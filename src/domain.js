export const SAVE_KEY = "ARISE_SAVE_V10";
export const LEGACY_SAVE_KEY = "ARISE_SAVE_V2";
export const SAVE_VERSION = 10;

export const CORE_QUESTS = [
  { id: "nj", name: "NJ", detail: "NAAM JAP", xp: 100, icon: "◉" },
  { id: "exercise", name: "EXERCISE", detail: "DAILY PHYSICAL ACTIVITY", xp: 100, icon: "✦" },
  { id: "wake", name: "WAKE UP EARLY", detail: "START THE DAY WITH DISCIPLINE", xp: 100, icon: "☼" },
  { id: "junk", name: "NO JUNK FOOD", detail: "MAINTAIN CLEAN EATING", xp: 100, icon: "◇" }
];

export const ACHIEVEMENTS = [
  { id: "first-awakening", icon: "✧", name: "FIRST AWAKENING", description: "Complete your first quest.", test: s => getStats(s).questsCompleted >= 1 },
  { id: "five-quests", icon: "Ⅴ", name: "FIVE QUESTS", description: "Complete five quests across your journey.", test: s => getStats(s).questsCompleted >= 5 },
  { id: "five-hundred-xp", icon: "⌁", name: "500 XP", description: "Reach 500 total XP.", test: s => s.player.totalXp >= 500 },
  { id: "three-day-streak", icon: "↗", name: "3 DAY STREAK", description: "Complete the daily objectives three days in a row.", test: s => getStats(s).bestStreak >= 3 },
  { id: "seven-day-streak", icon: "⟡", name: "7 DAY STREAK", description: "Complete the daily objectives seven days in a row.", test: s => getStats(s).bestStreak >= 7 },
  { id: "level-five", icon: "Ⅴ", name: "LEVEL 5", description: "Reach Level 5.", test: s => s.player.level >= 5 },
  { id: "ten-hours", icon: "◷", name: "10 HOURS", description: "Log ten hours of legitimate study.", test: s => getStats(s).totalStudyMinutes >= 600 },
  { id: "d-rank", icon: "D", name: "D-RANK", description: "Awaken your D-Rank potential.", rank: "D", test: s => s.player.level >= 5 },
  { id: "thousand-xp", icon: "Ⅰ", name: "1,000 XP", description: "Earn 1,000 total XP.", test: s => s.player.totalXp >= 1000 },
  { id: "two-thousand-five-hundred-xp", icon: "Ⅱ", name: "2,500 XP", description: "Earn 2,500 total XP.", test: s => s.player.totalXp >= 2500 },
  { id: "five-thousand-xp", icon: "Ⅴ", name: "5,000 XP", description: "Earn 5,000 total XP.", test: s => s.player.totalXp >= 5000 },
  { id: "ten-thousand-xp", icon: "Ⅹ", name: "10,000 XP", description: "Earn 10,000 total XP.", test: s => s.player.totalXp >= 10000 },
  { id: "twenty-five-thousand-xp", icon: "✦", name: "25,000 XP", description: "Earn 25,000 total XP.", test: s => s.player.totalXp >= 25000 },
  { id: "level-ten", icon: "Ⅹ", name: "LEVEL 10", description: "Reach Level 10.", test: s => s.player.level >= 10 },
  { id: "level-twenty", icon: "ⅩⅩ", name: "LEVEL 20", description: "Reach Level 20.", test: s => s.player.level >= 20 },
  { id: "level-forty", icon: "ⅩⅬ", name: "LEVEL 40", description: "Reach Level 40.", test: s => s.player.level >= 40 },
  { id: "ten-quests", icon: "◈", name: "TEN QUESTS", description: "Complete ten quests across your journey.", test: s => getStats(s).questsCompleted >= 10 },
  { id: "twenty-five-quests", icon: "◈", name: "QUEST REGULAR", description: "Complete 25 quests across your journey.", test: s => getStats(s).questsCompleted >= 25 },
  { id: "fifty-quests", icon: "◈", name: "QUEST VETERAN", description: "Complete 50 quests across your journey.", test: s => getStats(s).questsCompleted >= 50 },
  { id: "one-hundred-quests", icon: "◈", name: "CENTURION", description: "Complete 100 quests across your journey.", test: s => getStats(s).questsCompleted >= 100 },
  { id: "two-hundred-fifty-quests", icon: "◈", name: "QUEST LEGEND", description: "Complete 250 quests across your journey.", test: s => getStats(s).questsCompleted >= 250 },
  { id: "one-hour-study", icon: "◷", name: "FIRST HOUR", description: "Log one hour of legitimate study.", test: s => getStats(s).totalStudyMinutes >= 60 },
  { id: "five-hours-study", icon: "◷", name: "FIVE HOURS", description: "Log five hours of legitimate study.", test: s => getStats(s).totalStudyMinutes >= 300 },
  { id: "twenty-five-hours-study", icon: "◷", name: "STUDY ROUTINE", description: "Log 25 hours of legitimate study.", test: s => getStats(s).totalStudyMinutes >= 1500 },
  { id: "fifty-hours-study", icon: "◷", name: "FIFTY HOURS", description: "Log 50 hours of legitimate study.", test: s => getStats(s).totalStudyMinutes >= 3000 },
  { id: "one-hundred-hours-study", icon: "◷", name: "CENTURY OF STUDY", description: "Log 100 hours of legitimate study.", test: s => getStats(s).totalStudyMinutes >= 6000 },
  { id: "ten-day-streak", icon: "↗", name: "10 DAY STREAK", description: "Complete daily objectives ten days in a row.", test: s => getStats(s).bestStreak >= 10 },
  { id: "fourteen-day-streak", icon: "↗", name: "TWO-WEEK STREAK", description: "Complete daily objectives 14 days in a row.", test: s => getStats(s).bestStreak >= 14 },
  { id: "thirty-day-streak", icon: "⟡", name: "30 DAY STREAK", description: "Complete daily objectives 30 days in a row.", test: s => getStats(s).bestStreak >= 30 },
  { id: "sixty-day-streak", icon: "⟡", name: "60 DAY STREAK", description: "Complete daily objectives 60 days in a row.", test: s => getStats(s).bestStreak >= 60 },
  { id: "hundred-day-streak", icon: "⟡", name: "100 DAY STREAK", description: "Complete daily objectives 100 days in a row.", test: s => getStats(s).bestStreak >= 100 },
  { id: "first-custom-quest", icon: "◇", name: "PERSONAL DIRECTIVE", description: "Complete your first custom quest.", test: s => getStats(s).questsCompleted > getStats(s).coreObjectivesCompleted },
  { id: "ten-custom-quests", icon: "◇", name: "CUSTOM QUEST SET", description: "Complete ten custom quests.", test: s => completedCustomQuests(s) >= 10 },
  { id: "twenty-five-custom-quests", icon: "◇", name: "CUSTOM QUEST SPECIALIST", description: "Complete 25 custom quests.", test: s => completedCustomQuests(s) >= 25 },
  { id: "seven-active-days", icon: "◉", name: "WEEK OF ACTION", description: "Record activity on seven different days.", test: s => getStats(s).activeDays >= 7 },
  { id: "thirty-active-days", icon: "◉", name: "MONTH OF MOMENTUM", description: "Record activity on 30 different days.", test: s => getStats(s).activeDays >= 30 },
  { id: "hundred-active-days", icon: "◉", name: "HUNDRED ACTIVE DAYS", description: "Record activity on 100 different days.", test: s => getStats(s).activeDays >= 100 },
  { id: "weekly-xp-milestone", icon: "▥", name: "WEEKLY SURGE", description: "Earn at least 1,000 XP in a seven-day period.", test: s => getStats(s).weeklyXp >= 1000 },
  { id: "rank-c-awakening", icon: "C", name: "C-RANK AWAKENING", description: "Ascend to C-Rank.", rank: "C", test: s => s.player.level >= 10 },
  { id: "rank-b-awakening", icon: "B", name: "B-RANK AWAKENING", description: "Ascend to B-Rank.", rank: "B", test: s => s.player.level >= 20 },
  { id: "rank-a-awakening", icon: "A", name: "A-RANK AWAKENING", description: "Ascend to A-Rank.", rank: "A", test: s => s.player.level >= 40 },
  { id: "rank-s-awakening", icon: "S", name: "S-RANK AWAKENING", description: "Ascend to S-Rank.", rank: "S", test: s => s.player.level >= 75 },
  { id: "rank-ss-awakening", icon: "SS", name: "SS-RANK AWAKENING", description: "Ascend to SS-Rank.", rank: "SS", test: s => s.player.level >= 150 },
  { id: "rank-sss-awakening", icon: "✦", name: "SSS-RANK AWAKENING", description: "Ascend to SSS-Rank.", rank: "SSS", test: s => s.player.level >= 300 },
  { id: "rank-x-awakening", icon: "X", name: "X-RANK AWAKENING", description: "Reach the pinnacle of X-Rank.", rank: "X", test: s => s.player.level >= 999 }
].map((achievement, index) => ({
  ...achievement,
  rewardXp: achievement.rank ? 250 + index * 25 : 50 + Math.floor(index / 8) * 25
}));

