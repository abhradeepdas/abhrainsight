import { db } from "./firebase.js";

import {
    collection,
    getDocs,
    doc,
    getDoc,
    query,
    where
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


const studentName =
    document.getElementById("studentName");

const studentClass =
    document.getElementById("studentClass");

const studentRank =
    document.getElementById("studentRank");

const studentAverage =
    document.getElementById("studentAverage");

const studentAttendance =
    document.getElementById("studentAttendance");

const studentResultsBody =
    document.getElementById("studentResultsBody");

const highestBonusTotal =
    document.getElementById("highestBonusTotal");

const improveBonusTotal =
    document.getElementById("improveBonusTotal");

const pointsVault =
    document.getElementById("pointsVault");
const studentLoader =
    document.getElementById("studentLoader");

const studentContent =
    document.getElementById("studentContent");
    const params = new URLSearchParams(window.location.search);


    const studentDocId = params.get("id");
    let currentStudentClass = "";

console.log("Student ID:", studentDocId);






async function loadStudent() {

    if (!studentDocId) {

        studentName.textContent = "Student not found";

        return;
    }

    const studentRef =
        doc(db, "students", studentDocId);

    const studentSnap =
        await getDoc(studentRef);

    if (!studentSnap.exists()) {

        studentName.textContent = "Student not found";

        return;
    }

 const student = studentSnap.data();

currentStudentClass = String(student.classLevel);


const leaderboardBackButton =
    document.getElementById(
        "leaderboardBackButton"
    );

if (leaderboardBackButton) {

    leaderboardBackButton.href =
        `leaderboard.html?class=${encodeURIComponent(
            currentStudentClass
        )}`;

}

studentName.textContent =
    student.name || "Unknown";

studentClass.textContent =
    `Class ${student.classLevel}`;

}


loadStudent().then(async () => {

    await Promise.all([
        loadStudentRank(),
        loadStudentAttendance(),
        loadStudentResults()
    ]);

    await loadAchievements();

    if (studentLoader) {
        studentLoader.style.display = "none";
    }

    if (studentContent) {
        studentContent.style.display = "";
    }

});



async function loadStudentResults() {

    studentResultsBody.innerHTML = "";

    const marksSnapshot = await getDocs(
        collection(db, "marks")
    );

    // Get only this student's published tests
    const studentMarks = [];

    for (const markDoc of marksSnapshot.docs) {

        const mark = markDoc.data();

        if (mark.published !== true) {
            continue;
        }

        if (!mark.totalMarks || mark.totalMarks <= 0) {
            continue;
        }

        if (mark.studentDocId !== studentDocId) {
            continue;
        }

        studentMarks.push(mark);
    }

    // IMPORTANT:
    // Process Test 1 → Test 2 → Test 3
    studentMarks.sort(function(a, b) {

        const examA =
            String(a.exam || "");

        const examB =
            String(b.exam || "");

        const numberA =
            parseInt(
                examA.replace(/\D/g, ""),
                10
            ) || 0;

        const numberB =
            parseInt(
                examB.replace(/\D/g, ""),
                10
            ) || 0;

        return numberA - numberB;
    });

    let totalScore = 0;
    let testCount = 0;

    let highestBonusSum = 0;
    let improveBonusSum = 0;

    let vaultTotal = 0;

    for (const mark of studentMarks) {

        const performancePoints =
            (mark.obtainedMarks / mark.totalMarks) * 10;

        const highestBonus =
            mark.highestBonus ? 0.30 : 0;

        const improveBonus =
            mark.improveBonus ? 0.20 : 0;

        const rawTotal =
            performancePoints +
            highestBonus +
            improveBonus;

        // Active score cannot exceed 10
        let finalScore =
            Math.min(rawTotal, 10);

        // Excess goes into the Vault
        const vaultDeposit =
            Math.max(rawTotal - 10, 0);

        vaultTotal += vaultDeposit;

        // Use existing Vault to protect a lower score
        if (
            finalScore < 10 &&
            vaultTotal > 0
        ) {

            const roomAvailable =
                10 - finalScore;

            const vaultUsed =
                Math.min(
                    vaultTotal,
                    roomAvailable
                );

            finalScore += vaultUsed;

            vaultTotal -= vaultUsed;
        }

        totalScore += finalScore;
        testCount++;

        highestBonusSum += highestBonus;
        improveBonusSum += improveBonus;

        studentResultsBody.innerHTML += `
            <tr>
                <td>${mark.exam || "-"}</td>
                <td>${mark.subject || "-"}</td>
                <td>${finalScore.toFixed(2)}</td>
            </tr>
        `;
    }

    pointsVault.textContent =
        vaultTotal.toFixed(2);

    highestBonusTotal.textContent =
        `+${highestBonusSum.toFixed(2)}`;

    improveBonusTotal.textContent =
        `+${improveBonusSum.toFixed(2)}`;

    if (testCount > 0) {

        const average =
            totalScore / testCount;

        studentAverage.textContent =
            average.toFixed(2);

    } else {

        studentAverage.textContent = "-";
    }
}







async function loadStudentAttendance() {

    try {

        const attendanceSnapshot =
            await getDocs(
                collection(db, "attendance")
            );

        let totalTests = 0;
        let presentTests = 0;

        for (
            const attendanceDoc
            of attendanceSnapshot.docs
        ) {

            const attendance =
                attendanceDoc.data();

            // Only this student
            if (
                attendance.studentDocId !==
                studentDocId
            ) {
                continue;
            }

            // Only this student's class
            if (
                String(attendance.classLevel) !==
                currentStudentClass
            ) {
                continue;
            }

            totalTests++;

            if (
                attendance.status ===
                "present"
            ) {
                presentTests++;
            }
        }

        if (totalTests === 0) {

            studentAttendance.textContent =
                "-";

            return;
        }

        const percentage =
            (presentTests / totalTests) * 100;

        studentAttendance.textContent =
            `${presentTests}/${totalTests} (${percentage.toFixed(0)}%)`;

    } catch (error) {

        console.error(
            "Attendance error:",
            error
        );

        studentAttendance.textContent =
            "-";
    }
}

async function loadStudentRank() {

    const marksSnapshot = await getDocs(
        collection(db, "marks")
    );

    const studentsSnapshot = await getDocs(
        collection(db, "students")
    );

    // Only current students are allowed in ranking
    const currentStudents = new Set(
        studentsSnapshot.docs.map(
            docItem => docItem.id
        )
    );

    const studentMarks = {};

    // Collect published marks for current students
    for (const markDoc of marksSnapshot.docs) {

        const mark = markDoc.data();

        if (mark.published !== true) {
            continue;
        }

        if (!currentStudents.has(mark.studentDocId)) {
            continue;
        }

        if (
            String(mark.classLevel) !==
            currentStudentClass
        ) {
            continue;
        }

        if (
            !mark.totalMarks ||
            mark.totalMarks <= 0
        ) {
            continue;
        }

        if (!studentMarks[mark.studentDocId]) {
            studentMarks[mark.studentDocId] = [];
        }

        studentMarks[mark.studentDocId].push(mark);
    }

    const averages = {};

    // Calculate each student's protected scores
    for (const studentId in studentMarks) {

        const marks = studentMarks[studentId];

        // Test 1 → Test 2 → Test 3...
        marks.sort(function(a, b) {

            let timeA = 0;
            let timeB = 0;

            if (
                a.createdAt &&
                a.createdAt.toMillis
            ) {
                timeA =
                    a.createdAt.toMillis();
            }

            if (
                b.createdAt &&
                b.createdAt.toMillis
            ) {
                timeB =
                    b.createdAt.toMillis();
            }

            return timeA - timeB;
        });

        let total = 0;
        let tests = 0;
        let vault = 0;

        for (const mark of marks) {

            const performancePoints =
                (mark.obtainedMarks /
                 mark.totalMarks) * 10;

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

            let finalScore =
                Math.min(rawTotal, 10);

            // Deposit excess above 10
            const vaultDeposit =
                Math.max(
                    rawTotal - 10,
                    0
                );

            vault += vaultDeposit;

            // Use Vault on a lower score
            if (
                finalScore < 10 &&
                vault > 0
            ) {

                const roomAvailable =
                    10 - finalScore;

                const vaultUsed =
                    Math.min(
                        vault,
                        roomAvailable
                    );

                finalScore += vaultUsed;

                vault -= vaultUsed;
            }

            total += finalScore;
            tests++;
        }

        if (tests > 0) {

            averages[studentId] = {
                total: total,
                tests: tests
            };
        }
    }

    const ranking =
        Object.entries(averages)
            .map(([id, data]) => ({
                id: id,
                average:
                    data.total / data.tests
            }))
            .sort(
                (a, b) =>
                    b.average - a.average
            );

    const position =
        ranking.findIndex(
            student =>
                student.id === studentDocId
        ) + 1;

    studentRank.textContent =
        position > 0
            ? `#${position}`
            : "-";
}



async function loadAchievements() {

    const achievements =
        document.getElementById("studentAchievements");

    if (!achievements) return;

    const awards = [];

    // Class Champion
    if (studentRank.textContent.trim() === "#1") {

        awards.push(`
            <span class="achievement-badge">
                🏆 Class Champion
            </span>
        `);

    }

    // Perfect Attendance
    if (
        studentAttendance.textContent.includes("100%")
    ) {

        awards.push(`
            <span class="achievement-badge">
                🏅 Perfect Attendance
            </span>
        `);

    }

    // Highest Marks
    const marksSnapshot =
        await getDocs(collection(db, "marks"));

    for (const markDoc of marksSnapshot.docs) {

        const mark = markDoc.data();

        if (
            mark.published === true &&
            mark.studentDocId === studentDocId &&
            mark.highestBonus === true
        ) {

            awards.push(`
                <span class="achievement-badge">
                    ⭐ Highest Marks
                </span>
            `);

            break;
        }
    }
// 📈 Improvement Achievement
const improvementMarks =
    marksSnapshot.docs
        .map(markDoc => markDoc.data())
        .filter(mark =>
            mark.published === true &&
            mark.studentDocId === studentDocId &&
            mark.totalMarks > 0
        );


// Sort Test 1 → Test 2 → Test 3 → Test 4
improvementMarks.sort((a, b) => {

    const testA =
        parseInt(
            String(a.exam || "").replace(/\D/g, ""),
            10
        ) || 0;

    const testB =
        parseInt(
            String(b.exam || "").replace(/\D/g, ""),
            10
        ) || 0;

    return testA - testB;
});


const previousBySubject = {};
let hasImprovement = false;

for (const mark of improvementMarks) {

    const subject =
        String(mark.subject || "").trim();

    if (!subject) {
        continue;
    }

    const currentScore =
        Number(mark.obtainedMarks) /
        Number(mark.totalMarks);

    if (previousBySubject[subject] !== undefined) {

        const previousScore =
            previousBySubject[subject];

        if (currentScore > previousScore) {

            hasImprovement = true;

            break;
        }
    }

    previousBySubject[subject] =
        currentScore;
}


if (hasImprovement) {

    awards.push(`
        <span class="achievement-badge">
            📈 Improvement
        </span>
    `);

}
    if (awards.length === 0) {

        achievements.innerHTML = `
            <div class="achievement-empty">
                🏆<br>
                No achievements yet.
            </div>
        `;

        return;
    }

    achievements.innerHTML =
        awards.join("");
}


