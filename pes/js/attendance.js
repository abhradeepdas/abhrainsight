
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




const classSelect =
    document.getElementById("classSelect");

const examSelect =
    document.getElementById("examSelect");

const attendanceTableBody =
    document.getElementById("attendanceTableBody");

const saveAttendance =
    document.getElementById("saveAttendance");


const studentsCollection =
    collection(db, "students");

const attendanceCollection =
    collection(db, "attendance");


/*
 * Load students when class changes
 */
classSelect.addEventListener(
    "change",
    loadStudents
);


/*
 * Also reload when exam changes
 */
examSelect.addEventListener(
    "change",
    loadStudents
);


async function loadStudents() {

    attendanceTableBody.innerHTML = "";

    const selectedClass =
        classSelect.value;

    const selectedExam =
        examSelect.value;


    if (
        selectedClass === "" ||
        selectedExam === ""
    ) {

        return;
    }


    try {

        const q = query(
            studentsCollection,
            where(
                "classLevel",
                "==",
                selectedClass
            )
        );


        const snapshot =
            await getDocs(q);


        if (snapshot.empty) {

            attendanceTableBody.innerHTML = `
                <tr>
                    <td
                        colspan="3"
                        class="text-center text-danger"
                    >
                        No students found.
                    </td>
                </tr>
            `;

            return;
        }


 
snapshot.forEach((studentDoc) => {

    const student =
        studentDoc.data();

    attendanceTableBody.innerHTML += `

        <tr>

            <td>
                ${student.name || "Unknown"}
            </td>

            <td>

                <select
                    class="form-select attendanceSelect"
                    data-id="${studentDoc.id}"
                >

                    <option value="present">
                        Present
                    </option>

                    <option value="absent">
                        Absent
                    </option>

                </select>

            </td>

        </tr>

    `;

});




    } catch (error) {

        console.error(error);

        alert(
            "Failed to load students."
        );

    }

}


/*
 * Save Attendance
 */

saveAttendance.addEventListener(
    "click",
    async () => {

        try {

            const selectedClass =
                classSelect.value;

            const selectedExam =
                examSelect.value;


            if (
                selectedClass === "" ||
                selectedExam === ""
            ) {

                alert(
                    "Please select class and exam."
                );

                return;
            }


            const attendanceInputs =
                document.querySelectorAll(
                    ".attendanceSelect"
                );


            if (
                attendanceInputs.length === 0
            ) {

                alert(
                    "No students loaded."
                );

                return;
            }


            let savedCount = 0;


            for (
                const input
                of attendanceInputs
            ) {

                const studentDocId =
                    input.dataset.id;

                const status =
                    input.value;


                /*
                 * Find existing attendance
                 * for this student + class + exam
                 */
                const existingQuery =
                    query(
                        attendanceCollection,

                        where(
                            "studentDocId",
                            "==",
                            studentDocId
                        ),

                        where(
                            "classLevel",
                            "==",
                            selectedClass
                        ),

                        where(
                            "exam",
                            "==",
                            selectedExam
                        )
                    );


                const existingSnapshot =
                    await getDocs(
                        existingQuery
                    );


                /*
                 * Get student information
                 */
                const studentQuery =
                    query(
                        studentsCollection,

                        where(
                            "__name__",
                            "==",
                            studentDocId
                        )
                    );


                const studentSnapshot =
                    await getDocs(
                        studentQuery
                    );


                if (
                    studentSnapshot.empty
                ) {

                    continue;
                }


                const student =
                    studentSnapshot
                        .docs[0]
                        .data();


                /*
                 * If attendance already exists,
                 * update the existing record.
                 */
                if (
                    !existingSnapshot.empty
                ) {

                    const existingDoc =
                        existingSnapshot.docs[0];


                    await updateDoc(
                        doc(
                            db,
                            "attendance",
                            existingDoc.id
                        ),
                        {

                            status:
                                status,

                            updatedAt:
                                serverTimestamp()

                        }
                    );


                } else {

                    /*
                     * Otherwise create a
                     * new attendance record.
                     */
                    await addDoc(
                        attendanceCollection,
                        {

                            studentDocId:
                                studentDocId,

                            studentName:
                                student.name ||
                                "Unknown",

                            classLevel:
                                selectedClass,

                            exam:
                                selectedExam,

                            status:
                                status,

                            createdAt:
                                serverTimestamp()

                        }
                    );

                }


                savedCount++;

            }


            alert(
                `Attendance saved successfully! ${savedCount} record(s) saved.`
            );


        } catch (error) {

            console.error(error);

            alert(
                "Failed to save attendance."
            );

        }

    }
);
