import { auth } from "./firebase.js";

import {
    signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";


const loginForm =
    document.getElementById("loginForm");

const emailInput =
    document.getElementById("email");

const passwordInput =
    document.getElementById("password");

const loginButton =
    document.getElementById("loginButton");

const loginError =
    document.getElementById("loginError");


loginForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();

        loginError.classList.add("d-none");

        loginButton.disabled = true;

        loginButton.textContent =
            "Signing in...";


        const email =
            emailInput.value.trim();

        const password =
            passwordInput.value;


        try {
    await signInWithEmailAndPassword(auth, email, password);

    alert("Logged in");

    const returnPage =
        sessionStorage.getItem("adminReturnPage");

    sessionStorage.removeItem("adminReturnPage");

    if (returnPage) {

        window.location.replace(returnPage);

    } else {

        window.location.replace("admin/students.html");

    }

} catch (error) {
    // ...
}

    }
);