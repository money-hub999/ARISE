import test from "node:test";
import assert from "node:assert/strict";
import {
  ACHIEVEMENTS,
  CORE_QUESTS,
  SAVE_VERSION,
  STUDY_CAP_MINUTES,
  TIMED_EVENTS,
  addDays,
  applyXp,
  applyXpWithLevelRewards,
  createSave,
  customStudyXp,
  dayStatus,
  evaluateAchievements,
  eventAdjustedXp,
  getCurrentStreak,
  getStats,
  isDayComplete,
  levelUpReward,
  localDate,
  migrateLegacySave,
  normalizeSave,
  rankForLevel,
  timedEventAt,
  updateBestStreak,
  xpRequired,
  xpToLevel
} from "../src/domain.js";
import { exportSave, parseImportedSave } from "../src/storage.js";

function completeDay(save, date) {
  const day = save.history[date] ||= {
    date,
    quests: Object.fromEntries(CORE_QUESTS.map(quest => [quest.id, true])),
    studyMinutes: 1,
    studyEntries: [],
    xpDelta: 0,
    cheatAttempts: [],
    customQuests: []
  };
  day.quests = Object.fromEntries(CORE_QUESTS.map(quest => [quest.id, true]));
  day.studyMinutes = 1;
  return day;
}

test("level thresholds and rank bands match the system specification", () => {
  assert.deepEqual([1, 2, 3, 4, 5].map(xpRequired), [500, 750, 1000, 1250, 1500]);
  assert.deepEqual(xpToLevel(499), { level: 1, xpIntoLevel: 499 });
  assert.deepEqual(xpToLevel(500), { level: 2, xpIntoLevel: 0 });
  assert.deepEqual(xpToLevel(1250), { level: 3, xpIntoLevel: 0 });
  assert.deepEqual([1, 5, 10, 20, 40, 75, 150, 300, 999].map(rankForLevel), ["E", "D", "C", "B", "A", "S", "SS", "SSS", "X"]);
});

test("level-up rewards start at 100 XP and compound by 5 percent per level", () => {
  assert.deepEqual([1, 2, 3].map(levelUpReward), [100, 105, 110]);

  const save = createSave();
  const secondLevel = applyXpWithLevelRewards(save, 500);
  assert.equal(secondLevel.levelRewardXp, 100);
  assert.equal(save.player.totalXp, 600);
  assert.equal(save.player.level, 2);

  const thirdLevel = applyXpWithLevelRewards(save, 650);
  assert.equal(thirdLevel.levelRewardXp, 105);
  assert.equal(save.player.totalXp, 1355);
  assert.equal(save.player.level, 3);
});

test("study XP is proportional to cumulative daily time, including tiny sessions", () => {
  assert.equal(customStudyXp(0, 30), 25);
  assert.equal(customStudyXp(30, 31), 0);
  assert.equal(customStudyXp(31, 60), 25);
  assert.equal(customStudyXp(0, 480), 400);
  assert.equal(customStudyXp(0, 720), 600);
});

test("the daily study cap is 12 hours and normalized saves retain the full valid range", () => {
  assert.equal(STUDY_CAP_MINUTES, 720);
  const save = createSave("2026-10-06");
  save.history["2026-10-06"].studyMinutes = STUDY_CAP_MINUTES;
  save.history["2026-10-06"].studyEntries.push({ minutes: STUDY_CAP_MINUTES, xp: 600, at: "" });
  const normalized = normalizeSave(save, "2026-10-06");
  assert.equal(normalized.antiCheat.studyCapMinutes, STUDY_CAP_MINUTES);
  assert.equal(normalized.history["2026-10-06"].studyMinutes, STUDY_CAP_MINUTES);
  assert.equal(normalized.history["2026-10-06"].studyEntries[0].minutes, STUDY_CAP_MINUTES);
});

