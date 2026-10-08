/* =========================================
   ARISE SYSTEM CORE
========================================= */

const KEY = "ARISE_SAVE_V2";



/* =========================================
   DATE
========================================= */

function getToday() {

    const d = new Date();

    return (
        d.getFullYear() +
        "-" +
        String(d.getMonth() + 1).padStart(2, "0") +
        "-" +
        String(d.getDate()).padStart(2, "0")
    );
}



/* =========================================
   DAILY DATA
========================================= */

function createToday() {

    return {

        date: getToday(),

        quests: {

            nj: false,

            exercise: false,

            wake: false,

            junk: false
        },

        studyMinutes: 0,

        xp: 0,

        cheat: false,

        customTasks: []
    };
}



/* =========================================
   PLAYER
========================================= */

function createPlayer() {

    return {

        xp: 0,

        level: 1,

        streak: 0,

        lastCompletedDate: null,

        today: createToday()
    };
}



let state =
    JSON.parse(
        localStorage.getItem(KEY)
    ) || createPlayer();



/* =========================================
   SAVE
========================================= */

function save() {

    localStorage.setItem(
        KEY,
        JSON.stringify(state)
    );
}



/* =========================================
   NEW DAY
========================================= */

function checkNewDay() {

    if (
        !state.today ||
        state.today.date !== getToday()
    ) {

        state.today =
            createToday();

        save();
    }
}



/* =========================================
   RANK
========================================= */

