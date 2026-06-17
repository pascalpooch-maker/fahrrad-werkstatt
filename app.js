let auftraege = JSON.parse(localStorage.getItem("auftraege")) || [];

function speichern() {
  const kunde = document.getElementById("kunde").value;
  const fahrrad = document.getElementById("fahrrad").value;
  const leistung = document.getElementById("leistung").value;
  const preis = document.getElementById("preis").value;

  if (!kunde || !fahrrad) {
    alert("Bitte Kunde und Fahrrad eintragen");
    return;
  }

  const auftrag = {
    id: Date.now(),
    kunde,
    fahrrad,
    leistung,
    preis,
    status: "Offen",
    datum: new Date().toLocaleDateString()
  };

  auftraege.push(auftrag);

  localStorage.setItem("auftraege", JSON.stringify(auftraege));

  anzeigen();
}

function anzeigen() {
  const liste = document.getElementById("auftragsliste");

  if (!liste) return;

  liste.innerHTML = "";

  auftraege.forEach(a => {
    liste.innerHTML += `
      <div class="card">
        <h3>${a.kunde}</h3>
        <p><b>Fahrrad:</b> ${a.fahrrad}</p>
        <p><b>Leistung:</b> ${a.leistung}</p>
        <p><b>Preis:</b> ${a.preis} €</p>
        <p><b>Status:</b> ${a.status}</p>
      </div>
    `;
  });
}

window.onload = anzeigen;
