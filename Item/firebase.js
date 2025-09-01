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

window.IsAdmin = false;

window.refreshAdminFlag = function (user) {
    try {
        get(ref(db, `admins/${user}`)).then((adminSnap) => {
            window.IsAdmin = !!adminSnap.val();
            initialize();
        }).catch((error) => {
            console.error("Fehler beim Abrufen:", error);
            window.IsAdmin = false;
            initialize();
        });
    } catch (error) {
        console.error("Fehler beim Abrufen:", error);
        window.IsAdmin = false;
        initialize();
        return;
    }

}

window.createCommentOnFirebase = async function (Hash, ID, content, Datum, kind, user) {
    try {
        const db = getDatabase();
        const key = encodeKey(ID);
        const userEncoded = encodeKey(user);
        const commentKey = userEncoded + encodeKey(Datum); // Key bleibt kodiert
        const commentRef = ref(db, `${Hash}/${kind}/${key}/comments/${commentKey}`);

        await set(commentRef, {
            date: Datum, // ✅ Datum wird jetzt sauber gespeichert
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

window.deleteCommentFromFirebase = function (oldHash, eventId, user, date, kind) {
    if (confirm("Are you sure you want to delete this comment?")) {
        const userEncoded = encodeKey(user);
        const commentKey = userEncoded + encodeKey(date);
        const db = getDatabase();
        const commentRef = ref(db, `${oldHash}/${kind}/${encodeKey(eventId)}/comments/${commentKey}`);
        console.log(commentRef.toString());
        remove(commentRef)
            .then(() => {
                console.log("Comment deleted");
            })
            .catch((error) => {
                console.error("Error deleting comment:", error);
            });
    }
};
window.getCommentsFromFirebase = async function (Hash, ID, kind) {
    let unsubTest = null;
    let unsubTask = null;

    // Unsubscribe previous
    if (kind === "Test" && unsubTest) unsubTest();
    if (kind === "Task" && unsubTask) unsubTask();

    const path = `${Hash.slice(1)}/${kind}/${encodeKey(ID)}/comments`;
    const filesRef = ref(db, path);

    const handler = onValue(filesRef, (snapshot) => {
        const data = snapshot.val();

        // Clear old comments before rendering new ones
        const commentsDiv = document.querySelector(".comments");
        if (commentsDiv) {
            commentsDiv.innerHTML = "<h3>Kommentare</h3>";
        }

        if (!data) return;

        const entries = Object.entries(data).map(([id, v]) => ({
            id,
            ...v
        }));

        // Direkt sortieren mit Date()
        entries.sort((a, b) => new Date(a.date) - new Date(b.date));

        // Render Kommentare
        entries.forEach(({
            content,
            date,
            user
        }) => {
            const formatted = date; // schon lesbar gespeichert
            window.createCommentForDiv(content, user, formatted);
        });
    });

    // Store unsubscribe function
    if (kind === "Test") unsubTest = handler;
    if (kind === "Task") unsubTask = handler;
}