export const EVENT_DEFINITIONS = [
  { id: "winter-arc", name: "WINTER ARC", status: "ACTIVE EVENT", description: "Build consistency through focused daily action." }
];

export const TIMED_EVENTS = [
  { id: "sunrise-surge", name: "SUNRISE SURGE", description: "Early discipline sharpens every effort.", startHour: 6, endHour: 9, multiplier: 1.25 },
  { id: "deep-work", name: "DEEP WORK WINDOW", description: "A calm stretch for focused progress.", startHour: 9, endHour: 12, multiplier: 1.15 },
  { id: "distraction-field", name: "DISTRACTION FIELD", description: "Midday interference reduces XP gains.", startHour: 13, endHour: 15, multiplier: 0.8 },
  { id: "golden-hour", name: "GOLDEN HOUR", description: "Evening momentum amplifies your effort.", startHour: 17, endHour: 20, multiplier: 1.4 },
  { id: "fatigue-wave", name: "FATIGUE WAVE", description: "Late-night fatigue makes progress harder.", startHour: 22, endHour: 24, multiplier: 0.75 }
];

export function localDate(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function dateFromKey(key) {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day, 12);
}

export function addDays(key, amount) {
  const date = dateFromKey(key);
  date.setDate(date.getDate() + amount);
  return localDate(date);
}

