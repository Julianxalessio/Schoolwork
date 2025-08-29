import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref, set, remove, onValue } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

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

let unsubTest = null;
let unsubTask = null;

// --- CRUD helpers ---
window.uploadToFirebase = function (ID, Name, Datum, kind){
    const path = `${window.location.hash.slice(1)}/${kind}/${ID}`;
    const dbRef = ref(db, path);
    set(dbRef, { Datum, Name }).catch((error) => {
        console.error("Fehler beim Speichern:", error);
    });
}

window.RemoveEvent = function (ID, kind){
    const pathToDelete = `${window.location.hash.slice(1)}/${kind}/${ID}`;
    remove(ref(db, pathToDelete))
        .then(() => { console.log("Daten erfolgreich geloescht."); })
        .catch((error) => { console.error("Fehler beim Loeschen:", error); });
}

// --- Realtime listeners ---
window.getEvent = function (kind){
    const tableId = (kind === "Test") ? "TableTest" : "TableTask";

    // Unsubscribe previous
    if (kind === "Test" && unsubTest) unsubTest();
    if (kind === "Task" && unsubTask) unsubTask();

    const path = `${window.location.hash.slice(1)}/${kind}`;
    const filesRef = ref(db, path);

    const handler = onValue(filesRef, (snapshot) => {
        const data = snapshot.val();
        window.ensureTableHeader(tableId);

        if (!data) {
            window.updateEmptyState(tableId);
            return;
        }

        const entries = Object.entries(data).map(([id, v]) => ({ id, ...v }));
        // Sort by date ascending, closest first
        entries.sort((a,b) => new Date(a.Datum) - new Date(b.Datum));

        const table = document.getElementById(tableId);
        entries.forEach(({ id, Name, Datum }) => {
            const tr = document.createElement("tr");
            tr.id = id;
            tr.dataset.date = Datum;
            tr.innerHTML = `
                <th>${Name}</th>
                <th>${window.formatDateCH(Datum)}</th>
                <th><button class="btn btn-delete">Delete</button></th>
            `;
            table.appendChild(tr);

            tr.querySelector(".btn-delete").onclick = () => {
                if (window.LogedIn === true || typeof LogedIn !== 'undefined' && LogedIn === true) {
                    tr.remove();
                    window.RemoveEvent(id, kind);
                    window.updateEmptyState(tableId);
                } else {
                    alert("No permission to delete event");
                }
            };
        });

        window.sortiereNachNaechstemDatum(tableId);
    });

    if (kind === "Test") unsubTest = handler; else unsubTask = handler;
}

// Start listeners
getEvent("Test");
getEvent("Task");