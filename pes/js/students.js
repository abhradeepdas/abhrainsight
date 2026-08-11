import { db, storage } from "./firebase.js";

import {
    collection,
    addDoc,
    getDocs,
    deleteDoc,
    doc,
    updateDoc,
    getDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import {
    ref,
    uploadBytes,
    getDownloadURL
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-storage.js";

const tableBody = document.getElementById("studentsTableBody");

const loadingSpinner = document.getElementById("loadingSpinner");

const emptyMessage = document.getElementById("emptyMessage");

const saveButton = document.getElementById("saveStudent");

const searchBox = document.getElementById("search");

const classFilter = document.getElementById("classFilter");

const studentsCollection = collection(db, "students");


const studentIdInput = document.getElementById("studentId");

const studentNameInput = document.getElementById("studentName");

const classLevelInput = document.getElementById("classLevel");



const attendanceInput = document.getElementById("attendance");

const schoolInput = document.getElementById("school");

const photoInput = document.getElementById("studentPhoto");


let editingStudentId = null;

async function loadStudents() {

    loadingSpinner.style.display = "block";

    tableBody.innerHTML = "";

    const snapshot = await getDocs(studentsCollection);

    loadingSpinner.style.display = "none";

    if(snapshot.empty){

    tableBody.innerHTML = "";

    emptyMessage.style.display = "block";

    return;

}

    emptyMessage.style.display="none";

    snapshot.forEach((docItem)=>{

        const s = docItem.data();
const initials = (s.name || "")
    .split(" ")
    .map(x => x.charAt(0))
    .join("")
    .substring(0,2)
    .toUpperCase();

   tableBody.innerHTML += `
<tr>
    <td>
        <div class="d-flex align-items-center gap-2">
            <div class="avatar">
                ${initials}
            </div>
            <strong>${s.name}</strong>
        </div>
    </td>

    <td>Class ${s.classLevel}</td>

   

    <td>
        <span class="badge bg-success">Active</span>
    </td>

    <td>
        <a
            href="student.html?id=${docItem.id}"
            class="btn btn-sm btn-primary"
        >
            View Profile
        </a>

        <button
            class="btn btn-sm btn-warning editBtn"
            data-id="${docItem.id}"
        >
            Edit
        </button>

        <button
            class="btn btn-sm btn-danger deleteBtn"
            data-id="${docItem.id}"
        >
            Delete
        </button>
    </td>
</tr>
`;

    });

}

loadStudents();

document.addEventListener("click", async (e) => {

    if (!e.target.classList.contains("editBtn")) return;

    const studentDocId = e.target.dataset.id;

    editingStudentId = studentDocId;

    const docRef = doc(db, "students", studentDocId);

    const snapshot = await getDoc(docRef);

    if (!snapshot.exists()) {

        alert("Student not found.");

        return;

    }

    const student = snapshot.data();

    studentIdInput.value = student.studentId || "";
    studentNameInput.value = student.name || "";
    classLevelInput.value = student.classLevel || "";
   
    schoolInput.value = student.school || "";
    attendanceInput.value = student.attendance || "";

    document.getElementById("studentModalTitle").textContent = "Edit Student";

    saveButton.textContent = "Update Student";

    const modal = new bootstrap.Modal(
        document.getElementById("studentModal")
    );

    modal.show();

});



document.addEventListener("click", async (e) => {

    if (!e.target.classList.contains("deleteBtn")) return;

    const studentDocId = e.target.dataset.id;

    const confirmDelete = confirm(
        "Are you sure you want to delete this student?"
    );

    if (!confirmDelete) return;

    try {

        await deleteDoc(
            doc(db, "students", studentDocId)
        );

        alert("Student deleted successfully!");

        loadStudents();

    } catch (error) {

        console.error(error);

        alert("Failed to delete student.");

    }

});







saveButton.addEventListener("click", async () => {

    // Validation
   if (
    studentIdInput.value.trim() === "" ||
    studentNameInput.value.trim() === "" ||
    classLevelInput.value === ""
) {
    alert("Please fill all required fields.");
    return;
}
    try {

        let photoURL = "";

        // Upload photo if selected
        if (photoInput.files.length > 0) {

            const file = photoInput.files[0];

            const storageRef = ref(
                storage,
                "students/" + Date.now() + "_" + file.name
            );

            await uploadBytes(storageRef, file);

            photoURL = await getDownloadURL(storageRef);
        }

        // Save student
      const studentData = {

    studentId: studentIdInput.value.trim(),

    name: studentNameInput.value.trim(),

    classLevel: classLevelInput.value,

    


    school: schoolInput.value.trim(),

    attendance: Number(attendanceInput.value),

    photo: photoURL,

    vault: 0,

    average: 0,

    createdAt: serverTimestamp()

};

if (editingStudentId) {

    await updateDoc(
        doc(db, "students", editingStudentId),
        studentData
    );

    alert("Student updated successfully!");

} else {

    await addDoc(
        studentsCollection,
        studentData
    );

    alert("Student added successfully!");

}


// Close modal
// Close modal
bootstrap.Modal.getInstance(
    document.getElementById("studentModal")
).hide();

// Reset form
studentIdInput.value = "";
studentNameInput.value = "";
classLevelInput.value = "";

schoolInput.value = "";
attendanceInput.value = 100;
photoInput.value = "";

// Reload only the table
loadStudents();

// Reset edit mode
editingStudentId = null;

document.getElementById("studentModalTitle").textContent = "Add Student";

saveButton.textContent = "Save Student";

} catch (error) {

        console.error(error);

        alert("Error adding student.");

    }

});
