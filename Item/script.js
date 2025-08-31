const params = new URLSearchParams(window.location.search);
const oldHash = params.get("oldHash");
const eventId = params.get("eventId");
const currentUser = params.get("user");
const kind = params.get("kind");

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

    createCommentForDiv(content, user, isoDate);
};

window.createCommentForDiv = function (content, user, date){
    let comments = document.querySelector(".comments");
    let div = document.createElement("div");
    div.classList.add("comment");

    let userElement = document.createElement("span");
    userElement.textContent = user;
    let dateElement = document.createElement("span");
    dateElement.textContent = date;
    let contentElement = document.createElement("p");
    contentElement.innerHTML = content.replace(/\n/g, "<br>"); // <-- FIXED

    userElement.classList.add("comment-author");
    dateElement.classList.add("comment-date");

    div.appendChild(userElement);
    div.appendChild(dateElement);
    div.appendChild(contentElement);

    comments.appendChild(div);
}

document.addEventListener('DOMContentLoaded', () => {
    const sendBtn = document.querySelector('.send-btn');
    if (sendBtn) sendBtn.addEventListener('click', () => window.createCommentToFirebase());
});

function closeWindow(){
    window.location.replace(`../${oldHash}`);
}