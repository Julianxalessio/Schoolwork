const params = new URLSearchParams(window.location.search);
const oldHash = params.get("oldHash");
const eventId = params.get("eventId");
const currentUser = params.get("user");
const kind = params.get("kind");
const userUid = params.get("uid");

refreshAdminFlag(userUid);
async function initialize() {
    getCommentsFromFirebase(oldHash || "#", eventId || '', kind || '');
}

// make the function global so onclick="createComment()" resolves to this, not Document.createComment
window.createCommentToFirebase = function () {
    const textarea = document.querySelector(".input-comment");
    if (!textarea) return console.error("Textarea .input-comment not found");
    const content = textarea.value.trim();
    if (!content) return; // nothing to send

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

    if (typeof window.createCommentOnFirebase === 'function') {
        window.createCommentOnFirebase(Hash || "#", eventId || '', content, isoDate, kind || '', user)
            .then(() => {
                textarea.value = '';
            })
            .catch(err => console.error('Fehler beim Erstellen des Kommentars:', err));
    } else {
        console.error('createCommentOnFirebase not available');
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const sendBtn = document.querySelector('.send-btn');
    if (sendBtn) sendBtn.addEventListener('click', () => window.createCommentToFirebase());
});

function closeWindow(){
    window.location.replace(`../${oldHash}`);
}

window.createCommentForDiv = function (content, user, date) {
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

    const deleteButton = document.createElement("button");
    deleteButton.textContent = "Delete";
    deleteButton.classList.add("btn", "btn-delete");
    deleteButton.style.marginLeft = "10px";

    if (window.IsAdmin) {
        deleteButton.style.display = "inline-block";   
        deleteButton.addEventListener("click", (ev) => {
            ev.stopPropagation();
            deleteCommentFromFirebase(oldHash.slice(1), eventId, user, date, kind);
            div.remove();
        });
    } else {
        deleteButton.style.display = "none"; // Hide delete button for non-admins
    }

    div.appendChild(userElement);
    div.appendChild(dateElement);
    div.appendChild(deleteButton);
    div.appendChild(contentElement);

    comments.appendChild(div);
};

function encodeKey(key) {
    return key.replace(/[.#$\[\]/]/g, c => '!' + c.charCodeAt(0));
};