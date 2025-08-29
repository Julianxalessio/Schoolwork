import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref, set, get, child, remove, onValue } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
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
let arr = [];
let arrTask = [];
let unsubscribeTasks = null;
let unsubscribeTests = null;

window.getTests = function (){
    const db = getDatabase();
    if (unsubscribeTests) {
        unsubscribeTests();
    }
    const filesRef = ref(db, `${window.location.hash.slice(1)}/Test`);
    unsubscribeTests = onValue(filesRef, (snapshot) => {
    const data = snapshot.val(); // Daten von Firebase
        const table = document.getElementById("TableTest");
        if (table) table.innerHTML = "";
        arr = [];
    if (!data) {
        console.log("Keine Daten vorhanden");
        return; // Abbruch, falls snapshot leer ist
    }
    arr = Object.entries(data).map(([titel, daten]) => {
        if (!daten) return `${titel}: keine Daten`; 
        const datenString = Object.entries(daten)
            .map(([key, value]) => `${key}:${value}`)
            .join(", ");
        return `${titel}: ${datenString}`;
        });
        LoadEventsIntoTablefromDatabase();
    });
    
}

window.uploadTestToFirebase = function (ID, Name, Datum){
    const dbRef = ref(db, `${window.location.hash.slice(1)}/Test/${ID}`);
        set(dbRef, {
            Datum: Datum,
            Name: Name
        }).catch((error) => {
            console.error("Fehler beim Speichern:", error);
        });
}

window.getTasks = function (){
    const db = getDatabase();
    if (unsubscribeTasks) {
        unsubscribeTasks();
    }
    const filesRef = ref(db, `${window.location.hash.slice(1)}/Task`);
    unsubscribeTasks = onValue(filesRef, (snapshot) => {
    const data = snapshot.val(); // Daten von Firebase
        const table = document.getElementById("TableTask");
        if (table) table.innerHTML = "";
        arrTask = [];
    if (!data) {
        console.log("Keine Daten vorhanden");
        return; // Abbruch, falls snapshot leer ist
    }
    arrTask = Object.entries(data).map(([titel, daten]) => {
        if (!daten) return `${titel}: keine Daten`; 
        const datenString = Object.entries(daten)
            .map(([key, value]) => `${key}:${value}`)
            .join(", ");
        return `${titel}: ${datenString}`;
        });
        LoadTasksIntoTablefromDatabase();
    });
    
}

window.uploadTaskToFirebase = function (ID, Name, Datum){
    const dbRef = ref(db, `${window.location.hash.slice(1)}/Task/${ID}`);
        set(dbRef, {
            Datum: Datum,
            Name: Name
        }).catch((error) => {
            console.error("Fehler beim Speichern:", error);
        });
        
}

function LoadEventsIntoTablefromDatabase() {
    arr.forEach(eintrag => {
        // Example eintrag: "Asdf1232025-08-30: Datum:2025-08-30, Name:Asdf123"
        const datumMatch = eintrag.match(/Datum:([0-9\-]+)/);
        const nameMatch = eintrag.match(/Name:([^,]+)/);

        const datum = datumMatch ? datumMatch[1].trim() : "";
        const name = nameMatch ? nameMatch[1].trim() : "";

        let NewTR = document.createElement("tr");
        let ID = name + datum;
        if (document.getElementById(ID)) {
            return;
        }
        NewTR.id = ID;

        let NewTH1 = document.createElement("th");
        NewTH1.textContent = name;

        let NewTH2 = document.createElement("th");
        NewTH2.textContent = datum;

        let NewTH3 = document.createElement("th");

        let deleteBtn = document.createElement("button");
        deleteBtn.className = "btn btn-delete";
        deleteBtn.innerHTML = `<span class="mdi mdi-delete"></span> <span>Delete</span>`;
        deleteBtn.onclick = function () {
            if (LogedIn == true) {
                NewTR.remove();
                RemoveTest(ID);
            } else {
                alert("No permission to delete event");
            }
        };

        NewTH3.appendChild(deleteBtn);

        NewTR.appendChild(NewTH1);
        NewTR.appendChild(NewTH2);
        NewTR.appendChild(NewTH3);
        document.getElementById("TableTest").appendChild(NewTR);
        sortiereNachNaechstemDatumfürTest();
    });
}

function LoadTasksIntoTablefromDatabase() {
    arrTask.forEach(eintrag => {
        // Example eintrag: "Asdf1232025-08-30: Datum:2025-08-30, Name:Asdf123"
        const datumMatch = eintrag.match(/Datum:([0-9\-]+)/);
        const nameMatch = eintrag.match(/Name:([^,]+)/);

        const datum = datumMatch ? datumMatch[1].trim() : "";
        const name = nameMatch ? nameMatch[1].trim() : "";

        let NewTR = document.createElement("tr");
        let ID = name + datum;  
        if (document.getElementById(ID)) {
            return;
        }
        NewTR.id = ID;

        let NewTH1 = document.createElement("th");
        NewTH1.textContent = name;

        let NewTH2 = document.createElement("th");
        NewTH2.textContent = datum;

        let NewTH3 = document.createElement("th");

        let deleteBtn = document.createElement("button");
        deleteBtn.className = "btn btn-delete";
        deleteBtn.innerHTML = `<span class="mdi mdi-delete"></span> <span>Delete</span>`;
        deleteBtn.onclick = function () {
            if (LogedIn == true) {
                NewTR.remove();
                RemoveTask(ID);
            } else {
                alert("No permission to delete event");
            }
        };

        NewTH3.appendChild(deleteBtn);

        NewTR.appendChild(NewTH1);
        NewTR.appendChild(NewTH2);
        NewTR.appendChild(NewTH3);
        document.getElementById("TableTask").appendChild(NewTR);
        sortiereNachNaechstemDatumfürTest();
    });
}

window.RemoveTest = function (ID){
            let pathToDelete = `${window.location.hash.slice(1)}/Test/${ID}`
            remove(ref(db, pathToDelete))
            .then(() => {
                console.log("Daten erfolgreich gelöscht.");
            })
            .catch((error) => {
                console.error("Fehler beim Löschen:", error);
            })
        }

window.RemoveTask = function (ID){
            let pathToDelete = `${window.location.hash.slice(1)}/Task/${ID}`
            remove(ref(db, pathToDelete))
            .then(() => {
                console.log("Daten erfolgreich gelöscht.");
            })
            .catch((error) => {
                console.error("Fehler beim Löschen:", error);
            })
        }

getTasks();
getTests();