test("extended study achievements unlock at their stated lifetime milestones", () => {
  const save = createSave("2026-10-06");
  const day = save.history["2026-10-06"];
  day.studyMinutes = 14999;
  assert.equal(ACHIEVEMENTS.find(item => item.id === "two-hundred-fifty-hours-study").test(save), false);
  day.studyMinutes = 15000;
  assert.equal(ACHIEVEMENTS.find(item => item.id === "two-hundred-fifty-hours-study").test(save), true);
  day.studyMinutes = 30000;
  assert.equal(ACHIEVEMENTS.find(item => item.id === "five-hundred-hours-study").test(save), true);
});

test("XP penalties update level progress and preserve the signed lifetime total", () => {
  const save = createSave();
  const change = applyXp(save, -5000);
  assert.equal(save.player.totalXp, -5000);
  assert.equal(save.player.level, 1);
  assert.equal(save.player.xpIntoLevel, 0);
  assert.equal(change.after.rank, "E");
  assert.equal(save.history[localDate()].xpDelta, -5000);
});

test("daily completion and streaks use contiguous completed history", () => {
  const save = createSave("2026-10-01");
  const dates = ["2026-10-01", "2026-10-02", "2026-10-03"];
  dates.forEach(date => completeDay(save, date));
  assert.equal(isDayComplete(save.history[dates[0]]), true);
  assert.equal(getCurrentStreak(save, dates[2]), 3);
  updateBestStreak(save);
  assert.equal(getStats(save, dates[2]).bestStreak, 3);
  assert.equal(getCurrentStreak(save, "2026-10-05"), 0);
  assert.equal(addDays("2026-10-03", 1), "2026-10-04");
});

test("a study-only day does not complete the core daily objective set", () => {
  const save = createSave("2026-10-05");
  save.history["2026-10-05"].studyMinutes = 60;
  assert.equal(isDayComplete(save.history["2026-10-05"]), false);
});

test("calendar marks a recorded violation as partial activity without counting it as progress", () => {
  const save = createSave("2026-10-05");
  save.history["2026-10-05"].cheatAttempts.push({ reason: "DAILY STUDY CAP EXCEEDED", penaltyApplied: true });
  assert.equal(dayStatus(save.history["2026-10-05"]), "PARTIAL");
  assert.equal(getStats(save, "2026-10-05").activeDays, 0);
});

test("export preserves the complete versioned history snapshot", () => {
  const save = createSave("2026-10-05");
  save.history["2026-10-04"] = { ...save.history["2026-10-05"], date: "2026-10-04", studyMinutes: 40 };
  const exported = JSON.parse(exportSave(save));
  assert.equal(exported.version, SAVE_VERSION);
  assert.equal(exported.history["2026-10-04"].studyMinutes, 40);
  assert.ok(exported.history["2026-10-05"]);
});

test("all configured achievements unlock once when their real milestones are met", () => {
  const today = localDate();
  const save = createSave(today);
  const dates = Array.from({ length: 100 }, (_, index) => addDays(today, index - 99));
  dates.forEach((date, index) => {
    const day = completeDay(save, date);
    day.studyMinutes = 60;
    day.customQuests = Array.from({ length: 3 }, (_, questIndex) => ({
      id: `${date}-custom-${questIndex}`,
      name: `CUSTOM ${index}-${questIndex}`,
      xp: 10,
      completed: true
    }));
  });
  applyXp(save, 10_000_000_000);
  updateBestStreak(save);

  const unlocked = evaluateAchievements(save);
  assert.deepEqual(unlocked.map(item => item.id).sort(), ACHIEVEMENTS.map(item => item.id).sort());
  assert.ok(Object.values(save.achievements).every(date => date === today));
  assert.deepEqual(evaluateAchievements(save), []);
});

test("rank milestones have increasing one-time XP rewards", () => {
  const save = createSave(localDate());
  const dRank = ACHIEVEMENTS.find(item => item.id === "d-rank");
  const cRank = ACHIEVEMENTS.find(item => item.id === "rank-c-awakening");
  const xRank = ACHIEVEMENTS.find(item => item.id === "rank-x-awakening");
  assert.ok(dRank.rank === "D" && dRank.rewardXp > 0);
  assert.ok(cRank.rank === "C" && cRank.rewardXp > dRank.rewardXp);
  assert.ok(xRank.rank === "X" && xRank.rewardXp > cRank.rewardXp);
  save.player.level = 40;
  const rankUnlocks = evaluateAchievements(save).filter(item => item.rank);
  assert.deepEqual(rankUnlocks.map(item => item.rank).sort(), ["A", "B", "C", "D"]);
  assert.ok(rankUnlocks.every(item => item.rewardXp > 0));
});