export function isDateKey(value) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && localDate(dateFromKey(value)) === value;
}

export function xpRequired(level) {
  return 500 + ((Math.max(1, level) - 1) * 250);
}

export function rankForLevel(level) {
  if (level >= 999) return "X";
  if (level >= 300) return "SSS";
  if (level >= 150) return "SS";
  if (level >= 75) return "S";
  if (level >= 40) return "A";
  if (level >= 20) return "B";
  if (level >= 10) return "C";
  if (level >= 5) return "D";
  return "E";
}

function levelFromTotalXp(totalXp) {
  let remaining = Math.max(0, totalXp);
  let level = 1;
  while (level < 10000 && remaining >= xpRequired(level)) {
    remaining -= xpRequired(level);
    level += 1;
  }
  return { level, xpIntoLevel: remaining };
}

function createDay(date, customQuests = []) {
  return {
    date,
    quests: { nj: false, exercise: false, wake: false, junk: false },
    studyMinutes: 0,
    studyEntries: [],
    xpDelta: 0,
    cheatAttempts: [],
    customQuests: customQuests.map(task => ({ ...task, completed: false, completedAt: null }))
  };
}

export function createSave(date = localDate()) {
  const save = {
    version: SAVE_VERSION,
    player: { name: "", totalXp: 0, level: 1, xpIntoLevel: 0 },
    history: {},
    customQuestLibrary: [],
    achievements: {},
    bestStreak: 0,
    logs: [],
    antiCheat: { studyCapMinutes: 480, firstViolationPenalty: -5000 },
    settings: { playerName: "", nameConfigured: false },
    events: { winterArcStartDate: date }
  };
  save.history[date] = createDay(date);
  return save;
}

function cleanCustomQuest(task, fallbackId) {
  if (!task || typeof task !== "object") return null;
  const name = typeof task.name === "string" ? task.name.trim().slice(0, 60) : "";
  const xp = Number(task.xp);
  if (!name || !Number.isInteger(xp) || xp < 1 || xp > 10000) return null;
  return {
    id: String(task.id ?? fallbackId).slice(0, 80),
    name,
    xp,
    completed: Boolean(task.completed),
    completedAt: typeof task.completedAt === "string" ? task.completedAt.slice(0, 40) : null
  };
}

