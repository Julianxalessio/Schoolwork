import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
    getDatabase,
    ref,
    set,
    remove,
    onValue,
    get,
    update
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
    get(ref(db, `admins/${user}`)).then((adminSnap) => {
        window.IsAdmin = !!adminSnap.val();
        initialize();
        if (window.IsAdmin) {
            let adminPanel = document.querySelector(".admin-change-field");
            if (adminPanel) {
                adminPanel.style.display = "block";
            }
        } else {
            let userPanel = document.querySelector(".admin-change-field");
            if (userPanel) {
                userPanel.style.display = "none";
            }
        }
    }).catch((error) => {
        console.error("Fehler beim Abrufen:", error);
        window.IsAdmin = false;
        initialize();
    });

}

/*window.getUsernameFromUid = async function (uid) {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    const email = snap.data().email;
    const username = email.split("@")[0];
    return username;
  } else {
    alert("User nicht gefunden");
    return "User unbekannt";
  }
}

window.getUsernameFromUidwithRole = async function (uid) {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    get(ref(db, `role/${uid}`)).then((role) => {
        window.role = !!role.val();
        if (role != window.currentClass) {
            alert("Du bist nicht in der richtigen Klasse eingeloggt!");
            return "User unbekannt";
        }
        else {
            const email = snap.data().email;
            const username = email.split("@")[0];
            return username;
        }
    }).catch((error) => {
        console.error("Fehler beim Abrufen:", error);
        window.IsAdmin = false;
        initialize();
    });
  } else {
    alert("User nicht gefunden");
    return "User unbekannt";
  }
}*/

window.createCommentOnFirebase = async function (Hash, ID, content, Datum, kind, user, imageData = null) {
    try {
        const db = getDatabase();
        const key = encodeKey(ID);
        const userEncoded = encodeKey(user);
        const commentKey = userEncoded + encodeKey(Datum);
        const commentRef = ref(db, `${Hash}/${kind}/${key}/comments/${commentKey}`);

        const commentData = {
            date: Datum,
            content: content,
            user: user || null
        };

        // Nur hinzufügen, wenn ein Bild existiert
        if (imageData && imageData.url) {
            commentData.imageUrl = imageData.url;
            commentData.public_id = imageData.public_id || null;
        }

        await set(commentRef, commentData);

        console.log('Kommentar gespeichert', commentRef.toString());
    } catch (error) {
        console.error("Fehler beim Speichern des Kommentars:", error);
    }
};



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
window.getCommentsFromFirebase = async function (Hash, ID, kind, createDeleteButton = false) {
    console.log("Getcomments");

    const path = `${Hash.slice(1)}/${kind}/${encodeKey(ID)}/comments`;
    const filesRef = ref(db, path);

    onValue(filesRef, (snapshot) => {
        if (skipNextOnValue) {
            skipNextOnValue = false;
            return; // 🚨 Ignorieren
        }

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

        entries.sort((a, b) => new Date(b.date) - new Date(a.date));

        entries.forEach(({
            content,
            date,
            user,
            imageUrl
        }) => {
            if (user == currentUser) {
                createDeleteButton = true;
            } else {
                createDeleteButton = false;
            }
            console.log("Comment:", content, date, user, imageUrl);
            window.createCommentForDiv(content, user, date, createDeleteButton, imageUrl);
        });
    });
};

window.getEvent = function (Hash, kind, ID) {
    const path = `${Hash.slice(1)}/${kind}/${encodeKey(ID)}`;

    const eventRef = ref(db, path);

    get(eventRef)
        .then((snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val(); // enthält alle Felder unter ID
                const Name = data.Name;
                const Datum = data.Datum;
                const Beschreibung = data.Beschreibung;
                let NameObject = document.querySelector(".task-info h2");
                NameObject.innerHTML = Name;
                let updateNameObject = document.querySelector(".update-name");
                updateNameObject.innerHTML = Name;
                let updateDescriptionObject = document.querySelector(".update-description");
                updateDescriptionObject.innerHTML = Beschreibung;
                let updateDateObject = document.querySelector(".update-date");
                updateDateObject.value = Datum;
                let DateumObject = document.querySelector(".task-info .Date");
                DateumObject.innerHTML = "Bis: " + formatDateCH(Datum);
                let BeschreibungObject = document.querySelector(".task-info p:nth-of-type(2)");
                BeschreibungObject.innerHTML = "Beschreibung: " + Beschreibung.replace(/\n/g, "<br>");
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
            Datum: Datum, // z.B. "2025-09-01"
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
    if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso || "";
    const [y, m, d] = iso.split("-");
    return `${d}.${m}.${y}`;
};

window.uploadImageToCloudinary = async function (file) {
    const url = "https://api.cloudinary.com/v1_1/dd2aeimaq/upload";
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "TestClassroom");

    try {
        const response = await fetch(url, {
            method: "POST",
            body: formData
        });
        const data = await response.json();
        return {
            url: data.secure_url,
            public_id: data.public_id
        };
    } catch (err) {
        console.error("Cloudinary Upload Error:", err);
        return {
            url: null,
            public_id: null
        };
    }
};