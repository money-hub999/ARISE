import {
  ACHIEVEMENTS,
  CORE_QUESTS,
  EVENT_DEFINITIONS,
  SAVE_KEY,
  TIMED_EVENTS,
  addDays,
  addSystemLog,
  applyXp,
  customStudyXp,
  dayHasProgress,
  dayStatus,
  ensureToday,
  evaluateAchievements,
  eventAdjustedXp,
  getCurrentStreak,
  getMonthDays,
  getStats,
  isDayComplete,
  localDate,
  normalizeSave,
  rankForLevel,
  updateBestStreak,
  timedEventAt,
  xpInMonth,
  xpInRange,
  xpRequired
} from "./domain.js";
import { exportSave, loadSave, parseImportedSave, saveSave } from "./storage.js";

const KEY = SAVE_KEY;
const SCREEN_META = {
  home: ["HOME", "COMMAND CENTER"],
  quests: ["QUESTS", "DAILY OBJECTIVES"],
  progress: ["PROGRESS", "ASCENSION RECORD"],
  achievements: ["ACHIEVEMENTS", "SYSTEM AWARDS"],
  player: ["PLAYER", "AWAKENED PROFILE"],
  calendar: ["CALENDAR", "ACTIVITY ARCHIVE"],
  system: ["SYSTEM", "CORE CONFIGURATION"],
  events: ["EVENTS", "LIVE OPERATIONS"]
};

const root = document.getElementById("appShell");
const host = document.getElementById("screenHost");
const toastStack = document.getElementById("toastStack");
const modalRoot = document.getElementById("modalRoot");
const menuToggle = document.getElementById("menuToggle");
const sidebar = document.getElementById("sidebar");
const navBackdrop = document.getElementById("navBackdrop");
let { save: state, available: storageAvailable, warning: startupWarning } = loadSave();
let activeScreen = "home";
let calendarCursor = new Date();
let selectedCalendarDate = localDate();
let screenTransitionTimer = 0;
const focusTimer = { minutes: 25, remainingSeconds: 25 * 60, endsAt: 0, intervalId: 0, running: false };

const $ = (selector, parent = document) => parent.querySelector(selector);
const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, character => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[character]);
}

function fmtNumber(value) {
  return new Intl.NumberFormat("en-US").format(value);
}

function fmtDate(key, options = { weekday: "short", month: "short", day: "numeric" }) {
  const [year, month, day] = key.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", options).format(new Date(year, month - 1, day, 12));
}

function fmtMonth(date) {
  return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(date);
}

function fmtStudy(minutes) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return `${hours}H ${String(rest).padStart(2, "0")}M`;
}

function fmtClock(iso) {
  if (!iso) return "--:--";
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "--:--" : new Intl.DateTimeFormat("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }).format(date);
}

function todayRecord() {
  return ensureToday(state);
}

function persist() {
  storageAvailable = saveSave(state);
  updateGlobalHeader();
}

function sectionHead(code, title, extra = "") {
  return `<div class="section-head"><div><span class="section-code">${escapeHTML(code)}</span><h2>${escapeHTML(title)}</h2></div>${extra ? `<div class="section-extra">${extra}</div>` : ""}</div>`;
}

function panel(code, title, content, extra = "", className = "") {
  return `<section class="hud-panel ${className}">${sectionHead(code, title, extra)}${content}</section>`;
}

function meter(label, value, max, className = "") {
  const percent = max > 0 ? Math.min(100, Math.max(0, value / max * 100)) : 0;
  return `<div class="meter ${className}"><div class="meter-caption"><span>${escapeHTML(label)}</span><strong>${fmtNumber(value)} / ${fmtNumber(max)}</strong></div><div class="meter-track"><i style="width:${percent}%"></i></div></div>`;
}

function updateGlobalHeader() {
  const rank = rankForLevel(state.player.level);
  $("#topDate").textContent = new Intl.DateTimeFormat("en-US", { month: "short", day: "2-digit", year: "numeric" }).format(new Date());
  $("#topRank").textContent = rank;
  document.title = `ARISE SYSTEM V10 — ${SCREEN_META[activeScreen][0]}`;
}

function syncPlayerName() {
  const name = state.player.name?.trim() || state.settings.playerName?.trim() || "PLAYER";
  const sidebarName = $(".sidebar-player-copy strong");
  if (sidebarName) sidebarName.textContent = name;
  const avatar = $(".sidebar-avatar");
  if (avatar) avatar.textContent = name.charAt(0).toUpperCase();
  const heroName = $(".hero-player .section-code");
  if (heroName) heroName.textContent = `PLAYER // ${name}`;
  const profileName = $(".profile-identity h2");
  if (profileName) profileName.textContent = name;
  const profileAvatar = $(".profile-avatar span");
  if (profileAvatar) profileAvatar.textContent = name.charAt(0).toUpperCase();
  const heroHeading = $(".hero-player h2");
  if (heroHeading) heroHeading.innerHTML = `THE SYSTEM<br><em>RECOGNIZES ${escapeHTML(name.toUpperCase())}.</em>`;
}

function showPlayerNameSetup() {
  modalRoot.innerHTML = `<div class="modal-backdrop"><section class="name-setup hud-frame" role="dialog" aria-modal="true" aria-labelledby="nameSetupTitle"><span class="section-code">PLAYER INITIALIZATION // IDENTITY</span><h2 id="nameSetupTitle">WHAT SHOULD THE SYSTEM CALL YOU?</h2><p>Your name is saved to this browser profile and will only be requested once.</p><form id="playerNameForm"><label class="field" for="playerNameInput"><span>PLAYER NAME</span><input id="playerNameInput" name="playerName" type="text" maxlength="30" autocomplete="nickname" placeholder="Enter your name" required></label><button class="action-button" type="submit">CONFIRM IDENTITY <span>↗</span></button></form></section></div>`;
  $("#playerNameInput").focus();
}

function navigate(screen) {
  if (!SCREEN_META[screen]) return;
  if (activeScreen === screen) {
    closeMobileNav();
    return;
  }
  activeScreen = screen;
  $$(".nav-item").forEach(button => {
    const selected = button.dataset.screen === screen;
    button.classList.toggle("active", selected);
    button.setAttribute("aria-current", selected ? "page" : "false");
  });
  const [title, subtitle] = SCREEN_META[screen];
  $("#screenTitle").innerHTML = `${escapeHTML(title)} <span>${escapeHTML(subtitle)}</span>`;
  renderActiveScreen();
  closeMobileNav();
  updateGlobalHeader();
  host.focus({ preventScroll: true });
}

function openMobileNav() {
  sidebar.classList.add("is-open");
  navBackdrop.hidden = false;
  menuToggle.setAttribute("aria-expanded", "true");
  menuToggle.setAttribute("aria-label", "Close navigation");
  document.body.classList.add("nav-open");
}

function closeMobileNav() {
  sidebar.classList.remove("is-open");
  navBackdrop.hidden = true;
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.setAttribute("aria-label", "Open navigation");
  document.body.classList.remove("nav-open");
}

function showToast(type, title, detail = "", strong = false) {
  const toast = document.createElement("div");
  toast.className = `system-toast toast-${type}${strong ? " toast-strong" : ""}`;
  toast.setAttribute("role", type === "error" || type === "warning" ? "alert" : "status");
  toast.innerHTML = `<span class="toast-symbol">${type === "error" || type === "warning" ? "!" : type === "achievement" ? "✧" : type === "rank" ? "↗" : "+"}</span><span class="toast-copy"><strong>${escapeHTML(title)}</strong>${detail ? `<small>${escapeHTML(detail)}</small>` : ""}</span><button type="button" class="toast-close" aria-label="Dismiss notification">×</button>`;
  toastStack.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add("visible"));
  const remove = () => {
    toast.classList.remove("visible");
    setTimeout(() => toast.remove(), 260);
  };
  const timer = setTimeout(remove, strong ? 7000 : 4600);
  $(".toast-close", toast).addEventListener("click", () => { clearTimeout(timer); remove(); });
}

function log(text, type = "info") {
  addSystemLog(state, text, type);
}

function processAchievementUnlocks(notify = true) {
  let rankChanged = false;
  while (true) {
    const earned = evaluateAchievements(state);
    if (!earned.length) break;
    for (const achievement of earned) {
      const reward = achievement.rewardXp;
      const change = applyXp(state, reward);
      log(`ACHIEVEMENT UNLOCKED // ${achievement.name} // +${fmtNumber(reward)} XP`, "achievement");
      if (notify) {
        showToast("achievement", "ACHIEVEMENT REWARD", `${achievement.name} · +${fmtNumber(reward)} XP`, true);
      }
      if (change.leveledUp) {
        log(`LEVEL UP // LEVEL ${change.after.level}`, "level");
        if (notify) showToast("level", "LEVEL UP", `LEVEL ${change.after.level} · ACHIEVEMENT REWARD`, true);
      }
      if (change.rankedUp) {
        rankChanged = true;
        log(`RANK UP // ${change.after.rank}-RANK`, "rank");
        if (notify) showToast("rank", "RANK UP", `${change.after.rank}-RANK`, true);
      }
    }
  }
  if (rankChanged) {
    document.body.classList.add("rank-flash");
    setTimeout(() => document.body.classList.remove("rank-flash"), 2300);
  }
}

