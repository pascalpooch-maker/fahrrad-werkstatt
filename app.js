let auftraege = JSON.parse(localStorage.getItem("auftraege")) || [];
let lager = JSON.parse(localStorage.getItem("lager")) || [];
let bestellungen = JSON.parse(localStorage.getItem("bestellungen")) || [];
let termine = JSON.parse(localStorage.getItem("termine")) || [];

function speichernDaten() {
  localStorage.setItem("auftraege", JSON.stringify(auftraege));
  localStorage.setItem("lager", JSON.stringify(lager));
  localStorage.setItem("bestellungen", JSON.stringify(bestellungen));
  localStorage.setItem("termine", JSON.stringify(termine));
}

function zeigeTab(id) {
  document.querySelectorAll(".tab").forEach(tab => {
    tab.classList.remove("active");
  });

  const element = document.getElementById(id);
  if (element) {
    element.classList.add("active");
  }
}

window.onload = function() {
  zeigeTab("dashboard");
};

async function bilderLesen(input) {
  const dateien = Array.from(input.files || []);
  const bilder = [];

  for (const datei of dateien) {
    const bild = await new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = e => resolve(e.target.result);
      reader.readAsDataURL(datei);
    });
    bilder.push(bild);
  }

  return bilder;
}

async function auftragSpeichern() {
  const leistungWert = document.getElementById("leistung").value.split("|");
  const leistungsName = leistungWert[0];
  const leistungsPreis = Number(leistungWert[1] || 0);
  const materialpreis = Number(document.getElementById("materialpreis").value || 0);
  const editId = document.getElementById("editId").value;
  const neueBilder = await bilderLesen(document.getElementById("bilder"));

  const daten = {
    kunde: document.getElementById("kunde").value,
    telefon: document.getElementById("telefon").value,
    fahrrad: document.getElementById("fahrrad").value,
    leistung: leistungsName,
    preis: leistungsPreis,
    notiz: document.getElementById("notiz").value,
    material: document.getElementById("material").value,
    materialpreis: materialpreis,
    status: document.getElementById("status").value,
    datum: new Date().toLocaleDateString(),
  };

  if (!daten.kunde || !daten.fahrrad) {
    alert("Bitte Kunde und Fahrrad eintragen.");
    return;
  }

  if (editId) {
    const index = auftraege.findIndex(a => String(a.id) === String(editId));
    if (index >= 0) {
      daten.id = auftraege[index].id;
      daten.bilder = [...(auftraege[index].bilder || []), ...neueBilder];
      auftraege[index] = daten;
    }
  } else {
    daten.id = Date.now();
    daten.bilder = neueBilder;
    auftraege.push(daten);
  }

  speichernDaten();
  formularLeeren();
  allesAktualisieren();
  zeigeTab("liste");
}

function auftraegeAnzeigen() {
  const liste = document.getElementById("auftragsliste");
  const suche = (document.getElementById("suche")?.value || "").toLowerCase();

  if (!liste) return;

  liste.innerHTML = "";

  auftraege
    .filter(a =>
      a.kunde.toLowerCase().includes(suche) ||
      a.fahrrad.toLowerCase().includes(suche) ||
      a.status.toLowerCase().includes(suche)
    )
    .forEach(a => {
      const gesamt = Number(a.preis || 0) + Number(a.materialpreis || 0);

      liste.innerHTML += `
        <div class="auftrag">
          <h3>${a.kunde}</h3>
          <p><b>Telefon:</b> ${a.telefon || "-"}</p>
          <p><b>Fahrrad:</b> ${a.fahrrad}</p>
          <p><b>Leistung:</b> ${a.leistung} – ${Number(a.preis || 0).toFixed(2)} €</p>
          <p><b>Material:</b> ${a.material || "-"} – ${Number(a.materialpreis || 0).toFixed(2)} €</p>
          <p><b>Status:</b> ${a.status}</p>
          <p><b>Gesamt:</b> ${gesamt.toFixed(2)} €</p>
          <div>${(a.bilder || []).map(b => `<img src="${b}">`).join("")}</div>
          <button onclick="auftragBearbeiten(${a.id})">Bearbeiten</button>
          <button onclick="rechnungErstellen(${a.id})">Rechnung</button>
          <button onclick="auftragLoeschen(${a.id})">Löschen</button>
        </div>
      `;
    });
}

function auftragBearbeiten(id) {
  const a = auftraege.find(x => x.id === id);
  if (!a) return;

  document.getElementById("editId").value = a.id;
  document.getElementById("kunde").value = a.kunde || "";
  document.getElementById("telefon").value = a.telefon || "";
  document.getElementById("fahrrad").value = a.fahrrad || "";
  document.getElementById("notiz").value = a.notiz || "";
  document.getElementById("material").value = a.material || "";
  document.getElementById("materialpreis").value = a.materialpreis || 0;
  document.getElementById("status").value = a.status || "Offen";
  document.getElementById("formularTitel").innerText = "Auftrag bearbeiten";

  zeigeTab("auftrag");
}

function auftragLoeschen(id) {
  if (!confirm("Auftrag wirklich löschen?")) return;
  auftraege = auftraege.filter(a => a.id !== id);
  speichernDaten();
  allesAktualisieren();
}

function formularLeeren() {
  document.getElementById("editId").value = "";
  document.getElementById("kunde").value = "";
  document.getElementById("telefon").value = "";
  document.getElementById("fahrrad").value = "";
  document.getElementById("notiz").value = "";
  document.getElementById("material").value = "";
  document.getElementById("materialpreis").value = "";
  document.getElementById("status").value = "Offen";
  document.getElementById("bilder").value = "";
  document.getElementById("formularTitel").innerText = "Neuer Auftrag";
}
