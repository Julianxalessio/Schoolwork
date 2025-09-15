import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref, set, remove, onValue, get, update } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, sendEmailVerification } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

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
window.uid = null;
window.UserEmailLocal = null;

// --- Auth-Listener: setzt User + Admin-Flag beim Laden und ruft initialize() ---
onAuthStateChanged(auth, async (user) => {
    try {
        window.uid = user ? user.uid : null;

        if (user && user.email) {
            const email = String(user.email);
            const atIndex = email.indexOf("@");
            window.UserEmailLocal = atIndex !== -1 ? email.slice(0, atIndex) : email;
        } else {
            window.UserEmailLocal = null;
        }

        if (user) {
            const adminSnap = await get(ref(db, `admins/${user.uid}`));
            window.IsAdmin = !!adminSnap.val();
        } else {
            window.IsAdmin = false;
        }
    } catch (err) {
        console.error("Auth-State Fehler:", err);
        window.IsAdmin = false;
    } finally {
        // Admin-UI ein/aus
        const panel = document.querySelector(".admin-change-field");
        if (panel) {
            panel.style.display = window.IsAdmin ? "block" : "none";
        }
        // Kommentare/Seite initialisieren
        if (typeof window.initialize === "function") {
            window.initialize();
        }
    }
});

/* ---- Kommentare ---- */

window.createCommentOnFirebase = async function (Hash, ID, content, Datum, kind, user, imageUrl = null) {
    try {
        if (!window.uid) {
            alert("Bitte zuerst einloggen.");
            return;
        }

        if (content.includes("<img") || content.includes("onerror=") || content.includes("<script") || content.includes("src=")) {
        alert("Der Name enthaelt unzulässige Zeichen.");
        return null;
    }

        const key = encodeKey(ID);
        const userEncoded = encodeKey(user || "");
        const commentKey = userEncoded + encodeKey(Datum);
        const commentRef = ref(db, `${Hash}/${kind}/${key}/comments/${commentKey}`);

        const commentData = {
            date: Datum,
            content: content,
            user: user || null
        };

        if (imageUrl) {
            if (typeof imageUrl === "object" && imageUrl.url) {
                commentData.imageUrl = imageUrl.url;
                commentData.public_id = imageUrl.public_id || null;
            } else {
                commentData.imageUrl = imageUrl;
            }
        }

        await set(commentRef, commentData);
        console.log("Kommentar gespeichert", commentRef.toString());
    } catch (error) {
        console.error("Fehler beim Speichern des Kommentars:", error);
    }
};

function encodeKey(key) {
    return key.replace(/[.#$\[\]/]/g, c => '!' + c.charCodeAt(0));
}

window.deleteCommentFromFirebase = function (oldHash, eventId, user, date, kind) {
    // Rechte: Admin ODER eigener Kommentar
    if (!(window.IsAdmin || (window.UserEmailLocal && user === window.UserEmailLocal))) {
        alert("Keine Berechtigung, diesen Kommentar zu loeschen.");
        return;
    }
    if (confirm("Are you sure you want to delete this comment?")) {
        const userEncoded = encodeKey(user);
        const commentKey = userEncoded + encodeKey(date);
        const commentRef = ref(db, `${oldHash}/${kind}/${encodeKey(eventId)}/comments/${commentKey}`);
        console.log(commentRef.toString());
        remove(commentRef)
            .then(() => console.log("Comment deleted"))
            .catch((error) => console.error("Error deleting comment:", error));
    }
};

window.getCommentsFromFirebase = async function (Hash, ID, kind) {
    console.log("Getcomments");

    const path = `${Hash.slice(1)}/${kind}/${encodeKey(ID)}/comments`;
    const filesRef = ref(db, path);

    onValue(filesRef, (snapshot) => {
        if (window.skipNextOnValue) {
            window.skipNextOnValue = false;
            return; // Ignorieren
        }

        const data = snapshot.val();

        // Alten Inhalt loeschen
        const commentsDiv = document.querySelector(".comments");
        if (commentsDiv) {
            commentsDiv.innerHTML = "<h3>Kommentare</h3>";
        }

        if (!data) return;

        const entries = Object.entries(data).map(([id, v]) => ({ id, ...v }));
        entries.sort((a, b) => new Date(b.date) - new Date(a.date));

        entries.forEach(({ content, date, user, imageUrl }) => {
            const canDelete = window.IsAdmin || (window.UserEmailLocal && user === window.UserEmailLocal);
            console.log("Comment:", content, date, user, imageUrl);
            window.createCommentForDiv(content, user, date, canDelete, imageUrl);
        });
    });
};

/* ---- Event-Details ---- */

window.getEvent = function (Hash, kind, ID) {
    const path = `${Hash.slice(1)}/${kind}/${encodeKey(ID)}`;
    const eventRef = ref(db, path);

    get(eventRef)
        .then((snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                const Name = data.Name;
                const Datum = data.Datum;
                const Beschreibung = data.Beschreibung;

                const NameObject = document.querySelector(".task-info h2");
                const updateNameObject = document.querySelector(".update-name");
                const updateDescriptionObject = document.querySelector(".update-description");
                const updateDateObject = document.querySelector(".update-date");
                const DateumObject = document.querySelector(".task-info .Date");
                const BeschreibungObject = document.querySelector(".task-info p:nth-of-type(2)");

                if (NameObject) NameObject.innerHTML = Name;
                if (updateNameObject) updateNameObject.value = Name || "";
                if (updateDescriptionObject) updateDescriptionObject.value = Beschreibung || "";
                if (updateDateObject) updateDateObject.value = Datum || "";
                if (DateumObject) DateumObject.innerHTML = "Bis: " + formatDateCH(Datum || "");
                if (BeschreibungObject) BeschreibungObject.innerHTML = "Beschreibung: " + (Beschreibung || "").replace(/\\n/g, "<br>");
            } else {
                console.log("Kein Event gefunden");
            }
        })
        .catch((error) => {
            console.error("Fehler beim Laden:", error);
        });
};

window.updateEventFromAdmin = function (Hash, kind, ID, Name, Datum, Beschreibung) {
    const path = `${Hash.slice(1)}/${kind}/${encodeKey(ID)}`;
    console.log(Name, Datum, Beschreibung);

    const eventRef = ref(db, path);

    update(eventRef, {
        Name: Name,
        Datum: Datum,
        Beschreibung: Beschreibung
    })
        .then(() => {
            alert("Event erfolgreich aktualisiert!");
        })
        .catch((error) => {
            console.error("Fehler beim Update:", error);
        });
};

window.formatDateCH = function (iso) {
    if (!iso || !/^\\d{4}-\\d{2}-\\d{2}$/.test(iso)) return iso || "";
    const [y, m, d] = iso.split("-");
    return `${d}.${m}.${y}`;
};

window.uploadImageToCloudinary = async function (file) {
    const url = "https://api.cloudinary.com/v1_1/dd2aeimaq/upload";
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "TestClassroom");

    try {
        const response = await fetch(url, { method: "POST", body: formData });
        const data = await response.json();
        return { url: data.secure_url, public_id: data.public_id };
    } catch (err) {
        console.error("Cloudinary Upload Error:", err);
        return { url: null, public_id: null };
    }
};