function award(amount, reason, logType = "success") {
  const timedEvent = amount > 0 ? timedEventAt() : null;
  const awardedAmount = eventAdjustedXp(amount, timedEvent);
  const change = applyXp(state, awardedAmount);
  const amountText = `${awardedAmount >= 0 ? "+" : ""}${fmtNumber(awardedAmount)} XP`;
  const eventText = timedEvent ? ` // ${timedEvent.name} ${timedEvent.multiplier > 1 ? "+" : ""}${Math.round((timedEvent.multiplier - 1) * 100)}%` : "";
  log(`${reason} // ${amountText}${eventText}`, awardedAmount < 0 ? "error" : logType);
  if (awardedAmount > 0) showToast("success", `+${fmtNumber(awardedAmount)} XP`, timedEvent ? `${reason} · ${timedEvent.name}` : reason);
  if (awardedAmount < 0) showToast("error", `${fmtNumber(awardedAmount)} XP`, reason, true);
  if (change.leveledUp) {
    log(`LEVEL UP // LEVEL ${change.after.level}`, "level");
    showToast("level", "LEVEL UP", `LEVEL ${change.after.level}`, true);
    document.body.classList.add("level-flash");
    setTimeout(() => document.body.classList.remove("level-flash"), 1700);
  }
  if (change.rankedUp) {
    log(`RANK UP // ${change.after.rank}-RANK`, "rank");
    showToast("rank", "RANK UP", `${change.after.rank}-RANK`, true);
    document.body.classList.add("rank-flash");
    setTimeout(() => document.body.classList.remove("rank-flash"), 2300);
  }
  updateBestStreak(state);
  processAchievementUnlocks();
  persist();
  renderActiveScreen();
}

function recordQuest(id) {
  const quest = CORE_QUESTS.find(item => item.id === id);
  if (!quest) return;
  const day = todayRecord();
  if (day.quests[id]) {
    showToast("info", "QUEST ALREADY COMPLETE", quest.name);
    return;
  }
  day.quests[id] = true;
  log(`QUEST COMPLETE // ${quest.name}`, "success");
  award(quest.xp, quest.name);
}

function flagStudyViolation(hoursValue, minutesValue, reason, totalAttempt = null) {
  const day = todayRecord();
  if (day.cheatAttempts.length) {
    showToast("warning", "STUDY LOCK ACTIVE", "Study entries are locked for today.");
    return;
  }
  const at = new Date().toISOString();
  day.cheatAttempts.push({
    attemptedHours: Number.isFinite(Number(hoursValue)) ? Number(hoursValue) : null,
    attemptedMinutes: Number.isFinite(Number(minutesValue)) ? Number(minutesValue) : null,
    attemptedTotalMinutes: Number.isFinite(Number(totalAttempt)) ? Number(totalAttempt) : null,
    reason,
    at,
    penaltyApplied: true,
    legacy: false
  });
  log(`INVALID SYSTEM ENTRY // ${reason}`, "error");
  log("SYSTEM LESSON // EARN XP. DO NOT FARM XP. DISCIPLINE CANNOT BE FAKED.", "warning");
  award(-5000, "STUDY CAP VIOLATION // SYSTEM LESSON", "error");
  renderActiveScreen();
}

function submitStudy(form) {
  const rawHours = form.elements.hours.value.trim();
  const rawMinutes = form.elements.minutes.value.trim();
  const hours = rawHours === "" ? 0 : Number(rawHours);
  const minutes = rawMinutes === "" ? 0 : Number(rawMinutes);
  const day = todayRecord();
  if (day.cheatAttempts.length) {
    showToast("warning", "STUDY LOCK ACTIVE", "Further study submissions are disabled for today.");
    return;
  }
  const integerInput = value => value === "" || /^\d+$/.test(value);
  if (!integerInput(rawHours) || !integerInput(rawMinutes) || !Number.isSafeInteger(hours) || !Number.isSafeInteger(minutes) || hours < 0 || minutes < 0 || minutes > 59) {
    flagStudyViolation(hours, minutes, "INVALID HOURS OR MINUTES", Number(hours) * 60 + Number(minutes));
    return;
  }
  const totalMinutes = hours * 60 + minutes;
  if (totalMinutes <= 0) {
    showToast("warning", "STUDY TIME REQUIRED", "Enter a valid study duration.");
    return;
  }
  const attemptedTotal = day.studyMinutes + totalMinutes;
  if (!Number.isSafeInteger(totalMinutes) || attemptedTotal > state.antiCheat.studyCapMinutes) {
    flagStudyViolation(hours, minutes, "DAILY STUDY CAP EXCEEDED", attemptedTotal);
    return;
  }
  const oldTotal = day.studyMinutes;
  const xp = customStudyXp(oldTotal, attemptedTotal);
  day.studyMinutes = attemptedTotal;
  day.studyEntries.push({ minutes: totalMinutes, xp, at: new Date().toISOString() });
  log(`STUDY LOGGED // ${fmtStudy(totalMinutes)} // ${xp ? `${xp} BASE XP` : "XP MILESTONE PENDING"}`, "success");
  if (xp) award(xp, `STUDY LOGGED // ${fmtStudy(totalMinutes)}`);
  else {
    updateBestStreak(state);
    processAchievementUnlocks();
    persist();
    renderActiveScreen();
    showToast("info", "STUDY RECORDED", "XP is awarded proportionally across each full hour.");
  }
}

