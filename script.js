const Passwort = "Tester";
let LogedIn = false;

function SubmitAdminPasswort() {
    let InputPasswort = document.getElementById("PasswortInput").value;
    if (InputPasswort == Passwort) {
        LogedIn = true;
        document.getElementById("PasswortInput").value = "";
        showAdminField();
    } else {
        alert("Wrong Password");
    }
};

function showAdminField() {
    const adminField = document.querySelector(".adminField");
    adminField.classList.toggle("hide");
};

function getEventPropertys() {
    if (LogedIn == true) {
        const eventType = document.getElementById("eventTyp").value;
        const eventName = document.getElementById("EventName").value;
        const eventDate = document.getElementById("EventDate").value;
        if (!eventName || !eventDate) {
            alert("Bitte Name und Datum ausfuellen.");
            return;
        }
        if (eventType === "Test") {
            createTest(eventName, eventDate);
        } else if (eventType === "Husi") {
            createTask(eventName, eventDate);
        }
    } else {
        alert("Admin not loged in");
    }
}

// --- UI helpers ---
window.formatDateCH = function(iso) {
    if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso || "";
    const [y, m, d] = iso.split("-");
    return `${d}.${m}.${y}`;
};

window.ensureTableHeader = function(tableId) {
    const table = document.getElementById(tableId);
    if (!table) return;
    table.innerHTML = "";
    const headRow = document.createElement("tr");
    headRow.className = "Zeile";
    const th1 = document.createElement("th"); th1.textContent = "Aufgabe";
    const th2 = document.createElement("th"); th2.textContent = "Bis wann";
    const th3 = document.createElement("th"); th3.textContent = "Loeschen";
    headRow.appendChild(th1); headRow.appendChild(th2); headRow.appendChild(th3);
    table.appendChild(headRow);
};

window.updateEmptyState = function(tableId) {
    const table = document.getElementById(tableId);
    if (!table) return;
    const hasRows = table.rows.length > 1; // header + rows
    const existing = table.querySelector(".table-empty");
    if (!hasRows && !existing) {
        const row = document.createElement("tr");
        const cell = document.createElement("th");
        cell.className = "table-empty";
        cell.colSpan = 3;
        cell.textContent = "Keine Eintraege – @ fuer Admin-Feld.";
        row.appendChild(cell);
        table.appendChild(row);
    } else if (hasRows && existing) {
        existing.parentElement.remove();
    }
};

window.sortiereNachNaechstemDatum = function(tableId) {
    const heute = new Date();
    const table = document.getElementById(tableId);
    if (!table) return;
    const header = table.rows[0];
    const rows = Array.from(table.rows).slice(1).filter(r => !r.querySelector(".table-empty"));

    rows.sort((a, b) => {
        const da = new Date(a.dataset.date || a.cells[1].textContent.trim());
        const db = new Date(b.dataset.date || b.cells[1].textContent.trim());
        const diffA = Math.abs(da - heute);
        const diffB = Math.abs(db - heute);
        return diffA - diffB;
    });

    table.innerHTML = "";
    table.appendChild(header);
    rows.forEach(row => table.appendChild(row));
    window.updateEmptyState(tableId);
};

function createTest(Name, datum) {
    const tableId = "TableTest";
    const table = document.getElementById(tableId);
    window.ensureTableHeader(tableId);

    let NewTR = document.createElement("tr");
    let ID = Name + datum;
    if (document.getElementById(ID)) {
        alert("Eintrag existiert bereits.");
        return;
    }
    NewTR.id = ID;
    NewTR.dataset.date = datum;

    let NewTH1 = document.createElement("th");
    NewTH1.textContent = Name;

    let NewTH2 = document.createElement("th");
    NewTH2.textContent = window.formatDateCH(datum);

    let NewTH3 = document.createElement("th");

    let deleteBtn = document.createElement("button");
    deleteBtn.className = "btn btn-delete";
    deleteBtn.innerHTML = `<span class="mdi mdi-delete"></span> <span>Delete</span>`;
    deleteBtn.onclick = function () {
        if (LogedIn == true) {
            NewTR.remove();
            RemoveTest(ID);
            window.updateEmptyState(tableId);
        } else {
            alert("No permission to delete event");
        }
    };

    NewTH3.appendChild(deleteBtn);

    NewTR.appendChild(NewTH1);
    NewTR.appendChild(NewTH2);
    NewTR.appendChild(NewTH3);
    table.appendChild(NewTR);
    window.sortiereNachNaechstemDatum(tableId);

    uploadTestToFirebase(ID, Name, datum);
}

function createTask(Name, datum) {
    const tableId = "TableTask";
    const table = document.getElementById(tableId);
    window.ensureTableHeader(tableId);

    let NewTR = document.createElement("tr");
    let ID = Name + datum;
    if (document.getElementById(ID)) {
        alert("Eintrag existiert bereits.");
        return;
    }
    NewTR.id = ID;
    NewTR.dataset.date = datum;

    let NewTH1 = document.createElement("th");
    NewTH1.textContent = Name;

    let NewTH2 = document.createElement("th");
    NewTH2.textContent = window.formatDateCH(datum);

    let NewTH3 = document.createElement("th");

    let deleteBtn = document.createElement("button");
    deleteBtn.className = "btn btn-delete";
    deleteBtn.innerHTML = `<span class="mdi mdi-delete"></span> <span>Delete</span>`;
    deleteBtn.onclick = function () {
        if (LogedIn == true) {
            NewTR.remove();
            RemoveTask(ID);
            window.updateEmptyState(tableId);
        } else {
            alert("No permission to delete event");
        }
    };

    NewTH3.appendChild(deleteBtn);

    NewTR.appendChild(NewTH1);
    NewTR.appendChild(NewTH2);
    NewTR.appendChild(NewTH3);
    table.appendChild(NewTR);
    window.sortiereNachNaechstemDatum(tableId);

    uploadTaskToFirebase(ID, Name, datum);
}

function manageNavBarActive(button = null, reload = false) {
    const navItems = document.querySelectorAll(".navBarItem");
    const hash = window.location.hash;

    navItems.forEach(item => {
        const isActive = button ? (item === button) : (item.getAttribute("href") === hash);
        item.classList.toggle("active", isActive);
    });

    if (reload) {
        const targetHash = button ? button.getAttribute("href") : hash;
        if (targetHash && window.location.hash !== targetHash) {
            window.location.hash = targetHash;
        } else {
            window.location.reload();
        }
    }
}

document.addEventListener("DOMContentLoaded", () => manageNavBarActive(null, false));