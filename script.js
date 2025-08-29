let LogedIn = false; // this will be kept in sync by firebase.js
window.IsAdmin = window.IsAdmin || false;

function getEventPropertys() {
    if (window.IsAdmin === true) {
        const eventType = document.getElementById("eventTyp").value; // "Test" or "Husi"
        const eventName = document.getElementById("EventName").value;
        const eventDate = document.getElementById("EventDate").value; // ISO yyyy-mm-dd
        if (!eventName || !eventDate) {
            alert("Bitte Name und Datum ausfuellen.");
            return;
        }
        const kind = (eventType === "Test") ? "Test" : "Task"; // map Husi -> Task
        createEvent(eventName, eventDate, kind);
    } else {
        alert("Nur Admins duerfen Events erstellen.");
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
        cell.textContent = "Keine Eintraege";
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

function resetTables(){
    const tableTest = document.getElementById("TableTest");
    const tableTask = document.getElementById("TableTask");
    if (tableTest) {
        window.ensureTableHeader("TableTest");
        window.updateEmptyState("TableTest");
    }
    if (tableTask) {
        window.ensureTableHeader("TableTask");
        window.updateEmptyState("TableTask");
    }
}

async function createEvent(Name, datum, kind) {
    const tableId = (kind === "Test") ? "TableTest" : "TableTask";
    let table = document.getElementById(tableId);
    window.ensureTableHeader(tableId);

    let NewTR = document.createElement("tr");
    let ID = Name + datum + kind;
    NewTR.dataset.date = datum;

    // Persist first to get the exact Firebase key (handles encoding/suffix to avoid overwrite)
    const usedKey = await uploadToFirebase(ID, Name, datum, kind);

    // Avoid duplicating the same row if it is already present
    if (document.getElementById(usedKey)) {
        // Already rendered by realtime listener; nothing to add
        return;
    }

    NewTR.id = usedKey;
    NewTR.innerHTML = `
        <th>${Name}</th>
        <th>${window.formatDateCH(datum)}</th>
        <th>
            <button class="btn btn-delete">Delete</button>
        </th>
    `;

    table.appendChild(NewTR);

    const deleteBtn = NewTR.querySelector("button.btn-delete");
    deleteBtn.onclick = function () {
        if (window.IsAdmin === true) {
            NewTR.remove();
            RemoveEvent(usedKey, kind);
            window.updateEmptyState(tableId);
        } else {
            alert("No permission to delete event");
        }
    };

    window.sortiereNachNaechstemDatum(tableId);
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
        }
        window.location.reload();
    }
}

document.addEventListener("DOMContentLoaded", () => manageNavBarActive(null, false));