function getRank(level) {

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



/* =========================================
   LEVEL XP
========================================= */

function xpRequired(level) {

    return 500 + ((level - 1) * 250);
}



/* =========================================
   LEVEL SYSTEM
========================================= */

function updateLevel() {

    while (
        state.xp >=
        xpRequired(state.level)
    ) {

        state.xp -=
            xpRequired(state.level);

        state.level++;

        logSystem(
            `⚡ LEVEL UP — LEVEL ${state.level}`
        );
    }
}



/* =========================================
   ADD XP
========================================= */

function addXP(amount, reason) {

    state.xp += amount;

    state.today.xp += amount;

    updateLevel();

    logSystem(
        `${reason} <span class="log-xp">+${amount} XP</span>`
    );

    save();

    render();
}



/* =========================================
   PERMANENT QUESTS
========================================= */

function completeQuest(type) {

    if (
        state.today.quests[type]
    ) {

        logSystem(
            "QUEST ALREADY COMPLETED."
        );

        return;
    }


    const rewards = {

        nj: 100,

        exercise: 100,

        wake: 100,

        junk: 100
    };


    const names = {

        nj: "NJ",

        exercise: "EXERCISE",

        wake: "WAKE UP EARLY",

        junk: "NO JUNK FOOD"
    };


    state.today.quests[type] =
        true;


    addXP(
        rewards[type],
        `${names[type]} COMPLETE`
    );
}



/* =========================================
   STUDY
========================================= */

function logStudy() {

    const hours =
        Number(
            document.getElementById(
                "studyHours"
            ).value
        ) || 0;


    const minutes =
        Number(
            document.getElementById(
                "studyMinutes"
            ).value
        ) || 0;


    if (
        minutes < 0 ||
        minutes > 59
    ) {

        logSystem(
            "INVALID MINUTES."
        );

        return;
    }


    const total =
        hours * 60 + minutes;


    if (total <= 0) {

        logSystem(
            "ENTER A VALID STUDY TIME."
        );

        return;
    }


    const newTotal =
        state.today.studyMinutes +
        total;


    /* =============================
       ANTI CHEAT
    ============================== */

    if (newTotal > 480) {

        state.today.cheat = true;


        logSystem(
            `<span class="log-warning">
            ⚠ STUDY ENTRY FLAGGED — LIMIT EXCEEDED
            </span>`
        );


        logSystem(
            `<span class="log-warning">
            SYSTEM LESSON:
            DISCIPLINE CANNOT BE FAKED.
            </span>`
        );


        save();

        return;
    }


    state.today.studyMinutes =
        newTotal;


    const xp =
        Math.round(
            total * (50 / 60)
        );


    addXP(
        xp,
        `STUDY LOGGED — ${hours}H ${minutes}M`
    );


    document.getElementById(
        "studyHours"
    ).value = "";


    document.getElementById(
        "studyMinutes"
    ).value = "";
}



/* =========================================
   ADD CUSTOM QUEST
========================================= */

function addCustomTask() {

    const nameInput =
        document.getElementById(
            "taskName"
        );


    const xpInput =
        document.getElementById(
            "taskXP"
        );


    const name =
        nameInput.value.trim();


    const xp =
        Number(xpInput.value);


    if (!name) {

        logSystem(
            "ENTER QUEST NAME."
        );

        return;
    }


    if (!xp || xp <= 0) {

        logSystem(
            "ENTER VALID XP."
        );

        return;
    }


    if (xp > 10000) {

        logSystem(
            "MAXIMUM CUSTOM XP: 10,000."
        );

        return;
    }


    const task = {

        id: Date.now(),

        name: name,

        xp: xp,

        completed: false
    };


    state.today.customTasks.push(
        task
    );


    nameInput.value = "";

    xpInput.value = "";


    save();

    renderCustomTasks();


    logSystem(
        `CUSTOM QUEST CREATED — ${name}`
    );
}



/* =========================================
   COMPLETE CUSTOM QUEST
========================================= */

function completeCustomTask(id) {

    const task =
        state.today.customTasks.find(
            t => t.id === id
        );


    if (!task) return;


    if (task.completed) {

        logSystem(
            "QUEST ALREADY COMPLETED."
        );

        return;
    }


    task.completed = true;


    addXP(
        task.xp,
        `${task.name} COMPLETE`
    );


    renderCustomTasks();

    save();
}



/* =========================================
   HTML SAFETY
========================================= */

function escapeHTML(text) {

    const div =
        document.createElement("div");

    div.textContent = text;

    return div.innerHTML;
}



/* =========================================
   CUSTOM QUEST RENDER
========================================= */

function renderCustomTasks() {

    const container =
        document.getElementById(
            "customTasks"
        );


    container.innerHTML = "";


    if (
        state.today.customTasks.length === 0
    ) {

        container.innerHTML = `
            <div class="log-entry">
                NO CUSTOM QUESTS CREATED.
            </div>
        `;

        return;
    }


    state.today.customTasks.forEach(
        task => {

            const div =
                document.createElement(
                    "div"
                );


            div.className =
                "custom-task" +
                (
                    task.completed
                        ? " completed"
                        : ""
                );


            div.innerHTML = `

                <div class="custom-task-icon">
                    ${task.completed ? "✓" : "◈"}
                </div>

                <div class="custom-task-name">
                    ${escapeHTML(task.name)}
                </div>

                <div class="custom-task-xp">
                    +${task.xp} XP
                </div>

                <button
                    ${
                        task.completed
                            ? "disabled"
                            : ""
                    }
                    onclick="
                        completeCustomTask(
                            ${task.id}
                        )
                    "
                >
                    ${
                        task.completed
                            ? "COMPLETED"
                            : "COMPLETE"
                    }
                </button>

            `;


            container.appendChild(div);
        }
    );
}



/* =========================================
   STUDY DISPLAY
========================================= */

function renderStudy() {

    const minutes =
        state.today.studyMinutes;


    const hours =
        Math.floor(minutes / 60);


    const mins =
        minutes % 60;


    document.getElementById(
        "studyTime"
    ).textContent =
        `${hours}H ${String(mins).padStart(2, "0")}M`;


    const percentage =
        Math.min(
            (minutes / 480) * 100,
            100
        );


    document.getElementById(
        "studyProgress"
    ).style.width =
        percentage + "%";
}



/* =========================================
   RENDER PLAYER
========================================= */

function render() {

    document.getElementById(
        "levelValue"
    ).textContent =
        state.level;


    document.getElementById(
        "rankValue"
    ).textContent =
        getRank(state.level);


    document.getElementById(
        "streakValue"
    ).textContent =
        state.streak;


    document.getElementById(
        "todayXP"
    ).textContent =
        state.today.xp;


    const required =
        xpRequired(state.level);


    document.getElementById(
        "xpText"
    ).textContent =
        `${state.xp} / ${required} XP`;


    const percent =
        Math.min(
            (state.xp / required) * 100,
            100
        );


    document.getElementById(
        "xpProgress"
    ).style.width =
        percent + "%";


    document.getElementById(
        "questDate"
    ).textContent =
        state.today.date;


    renderStudy();


    const buttons = {

        nj: "njQuest",

        exercise: "exerciseQuest",

        wake: "wakeQuest",

        junk: "junkQuest"
    };


    for (
        const type in buttons
    ) {

        const button =
            document.getElementById(
                buttons[type]
            );


        if (
            state.today.quests[type]
        ) {

            button.textContent =
                "✓ COMPLETE";

            button.disabled =
                true;
        }
    }


    renderCustomTasks();
}



/* =========================================
   SYSTEM LOG
========================================= */

function logSystem(message) {

    const log =
        document.getElementById(
            "systemLog"
        );


    const entry =
        document.createElement(
            "div"
        );


    entry.className =
        "log-entry";


    entry.innerHTML =
        `[SYSTEM] ${message}`;


    log.prepend(entry);
}



/* =========================================
   BOOT
========================================= */

function bootSystem() {

    const messages = [

        "SCANNING PLAYER...",

        "IDENTITY CONFIRMED.",

        "LOADING DAILY QUESTS...",

        "LOADING CUSTOM QUEST SYSTEM...",

        "SYNCHRONIZING PLAYER DATA...",

        "CALIBRATING ARISE CORE...",

        "SYSTEM STATUS: ONLINE"
    ];


    let index = 0;


    const bootText =
        document.getElementById(
            "bootText"
        );


    const interval =
        setInterval(
            () => {

                bootText.textContent =
                    messages[index];


                index++;


                if (
                    index >=
                    messages.length
                ) {

                    clearInterval(
                        interval
                    );


                    setTimeout(
                        () => {

                            document.getElementById(
                                "bootScreen"
                            ).style.display =
                                "none";


                            document.getElementById(
                                "app"
                            ).style.display =
                                "block";


                            checkNewDay();

                            render();


                            logSystem(
                                "WELCOME BACK, PLAYER."
                            );


                            logSystem(
                                "SYSTEM STATUS: ONLINE."
                            );


                        },
                        600
                    );
                }

            },
            450
        );
}



/* =========================================
   START
========================================= */

bootSystem();