function cleanDay(day, date, library) {
  const source = day && typeof day === "object" ? day : {};
  const quests = source.quests && typeof source.quests === "object" ? source.quests : {};
  const customSource = Array.isArray(source.customQuests) ? source.customQuests : library;
  const customQuests = customSource.map((item, index) => cleanCustomQuest(item, `${date}-custom-${index}`)).filter(Boolean);
  const studyMinutes = Number.isInteger(source.studyMinutes) ? Math.max(0, Math.min(480, source.studyMinutes)) : 0;
  const studyEntries = Array.isArray(source.studyEntries) ? source.studyEntries.slice(-200).map(entry => ({
    minutes: Number.isInteger(entry?.minutes) ? Math.max(1, Math.min(480, entry.minutes)) : 0,
    xp: Number.isInteger(entry?.xp) ? entry.xp : 0,
    at: typeof entry?.at === "string" ? entry.at.slice(0, 40) : ""
  })).filter(entry => entry.minutes > 0) : [];
  const optionalNumber = value => value !== null && value !== undefined && value !== "" && Number.isFinite(Number(value)) ? Number(value) : null;
  const cheatAttempts = Array.isArray(source.cheatAttempts) ? source.cheatAttempts.slice(0, 20).map(attempt => ({
    attemptedHours: optionalNumber(attempt?.attemptedHours),
    attemptedMinutes: optionalNumber(attempt?.attemptedMinutes),
    attemptedTotalMinutes: optionalNumber(attempt?.attemptedTotalMinutes),
    reason: String(attempt?.reason || "INVALID SYSTEM ENTRY").slice(0, 100),
    at: typeof attempt?.at === "string" ? attempt.at.slice(0, 40) : "",
    penaltyApplied: attempt?.penaltyApplied === true,
    legacy: Boolean(attempt?.legacy)
  })) : [];
  return {
    date,
    quests: Object.fromEntries(CORE_QUESTS.map(quest => [quest.id, Boolean(quests[quest.id])])),
    studyMinutes,
    studyEntries,
    xpDelta: Number.isFinite(Number(source.xpDelta)) ? Math.trunc(Number(source.xpDelta)) : 0,
    cheatAttempts,
    customQuests
  };
}

export function migrateLegacySave(legacy, today = localDate()) {
  const save = createSave(today);
  const oldPlayer = legacy?.player && typeof legacy.player === "object" ? legacy.player : legacy;
  const oldLevel = Math.max(1, Math.min(10000, Math.trunc(Number(oldPlayer?.level) || 1)));
  let priorXp = 0;
  for (let level = 1; level < oldLevel; level += 1) priorXp += xpRequired(level);
  const withinLevelXp = Math.max(0, Math.trunc(Number(oldPlayer?.xp) || 0));
  save.player.totalXp = priorXp + withinLevelXp;
  const oldDay = oldPlayer?.today;
  if (oldDay && isDateKey(oldDay.date)) {
    const legacyTasks = Array.isArray(oldDay.customTasks) ? oldDay.customTasks : [];
    save.customQuestLibrary = legacyTasks.map((task, index) => cleanCustomQuest(task, `legacy-${index}`)).filter(Boolean);
    const record = cleanDay({
      ...oldDay,
      quests: oldDay.quests,
      studyMinutes: oldDay.studyMinutes,
      xpDelta: oldDay.xp,
      customQuests: legacyTasks
    }, oldDay.date, save.customQuestLibrary);
    record.customQuests = legacyTasks.map((task, index) => {
      const clean = cleanCustomQuest(task, `legacy-${index}`);
      return clean ? { ...clean, completed: Boolean(task.completed), completedAt: null } : null;
    }).filter(Boolean);
    if (oldDay.cheat) {
      record.cheatAttempts = [{ attemptedHours: null, attemptedMinutes: null, attemptedTotalMinutes: null, reason: "LEGACY STUDY CAP VIOLATION", at: new Date().toISOString(), penaltyApplied: true, legacy: true }];
      record.xpDelta -= 5000;
      save.player.totalXp -= 5000;
    }
    save.history[record.date] = record;
  }
  for (const task of save.customQuestLibrary) {
    const todayRecord = save.history[today];
    if (todayRecord && !todayRecord.customQuests.some(item => item.id === task.id)) {
      todayRecord.customQuests.push({ ...task, completed: false, completedAt: null });
    }
  }
  save.bestStreak = Math.max(0, Math.trunc(Number(oldPlayer?.streak) || 0));
  const derived = levelFromTotalXp(save.player.totalXp);
  save.player.level = derived.level;
  save.player.xpIntoLevel = derived.xpIntoLevel;
  return save;
}

