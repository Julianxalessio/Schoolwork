import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
    getDatabase,
    ref,
    set,
    remove,
    onValue,
    get
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
import {
    getAuth,
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    sendEmailVerification // <-- neu
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyA1f1LlbGrevYqPojOGjFZZFeSCg_TiPYI",
    authDomain: "classroom-26016.firebaseapp.com",
    databaseURL: "https://classroom-26016-default-rtdb.firebaseio.com",
    projectId: "classroom-26016",
    storageBucket: "classroom-26016.firebasestorage.app",
    messagingSenderId: "494692974948",
    appId: "1:494692974948:web:39458c2d78189f2a34fa71",
    measurementId: "G-JM2KZCLH3W"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const auth = getAuth(app);

window.createCommentOnFirebase = async function (Hash, ID, content, Datum, kind, user) {
    try {
        const db = getDatabase();
        const key = encodeKey(ID);
        const userEncoded = encodeKey(user);
        const dateEncoded = encodeKey(Datum);
        // Kommentare als Liste speichern (Timestamp als eindeutiger Key)
        const commentKey = userEncoded + dateEncoded;
        const commentRef = ref(db, `${Hash}/${kind}/${key}/comments/${commentKey}`);

        await set(commentRef, {
            date: dateEncoded,
            content: content,
            user: user || null
        });
        console.log('Kommentar gespeichert', commentRef.toString());
    } catch (error) {
        console.error("Fehler beim Speichern des Kommentars:", error);
    }
}

function encodeKey(key) {
    return key.replace(/[.#$\[\]/]/g, c => '!' + c.charCodeAt(0));
};