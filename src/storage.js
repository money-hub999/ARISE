import {
  LEGACY_SAVE_KEY,
  SAVE_KEY,
  SAVE_VERSION,
  addSystemLog,
  createSave,
  ensureToday,
  localDate,
  migrateLegacySave,
  normalizeSave,
  xpToLevel
} from "./domain.js";

export function loadSave() {
  let available = true;
  let warning = "";
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) {
      try {
        const save = normalizeSave(JSON.parse(raw));
        ensureToday(save);
        return { save, available, warning };
      } catch (error) {
        warning = `SAVE DATA COULD NOT BE READ: ${error.message}`;
        try {
          localStorage.setItem(`${SAVE_KEY}_RECOVERY_${Date.now()}`, raw);
        } catch { /* Keep the recovery warning visible if storage is full. */ }
      }
    }
    const legacyRaw = localStorage.getItem(LEGACY_SAVE_KEY);
    if (legacyRaw && !warning) {
      try {
        const save = migrateLegacySave(JSON.parse(legacyRaw));
        ensureToday(save);
        saveSave(save);
        return { save, available, warning: "LEGACY PLAYER DATA RESTORED. HISTORY BEFORE THIS VERSION WAS NOT AVAILABLE." };
      } catch (error) {
        warning = `LEGACY SAVE COULD NOT BE MIGRATED: ${error.message}`;
      }
    }
    const save = createSave();
    if (warning) addSystemLog(save, warning, "warning");
    return { save, available, warning };
  } catch (error) {
    available = false;
    const save = createSave();
    warning = `LOCAL STORAGE IS UNAVAILABLE. PROGRESS WILL LAST UNTIL THIS TAB CLOSES. ${error.message}`;
    addSystemLog(save, warning, "error");
    return { save, available, warning };
  }
}

export function saveSave(save) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(save));
    return true;
  } catch {
    return false;
  }
}

export function exportSave(save) {
  return JSON.stringify({ ...save, version: SAVE_VERSION }, null, 2);
}

export function parseImportedSave(text, currentSave) {
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("The selected file is not valid JSON.");
  }
  const incoming = normalizeSave(parsed);
  if (Object.values(incoming.history).some(day => day.cheatAttempts.some(attempt => attempt.penaltyApplied === false))) {
    throw new Error("The save contains a study violation without its required penalty.");
  }
  const today = localDate();
  const currentToday = currentSave.history[today];
  const incomingToday = ensureToday(incoming, today);
  const localPenalty = currentToday?.cheatAttempts?.some(attempt => attempt.penaltyApplied !== false);
  const importedPenalty = incomingToday.cheatAttempts.some(attempt => attempt.penaltyApplied !== false);
  if (localPenalty && !importedPenalty) {
    incomingToday.cheatAttempts = currentToday.cheatAttempts.map(attempt => ({ ...attempt }));
    incomingToday.xpDelta -= 5000;
    incoming.player.totalXp -= 5000;
    const derived = xpToLevel(incoming.player.totalXp);
    incoming.player.level = derived.level;
    incoming.player.xpIntoLevel = derived.xpIntoLevel;
    addSystemLog(incoming, "TODAY'S STUDY LOCK AND SYSTEM PENALTY WERE PRESERVED DURING IMPORT.", "warning");
  }
  return incoming;
}