export function normalizeSave(raw, today = localDate()) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new Error("Save data must be a JSON object.");
  if (raw.version !== SAVE_VERSION || !raw.player || typeof raw.player !== "object" || !raw.history || typeof raw.history !== "object") {
    if (raw.version === 2 || raw.today || raw.player?.today) return migrateLegacySave(raw, today);
    throw new Error("This file is not a valid ARISE SYSTEM V10 save.");
  }
  if (!Number.isFinite(Number(raw.player.totalXp)) || Math.abs(Number(raw.player.totalXp)) > 1_000_000_000_000) throw new Error("Player XP is invalid.");
  const library = Array.isArray(raw.customQuestLibrary) ? raw.customQuestLibrary.map((item, index) => cleanCustomQuest(item, `custom-${index}`)).filter(Boolean) : [];
  const history = {};
  for (const [date, day] of Object.entries(raw.history)) {
    if (!isDateKey(date)) continue;
    history[date] = cleanDay(day, date, library);
  }
  if (!history[today]) history[today] = createDay(today, library);
  const totalXp = Math.trunc(Number(raw.player.totalXp));
  const derived = levelFromTotalXp(totalXp);
  const playerName = typeof raw.player.name === "string" ? raw.player.name.trim().slice(0, 30) : "";
  const configuredName = typeof raw.settings?.playerName === "string" ? raw.settings.playerName.trim().slice(0, 30) : "";
  const save = {
    version: SAVE_VERSION,
    player: {
      name: playerName,
      totalXp,
      level: derived.level,
      xpIntoLevel: derived.xpIntoLevel
    },
    history,
    customQuestLibrary: library,
    achievements: raw.achievements && typeof raw.achievements === "object" && !Array.isArray(raw.achievements) ? { ...raw.achievements } : {},
    bestStreak: Math.max(0, Math.min(100000, Math.trunc(Number(raw.bestStreak) || 0))),
    logs: Array.isArray(raw.logs) ? raw.logs.slice(-100).map(log => ({
      id: String(log?.id || "").slice(0, 80),
      type: ["info", "success", "warning", "error", "level", "rank", "achievement"].includes(log?.type) ? log.type : "info",
      text: String(log?.text || "").slice(0, 180),
      at: typeof log?.at === "string" ? log.at.slice(0, 40) : "",
      date: isDateKey(log?.date) ? log.date : today
    })).filter(log => log.text) : [],
    antiCheat: { studyCapMinutes: 480, firstViolationPenalty: -5000 },
    settings: {
      playerName: configuredName || playerName,
      nameConfigured: raw.settings?.nameConfigured === true || Boolean(playerName && playerName.toUpperCase() !== "AWAKENED")
    },
    events: { winterArcStartDate: isDateKey(raw.events?.winterArcStartDate) ? raw.events.winterArcStartDate : today }
  };
  const normalizedToday = history[today];
  for (const task of library) {
    if (!normalizedToday.customQuests.some(item => item.id === task.id)) normalizedToday.customQuests.push({ ...task, completed: false, completedAt: null });
  }
  return save;
}

function completedCustomQuests(save) {
  return Object.values(save.history).reduce((total, day) => total + day.customQuests.filter(quest => quest.completed).length, 0);
}

export function ensureToday(save, date = localDate()) {
  if (!save.history[date]) save.history[date] = createDay(date, save.customQuestLibrary);
  return save.history[date];
}

export function getTodayRecord(save, date = localDate()) {
  return ensureToday(save, date);
}

export function isDayComplete(day) {
  return Boolean(day && CORE_QUESTS.every(quest => day.quests[quest.id]) && day.studyMinutes > 0);
}

export function dayHasProgress(day) {
  return Boolean(day && (day.studyMinutes > 0 || CORE_QUESTS.some(quest => day.quests[quest.id]) || day.customQuests.some(quest => quest.completed)));
}

export function dayStatus(day) {
  if (!day) return "NO DATA";
  if (!dayHasProgress(day) && day.cheatAttempts.length === 0) return "NO DATA";
  return isDayComplete(day) ? "COMPLETED" : "PARTIAL";
}