function focusTimeText(seconds) {
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

function updateFocusDisplay() {
  if (focusTimer.running) focusTimer.remainingSeconds = Math.max(0, Math.ceil((focusTimer.endsAt - Date.now()) / 1000));
  if (focusTimer.running && focusTimer.remainingSeconds === 0) {
    clearInterval(focusTimer.intervalId);
    focusTimer.intervalId = 0;
    focusTimer.running = false;
    showToast("success", "FOCUS SPRINT READY", "Log the completed sprint to record study time and XP.", true);
    if (activeScreen === "home") renderActiveScreen();
  }
  const clock = $("#focusClock");
  if (!clock) return;
  const canFit = todayRecord().studyMinutes + focusTimer.minutes <= state.antiCheat.studyCapMinutes;
  clock.textContent = focusTimeText(focusTimer.remainingSeconds);
  $("#focusStatus").textContent = focusTimer.running ? "IN SESSION" : focusTimer.remainingSeconds === 0 ? "READY TO LOG" : focusTimer.remainingSeconds === focusTimer.minutes * 60 ? "STANDING BY" : "PAUSED";
  $("#focusTrack").style.width = `${(1 - focusTimer.remainingSeconds / (focusTimer.minutes * 60)) * 100}%`;
  $("#focusToggle").textContent = focusTimer.running ? "PAUSE SPRINT" : focusTimer.remainingSeconds === 0 ? "SPRINT COMPLETE" : focusTimer.remainingSeconds === focusTimer.minutes * 60 ? "START SPRINT" : "RESUME SPRINT";
  $("#focusToggle").disabled = focusTimer.remainingSeconds === 0 || (!canFit && !focusTimer.running);
  $("#focusLog").disabled = focusTimer.remainingSeconds !== 0 || !canFit || Boolean(todayRecord().cheatAttempts.length);
}

function renderFocusConsole(locked) {
  const seconds = focusTimer.running ? Math.max(0, Math.ceil((focusTimer.endsAt - Date.now()) / 1000)) : focusTimer.remainingSeconds;
  const status = focusTimer.running ? "IN SESSION" : seconds === 0 ? "READY TO LOG" : seconds === focusTimer.minutes * 60 ? "STANDING BY" : "PAUSED";
  const dayMinutes = todayRecord().studyMinutes;
  const availableMinutes = Math.max(0, state.antiCheat.studyCapMinutes - dayMinutes);
  const canFit = focusTimer.minutes <= availableMinutes;
  const xp = canFit ? customStudyXp(dayMinutes, dayMinutes + focusTimer.minutes) : 0;
  const hint = locked ? "STUDY LOCK ACTIVE UNTIL TOMORROW." : !canFit ? `ONLY ${availableMinutes} MIN REMAIN BELOW TODAY'S STUDY CAP.` : "XP IS RECORDED ONLY AFTER A COMPLETED SPRINT IS LOGGED.";
  return `<section class="focus-console ${focusTimer.running ? "focus-running" : ""}" aria-label="Focus sprint timer"><div class="focus-console-head"><div><span class="section-code">FOCUS PROTOCOL // ${focusTimer.minutes} MIN</span><strong id="focusStatus">${status}</strong></div><span class="focus-signal"><i></i> ${locked ? "STUDY LOCK" : focusTimer.running ? "TRANSMITTING" : "READY"}</span></div><div class="focus-controls"><div class="focus-presets" role="group" aria-label="Sprint duration"><button type="button" data-action="focus-duration" data-minutes="25" aria-pressed="${focusTimer.minutes === 25}" ${locked || availableMinutes < 25 ? "disabled" : ""}>25 MIN</button><button type="button" data-action="focus-duration" data-minutes="50" aria-pressed="${focusTimer.minutes === 50}" ${locked || availableMinutes < 50 ? "disabled" : ""}>50 MIN</button></div><strong id="focusClock" class="focus-clock" role="timer" aria-label="Time remaining">${focusTimeText(seconds)}</strong><div class="focus-track"><i id="focusTrack" style="width:${(1 - seconds / (focusTimer.minutes * 60)) * 100}%"></i></div><div class="focus-actions"><button id="focusToggle" class="action-button focus-toggle" type="button" data-action="focus-toggle" ${locked || seconds === 0 || (!canFit && !focusTimer.running) ? "disabled" : ""}>${focusTimer.running ? "PAUSE SPRINT" : seconds === focusTimer.minutes * 60 ? "START SPRINT" : seconds === 0 ? "SPRINT COMPLETE" : "RESUME SPRINT"}<span>${focusTimer.running ? "Ⅱ" : "▶"}</span></button><button class="square-button focus-reset" type="button" data-action="focus-reset" aria-label="Reset focus sprint" title="Reset sprint" ${locked ? "disabled" : ""}>↺</button><button id="focusLog" class="action-button focus-log" type="button" data-action="focus-log" ${locked || seconds !== 0 || !canFit ? "disabled" : ""}>LOG SPRINT <span>+${xp} XP</span></button></div></div><p class="focus-hint">${hint}</p></section>`;
}

function toggleFocusSprint() {
  if (focusTimer.running) {
    focusTimer.remainingSeconds = Math.max(0, Math.ceil((focusTimer.endsAt - Date.now()) / 1000));
    focusTimer.running = false;
    clearInterval(focusTimer.intervalId);
    focusTimer.intervalId = 0;
  } else if (focusTimer.remainingSeconds > 0) {
    focusTimer.endsAt = Date.now() + focusTimer.remainingSeconds * 1000;
    focusTimer.running = true;
    focusTimer.intervalId = setInterval(updateFocusDisplay, 250);
  }
  updateFocusDisplay();
}

function resetFocusSprint(minutes = focusTimer.minutes) {
  clearInterval(focusTimer.intervalId);
  focusTimer.intervalId = 0;
  focusTimer.minutes = minutes;
  focusTimer.remainingSeconds = minutes * 60;
  focusTimer.running = false;
  renderActiveScreen();
}

function logFocusSprint() {
  if (focusTimer.remainingSeconds !== 0 || todayRecord().cheatAttempts.length) return;
  const minutes = focusTimer.minutes;
  if (todayRecord().studyMinutes + minutes > state.antiCheat.studyCapMinutes) {
    showToast("warning", "STUDY CAP REACHED", "This completed sprint no longer fits today's remaining study time.");
    return;
  }
  clearInterval(focusTimer.intervalId);
  focusTimer.intervalId = 0;
  focusTimer.remainingSeconds = minutes * 60;
  focusTimer.running = false;
  submitStudy({ elements: { hours: { value: String(Math.floor(minutes / 60)) }, minutes: { value: String(minutes % 60) } } });
}

function addCustomQuest(form) {
  const name = form.elements.taskName.value.trim();
  const xp = Number(form.elements.taskXp.value);
  if (!name) {
    showToast("warning", "QUEST NAME REQUIRED", "Enter a task name before saving.");
    form.elements.taskName.focus();
    return;
  }
  if (name.length > 60) {
    showToast("warning", "QUEST NAME TOO LONG", "Use 60 characters or fewer.");
    return;
  }
  if (!Number.isInteger(xp) || xp < 1 || xp > 10000) {
    showToast("warning", "INVALID XP REWARD", "Choose a whole number from 1 to 10,000 XP.");
    form.elements.taskXp.focus();
    return;
  }
  const id = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const quest = { id, name, xp };
  state.customQuestLibrary.push(quest);
  todayRecord().customQuests.push({ ...quest, completed: false, completedAt: null });
  log(`CUSTOM QUEST ADDED // ${name}`, "info");
  persist();
  renderActiveScreen();
  showToast("info", "CUSTOM QUEST ADDED", name);
}

function completeCustomQuest(id) {
  const quest = todayRecord().customQuests.find(item => item.id === id);
  if (!quest || quest.completed) return;
  quest.completed = true;
  quest.completedAt = new Date().toISOString();
  log(`CUSTOM QUEST COMPLETE // ${quest.name}`, "success");
  award(quest.xp, quest.name);
}

function homeQuestRow(quest, day) {
  const complete = day.quests[quest.id];
  return `<div class="objective-row ${complete ? "is-complete" : ""}"><span class="objective-check">${complete ? "✓" : ""}</span><span>${escapeHTML(quest.name)}</span><span>${complete ? "COMPLETE" : `+${quest.xp} XP`}</span></div>`;
}

function homeCustomQuestRow(quest) {
  return `<div class="objective-row ${quest.completed ? "is-complete" : ""}"><span class="objective-check">${quest.completed ? "✓" : ""}</span><span>${escapeHTML(quest.name)} <small>CUSTOM</small></span><span>${quest.completed ? "COMPLETE" : `+${fmtNumber(quest.xp)} XP`}</span></div>`;
}

function renderHome() {
  const day = todayRecord();
  const stats = getStats(state);
  const required = xpRequired(state.player.level);
  const xpPercent = Math.min(100, state.player.xpIntoLevel / required * 100);
  const done = CORE_QUESTS.filter(quest => day.quests[quest.id]).length + (day.studyMinutes > 0 ? 1 : 0);
  const completionPercent = Math.round(done / 5 * 100);
  const recentLogs = state.logs.slice(0, 5);
  const nextQuest = CORE_QUESTS.find(quest => !day.quests[quest.id]);
  const nextActionText = focusTimer.running ? `FOCUS SPRINT ACTIVE // ${focusTimer.minutes} MIN SESSION` : focusTimer.remainingSeconds === 0 ? "FOCUS SPRINT COMPLETE // LOG IT TO SAVE XP." : !day.studyMinutes ? "START A FOCUS SPRINT TO BUILD TODAY'S STUDY RECORD." : nextQuest ? `NEXT UP // VERIFY ${nextQuest.name}` : "CORE LOOP CLEARED // REVIEW YOUR ASCENSION RECORD.";
  const nextActionScreen = !day.studyMinutes || nextQuest || focusTimer.running || focusTimer.remainingSeconds === 0 ? "quests" : "progress";
  const nextActionLabel = focusTimer.remainingSeconds === 0 ? "LOG FOCUS SESSION" : nextActionScreen === "quests" ? focusTimer.running ? "RETURN TO FOCUS" : "OPEN QUEST MATRIX" : "REVIEW PROGRESS";
  const nextAction = `<section class="next-action-bar hud-frame"><div class="next-action-copy"><span class="next-action-mark">↗</span><div><span class="section-code">RECOMMENDED NEXT ACTION</span><strong>${escapeHTML(nextActionText)}</strong></div></div><button class="action-button" data-screen="${nextActionScreen}" type="button">${nextActionLabel}<span>↗</span></button></section>`;
  const hero = `<section class="home-hero hud-frame"><div class="hero-reactor" aria-hidden="true"><i class="reactor-ring reactor-ring-a"></i><i class="reactor-ring reactor-ring-b"></i><i class="reactor-ring reactor-ring-c"></i><i class="reactor-ring reactor-ring-d"></i><span class="reactor-core"></span><b class="reactor-sweep"></b><small>ARISE CORE // ONLINE</small></div><div class="hero-graphic"><div class="emblem-wrap"><i class="emblem-orbit orbit-a"></i><i class="emblem-orbit orbit-b"></i><i class="emblem-orbit orbit-c"></i><div class="emblem-core"><span>A</span></div><div class="emblem-level">LVL ${state.player.level}</div></div><div class="hero-player"><span class="section-code">PLAYER // AWAKENED</span><h2>THE SYSTEM<br><em>RECOGNIZES YOU.</em></h2><div class="hero-rank">CURRENT RANK <strong>${rankForLevel(state.player.level)}-RANK</strong></div></div><div class="hero-coordinate"><span>PLAYER</span><strong>001</strong><span>INSTANCE: LOCAL</span></div></div><div class="hero-xp"><div class="xp-copy"><span>EXPERIENCE CORE</span><strong>${fmtNumber(state.player.xpIntoLevel)} <i>/ ${fmtNumber(required)} XP</i></strong></div><div class="xp-track"><i style="width:${xpPercent}%"></i><b style="left:${xpPercent}%"></b></div><div class="xp-foot"><span>LEVEL ${state.player.level}</span><span>${Math.round(xpPercent)}% TO NEXT LEVEL</span><span>LEVEL ${state.player.level + 1}</span></div></div><div class="hero-stats"><div><span>CURRENT STREAK</span><strong>${stats.currentStreak}<small> DAYS</small></strong></div><div><span>BEST STREAK</span><strong>${stats.bestStreak}<small> DAYS</small></strong></div><div><span>TODAY XP</span><strong class="accent-number">${fmtNumber(day.xpDelta)}<small> XP</small></strong></div><div><span>OBJECTIVES</span><strong>${done}<small> / 5</small></strong></div></div></section>`;
  const briefing = panel("CORE TRANSMISSION // 01", "SYSTEM BRIEFING", `<div class="briefing-copy"><span class="briefing-quote">“</span><div><p>Today's objective: complete your daily quests and maintain your momentum.</p><span>THE SYSTEM SEES THE GRIND.</span></div></div><div class="briefing-footer"><span>DAILY DIRECTIVE</span><strong>${fmtDate(localDate(), { weekday: "long", month: "long", day: "numeric" }).toUpperCase()}</strong></div>`, "<span class='signal-tag'><i></i> LIVE</span>", "briefing-panel");
  const daily = panel("DAILY OBJECTIVE MATRIX", "DAILY STATUS", `<div class="daily-status-top"><div class="completion-ring" style="--progress:${completionPercent}%"><div><strong>${completionPercent}<small>%</small></strong><span>SYNC</span></div></div><div class="daily-status-copy"><strong>${done === 5 ? "ALL OBJECTIVES COMPLETE" : "MOMENTUM IN PROGRESS"}</strong><span>${done} OF 5 CORE OBJECTIVES VERIFIED</span></div></div><div class="objective-list"><div class="objective-row ${day.studyMinutes > 0 ? "is-complete" : ""}"><span class="objective-check">${day.studyMinutes > 0 ? "✓" : ""}</span><span>NEET STUDY <small>${fmtStudy(day.studyMinutes)}</small></span><span>${Math.min(100, Math.round(day.studyMinutes / 480 * 100))}%</span></div>${CORE_QUESTS.map(quest => homeQuestRow(quest, day)).join("")}${day.customQuests.map(homeCustomQuestRow).join("")}</div><button class="text-action" data-screen="quests" type="button">OPEN DAILY QUESTS <span>↗</span></button>`, "<span class='date-code'>" + escapeHTML(day.date) + "</span>", "daily-panel");
  const logRows = recentLogs.length ? recentLogs.map(item => `<div class="log-row log-${escapeHTML(item.type)}"><time>${fmtClock(item.at)}</time><span>${escapeHTML(item.text)}</span><i>›</i></div>`).join("") : `<div class="empty-state compact"><span class="empty-glyph">⌁</span><p>SYSTEM LOG READY.<br>YOUR ACTIONS WILL APPEAR HERE.</p></div>`;
  const systemLog = panel("SYSTEM_LOG // PERSISTENT", "RECENT ACTIVITY", `<div class="log-list">${logRows}</div><button class="text-action" data-screen="system" type="button">OPEN SYSTEM CORE <span>↗</span></button>`, `<span class="log-count">${state.logs.length} ENTRIES</span>`, "home-log-panel");
  const weekXp = stats.weeklyXp;
  const bestStudy = stats.bestStudyDay ? `${fmtStudy(stats.bestStudyDay.studyMinutes)} <span>• ${fmtDate(stats.bestStudyDay.date, { month: "short", day: "numeric" })}</span>` : "NO DATA YET";
  const pulse = `<section class="pulse-panel hud-frame"><div class="pulse-label"><span class="section-code">ARISE CORE // PULSE</span><span class="pulse-line"></span></div><div class="pulse-readout"><span>WEEK XP</span><strong>${fmtNumber(weekXp)}</strong></div><div class="pulse-readout"><span>TOTAL STUDY</span><strong>${fmtStudy(stats.totalStudyMinutes)}</strong></div><div class="pulse-readout"><span>BEST STUDY DAY</span><strong class="pulse-best">${bestStudy}</strong></div><button class="text-action" data-screen="progress" type="button">ANALYZE PROGRESS <span>↗</span></button></section>`;
  host.innerHTML = `<div class="screen-view screen-enter"><div class="screen-intro"><div><span class="section-code">COMMAND NODE // 01</span><p>PLAYER INTERFACE SYNCHRONIZED. YOUR ASCENSION STARTS WITH TODAY.</p></div><span class="intro-coordinate">${fmtDate(localDate(), { month: "short", day: "2-digit" }).toUpperCase()} <i>///</i> ${String(new Date().getFullYear()).slice(-2)}</span></div>${hero}${nextAction}<div class="home-grid">${briefing}${daily}${pulse}${systemLog}</div></div>`;
}

function renderStudyViolation(attempt) {
  if (!attempt) return "";
  const input = attempt.attemptedTotalMinutes === null ? "INVALID TIME FORMAT" : `${fmtStudy(Math.max(0, attempt.attemptedTotalMinutes))} ATTEMPTED`;
  return `<div class="violation-record"><div class="violation-mark">!</div><div><strong>CHEAT / INVALID SYSTEM ENTRY</strong><span>${escapeHTML(input)} · ${escapeHTML(attempt.reason)}</span><small>SYSTEM LESSON: HONEST PROGRESS &gt; FAKE LEVELS.</small></div><b>-5,000 XP</b></div>`;
}

function renderPermanentQuest(quest, day) {
  const complete = day.quests[quest.id];
  return `<article class="quest-card hud-frame ${complete ? "quest-complete" : ""}"><div class="quest-symbol">${quest.icon}</div><div class="quest-card-copy"><div class="quest-title-line"><h3>${escapeHTML(quest.name)}</h3><span class="quest-state">${complete ? "OBJECTIVE VERIFIED" : "DAILY OBJECTIVE"}</span></div><p>${escapeHTML(quest.detail)}</p></div><div class="quest-card-reward">${complete ? "✓ CLAIMED" : `+${quest.xp} <small>XP</small>`}</div><button class="action-button ${complete ? "is-complete" : ""}" data-action="complete-quest" data-id="${quest.id}" type="button" ${complete ? "disabled" : ""}>${complete ? "COMPLETE" : "COMPLETE QUEST"}<span>${complete ? "✓" : "↗"}</span></button></article>`;
}

function renderCustomQuest(quest) {
  const id = escapeHTML(quest.id);
  return `<article class="custom-quest hud-frame ${quest.completed ? "quest-complete" : ""}"><div class="custom-quest-glyph">${quest.completed ? "✓" : "◈"}</div><div class="custom-quest-copy"><h3>${escapeHTML(quest.name)}</h3><span>${quest.completed ? "OBJECTIVE VERIFIED" : "PLAYER CREATED"}</span></div><strong>+${fmtNumber(quest.xp)} <small>XP</small></strong><button class="action-button compact-action ${quest.completed ? "is-complete" : ""}" data-action="complete-custom" data-id="${id}" type="button" ${quest.completed ? "disabled" : ""}>${quest.completed ? "COMPLETE" : "CLAIM XP"}<span>${quest.completed ? "✓" : "↗"}</span></button></article>`;
}

function renderQuests() {
  const day = todayRecord();
  const completed = CORE_QUESTS.filter(quest => day.quests[quest.id]).length + (day.studyMinutes > 0 ? 1 : 0);
  const lock = day.cheatAttempts[0];
  const studyCard = `<section class="study-module hud-frame ${lock ? "study-locked" : ""}"><div class="study-module-top"><div class="study-icon">⌁</div><div><span class="section-code">PERMANENT QUEST // A</span><h2>NEET STUDY</h2><p>FOCUSED STUDY TIME · 50 XP PER HOUR · PROPORTIONAL</p></div><div class="study-cap"><span>DAILY CAP</span><strong>08<span>H</span> 00<span>M</span></strong></div></div><div class="study-meter"><div class="study-meter-top"><span>TODAY'S STUDY</span><strong>${fmtStudy(day.studyMinutes)} <i>/ 08H 00M</i></strong></div><div class="meter-track"><i style="width:${Math.min(100, day.studyMinutes / 480 * 100)}%"></i></div></div>${renderFocusConsole(Boolean(lock))}${lock ? renderStudyViolation(lock) : ""}<form id="studyForm" class="study-form"><label class="field"><span>HOURS</span><input name="hours" inputmode="numeric" type="number" min="0" step="1" placeholder="00" aria-label="Study hours" ${lock ? "disabled" : ""}></label><span class="time-colon">:</span><label class="field"><span>MINUTES</span><input name="minutes" inputmode="numeric" type="number" min="0" max="59" step="1" placeholder="00" aria-label="Study minutes" ${lock ? "disabled" : ""}></label><button class="action-button study-submit" type="submit" ${lock ? "disabled" : ""}>LOG STUDY <span>↗</span></button></form>${lock ? `<div class="locked-message"><span>⛨</span><p>STUDY SUBMISSIONS LOCKED UNTIL NEXT DAY.<br><small>DISCIPLINE CANNOT BE FAKED.</small></p></div>` : `<div class="study-note"><span>THE SYSTEM SEES THE GRIND.</span><span>REPEATED SESSIONS SHARE ONE DAILY XP CURVE</span></div>`}</section>`;
  const custom = day.customQuests.length ? day.customQuests.map(renderCustomQuest).join("") : `<div class="empty-state compact"><span class="empty-glyph">◈</span><p>NO CUSTOM QUESTS IN THE DAILY QUEUE.<br>ADD AN OBJECTIVE TO BEGIN.</p></div>`;
  const customPanel = panel("PLAYER GENERATED // DAILY QUEUE", "CUSTOM QUESTS", `<form id="customQuestForm" class="custom-create"><label class="field quest-name-field"><span>TASK NAME</span><input name="taskName" type="text" maxlength="60" placeholder="E.G. READ BIOLOGY NCERT" autocomplete="off" required></label><label class="field reward-field"><span>XP REWARD</span><input name="taskXp" type="number" min="1" max="10000" step="1" placeholder="250" required></label><button class="action-button" type="submit">ADD CUSTOM QUEST <span>＋</span></button></form><p class="form-hint">1–10,000 XP <i>///</i> QUESTS RETURN TO THE DAILY QUEUE EACH DAY</p><div class="custom-quest-list">${custom}</div>`, `<span class="date-code">${escapeHTML(day.date)}</span>`, "custom-panel");
  host.innerHTML = `<div class="screen-view screen-enter"><div class="screen-intro"><div><span class="section-code">QUEST MATRIX // DAILY</span><p>COMPLETE YOUR OBJECTIVES. THE SYSTEM WILL RECORD EVERY VERIFIED ACTION.</p></div><div class="objective-counter"><strong>${completed}<i>/05</i></strong><span>VERIFIED</span></div></div><div class="quests-layout"><section class="quest-column"><div class="column-heading"><div><span class="section-code">PERMANENT QUESTS // 01—05</span><h2>DAILY OBJECTIVES</h2></div><span class="date-code">${escapeHTML(day.date)}</span></div>${studyCard}${CORE_QUESTS.map(quest => renderPermanentQuest(quest, day)).join("")}</section><aside class="quest-aside"><div class="discipline-panel hud-frame"><span class="section-code">SYSTEM DIRECTIVE</span><div class="directive-mark">✦</div><h3>CONSISTENCY<br>IS YOUR<br><em>POWER.</em></h3><p>Earn XP through honest effort. Every real session moves your profile forward.</p><div class="directive-rule"></div><span class="directive-tag">HONEST PROGRESS &gt; FAKE LEVELS</span></div><div class="quest-aside-stat"><span>CORE QUEST XP</span><strong>+400 <i>XP / DAY</i></strong></div><div class="quest-aside-stat"><span>STUDY XP CAP</span><strong>+400 <i>XP / DAY</i></strong></div></aside></div>${customPanel}</div>`;
}

function renderBarChart(items, { labelKey = "label", valueKey = "value", maxValue, empty = "NO ACTIVITY RECORDED" } = {}) {
  const max = maxValue ?? Math.max(1, ...items.map(item => Math.abs(item[valueKey])));
  if (!items.length) return `<div class="chart-empty">${empty}</div>`;
  return `<div class="bar-chart" style="--bar-count:${items.length}">${items.map(item => {
    const value = item[valueKey];
    const magnitude = Math.abs(value);
    const height = magnitude > 0 ? Math.max(5, Math.min(100, magnitude / max * 100)) : 2;
    const signed = value < 0 ? "negative" : "";
    return `<div class="bar-column" title="${escapeHTML(item.title || `${item[labelKey]}: ${value}`)}"><div class="bar-value ${signed}">${fmtNumber(value)}</div><div class="bar-rail"><i style="height:${height}%" class="${magnitude ? "has-value" : ""} ${signed}"></i></div><span>${escapeHTML(item[labelKey])}</span></div>`;
  }).join("")}</div>`;
}

function renderLineChart(items) {
  const width = 700;
  const height = 220;
  const padding = { top: 20, right: 24, bottom: 36, left: 34 };
  const values = items.map(item => item.value);
  const min = Math.min(0, ...values);
  const max = Math.max(1, ...values);
  const range = max - min || 1;
  const x = index => padding.left + index * (width - padding.left - padding.right) / Math.max(1, items.length - 1);
  const y = value => padding.top + (max - value) / range * (height - padding.top - padding.bottom);
  const points = items.map((item, index) => `${x(index)},${y(item.value)}`).join(" ");
  const zeroY = y(0);
  const grid = Array.from({ length: 4 }, (_, index) => {
    const gridY = padding.top + index * (height - padding.top - padding.bottom) / 3;
    return `<line class="line-chart-grid" x1="${padding.left}" y1="${gridY}" x2="${width - padding.right}" y2="${gridY}"></line>`;
  }).join("");
  const markers = items.map((item, index) => `<circle class="line-chart-point" cx="${x(index)}" cy="${y(item.value)}" r="4"><title>${escapeHTML(item.title || `${item.label}: ${item.value} XP`)}</title></circle><text class="line-chart-label" x="${x(index)}" y="${height - 9}" text-anchor="middle">${escapeHTML(item.label)}</text>`).join("");
  return `<svg class="line-chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="Line graph of XP earned or lost over the last seven days">${grid}<line class="line-chart-zero" x1="${padding.left}" y1="${zeroY}" x2="${width - padding.right}" y2="${zeroY}"></line><polyline class="line-chart-path" points="${points}"></polyline>${markers}</svg>`;
}

function renderProgress() {
  const stats = getStats(state);
  const today = localDate();
  const lastSeven = Array.from({ length: 7 }, (_, index) => {
    const date = addDays(today, index - 6);
    const day = state.history[date];
    return { label: fmtDate(date, { weekday: "short" }).toUpperCase(), value: day?.xpDelta || 0, title: `${fmtDate(date)} · ${fmtNumber(day?.xpDelta || 0)} XP` };
  });
  const monthKey = today.slice(0, 7);
  const { daysInMonth } = getMonthDays(new Date().getFullYear(), new Date().getMonth());
  const weekCount = Math.ceil(daysInMonth / 7);
  const monthWeeks = Array.from({ length: weekCount }, (_, index) => {
    const first = index * 7 + 1;
    const last = Math.min(daysInMonth, first + 6);
    const days = Object.values(state.history).filter(day => day.date.startsWith(monthKey) && Number(day.date.slice(-2)) >= first && Number(day.date.slice(-2)) <= last);
    const active = days.filter(dayHasProgress).length;
    const xp = days.reduce((sum, day) => sum + day.xpDelta, 0);
    return { label: `W${String(index + 1).padStart(2, "0")}`, value: active, title: `Days ${first}–${last} · ${active} active · ${xp} XP`, xp };
  });
  const studyDates = Object.values(state.history).filter(day => day.studyMinutes > 0).sort((a, b) => b.studyMinutes - a.studyMinutes);
  const statCards = [
    ["CURRENT STREAK", stats.currentStreak, "DAYS", "↗"], ["BEST STREAK", stats.bestStreak, "DAYS", "✦"],
    ["TOTAL XP", fmtNumber(stats.totalXp), "NET XP", "⌁"], ["TOTAL STUDY", fmtStudy(stats.totalStudyMinutes), "HOURS : MINUTES", "◷"],
    ["WEEKLY XP", fmtNumber(stats.weeklyXp), "LAST 7 DAYS", "▥"], ["MONTHLY XP", fmtNumber(stats.monthlyXp), fmtMonth(new Date()).toUpperCase(), "▦"],
    ["ACTIVE DAYS", stats.activeDays, "REAL ACTIVITY", "◉"], ["QUESTS COMPLETED", stats.questsCompleted, "VERIFIED", "◈"]
  ];
  const cards = statCards.map(([label, value, unit, icon]) => `<div class="metric-card hud-frame"><span class="metric-icon">${icon}</span><span class="metric-label">${label}</span><strong>${value}</strong><small>${unit}</small></div>`).join("");
  const sevenChart = renderLineChart(lastSeven);
  const monthlyChart = renderBarChart(monthWeeks, { valueKey: "value", maxValue: 7, empty: "NO MONTHLY ACTIVITY" });
  const bestDay = studyDates[0];
  host.innerHTML = `<div class="screen-view screen-enter"><div class="screen-intro"><div><span class="section-code">PROGRESS CORE // VERIFIED HISTORY</span><p>EVERY NUMBER BELOW COMES FROM YOUR SAVED DAILY RECORDS.</p></div><span class="data-integrity"><i></i> REAL PLAYER DATA</span></div><div class="metric-grid">${cards}</div><div class="progress-grid">${panel("ACTIVITY TRACE // 07 DAYS", "WEEKLY XP ACTIVITY", `${sevenChart}<div class="chart-legend"><span><i></i> XP EARNED / PENALTY</span><span>LOCAL DAY</span></div>`, "<span class='chart-range'>LAST 7 DAYS</span>", "chart-panel weekly-chart")}${panel("MONTH ACTIVITY // CURRENT", "MONTHLY ACTIVE DAYS", `${monthlyChart}<div class="chart-legend"><span><i></i> ACTIVE DAYS / WEEK</span><span>${escapeHTML(monthKey)}</span></div>`, `<span class="chart-range">${fmtMonth(new Date()).toUpperCase()}</span>`, "chart-panel monthly-chart")}</div><div class="progress-detail-grid">${panel("PERSONAL RECORD // STUDY", "BEST STUDY DAY", bestDay ? `<div class="record-display"><span class="record-glyph">◷</span><div><strong>${fmtStudy(bestDay.studyMinutes)}</strong><span>${fmtDate(bestDay.date, { weekday: "long", month: "long", day: "numeric" }).toUpperCase()}</span></div></div>` : `<div class="empty-state compact"><span class="empty-glyph">◷</span><p>NO STUDY RECORD YET.<br>YOUR FIRST SESSION STARTS THE ARCHIVE.</p></div>`, "<span class='section-extra'>ALL TIME</span>", "record-panel")}${panel("ACTIVITY ARCHIVE // STREAK", "STREAK STATUS", `<div class="streak-display"><div><span>CURRENT</span><strong>${stats.currentStreak}<small> DAYS</small></strong></div><div><span>BEST EVER</span><strong>${stats.bestStreak}<small> DAYS</small></strong></div></div><p class="subtle-copy">A day is complete after all four daily quests and at least one legitimate study minute are recorded.</p>`, "<span class='section-extra'>5 CORE OBJECTIVES</span>", "streak-panel")}</div></div>`;
}

function renderAchievements() {
  const unlocked = ACHIEVEMENTS.filter(item => state.achievements[item.id]);
  const cards = ACHIEVEMENTS.map(item => {
    const date = state.achievements[item.id];
    const reward = `<span class="achievement-reward">${escapeHTML(String(item.rewardXp))} XP REWARD</span>`;
    return `<article class="achievement-card hud-frame ${date ? "unlocked" : "locked"} ${item.rank ? "rank-achievement" : ""}"><div class="achievement-icon">${item.icon}${date ? `<i>✓</i>` : ""}</div><div class="achievement-copy"><span class="section-code">${date ? item.rank ? `${item.rank}-RANK // ASCENDED` : "SYSTEM AWARD // UNLOCKED" : "SYSTEM AWARD // SEALED"}</span><h3>${escapeHTML(item.name)}</h3><p>${escapeHTML(item.description)}</p>${date ? `<small>UNLOCKED ${escapeHTML(fmtDate(date, { month: "short", day: "numeric", year: "numeric" }).toUpperCase())}</small>` : `<small>CONDITION NOT YET MET</small>`}</div><div class="achievement-meta">${reward}<div class="achievement-status">${date ? "UNLOCKED" : "LOCKED"}</div></div></article>`;
  }).join("");
  const totalRewards = unlocked.reduce((total, item) => total + item.rewardXp, 0);
  host.innerHTML = `<div class="screen-view screen-enter"><div class="screen-intro"><div><span class="section-code">ACHIEVEMENT CORE // RECOGNITION</span><p>THE SYSTEM RECORDS MILESTONES EARNED THROUGH REAL PROGRESS.</p></div><div class="award-counter"><strong>${String(unlocked.length).padStart(2, "0")}<i> / ${String(ACHIEVEMENTS.length).padStart(2, "0")}</i></strong><span>AWARDS UNLOCKED</span></div></div><section class="achievement-banner hud-frame"><div class="banner-emblem">✧</div><div><span class="section-code">ASCENSION RECORD</span><h2>EVERY MILESTONE<br><em>IS EARNED.</em></h2><span class="banner-reward-total">REWARDS CLAIMED // +${fmtNumber(totalRewards)} XP</span></div><div class="banner-progress"><strong>${Math.round(unlocked.length / ACHIEVEMENTS.length * 100)}<small>%</small></strong><span>SYSTEM RECOGNITION</span></div></section><div class="achievement-grid">${cards}</div></div>`;
}

function renderPlayer() {
  const stats = getStats(state);
  const rank = rankForLevel(state.player.level);
  const required = xpRequired(state.player.level);
  const nextRank = state.player.level < 5 ? "D" : state.player.level < 10 ? "C" : state.player.level < 20 ? "B" : state.player.level < 40 ? "A" : state.player.level < 75 ? "S" : state.player.level < 150 ? "SS" : state.player.level < 300 ? "SSS" : state.player.level < 999 ? "X" : "MAX";
  const portrait = `<section class="player-profile hud-frame"><div class="profile-scanline"></div><div class="profile-top"><span>PLAYER PROFILE // 001</span><span><i></i> AWAKENED</span></div><div class="profile-art"><div class="profile-orbit orbit-a"></div><div class="profile-orbit orbit-b"></div><div class="profile-orbit orbit-c"></div><div class="profile-avatar"><span>A</span><i>ARISE</i></div><div class="profile-level">LEVEL <strong>${state.player.level}</strong></div><div class="profile-rank-stamp">${rank}<small>RANK</small></div></div><div class="profile-identity"><span class="section-code">PLAYER IDENTIFIED</span><h2>AWAKENED</h2><p>PERSONAL ASCENSION INSTANCE</p></div><div class="profile-xp"><div><span>EXPERIENCE</span><strong>${fmtNumber(state.player.xpIntoLevel)} / ${fmtNumber(required)} XP</strong></div><div class="meter-track"><i style="width:${Math.min(100, state.player.xpIntoLevel / required * 100)}%"></i></div><span class="profile-next">NEXT RANK: <b>${nextRank}-RANK</b></span></div></section>`;
  const statLines = [
    ["CURRENT STREAK", `${stats.currentStreak} DAYS`], ["BEST STREAK", `${stats.bestStreak} DAYS`],
    ["TOTAL QUESTS", fmtNumber(stats.questsCompleted)], ["TOTAL STUDY", fmtStudy(stats.totalStudyMinutes)],
    ["ACTIVE DAYS", fmtNumber(stats.activeDays)], ["TOTAL XP", `${fmtNumber(stats.totalXp)} XP`]
  ];
  const rankSteps = [["E", 1], ["D", 5], ["C", 10], ["B", 20], ["A", 40], ["S", 75], ["SS", 150], ["SSS", 300], ["X", 999]];
  const rankTrack = rankSteps.map(([name, level]) => `<div class="rank-step ${state.player.level >= level ? "rank-reached" : ""} ${rank === name ? "rank-current" : ""}"><span>${name}</span><small>${level === 999 ? "999+" : `LV ${level}`}</small></div>`).join("");
  host.innerHTML = `<div class="screen-view screen-enter"><div class="screen-intro"><div><span class="section-code">PLAYER CORE // CHARACTER PROFILE</span><p>YOUR PROFILE IS BUILT FROM YOUR VERIFIED HISTORY.</p></div><span class="player-id-chip">ID // 001</span></div><div class="player-layout">${portrait}<div class="player-data-column">${panel("PLAYER ATTRIBUTES // 06", "ASCENSION RECORD", `<div class="profile-stat-list">${statLines.map(([label, value]) => `<div><span>${escapeHTML(label)}</span><strong>${escapeHTML(value)}</strong></div>`).join("")}</div>`, "<span class='section-extra'>LIVE DATA</span>", "profile-stats-panel")}${panel("RANK LADDER // 09", "RANK PROGRESSION", `<div class="rank-ladder">${rankTrack}</div><p class="subtle-copy">Rank is derived from your current level. Each level requires 250 more XP than the last.</p>`, `<span class='section-extra'>CURRENT ${rank}-RANK</span>`, "rank-panel")}</div></div></div>`;
}

function renderCalendar() {
  const year = calendarCursor.getFullYear();
  const month = calendarCursor.getMonth();
  const { offset, daysInMonth } = getMonthDays(year, month);
  const monthKey = `${year}-${String(month + 1).padStart(2, "0")}`;
  const cells = [];
  for (let i = 0; i < offset; i += 1) cells.push(`<div class="calendar-blank" aria-hidden="true"></div>`);
  for (let dayNumber = 1; dayNumber <= daysInMonth; dayNumber += 1) {
    const key = `${monthKey}-${String(dayNumber).padStart(2, "0")}`;
    const record = state.history[key];
    const status = dayStatus(record).toLowerCase().replaceAll(" ", "-");
    const selected = selectedCalendarDate === key;
    const isToday = key === localDate();
    const value = record ? Math.max(0, record.xpDelta) : 0;
    cells.push(`<button type="button" class="calendar-day ${status} ${selected ? "selected" : ""} ${isToday ? "today" : ""}" data-action="select-date" data-date="${key}" aria-label="${fmtDate(key, { weekday: "long", month: "long", day: "numeric", year: "numeric" })}: ${dayStatus(record)}" aria-pressed="${selected}"><span>${dayNumber}</span>${record && (record.studyMinutes > 0 || record.xpDelta !== 0) ? `<small>${fmtNumber(value)} XP</small>` : ""}<i></i></button>`);
  }
  const selected = state.history[selectedCalendarDate];
  const selectedStatus = dayStatus(selected);
  const questCount = selected ? CORE_QUESTS.filter(quest => selected.quests[quest.id]).length + (selected.studyMinutes > 0 ? 1 : 0) + selected.customQuests.filter(quest => quest.completed).length : 0;
  const objectiveCount = selected ? CORE_QUESTS.filter(quest => selected.quests[quest.id]).length + (selected.studyMinutes > 0 ? 1 : 0) : 0;
  const violationDetails = selected?.cheatAttempts?.map(attempt => `<div class="calendar-detail-violation"><span>!</span>STUDY CAP VIOLATION <strong>-5,000 XP</strong><small>${escapeHTML(attempt.reason)}</small></div>`).join("") || "";
  const detailContent = selected ? `
    <div class="calendar-detail-status status-${selectedStatus.toLowerCase().replace(" ", "-")}"><i></i>${selectedStatus}</div>
    <div class="calendar-detail-grid">
      <div><span>NET XP</span><strong>${fmtNumber(selected.xpDelta)}</strong></div>
      <div><span>STUDY</span><strong>${fmtStudy(selected.studyMinutes)}</strong></div>
      <div><span>QUESTS</span><strong>${questCount}</strong></div>
      <div><span>OBJECTIVES</span><strong>${isDayComplete(selected) ? "5 / 5" : `${objectiveCount} / 5`}</strong></div>
    </div>
    ${violationDetails}
    <div class="calendar-detail-list">
      ${CORE_QUESTS.map(quest => `<div><span class="${selected.quests[quest.id] ? "text-green" : ""}">${selected.quests[quest.id] ? "✓" : "·"}</span>${escapeHTML(quest.name)}</div>`).join("")}
      <div><span class="${selected.studyMinutes > 0 ? "text-green" : ""}">${selected.studyMinutes > 0 ? "✓" : "·"}</span>NEET STUDY</div>
      ${selected.customQuests.filter(quest => quest.completed).map(quest => `<div><span class="text-green">✓</span>${escapeHTML(quest.name)}</div>`).join("")}
    </div>` : `<div class="empty-state compact"><span class="empty-glyph">▦</span><p>NO SAVED RECORD FOR THIS DAY.<br>PAST ACTIVITY IS NEVER ASSUMED.</p></div>`;
  host.innerHTML = `<div class="screen-view screen-enter"><div class="screen-intro"><div><span class="section-code">HISTORY CORE // PERSISTENT ARCHIVE</span><p>SELECT A DATE TO INSPECT ITS SAVED PLAYER RECORD.</p></div><div class="calendar-legend"><span><i class="legend-complete"></i> COMPLETED</span><span><i class="legend-partial"></i> PARTIAL</span><span><i class="legend-none"></i> NO DATA</span></div></div><div class="calendar-layout"><section class="calendar-panel hud-panel"><div class="calendar-heading"><button class="square-button" data-action="month-prev" type="button" aria-label="Previous month">‹</button><div><span class="section-code">MONTHLY RECORD</span><h2>${escapeHTML(fmtMonth(calendarCursor).toUpperCase())}</h2></div><button class="square-button" data-action="month-next" type="button" aria-label="Next month">›</button></div><div class="calendar-weekdays">${["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map(day => `<span>${day}</span>`).join("")}</div><div class="calendar-grid">${cells.join("")}</div><div class="calendar-key"><span><i class="legend-complete"></i> COMPLETED</span><span><i class="legend-partial"></i> PARTIAL</span><span><i class="legend-none"></i> NO DATA</span></div></section><aside class="calendar-detail hud-frame"><span class="section-code">DAY RECORD // INSPECT</span><h2>${escapeHTML(fmtDate(selectedCalendarDate, { weekday: "long", month: "long", day: "numeric" }).toUpperCase())}</h2>${detailContent}</aside></div></div>`;
}

function renderSystem() {
  const day = todayRecord();
  const storageState = storageAvailable ? "CONNECTED" : "MEMORY ONLY";
  const lockState = day.cheatAttempts.length ? "TODAY LOCKED" : "CLEAR";
  host.innerHTML = `<div class="screen-view screen-enter"><div class="screen-intro"><div><span class="section-code">SYSTEM CORE // V10.0</span><p>LOCAL PLAYER DATA, SAVE TRANSFER, AND DEVELOPMENT CONTROLS.</p></div><span class="system-version">BUILD 10.0.0</span></div><div class="system-status-grid"><div class="system-status-card hud-frame"><span class="system-status-icon">◉</span><span>SYSTEM STATUS</span><strong><i></i> ONLINE</strong></div><div class="system-status-card hud-frame"><span class="system-status-icon">⌁</span><span>CORE STATUS</span><strong>OPERATIONAL</strong></div><div class="system-status-card hud-frame"><span class="system-status-icon">▤</span><span>LOCAL STORAGE</span><strong class="${storageAvailable ? "" : "status-alert"}">${storageState}</strong></div><div class="system-status-card hud-frame"><span class="system-status-icon">⛨</span><span>ANTI-CHEAT</span><strong class="${day.cheatAttempts.length ? "status-alert" : ""}">${lockState}</strong></div></div><div class="system-controls-grid"><section class="hud-panel data-panel">${sectionHead("SAVE CORE // JSON", "PLAYER DATA TRANSFER")}<p class="panel-description">Export a complete snapshot of your player, daily history, custom quests, achievements, settings, and anti-cheat record. Import validates the save before it replaces this local profile.</p><div class="data-controls"><button class="action-button" data-action="export-save" type="button">EXPORT SAVE <span>↓</span></button><label class="action-button import-button">IMPORT SAVE <span>↑</span><input id="importSaveInput" type="file" accept="application/json,.json" aria-label="Choose ARISE save file"></label></div><div class="save-key-line"><span>ACTIVE SAVE KEY</span><code>${KEY}</code><span>VERSION ${state.version}</span></div></section><section class="hud-panel dev-panel">${sectionHead("DEVELOPMENT BUILD // LOCAL ONLY", "TEST RESET")}<p class="panel-description">Clear this local development profile and reload a fresh player instance. This control is for testing only and permanently removes the current local save.</p><div class="dev-control-row"><div><span>DEVELOPMENT CONTROL</span><small>Clears the V10 local save key.</small></div><button class="danger-button" data-action="test-reset" type="button">TEST RESET <span>↻</span></button></div></section></div><div class="system-footnote"><span>ANTI-CHEAT RECORD</span><p>A study violation is stored in the dated history and cannot be cleared by normal day transitions or save imports on the same day. TEST RESET is a development control and intentionally clears the local save.</p></div></div>`;
}

function renderEvents() {
  const event = EVENT_DEFINITIONS[0];
  const today = localDate();
  const now = new Date();
  const currentHour = now.getHours();
  const activeTimedEvent = timedEventAt(now);
  const nextTimedEvent = TIMED_EVENTS.find(item => item.startHour > currentHour) || TIMED_EVENTS[0];
  const startDate = state.events.winterArcStartDate;
  const sevenDays = Array.from({ length: 7 }, (_, index) => state.history[addDays(today, index - 6)]).filter(Boolean);
  const activeDays = sevenDays.filter(dayHasProgress).length;
  const completedDays = Object.values(state.history).filter(day => day.date >= startDate && isDayComplete(day)).length;
  const todayDone = CORE_QUESTS.filter(quest => todayRecord().quests[quest.id]).length + (todayRecord().studyMinutes > 0 ? 1 : 0);
  const objectives = [
    { code: "OBJECTIVE 01", title: "DAILY CONSISTENCY", desc: "Show up and record a real action today.", value: `${todayDone} / 5`, percent: todayDone / 5 * 100 },
    { code: "OBJECTIVE 02", title: "MAINTAIN YOUR STREAK", desc: "Keep the daily completion chain alive.", value: `${getCurrentStreak(state)} DAYS`, percent: Math.min(100, getCurrentStreak(state) / 7 * 100) },
    { code: "OBJECTIVE 03", title: "COMPLETE DAILY QUESTS", desc: "Verify each core objective to complete a day.", value: `${completedDays} DAYS`, percent: Math.min(100, completedDays / 7 * 100) },
    { code: "OBJECTIVE 04", title: "WEEKLY PRESENCE", desc: "Record activity across the current 7-day window.", value: `${activeDays} / 7 DAYS`, percent: activeDays / 7 * 100 }
  ];
  const objectiveCards = objectives.map(item => `<article class="event-objective hud-frame"><div class="event-objective-head"><span class="section-code">${item.code}</span><span>${item.value}</span></div><h3>${item.title}</h3><p>${item.desc}</p><div class="meter-track"><i style="width:${item.percent}%"></i></div></article>`).join("");
  const timedEventCards = TIMED_EVENTS.map(item => {
    const isActive = activeTimedEvent?.id === item.id;
    const isNext = !activeTimedEvent && nextTimedEvent.id === item.id;
    const startTime = `${String(item.startHour).padStart(2, "0")}:00`;
    const endTime = `${String(item.endHour).padStart(2, "0")}:00`;
    const percent = Math.round((item.multiplier - 1) * 100);
    const effect = `${percent > 0 ? "+" : ""}${percent}% XP`;
    const status = isActive ? "ACTIVE NOW" : isNext ? "UP NEXT" : "SCHEDULED";
    return `<article class="timed-event-card hud-frame ${isActive ? "timed-event-active" : ""} ${item.multiplier < 1 ? "timed-event-debuff" : ""}"><div class="timed-event-top"><span class="section-code">${escapeHTML(status)}</span><strong>${startTime}–${endTime}</strong></div><h3>${escapeHTML(item.name)}</h3><p>${escapeHTML(item.description)}</p><div class="timed-event-effect">${escapeHTML(effect)}<small>LOCAL TIME</small></div></article>`;
  }).join("");
  const activeEventNote = activeTimedEvent
    ? `${activeTimedEvent.name} is active now. XP from actions completed in this window is multiplied by ${activeTimedEvent.multiplier.toFixed(2)}×.`
    : `No modifier is active now. ${nextTimedEvent.name} begins at ${String(nextTimedEvent.startHour).padStart(2, "0")}:00 local time.`;
  host.innerHTML = `<div class="screen-view screen-enter"><div class="screen-intro"><div><span class="section-code">EVENT CORE // OPERATIONS</span><p>LIVE SYSTEM INITIATIVES BUILT FROM YOUR SAVED ACTIVITY.</p></div><span class="signal-tag"><i></i> ${event.status}</span></div><section class="event-hero hud-frame"><div class="event-orbit"><i></i><i></i><i></i><span>✦</span></div><div class="event-copy"><span class="event-live"><i></i> ACTIVE EVENT</span><h2>${event.name}</h2><p>${event.description}</p><div class="event-meta"><span>EVENT START</span><strong>${escapeHTML(fmtDate(startDate, { month: "long", day: "numeric", year: "numeric" }).toUpperCase())}</strong></div></div><div class="event-seal"><span>WINTER</span><strong>ARC</strong><i>ARISE EVENT 01</i></div></section><div class="event-section-heading"><div><span class="section-code">WINTER ARC // OBJECTIVES</span><h2>ACTIVE DIRECTIVES</h2></div><span>NO REWARD TRACK ENABLED</span></div><div class="event-objective-grid">${objectiveCards}</div><div class="event-note"><span>✧</span><p>WINTER ARC tracks real consistency and daily completion. Event history is calculated from your saved records.</p></div><section class="timed-events-section"><div class="event-section-heading"><div><span class="section-code">SCHEDULED OPERATIONS // LOCAL TIME</span><h2>BUFF &amp; DEBUFF WINDOWS</h2></div><span>${escapeHTML(fmtClock(now.toISOString()))} LOCAL</span></div><p class="timed-event-disclaimer">${escapeHTML(activeEventNote)} Modifiers apply only to XP earned during the listed window; existing XP is unchanged.</p><div class="timed-event-grid">${timedEventCards}</div></section></div>`;
}

function renderActiveScreen() {
  clearTimeout(screenTransitionTimer);
  host.classList.remove("screen-refresh");
  void host.offsetWidth;
  host.classList.add("screen-refresh");
  const renderers = { home: renderHome, quests: renderQuests, progress: renderProgress, achievements: renderAchievements, player: renderPlayer, calendar: renderCalendar, system: renderSystem, events: renderEvents };
  try {
    renderers[activeScreen]();
    syncPlayerName();
  } catch (error) {
    console.error("ARISE screen render failed", error);
    host.innerHTML = `<section class="fatal-panel hud-frame"><span class="section-code">SYSTEM EXCEPTION</span><h2>SCREEN MODULE UNAVAILABLE</h2><p>${escapeHTML(error.message || "An unknown rendering error occurred.")}</p><button class="action-button" data-screen="home" type="button">RETURN HOME <span>↗</span></button></section>`;
    showToast("error", "SYSTEM ERROR", "The requested screen could not load.", true);
  }
}

function renderAll() {
  updateGlobalHeader();
  renderActiveScreen();
}

function exportPlayerSave() {
  const blob = new Blob([exportSave(state)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `arise-system-v10-${localDate()}.json`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
  log("PLAYER SAVE EXPORTED // JSON", "success");
  persist();
  showToast("success", "SAVE EXPORTED", "Complete player data downloaded as JSON.");
}

async function importPlayerSave(file) {
  if (!file) return;
  try {
    const imported = parseImportedSave(await file.text(), state);
    state = imported;
    persist();
    renderAll();
    if (!state.settings.nameConfigured) showPlayerNameSetup();
    showToast("success", "SAVE IMPORTED", "Player data and history synchronized.", true);
  } catch (error) {
    showToast("error", "IMPORT REJECTED", error.message || "The save could not be validated.", true);
  }
}

function selectCalendarDate(date) {
  selectedCalendarDate = date;
  renderActiveScreen();
}

function changeCalendarMonth(amount) {
  calendarCursor = new Date(calendarCursor.getFullYear(), calendarCursor.getMonth() + amount, 1, 12);
  const monthKey = `${calendarCursor.getFullYear()}-${String(calendarCursor.getMonth() + 1).padStart(2, "0")}`;
  if (!selectedCalendarDate.startsWith(monthKey)) selectedCalendarDate = `${monthKey}-01`;
  renderActiveScreen();
}

function handleClick(event) {
  const screenButton = event.target.closest("[data-screen]");
  if (screenButton) {
    navigate(screenButton.dataset.screen);
    return;
  }
  const action = event.target.closest("[data-action]");
  if (!action || action.disabled) return;
  switch (action.dataset.action) {
    case "complete-quest": recordQuest(action.dataset.id); break;
    case "complete-custom": completeCustomQuest(action.dataset.id); break;
    case "focus-duration": resetFocusSprint(Number(action.dataset.minutes)); break;
    case "focus-toggle": toggleFocusSprint(); break;
    case "focus-reset": resetFocusSprint(); break;
    case "focus-log": logFocusSprint(); break;
    case "export-save": exportPlayerSave(); break;
    case "test-reset": {
      const confirmed = window.confirm("TEST RESET will erase this local development save and all saved history. Continue?");
      if (!confirmed) break;
      localStorage.removeItem(KEY);
      location.reload();
      break;
    }
    case "month-prev": changeCalendarMonth(-1); break;
    case "month-next": changeCalendarMonth(1); break;
    case "select-date": selectCalendarDate(action.dataset.date); break;
    default: break;
  }
}

function handleSubmit(event) {
  const form = event.target;
  if (form.id === "playerNameForm") {
    event.preventDefault();
    const name = form.elements.playerName.value.replace(/\s+/g, " ").trim().slice(0, 30);
    if (!name) {
      form.elements.playerName.focus();
      showToast("warning", "PLAYER NAME REQUIRED", "Enter a name to initialize your player profile.");
      return;
    }
    state.player.name = name;
    state.settings.playerName = name;
    state.settings.nameConfigured = true;
    persist();
    modalRoot.replaceChildren();
    renderAll();
    showToast("success", "IDENTITY CONFIRMED", `Welcome, ${name}.`);
  }
  if (form.id === "studyForm") {
    event.preventDefault();
    submitStudy(form);
  }
  if (form.id === "customQuestForm") {
    event.preventDefault();
    addCustomQuest(form);
  }
}

function startBoot() {
  const bootScreen = $("#bootScreen");
  const messages = ["SCANNING PLAYER...", "IDENTITY CONFIRMED.", "LOADING DAILY QUESTS...", "LOADING PROGRESS CORE...", "CALIBRATING RANK SYSTEM...", "SYNCHRONIZING PLAYER DATA...", "ARISE CORE ONLINE"];
  const progress = $("#bootProgress");
  let index = 0;
  const line = $("#bootText");
  const transition = () => {
    line.textContent = messages[index];
    progress.style.width = `${Math.round((index + 1) / messages.length * 100)}%`;
    index += 1;
    if (index < messages.length) {
      setTimeout(transition, 360);
      return;
    }
    setTimeout(() => {
      bootScreen.classList.add("boot-exit");
      root.hidden = false;
      root.classList.add("app-ready");
      setTimeout(() => bootScreen.remove(), 620);
      renderAll();
      showToast("info", "SYSTEM STATUS: ONLINE", "PLAYER IDENTIFIED · ARISE CORE READY");
      if (startupWarning) showToast("warning", "SYSTEM NOTICE", startupWarning, true);
      if (!state.settings.nameConfigured) showPlayerNameSetup();
    }, 420);
  };
  setTimeout(transition, 280);
}

document.addEventListener("click", handleClick);
document.addEventListener("submit", handleSubmit);
menuToggle.addEventListener("click", () => sidebar.classList.contains("is-open") ? closeMobileNav() : openMobileNav());
navBackdrop.addEventListener("click", closeMobileNav);
document.addEventListener("keydown", event => {
  if (event.key === "Escape") closeMobileNav();
});
document.addEventListener("change", event => {
  if (event.target.id === "importSaveInput") importPlayerSave(event.target.files?.[0]);
});
window.addEventListener("storage", event => {
  if (event.key !== SAVE_KEY || !event.newValue) return;
  try {
    state = normalizeSave(JSON.parse(event.newValue));
    ensureToday(state);
    updateBestStreak(state);
    persist();
    renderAll();
    if (!state.settings.nameConfigured) showPlayerNameSetup();
    showToast("info", "SAVE SYNCHRONIZED", "Another ARISE tab updated this player profile.");
  } catch {
    showToast("warning", "SAVE SYNC REJECTED", "Invalid data from another ARISE tab was ignored.");
  }
});

try {
  ensureToday(state);
  updateBestStreak(state);
  processAchievementUnlocks(false);
  persist();
} catch (error) {
  console.error("ARISE startup recovery", error);
  state = loadSave().save;
  startupWarning = `SYSTEM RECOVERY MODE // ${error.message || "PLAYER DATA RECOVERED"}`;
}

startBoot();
