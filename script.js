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
window.formatDateCH = function (iso) {
    if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso || "";
    const [y, m, d] = iso.split("-");
    return `${d}.${m}.${y}`;
};

window.ensureTableHeader = function (tableId) {
    const table = document.getElementById(tableId);
    if (!table) return;
    table.innerHTML = "";
    const headRow = document.createElement("tr");
    headRow.className = "Zeile";
    const th1 = document.createElement("th");
    th1.textContent = "Aufgabe";
    const th2 = document.createElement("th");
    th2.textContent = "Bis wann";
    const th3 = document.createElement("th");
    th3.textContent = "Löschen";
    th3.classList.add("hide");
    headRow.appendChild(th1);
    headRow.appendChild(th2);
    headRow.appendChild(th3);
    table.appendChild(headRow);
};

window.updateEmptyState = function (tableId) {
    const table = document.getElementById(tableId);
    if (!table) return;
    const hasRows = table.rows.length > 1; // header + rows
    const existing = table.querySelector(".table-empty");
    if (!hasRows && !existing) {
        const row = document.createElement("tr");
        const cell = document.createElement("th");
        cell.classList.add("table-empty", "hide");
        cell.colSpan = 3;
        cell.textContent = "Keine Eintraege";
        row.appendChild(cell);
        table.appendChild(row);
    } else if (hasRows && existing) {
        existing.parentElement.remove();
    }
};

window.sortiereNachNaechstemDatum = function (tableId) {
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

function resetTables() {
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
    const table = document.getElementById(tableId);
    window.ensureTableHeader(tableId);

    const NewTR = document.createElement("tr");
    // ID shown to user can be different from the real DB key – prefer DB key for navigation
    const Id = Name + datum + kind;

    NewTR.dataset.date = datum;
    NewTR.classList.add('Zeile');

    NewTR.innerHTML = `
      <th>${Name.toString()}</th>
      <th>${window.formatDateCH(datum).toString()}</th>
      <th class="hide">
        <button class="btn btn-delete">Delete</button>
      </th>
    `;

    table.appendChild(NewTR);

    // ensure delete button does not trigger row click
    const deleteBtn = NewTR.querySelector('.btn-delete');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', (ev) => {
        ev.stopPropagation();
        if (window.IsAdmin) {
          // your existing delete logic here (adjust function name if needed)
          NewTR.remove();
          RemoveEvent(Id, kind);
          window.updateEmptyState(tableId);
        } else {
          alert('No permission to delete event');
        }
      });
    }

    // add event listener for row click – ignore clicks on controls inside the row
    NewTR.addEventListener('click', (ev) => {
      openEventSite(window.location.hash, Id, kind); // use DB key if you have it instead
    });

    // visual affordance
    NewTR.style.cursor = 'pointer';
    window.sortiereNachNaechstemDatum(tableId);
    uploadToFirebase(Id, Name, datum, kind);
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

function openEventSite(oldHash, Id, kind){
    console.log("Button pressed");
    window.location.replace(
        window.location.origin +
        `/Item/?oldHash=${encodeURIComponent(oldHash)}&eventId=${encodeURIComponent(Id)}&kind=${encodeURIComponent(kind)}`
    );
}