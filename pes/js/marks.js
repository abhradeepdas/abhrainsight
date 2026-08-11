import { db } from "./firebase.js";

import {
    collection,
    getDocs,
    query,
    where,
    addDoc,
    updateDoc,
    doc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";
const classSelect = document.getElementById("classSelect");

const subjectSelect = document.getElementById("subjectSelect");
classSelect.addEventListener("change", () => {

    const selectedClass = classSelect.value;

    subjectSelect.innerHTML =
        `<option value="">Select Subject</option>`;

    if (selectedClass === "5") {

        subjectSelect.innerHTML += `
            <option value="Science">Science</option>
            <option value="Mathematics">Mathematics</option>
        `;

    } else if (
        selectedClass === "6" ||
        selectedClass === "7" ||
        selectedClass === "8"
    ) {

        subjectSelect.innerHTML += `
            <option value="Physics">Physics</option>
            <option value="Chemistry">Chemistry</option>
            <option value="Biology">Biology</option>
            <option value="Mathematics">Mathematics</option>
        `;

    }

    loadStudentsByClass();

});

const examSelect = document.getElementById("examSelect");

const totalMarks = document.getElementById("totalMarks");

const marksTableBody = document.getElementById("marksTableBody");

const saveMarks = document.getElementById("saveMarks");

const publishResult = document.getElementById("publishResult");

const resetMarks = document.getElementById("resetMarks");

const studentsCollection = collection(db, "students");
const marksCollection = collection(db, "marks");

async function loadStudentsByClass() {

    marksTableBody.innerHTML = "";

    const selectedClass = classSelect.value;

    if (selectedClass === "") return;

    const q = query(
        studentsCollection,
        where("classLevel", "==", selectedClass)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {

        marksTableBody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center text-danger">
                    No students found.
                </td>
            </tr>
        `;

        return;

    }

    snapshot.forEach((studentDoc) => {

        const student = studentDoc.data();

        marksTableBody.innerHTML += `

        <tr>

            <td>${student.roll}</td>

            <td>${student.name}</td>

            <td>
                <input
                    type="number"
                    class="form-control marksInput"
                    data-id="${studentDoc.id}"
                    min="0"
                    max="${totalMarks.value || 100}"
                >
            </td>

            <td class="text-center">
                <input
                    type="checkbox"
                    class="highestBonus"
                    data-id="${studentDoc.id}">
            </td>

            <td class="text-center">
                <input
                    type="checkbox"
                    class="improveBonus"
                    data-id="${studentDoc.id}">
            </td>

        </tr>

        `;

    });

}


totalMarks.addEventListener("change", () => {

    if (classSelect.value !== "") {

        loadStudentsByClass();

    }

});



saveMarks.addEventListener("click", async () => {

    try {

        const rows =
            document.querySelectorAll(
                "#marksTableBody tr"
            );

        if (rows.length === 0) {

            alert("No students loaded.");

            return;
        }

        const selectedClass =
            classSelect.value;

        const selectedSubject =
            subjectSelect.value;

        const selectedExam =
            examSelect.value;

        const selectedTotalMarks =
            Number(totalMarks.value);

        if (
            !selectedClass ||
            !selectedSubject ||
            !selectedExam ||
            !selectedTotalMarks ||
            selectedTotalMarks <= 0
        ) {

            alert(
                "Please select class, subject, exam and total marks."
            );

            return;
        }

        /*
         * -----------------------------------------
         * STEP 1
         * Collect all entered marks first.
         * -----------------------------------------
         */

        const enteredMarks = [];

        for (const row of rows) {

            const markInput =
                row.querySelector(".marksInput");

            if (!markInput) {
                continue;
            }

            if (
                markInput.value.trim() === ""
            ) {
                continue;
            }

            const mark =
                Number(markInput.value);

            if (
                mark < 0 ||
                mark > selectedTotalMarks
            ) {

                alert(
                    `Invalid mark for ${
                        row.querySelector(
                            "td:nth-child(2)"
                        ).textContent.trim()
                    }.`
                );

                return;
            }

            const studentDocId =
                markInput.dataset.id;

            const studentName =
                row.querySelector(
                    "td:nth-child(2)"
                ).textContent.trim();

            enteredMarks.push({
                row,
                studentDocId,
                studentName,
                mark
            });
        }

        if (enteredMarks.length === 0) {

            alert("Please enter at least one mark.");

            return;
        }

        /*
         * -----------------------------------------
         * STEP 2
         * Find the highest mark in this test.
         * Tied highest scorers all receive +0.30.
         * -----------------------------------------
         */

        const highestMark =
            Math.max(
                ...enteredMarks.map(
                    item => item.mark
                )
            );

        /*
         * -----------------------------------------
         * STEP 3
         * Load previous published marks.
         * -----------------------------------------
         */

        const previousMarksQuery =
            query(
                marksCollection,
                where(
                    "classLevel",
                    "==",
                    selectedClass
                ),
                where(
                    "subject",
                    "==",
                    selectedSubject
                ),
                where(
                    "published",
                    "==",
                    true
                )
            );

        const previousMarksSnapshot =
            await getDocs(
                previousMarksQuery
            );

        /*
         * -----------------------------------------
         * STEP 4
         * Find the immediately previous published
         * same-subject test for each student.
         * -----------------------------------------
         */

        const previousByStudent = {};

        for (
            const markDoc
            of previousMarksSnapshot.docs
        ) {

            const previous =
                markDoc.data();

            if (
                !previous.studentDocId ||
                !previous.totalMarks ||
                previous.totalMarks <= 0
            ) {
                continue;
            }

            /*
             * Ignore the current exam if it somehow
             * already exists as published.
             */
            if (
                String(previous.exam) ===
                String(selectedExam)
            ) {
                continue;
            }

            const studentId =
                previous.studentDocId;

            const examNumber =
                parseInt(
                    String(
                        previous.exam || ""
                    ).replace(/\D/g, ""),
                    10
                ) || 0;

            if (
                !previousByStudent[studentId]
            ) {

                previousByStudent[studentId] =
                    [];

            }

            previousByStudent[studentId].push({

                mark: previous.obtainedMarks,

                totalMarks:
                    previous.totalMarks,

                examNumber,

                createdAt:
                    previous.createdAt
                        ?.toMillis
                        ? previous.createdAt.toMillis()
                        : 0

            });
        }

        /*
         * Sort each student's previous tests
         * so the latest published test comes first.
         */
        for (
            const studentId
            in previousByStudent
        ) {

            previousByStudent[studentId].sort(
                (a, b) => {

                    if (
                        a.examNumber !==
                        b.examNumber
                    ) {

                        return (
                            b.examNumber -
                            a.examNumber
                        );
                    }

                    return (
                        b.createdAt -
                        a.createdAt
                    );

                }
            );
        }

        /*
         * -----------------------------------------
         * STEP 5
         * Save each student's result.
         * -----------------------------------------
         */

        for (const item of enteredMarks) {

            const {
                studentDocId,
                studentName,
                mark
            } = item;

            /*
             * Highest Marks Bonus
             */
            const getsHighestBonus =
                mark === highestMark;

            /*
             * Previous same-subject percentage
             */
            let getsImproveBonus = false;

            const previousTests =
                previousByStudent[
                    studentDocId
                ];

            if (
                previousTests &&
                previousTests.length > 0
            ) {

                const previous =
                    previousTests[0];

                const previousPercentage =
                    (
                        previous.mark /
                        previous.totalMarks
                    ) * 100;

                const currentPercentage =
                    (
                        mark /
                        selectedTotalMarks
                    ) * 100;

                /*
                 * At least 10% relative improvement.
                 *
                 * Example:
                 * 50% -> 55% = qualifies
                 * 50% -> 54% = does not qualify
                 */
              
const improvement =
    currentPercentage - previousPercentage;

if (improvement >= 10) {

    getsImproveBonus = true;

}

            }

            /*
             * Calculate the current test score.
             */
            const performancePoints =
                (
                    mark /
                    selectedTotalMarks
                ) * 10;

            const highestBonusPoints =
                getsHighestBonus
                    ? 0.30
                    : 0;

            const improveBonusPoints =
                getsImproveBonus
                    ? 0.20
                    : 0;

            const rawTotal =
                performancePoints +
                highestBonusPoints +
                improveBonusPoints;

            const activeScore =
                Math.min(
                    rawTotal,
                    10
                );

            /*
             * NOTE:
             * Vault is calculated from published
             * results on the student profile.
             * We do NOT write another Vault value
             * here, to avoid double-counting.
             */

            await addDoc(
                marksCollection,
                {

                    studentName:
                        studentName,

                    studentDocId:
                        studentDocId,

                    classLevel:
                        selectedClass,

                    subject:
                        selectedSubject,

                    exam:
                        selectedExam,

                    totalMarks:
                        selectedTotalMarks,

                    obtainedMarks:
                        mark,

                    highestBonus:
                        getsHighestBonus,

                    improveBonus:
                        getsImproveBonus,

                    published:
                        false,

                    createdAt:
                        serverTimestamp()

                }
            );
        }

        alert(
            "Marks saved successfully. Bonuses were calculated automatically."
        );

    } catch (error) {

        console.error(error);

        alert(
            "Error saving marks."
        );

    }

});
