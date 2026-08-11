// Firebase SDK Imports
import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";

import {
    getFirestore
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import {
    getStorage
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-storage.js";

import {
    getAuth
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";


// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyAP8dc1vVt8R0xNgxWwHKnxEqzh2uwVJuw",
    authDomain: "abhrainsight-pes.firebaseapp.com",
    projectId: "abhrainsight-pes",
    storageBucket: "abhrainsight-pes.firebasestorage.app",
    messagingSenderId: "414424515086",
    appId: "1:414424515086:web:91b0b2a5186e560029725f"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);


// Services
const db = getFirestore(app);

const storage = getStorage(app);

const auth = getAuth(app);


// Export
export {
    db,
    storage,
    auth
};