const params = new URLSearchParams(window.location.search);
const oldHash = params.get("oldHash");
const eventId = params.get("eventId");
const kind = params.get("kind");
const userUid = params.get("uid");
//const currentUser = getUsernameFromUid(userUid);
const currentUser = params.get("user");
let createDeleteButton = false;

getEvent(oldHash, kind, eventId);

refreshAdminFlag(userUid);

function initialize() {
    console.log("Initialize");
    getCommentsFromFirebase(oldHash || "#", eventId || '', kind || '');
}

let skipNextOnValue = false;

window.createCommentToFirebase = async function (createDeleteButton) {
    if (currentUser === null) {
        alert("User is not logged in");
        return;
    }
    const textarea = document.querySelector(".input-comment");
    const fileInput = document.querySelector(".comment-image-input");
    if (!textarea) return console.error("Textarea .input-comment not found");

    const content = textarea.value.trim();
    if (!content && !fileInput.files.length) return; // Nichts zum Senden

    let imageUrl = null;
    if (fileInput.files.length) {
        imageUrl = await uploadImageToCloudinary(fileInput.files[0]);
    }

    let Hash = oldHash.slice(1);
    const now = new Date();
    const pad = n => String(n).padStart(2, '0');
    const day = pad(now.getDate());
    const month = pad(now.getMonth() + 1);
    const year = now.getFullYear();
    const hh = pad(now.getHours());
    const mm = pad(now.getMinutes());
    const ss = pad(now.getSeconds());
    const isoDate = `${day}.${month}.${year}, ${hh}:${mm}:${ss}`;

    const user = currentUser || window.UserEmailLocal || 'anonymous';

    // Direkt lokal anzeigen
    createCommentForDiv(content, user, isoDate, createDeleteButton, imageUrl);

    if (typeof window.createCommentOnFirebase === 'function') {
        skipNextOnValue = true; // Damit onValue den gerade gesendeten Kommentar ignoriert
        window.createCommentOnFirebase(Hash || "#", eventId || '', content, isoDate, kind || '', user, imageUrl)
            .then(() => {
                textarea.value = '';
                fileInput.value = null; // Input zurücksetzen
            })
            .catch(err => console.error('Fehler beim Erstellen des Kommentars:', err));
    }
};



document.addEventListener('DOMContentLoaded', () => {
    const sendBtn = document.querySelector('.send-btn');
    if (sendBtn) sendBtn.addEventListener('click', () => window.createCommentToFirebase());
});

function closeWindow() {
    window.location.replace(`../${oldHash}`);
}

window.createCommentForDiv = function (content, user, date, createDeleteButton, imageUrl = null) {
    const comments = document.querySelector(".comments");
    if (!comments) return;

    const div = document.createElement("div");
    div.classList.add("comment");

    const userElement = document.createElement("span");
    userElement.textContent = user;
    userElement.classList.add("comment-author");

    const dateElement = document.createElement("span");
    dateElement.textContent = date;
    dateElement.classList.add("comment-date");

    const contentElement = document.createElement("p");
    contentElement.innerHTML = content.replace(/\n/g, "<br>");

    div.appendChild(userElement);
    div.appendChild(dateElement);
    const deleteButton = document.createElement("button");
    deleteButton.textContent = "Delete";
    deleteButton.classList.add("btn", "btn-delete");
    deleteButton.style.marginLeft = "10px";
    if (window.IsAdmin || createDeleteButton) {
        deleteButton.style.display = "inline-block";
        deleteButton.addEventListener("click", (ev) => {
            ev.stopPropagation();
            deleteCommentFromFirebase(oldHash.slice(1), eventId, user, date, kind);
            div.remove();
        });
    } else {
        deleteButton.style.display = "none";
    }

    div.appendChild(deleteButton);
    div.appendChild(contentElement);

    if (imageUrl) {
        const img = document.createElement("img");
        img.src = imageUrl;
        img.style.maxHeight = "1200px"; // optional
        img.style.display = "block";
        img.style.marginTop = "5px";
        div.appendChild(img);
    }

    comments.appendChild(div);
};


function encodeKey(key) {
    return key.replace(/[.#$\[\]/]/g, c => '!' + c.charCodeAt(0));
};

function UpdateEvent() {
    let updateNameObject = document.querySelector(".update-name").value;
    let updateDescriptionObject = document.querySelector(".update-description").value;
    let updateDateObject = document.querySelector(".update-date").value;
    console.log(updateNameObject, updateDateObject, updateDescriptionObject);

    window.updateEventFromAdmin(oldHash, kind, eventId, updateNameObject, updateDateObject, updateDescriptionObject);
}