import { auth } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

onAuthStateChanged(auth, (user) => {

    if (!user) {

        const currentPage =
            window.location.pathname.split("/").pop();

        sessionStorage.setItem(
            "adminReturnPage",
            currentPage
        );

        const loginPath =
            window.location.pathname.includes("/admin/")
                ? "../admin-login.html"
                : "admin-login.html";

        window.location.replace(loginPath);

        return;
    }

});