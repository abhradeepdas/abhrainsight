import { db } from "./firebase.js";

import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

console.log("LEADERBOARD JS LOADED");
const updatedDate =
    document.getElementById("updatedDate");

const marksCollection =
    collection(db, "marks");

const studentsCollection =
    collection(db, "students");

const leaderboardTableBody =
    document.getElementById(
        "leaderboardTableBody"
    );

const leaderboardClass =
    document.getElementById(
        "leaderboardClass"
    );

const leaderboardTitle =
    document.getElementById(
        "leaderboardTitle"
    );

const urlParams =
    new URLSearchParams(
        window.location.search
    );

const classFromUrl =
    urlParams.get("class");

if (classFromUrl) {

    leaderboardClass.value =
        classFromUrl;

    leaderboardTitle.textContent =
        `Class ${classFromUrl} Leaderboard`;
}

const searchInput =
    document.getElementById("s");


async function loadLeaderboard() {

   leaderboardTableBody.innerHTML = `
    <tr>
        <td colspan="4" class="text-center py-5">
            <div class="spinner-border spinner-border-sm text-primary"
                 role="status">
                <span class="visually-hidden">
                    Loading...
                </span>
            </div>

            <div class="mt-2 text-muted small">
                Loading leaderboard...
            </div>
        </td>
    </tr>
`;


    updatedDate.textContent =
        new Date().toLocaleDateString(
            "en-GB",
            {
                day: "numeric",
                month: "short",
                year: "numeric"
            }
        );


    const selectedClass =
        leaderboardClass.value;


    if (!selectedClass) {

        leaderboardTableBody.innerHTML = `
            <tr>
                <td colspan="4"
                    class="text-center text-muted py-4">
                    Select a class to view leaderboard.
                </td>
            </tr>
        `;

        return;
    }


    try {

        const marksSnapshot =
            await getDocs(
                marksCollection
            );

        const studentsSnapshot =
            await getDocs(
                studentsCollection
            );


        const students = {};


        studentsSnapshot.forEach(
            (studentDoc) => {

                students[studentDoc.id] =
                    studentDoc.data();

            }
        );


        /*
         * Store published marks
         * for each student.
         */

        const studentMarks = {};


        marksSnapshot.forEach(
            (markDoc) => {

                const mark =
                    markDoc.data();


                if (
                    mark.published !== true
                ) {
                    return;
                }


                if (
                    String(mark.classLevel) !==
                    String(selectedClass)
                ) {
                    return;
                }


                if (
                    !mark.totalMarks ||
                    mark.totalMarks <= 0
                ) {
                    return;
                }


                /*
                 * Make sure the student
                 * still exists.
                 */

                if (
                    !students[mark.studentDocId]
                ) {
                    return;
                }


                if (
                    !studentMarks[
                        mark.studentDocId
                    ]
                ) {

                    studentMarks[
                        mark.studentDocId
                    ] = [];

                }


                studentMarks[
                    mark.studentDocId
                ].push(mark);

            }
        );


        const results = [];


        /*
         * Calculate each student's
         * protected score.
         */

        for (
            const studentDocId
            in studentMarks
        ) {

            const marks =
                studentMarks[
                    studentDocId
                ];


            /*
             * Test 1 → Test 2 → Test 3...
             */

            marks.sort(
                function (a, b) {

                    const examA =
                        String(
                            a.exam || ""
                        );

                    const examB =
                        String(
                            b.exam || ""
                        );


                    const numberA =
                        parseInt(
                            examA.replace(
                                /\D/g,
                                ""
                            ),
                            10
                        ) || 0;


                    const numberB =
                        parseInt(
                            examB.replace(
                                /\D/g,
                                ""
                            ),
                            10
                        ) || 0;


                    return numberA - numberB;

                }
            );


            let total = 0;
            let tests = 0;
            let vault = 0;


            const testScores = [];


            for (
                const mark
                of marks
            ) {

                const performancePoints =
                    (
                        mark.obtainedMarks /
                        mark.totalMarks
                    ) * 10;


                const highestBonus =
                    mark.highestBonus
                        ? 0.30
                        : 0;


                const improveBonus =
                    mark.improveBonus
                        ? 0.20
                        : 0;


                const rawTotal =
                    performancePoints +
                    highestBonus +
                    improveBonus;


                let activeScore =
                    Math.min(
                        rawTotal,
                        10
                    );


                /*
                 * Deposit excess.
                 */

                const vaultDeposit =
                    Math.max(
                        rawTotal - 10,
                        0
                    );


                vault +=
                    vaultDeposit;


                /*
                 * Use Vault on lower score.
                 */

                if (
                    activeScore < 10 &&
                    vault > 0
                ) {

                    const roomAvailable =
                        10 - activeScore;


                    const vaultUsed =
                        Math.min(
                            vault,
                            roomAvailable
                        );


                    activeScore +=
                        vaultUsed;


                    vault -=
                        vaultUsed;

                }


                total +=
                    activeScore;

                tests++;


                testScores.push(
                    activeScore
                );

            }


            if (tests > 0) {

                /*
                 * Determine trend.
                 */

                let trend = "—";
                let trendClass =
                    "text-secondary";


                if (tests >= 2) {

                    const previous =
                        testScores[
                            tests - 2
                        ];

                    const current =
                        testScores[
                            tests - 1
                        ];


                    if (
                        current >
                        previous
                    ) {

                        trend = "▲";
                        trendClass =
                            "text-success";

                    }
                    else if (
                        current <
                        previous
                    ) {

                        trend = "▼";
                        trendClass =
                            "text-danger";

                    }

                }


                results.push({

                    id:
                        studentDocId,

                    name:
                        students[
                            studentDocId
                        ]?.name ||
                        "Unknown",

                    average:
                        total / tests,

                    trend:
                        trend,

                    trendClass:
                        trendClass

                });

            }

        }


        /*
         * Highest average first.
         */

        results.sort(
            (a, b) =>
                b.average -
                a.average
        );


        /*
         * No results.
         */

        if (
            results.length === 0
        ) {

            leaderboardTableBody.innerHTML = `
                <tr>
                    <td colspan="4"
                        class="text-center text-muted py-4">

                        No published results
                        found for Class
                        ${selectedClass}.

                    </td>
                </tr>
            `;

            return;
        }


        /*
         * Display leaderboard.
         */

        leaderboardTableBody.innerHTML =
            results.map(
                (student, index) => {

                    return `

                        <tr
                            class="leaderboard-row"
                            data-id="${student.id}"
                            style="cursor:pointer;"
                        >

                            <td>
                                ${
                                    index === 0
                                        ? "🥇"
                                        : index === 1
                                        ? "🥈"
                                        : index === 2
                                        ? "🥉"
                                        : index + 1
                                }
                            </td>


                            <td class="student">
                                ${student.name}
                            </td>


                            <td>
                                ${student.average.toFixed(2)}
                            </td>


                            <td
                                class="${student.trendClass}
                                       fw-bold"
                            >
                                ${student.trend}
                            </td>

                        </tr>

                    `;

                }
            ).join("");


        /*
         * Make rows clickable.
         */

        document
            .querySelectorAll(
                ".leaderboard-row"
            )
            .forEach(
                (row) => {

                    row.addEventListener(
                        "click",
                        () => {

                            const id =
                                row.dataset.id;


                            window.location.href =
                                `student.html?id=${id}`;

                        }
                    );

                }
            );


        /*
         * Apply search after
         * leaderboard loads.
         */

        applySearch();


    } catch (error) {

        console.error(
            "Leaderboard error:",
            error
        );


        leaderboardTableBody.innerHTML = `
            <tr>
                <td colspan="4"
                    class="text-center text-danger py-4">

                    Failed to load leaderboard.

                </td>
            </tr>
        `;

    }

}


/*
 * Search students.
 */

function applySearch() {

    if (!searchInput) {
        return;
    }


    const search =
        searchInput.value
            .trim()
            .toLowerCase();


    const rows =
        leaderboardTableBody
            .querySelectorAll(
                "tr.leaderboard-row"
            );


    rows.forEach(
        (row) => {

            const name =
                row
                    .querySelector(
                        ".student"
                    )
                    ?.textContent
                    .toLowerCase() || "";


            row.style.display =
                name.includes(search)
                    ? ""
                    : "none";

        }
    );

}


/*
 * Search while typing.
 */

if (searchInput) {

    searchInput.addEventListener(
        "input",
        applySearch
    );

}


/*
 * Class selector.
 */

leaderboardClass.addEventListener(
    "change",
    () => {

        if (
            leaderboardClass.value
        ) {

            leaderboardTitle.textContent =
                `Class ${leaderboardClass.value} Leaderboard`;

        }
        else {

            leaderboardTitle.textContent =
                "Leaderboard";

        }


        loadLeaderboard();

    }
);

// Load initial leaderboard state
loadLeaderboard();