test("scheduled timed events apply their XP multiplier only during the local event window", () => {
  assert.equal(TIMED_EVENTS.length, 5);
  const sunrise = timedEventAt(new Date(2026, 9, 6, 7, 30));
  const midday = timedEventAt(new Date(2026, 9, 6, 14, 0));
  assert.equal(sunrise.id, "sunrise-surge");
  assert.equal(eventAdjustedXp(100, sunrise), 125);
  assert.equal(midday.id, "distraction-field");
  assert.equal(eventAdjustedXp(100, midday), 80);
  assert.equal(timedEventAt(new Date(2026, 9, 6, 12, 30)), null);
  assert.equal(eventAdjustedXp(-5000, sunrise), -5000);
});

test("new profiles request a name once while named saves retain their setup state", () => {
  const save = createSave("2026-10-06");
  assert.equal(normalizeSave(save, "2026-10-06").settings.nameConfigured, false);
  save.player.name = "Rin";
  save.settings.playerName = "Rin";
  save.settings.nameConfigured = true;
  const restored = normalizeSave(save, "2026-10-06");
  assert.equal(restored.player.name, "Rin");
  assert.equal(restored.settings.nameConfigured, true);
});

test("legacy saves migrate into the V10 dated history without discarding current progress", () => {
  const legacy = {
    level: 2,
    xp: 125,
    streak: 2,
    today: { date: "2026-10-04", quests: { nj: true, exercise: false, wake: false, junk: false }, studyMinutes: 45, xp: 137, cheat: false, customTasks: [{ id: 12, name: "Read Biology", xp: 80, completed: true }] }
  };
  const save = migrateLegacySave(legacy, "2026-10-05");
  assert.equal(save.version, SAVE_VERSION);
  assert.equal(save.player.totalXp, 625);
  assert.equal(save.history["2026-10-04"].studyMinutes, 45);
  assert.equal(save.history["2026-10-04"].quests.nj, true);
  assert.equal(save.history["2026-10-04"].customQuests[0].completed, true);
  assert.ok(save.history["2026-10-05"]);
});

test("import validation rejects malformed files and keeps today's anti-cheat lock", () => {
  assert.throws(() => normalizeSave({ unexpected: true }), /not a valid ARISE/);
  const today = localDate();
  const current = createSave(today);
  current.history[today].cheatAttempts.push({ reason: "DAILY STUDY CAP EXCEEDED", attemptedTotalMinutes: 500, penaltyApplied: true });
  applyXp(current, -5000);
  const imported = parseImportedSave(JSON.stringify(createSave(today)), current);
  assert.equal(imported.history[today].cheatAttempts.length, 1);
  assert.equal(imported.player.totalXp, -5000);
  assert.equal(imported.history[today].xpDelta, -5000);

  const unpenalizedImport = createSave(today);
  unpenalizedImport.history[today].cheatAttempts.push({ reason: "UNPENALIZED IMPORT", penaltyApplied: false });
  assert.throws(() => parseImportedSave(JSON.stringify(unpenalizedImport), createSave(today)), /without its required penalty/);
  const missingPenaltyImport = createSave(today);
  missingPenaltyImport.history[today].cheatAttempts.push({ reason: "MISSING PENALTY EVIDENCE" });
  assert.throws(() => parseImportedSave(JSON.stringify(missingPenaltyImport), createSave(today)), /without its required penalty/);
  const protectedImport = parseImportedSave(JSON.stringify(createSave(today)), current);
  assert.equal(protectedImport.history[today].cheatAttempts[0].reason, "DAILY STUDY CAP EXCEEDED");
  assert.equal(protectedImport.player.totalXp, -5000);
  assert.equal(protectedImport.history[today].xpDelta, -5000);
});
