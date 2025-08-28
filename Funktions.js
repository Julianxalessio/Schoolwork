const Passwort = "Tester";
let LogedIn = false;

function SubmitAdminPasswort() {
    let InputPasswort = document.getElementById("PasswortInput").value;
    if (InputPasswort == Passwort) {
        LogedIn = true;
        showAdminField();
    } else {
        alert("Wrong Password");
    }
};

function showAdminField() {
    const adminField = document.getElementById("adminFieldID");
    adminField.classList.toggle("hide");
};

function getEventPropertys() {
    if (LogedIn == true) {
        const eventType = document.getElementById("eventTyp").value;
        const eventName = document.getElementById("EventName").value;
        const eventDate = document.getElementById("EventDate").value;
        if (eventType === "Test") {
            createTest(eventName, eventDate);
        } else if (eventType === "Hausaufgaben") {
            createTask(eventName, eventDate);
        }
    } else {
        alert("Admin not loged in");
    }
}

function createTest(Name, datum) {
    
    let NewTR = document.createElement("tr");
    let ID = Name + datum;
    NewTR.id = ID;

    let NewTH1 = document.createElement("th");
    NewTH1.textContent = Name;

    let NewTH2 = document.createElement("th");
    NewTH2.textContent = datum;

    let NewTH3 = document.createElement("th");

    let deleteBtn = document.createElement("button");
    deleteBtn.className = "btn btn-delete";
    deleteBtn.innerHTML = `<span class="mdi mdi-delete"></span> <span>Delete</span>`;
    deleteBtn.onclick = function () {
        if (LogedIn == true) {
            NewTR.remove();
            DeleteEvent(ID);
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

    uploadTestToFirebase(ID, Name, datum);
}

function createTask(Name, datum) {
    let NewTR = document.createElement("tr");
    let ID = Name + datum;
    NewTR.id = ID;

    let NewTH1 = document.createElement("th");
    NewTH1.textContent = Name;

    let NewTH2 = document.createElement("th");
    NewTH2.textContent = datum;

    let NewTH3 = document.createElement("th");

    let deleteBtn = document.createElement("button");
    deleteBtn.className = "btn btn-delete";
    deleteBtn.innerHTML = `<span class="mdi mdi-delete"></span> <span>Delete</span>`;
    deleteBtn.onclick = function () {
        if (LogedIn == true) {
            NewTR.remove();
            DeleteEvent(ID);
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
    uploadTaskToFirebase(ID, Name, datum);
}