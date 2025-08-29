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
    signOut
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

// Simple Email/Password auth helpers
window.authLogin = async function () {
    const emailEl = document.getElementById('authEmail');
    const passEl = document.getElementById('authPassword');
    const email = emailEl ? emailEl.value.trim() : '';
    const password = passEl ? passEl.value : '';
    if (!email || !password) {
        alert('Bitte E-Mail und Passwort eingeben.');
        return;
    }
    try {
        await signInWithEmailAndPassword(auth, email, password);
    } catch (e) {
        alert('Login fehlgeschlagen: ' + (e ?.message || e));
    }
}

window.authRegister = async function () {
    const emailEl = document.getElementById('authEmail');
    const passEl = document.getElementById('authPassword');
    const email = emailEl ? emailEl.value.trim() : '';
    const password = passEl ? passEl.value : '';
    if (!email || !password) {
        alert('Bitte E-Mail und Passwort eingeben.');
        return;
    }
    try {
        await createUserWithEmailAndPassword(auth, email, password);
        // user is now signed in
    } catch (e) {
        alert('Registrierung fehlgeschlagen: ' + (e ?.message || e));
    }
}

function updateAuthUI(isLoggedIn) {
    window.LogedIn = isLoggedIn;
    const btn = document.getElementById("authBtn");
    const label = btn ? btn.querySelector('.auth-label') : null;
    const icon = btn ? btn.querySelector('.mdi') : null;
    const adminField = document.querySelector('.adminField');
    const panel = document.getElementById('authPanel');
    if (btn && label && icon) {
        if (isLoggedIn) {
            label.textContent = 'Logout';
            icon.className = 'mdi mdi-logout';
            btn.setAttribute('aria-label', 'Logout');
            const emailEl = document.getElementById('authEmail');
            const passEl = document.getElementById('authPassword');
            if (emailEl) emailEl.value = '';
            if (passEl) passEl.value = '';
        } else {
            label.textContent = 'Login';
            icon.className = 'mdi mdi-login';
            btn.setAttribute('aria-label', 'Login');
        }
    }
    // Always toggle .hide on all last th cells
    let lastThs = document.querySelectorAll("tr th:last-child");
    lastThs.forEach(th => {
        th.classList.toggle('hide', window.IsAdmin);
    });

    if (adminField) {
        adminField.classList.toggle('hide', !window.IsAdmin);
    }
    if (window.IsAdmin) {
        let lastThs = document.querySelectorAll("tr th:last-child");
        lastThs.forEach(th => {
            th.classList.toggle('hide', !window.IsAdmin);
        });
    }
    if (panel) {
        panel.classList.toggle('hide', isLoggedIn || !panel.classList.contains('open'));
    }
}

async function refreshAdminFlag(user) {
    try {
        if (!user) {
            window.IsAdmin = false;
            return;
        }
        const adminSnap = await get(ref(db, `admins/${user.uid}`));
        window.IsAdmin = !!adminSnap.val();
    } catch (e) {
        console.warn('Kann Admin-Flag nicht laden:', e);
        window.IsAdmin = false;
    }
}

// Expose toggle for the navbar button
window.toggleAuth = async function () {
    if (auth.currentUser) {
        await signOut(auth);
        return;
    }
    const panel = document.getElementById('authPanel');
    if (panel) {
        panel.classList.toggle('hide');
        panel.classList.toggle('open');
    }
}

// React to auth changes
onAuthStateChanged(auth, async (user) => {
    await refreshAdminFlag(user);
    updateAuthUI(!!user);
});

let unsubTest = null;
let unsubTask = null;

function encodeKey(key) {
    return key.replace(/[.#$\[\]/]/g, c => '!' + c.charCodeAt(0));
}

// --- CRUD helpers ---
window.uploadToFirebase = async function (ID, Name, Datum, kind) {
    if (!window.IsAdmin) {
        alert('Nur Admins duerfen Eintraege erstellen.');
        return null;
    }
    // Use readable keys; avoid overwrite by adding a numeric suffix on collision
    const basePath = `${window.location.hash.slice(1)}/${kind}`;

    // Try ID, then ID-1, ID-2, ... until a free key is found
    let key = encodeKey(ID);
    let attempt = 0;
    // eslint-disable-next-line no-constant-condition
    while (true) {
        const candidateRef = ref(db, `${basePath}/${key}`);
        const snap = await get(candidateRef);
        if (!snap.exists()) {
            await set(candidateRef, {
                Datum,
                Name
            });
            return key; // give caller the real key we used
        }
        attempt += 1;
        key = encodeKey(`${ID}-${attempt}`);
    }
}

window.RemoveEvent = function (ID, kind) {
    if (!window.IsAdmin) {
        alert('Nur Admins duerfen Eintraege loeschen.');
        return;
    }
    const pathToDelete = `${window.location.hash.slice(1)}/${kind}/${encodeKey(ID)}`;
    remove(ref(db, pathToDelete))
        .then(() => {
            console.log("Daten erfolgreich geloescht.");
        })
        .catch((error) => {
            console.error("Fehler beim Loeschen:", error);
        });
}

// --- Realtime listeners ---
window.getEvent = function (kind) {
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

        const entries = Object.entries(data).map(([id, v]) => ({
            id,
            ...v
        }));
        // Sort by date ascending, closest first
        entries.sort((a, b) => new Date(a.Datum) - new Date(b.Datum));

        const table = document.getElementById(tableId);
        entries.forEach(({
            id,
            Name,
            Datum
        }) => {
            const tr = document.createElement("tr");
            tr.id = id;
            tr.dataset.date = Datum;
            tr.innerHTML = `
                <th>${Name}</th>
                <th>${window.formatDateCH(Datum)}</th>
                <th class="hide">
                    <button class="btn btn-delete">Delete</button>
                </th>
            `;

            if (window.IsAdmin) {
                let lastThs = document.querySelectorAll("tr th:last-child");
                lastThs.forEach(th => {
                    th.classList.toggle('hide', false);
                });
            }
            table.appendChild(tr);

            const deleteBtn = tr.querySelector('.btn-delete');
            if (deleteBtn) {
                deleteBtn.addEventListener('click', (ev) => {
                    ev.stopPropagation();
                    if (window.IsAdmin) {
                        // your existing delete logic here (adjust function name if needed)
                        NewTR.remove();
                        RemoveEvent(localId, kind);
                        window.updateEmptyState(tableId);
                    } else {
                        alert('No permission to delete event');
                    }
                });
            }

            // add event listener for row click – ignore clicks on controls inside the row
            tr.addEventListener('click', (ev) => {
                // if user clicked a button/interactive element inside the row, do nothing
                openEventSite(window.location.hash, id); // use DB key if you have it instead
            });

            // visual affordance
            tr.style.cursor = 'pointer';
        });

        window.sortiereNachNaechstemDatum(tableId);
    });

    if (kind === "Test") unsubTest = handler;
    else unsubTask = handler;
}

// Start listeners
getEvent("Test");
getEvent("Task");