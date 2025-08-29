async function getNavBar() {
    const response = await fetch("./navBar.html");
    if (!response.ok) return;
    const data = await response.text();
    document.querySelector(".navBar").innerHTML = `
        ${data}
    `;
}

async function getAdminField() {
    const response = await fetch("./adminField.html");
    if (!response.ok) return;
    const data = await response.text();
    document.querySelector(".adminField").innerHTML = `
        ${data}
    `;
}

getNavBar();
getAdminField();