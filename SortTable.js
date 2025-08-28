function sortiereNachNaechstemDatumfürTest() {
    const heute = new Date();
    const table = document.getElementById("TableTest");
    // Kopfzeile fixieren
    const header = table.rows[0];

    // Alle Zeilen ab der 2. sammeln
    const rows = Array.from(table.rows).slice(1);

    // Sortieren nach Datum (2. <th> = index 1)
    rows.sort((a, b) => {
        const dateA = new Date(a.cells[1].textContent.trim());
        const dateB = new Date(b.cells[1].textContent.trim());

        const diffA = Math.abs(dateA - heute);
        const diffB = Math.abs(dateB - heute);

        return diffA - diffB;
    });

    // Tabelle neu aufbauen
    table.innerHTML = "";
    table.appendChild(header);
    rows.forEach(row => table.appendChild(row));
}