export function getCurrentStreak(save, today = localDate()) {
  let cursor = today;
  if (!isDayComplete(save.history[cursor])) cursor = addDays(cursor, -1);
  let streak = 0;
  while (isDayComplete(save.history[cursor])) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

export function getBestStreakFromHistory(history) {
  const dates = Object.keys(history).sort();
  let best = 0;
  let run = 0;
  let prior = null;
  for (const date of dates) {
    if (isDayComplete(history[date])) {
      run = prior && addDays(prior, 1) === date ? run + 1 : 1;
      best = Math.max(best, run);
    } else {
      run = 0;
    }
    prior = date;
  }
  return best;
}

export function getStats(save, today = localDate()) {
  const days = Object.values(save.history);
  const completedCustom = days.reduce((sum, day) => sum + day.customQuests.filter(quest => quest.completed).length, 0);
  const completedCore = days.reduce((sum, day) => sum + CORE_QUESTS.filter(quest => day.quests[quest.id]).length, 0);
  const completedStudy = days.reduce((sum, day) => sum + (day.studyMinutes > 0 ? 1 : 0), 0);
  const currentStreak = getCurrentStreak(save, today);
  const historyBest = getBestStreakFromHistory(save.history);
  const bestStreak = Math.max(save.bestStreak || 0, historyBest);
  const totalStudyMinutes = days.reduce((sum, day) => sum + day.studyMinutes, 0);
  const activeDays = days.filter(dayHasProgress).length;
  const questDates = Object.values(save.history).flatMap(day => [
    ...CORE_QUESTS.filter(quest => day.quests[quest.id]).map(() => day.date),
    ...(day.studyMinutes > 0 ? [day.date] : []),
    ...day.customQuests.filter(quest => quest.completed).map(() => day.date)
  ]).sort();
  return {
    currentStreak,
    bestStreak,
    totalXp: save.player.totalXp,
    totalStudyMinutes,
    weeklyXp: xpInRange(save.history, addDays(today, -6), today),
    monthlyXp: xpInMonth(save.history, today.slice(0, 7)),
    activeDays,
    questsCompleted: completedCore + completedCustom + completedStudy,
    coreObjectivesCompleted: completedCore + completedStudy,
    bestStudyDay: days.reduce((best, day) => day.studyMinutes > (best?.studyMinutes || 0) ? day : best, null),
    questDates
  };
}

export function xpInRange(history, start, end) {
  return Object.values(history).reduce((sum, day) => day.date >= start && day.date <= end ? sum + day.xpDelta : sum, 0);
}

export function xpInMonth(history, monthKey) {
  return Object.values(history).reduce((sum, day) => day.date.startsWith(monthKey) ? sum + day.xpDelta : sum, 0);
}

export function xpToLevel(totalXp) {
  return levelFromTotalXp(totalXp);
}

export function applyXp(save, amount) {
  const before = { level: save.player.level, rank: rankForLevel(save.player.level) };
  const today = getTodayRecord(save);
  save.player.totalXp += Math.trunc(amount);
  today.xpDelta += Math.trunc(amount);
  const derived = levelFromTotalXp(save.player.totalXp);
  save.player.level = derived.level;
  save.player.xpIntoLevel = derived.xpIntoLevel;
  const after = { level: derived.level, rank: rankForLevel(derived.level) };
  return { before, after, leveledUp: after.level > before.level, rankedUp: after.rank !== before.rank && rankOrder(after.rank) > rankOrder(before.rank) };
}

function rankOrder(rank) {
  return ["E", "D", "C", "B", "A", "S", "SS", "SSS", "X"].indexOf(rank);
}

export function customStudyXp(oldMinutes, newMinutes) {
  return Math.floor(newMinutes * 50 / 60) - Math.floor(oldMinutes * 50 / 60);
}

export function timedEventAt(date = new Date()) {
  const hour = date.getHours();
  return TIMED_EVENTS.find(event => hour >= event.startHour && hour < event.endHour) || null;
}

export function eventAdjustedXp(amount, event) {
  if (amount <= 0 || !event) return Math.trunc(amount);
  return Math.max(1, Math.round(amount * event.multiplier));
}

export function addSystemLog(save, text, type = "info", now = new Date()) {
  save.logs.unshift({ id: `${now.getTime()}-${Math.random().toString(36).slice(2, 7)}`, type, text, at: now.toISOString(), date: localDate(now) });
  save.logs = save.logs.slice(0, 100);
}

export function evaluateAchievements(save) {
  const unlocked = [];
  for (const achievement of ACHIEVEMENTS) {
    if (!save.achievements[achievement.id] && achievement.test(save)) {
      save.achievements[achievement.id] = localDate();
      unlocked.push({ ...achievement });
    }
  }
  return unlocked;
}

export function updateBestStreak(save) {
  save.bestStreak = Math.max(save.bestStreak || 0, getBestStreakFromHistory(save.history), getCurrentStreak(save));
}

export function getMonthDays(year, monthIndex) {
  const first = new Date(year, monthIndex, 1, 12);
  const daysInMonth = new Date(year, monthIndex + 1, 0, 12).getDate();
  return { offset: first.getDay(), daysInMonth };
}
