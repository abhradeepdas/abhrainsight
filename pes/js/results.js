import { db } from "./firebase.js";

import {
    collection,
    getDocs,
    query,
    where,
    doc,
    getDoc,
    updateDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

const marksCollection = collection(db, "marks");
const studentsCollection = collection(db, "students");
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

});
const examSelect = document.getElementById("examSelect");

const loadResults = document.getElementById("loadResults");

const resultsTableBody = document.getElementById("resultsTableBody");


const publishResult =
    document.getElementById("publishResult");

const totalStudentsCard = document.getElementById("totalStudents");

const classAverageCard = document.getElementById("classAverage");

const highestAverageCard = document.getElementById("highestAverage");

const lowestAverageCard = document.getElementById("lowestAverage");

loadResults.addEventListener("click", async () => {
console.log("Load Results clicked");
    resultsTableBody.innerHTML = "";


    let totalStudents = 0;

let totalMarksSum = 0;

let highestTotal = 0;

let lowestTotal = Number.MAX_VALUE;

    const q = query(
        marksCollection,
        where("classLevel", "==", classSelect.value),
        where("subject", "==", subjectSelect.value),
        where("exam", "==", examSelect.value)
    );

    const snapshot = await getDocs(q);

console.log(snapshot.size);

    if (snapshot.empty) {

        resultsTableBody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center">
                    No results found.
                </td>
            </tr>
        `;

        return;

    }

    for (const markDoc of snapshot.docs) {

        const mark = markDoc.data();

        const studentSnap = await getDoc(
            doc(db, "students", mark.studentDocId)
        );


        console.log(studentSnap.exists());
console.log(mark.studentDocId);
        if (!studentSnap.exists()) continue;

        const student = studentSnap.data();


        totalStudents++;
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
    
    const finalScore =
    Math.min(rawTotal, 10);

const vaultDeposit =
    Math.max(rawTotal - 10, 0);
const total =
    Math.min(rawTotal, 10);

totalMarksSum += total;

if (total > highestTotal) {
    highestTotal = total;
}

if (total < lowestTotal) {
    lowestTotal = total;
}

            console.log(student.name);
console.log(mark.obtainedMarks);
console.log(total);

        resultsTableBody.innerHTML += `

        <tr>

            <td>${student.name}</td>

            <td>${mark.obtainedMarks}</td>

            <td>${mark.highestBonus ? "✔" : "-"}</td>

            <td>${mark.improveBonus ? "✔" : "-"}</td>

           <td>${Number(total).toFixed(2)}</td>

        </tr>

        `;


        console.log(resultsTableBody.innerHTML);

    }

    totalStudentsCard.textContent = totalStudents;

if (totalStudents > 0) {

    const average = totalMarksSum / totalStudents;

    classAverageCard.textContent = average.toFixed(2);

  highestAverageCard.textContent = Number(highestTotal).toFixed(2);

lowestAverageCard.textContent = Number(lowestTotal).toFixed(2);

}




});



publishResult.addEventListener("click", async () => {

    const confirmPublish = confirm(
        "Are you sure you want to publish this result?"
    );

    if (!confirmPublish) return;

    try {

        const q = query(
            marksCollection,
            where("classLevel", "==", classSelect.value),
            where("subject", "==", subjectSelect.value),
            where("exam", "==", examSelect.value)
        );

        const snapshot = await getDocs(q);

        if (snapshot.empty) {

            alert("No results found to publish.");

            return;
        }

        let publishedCount = 0;

        for (const markDoc of snapshot.docs) {

            const mark = markDoc.data();

            // Already published — don't process it again
            if (mark.published === true) {
                continue;
            }

            await updateDoc(
                doc(db, "marks", markDoc.id),
                {
                    published: true
                }
            );

            publishedCount++;
        }

        alert(
            `Result published successfully! ${publishedCount} record(s) published.`
        );

    } catch (error) {

        console.error(error);

        alert("Failed to publish result.");

    }

});


publishResult.addEventListener("click", async () => {

    const confirmPublish = confirm(
        "Are you sure you want to publish this result?"
    );

    if (!confirmPublish) return;

    alert("Result published successfully!");

});




