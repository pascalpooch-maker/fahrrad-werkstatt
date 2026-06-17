let auftraege = JSON.parse(localStorage.getItem("auftraege")) || [];
let lager = JSON.parse(localStorage.getItem("lager")) || [];
let bestellungen = JSON.parse(localStorage.getItem("bestellungen")) || [];
let termine = JSON.parse(localStorage.getItem("termine")) || [];
let belege = JSON.parse(localStorage.getItem("belege")) || [];
let wareneingaenge = JSON.parse(localStorage.getItem("wareneingaenge")) || [];

const leistungsTeile = {
  "Schlauch wechseln": ["Schlauch"],
  "Reifenwechsel": ["Reifen"],
  "Kette wechseln": ["Kette"],
  "Frühjahrs-Check": ["Kettenöl"],
  "Große Inspektion": ["Kettenöl", "Bremsreiniger"],
  "Bremsen einstellen": [],
  "Schaltung einstellen": [],
  "E-Bike Diagnose": []
};

function speichernDaten() {
  localStorage.setItem("auftraege", JSON.stringify(auftraege));
  localStorage.setItem("lager", JSON.stringify(lager));
  localStorage.setItem("bestellungen", JSON.stringify(bestellungen));
  localStorage.setItem("termine", JSON.stringify(termine));
  localStorage.setItem("belege", JSON.stringify(belege));
  localStorage.setItem("wareneingaenge", JSON.stringify(wareneingaenge));
}

function zeigeTab(id) {
  document.querySelectorAll(".tab").forEach(tab => tab.classList.remove("active"));
  const element = document.getElementById(id);
  if (element) element.classList.add("active");
}

async function dateiLesen(input) {
  const datei = input.files[0];
  if (!datei) return null;

  return await new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = e => resolve({
      name: datei.name,
      daten: e.target.result
    });
    reader.readAsDataURL(datei);
  });
}

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

function lagerTeilFinden(name) {
  return lager.find(t => t.name && t.name.toLowerCase().includes(name.toLowerCase()));
}

function lagerFuerAuftragPruefen(auftrag) {
  const teile = leistungsTeile[auftrag.leistung] || [];

  teile.forEach(teilName => {
    const teil = lagerTeilFinden(teilName);

    if (teil && Number(teil.bestand) > 0) {
      teil.bestand = Number(teil.bestand) - 1;
    } else {
      bestellungen.push({
        id: Date.now() + Math.random(),
        kunde: auftrag.kunde,
        auftrag: auftrag.id,
        teil: teilName,
        status: "Offen"
      });
    }
  });
}
async function auftragSpeichern() {
  const leistungWert = document.getElementById("leistung").value.split("|");
  const leistungsName = leistungWert[0];
  const leistungsPreis = Number(leistungWert[1] || 0);

  const editId = document.getElementById("editId").value;
  const neueBilder = await bilderLesen(document.getElementById("bilder"));

  const daten = {
    id: editId || Date.now(),
    kunde: document.getElementById("kunde").value,
    telefon: document.getElementById("telefon").value,
    email: document.getElementById("email")?.value || "",
    fahrrad: document.getElementById("fahrrad").value,
    seriennummer: document.getElementById("seriennummer")?.value || "",
    leistung: leistungsName,
    preis: leistungsPreis,
    notiz: document.getElementById("notiz").value,
    material: document.getElementById("material").value,
    materialpreis: Number(document.getElementById("materialpreis").value || 0),
    status: document.getElementById("status").value,
    datum: new Date().toLocaleDateString()
  };

  if (!daten.kunde || !daten.fahrrad) {
    alert("Bitte Kunde und Fahrrad eintragen.");
    return;
  }

  if (editId) {
    const index = auftraege.findIndex(a => String(a.id) === String(editId));

    if (index >= 0) {
      daten.bilder = [
        ...(auftraege[index].bilder || []),
        ...neueBilder
      ];

      auftraege[index] = daten;
    }
  } else {
    daten.bilder = neueBilder;
    lagerFuerAuftragPruefen(daten);
    auftraege.push(daten);
  }

  speichernDaten();
  formularLeeren();
  allesAktualisieren();
  zeigeTab("liste");
}

function formularLeeren() {
  document.getElementById("editId").value = "";
  document.getElementById("kunde").value = "";
  document.getElementById("telefon").value = "";
  if(document.getElementById("email")) document.getElementById("email").value = "";
  document.getElementById("fahrrad").value = "";
  if(document.getElementById("seriennummer")) document.getElementById("seriennummer").value = "";
  document.getElementById("notiz").value = "";
  document.getElementById("material").value = "";
  document.getElementById("materialpreis").value = "";
  document.getElementById("status").value = "Offen";
  document.getElementById("bilder").value = "";
  document.getElementById("formularTitel").innerText = "Neuer Auftrag";
}

function auftragBearbeiten(id) {
  const a = auftraege.find(x => String(x.id) === String(id));
  if (!a) return;

  document.getElementById("editId").value = a.id;
  document.getElementById("kunde").value = a.kunde || "";
  document.getElementById("telefon").value = a.telefon || "";
  if(document.getElementById("email")) document.getElementById("email").value = a.email || "";
  document.getElementById("fahrrad").value = a.fahrrad || "";
  if(document.getElementById("seriennummer")) document.getElementById("seriennummer").value = a.seriennummer || "";
  document.getElementById("notiz").value = a.notiz || "";
  document.getElementById("material").value = a.material || "";
  document.getElementById("materialpreis").value = a.materialpreis || 0;
  document.getElementById("status").value = a.status || "Offen";

  document.getElementById("formularTitel").innerText = "Auftrag bearbeiten";

  zeigeTab("auftrag");
}

function auftragLoeschen(id) {
  if (!confirm("Auftrag wirklich löschen?")) return;

  auftraege = auftraege.filter(a => String(a.id) !== String(id));

  speichernDaten();
  allesAktualisieren();
}
function auftraegeAnzeigen() {
  const liste = document.getElementById("auftragsliste");
  const suche = (document.getElementById("suche")?.value || "").toLowerCase();

  if (!liste) return;

  liste.innerHTML = "";

  auftraege
    .filter(a =>
      (a.kunde || "").toLowerCase().includes(suche) ||
      (a.fahrrad || "").toLowerCase().includes(suche) ||
      (a.status || "").toLowerCase().includes(suche)
    )
    .forEach(a => {
      const gesamt = Number(a.preis || 0) + Number(a.materialpreis || 0);

      liste.innerHTML += `
        <div class="auftrag">
          <h3>${a.kunde}</h3>
          <p><b>Telefon:</b> ${a.telefon || "-"}</p>
          <p><b>Fahrrad:</b> ${a.fahrrad}</p>
          <p><b>Seriennummer:</b> ${a.seriennummer || "-"}</p>
          <p><b>Leistung:</b> ${a.leistung} – ${Number(a.preis || 0).toFixed(2)} €</p>
          <p><b>Material:</b> ${a.material || "-"} – ${Number(a.materialpreis || 0).toFixed(2)} €</p>
          <p><b>Status:</b> ${a.status}</p>
          <p><b>Gesamt:</b> ${gesamt.toFixed(2)} €</p>
          <div>${(a.bilder || []).map(b => `<img src="${b}">`).join("")}</div>
          <button onclick="auftragBearbeiten('${a.id}')">Bearbeiten</button>
          <button onclick="rechnungErstellen('${a.id}')">Rechnung</button>
          <button onclick="auftragLoeschen('${a.id}')">Löschen</button>
        </div>
      `;
    });
}

function kundenAnzeigen() {
  const liste = document.getElementById("kundenListe");
  if (!liste) return;

  const kunden = {};

  auftraege.forEach(a => {
    if (!kunden[a.kunde]) {
      kunden[a.kunde] = [];
    }
    kunden[a.kunde].push(a);
  });

  liste.innerHTML = Object.keys(kunden).map(name => {
    const summe = kunden[name].reduce((s,a) =>
      s + Number(a.preis || 0) + Number(a.materialpreis || 0), 0
    );

    return `
      <div class="auftrag">
        <h3>${name}</h3>
        <p><b>Aufträge:</b> ${kunden[name].length}</p>
        <p><b>Umsatz:</b> ${summe.toFixed(2)} €</p>
        ${kunden[name].map(a => `
          <div class="auftrag">
            ${a.fahrrad} · ${a.leistung} · ${a.status}
          </div>
        `).join("")}
      </div>
    `;
  }).join("");
}

function dashboardAnzeigen() {
  const offen = auftraege.filter(a => a.status !== "Bezahlt").length;
  const umsatz = auftraege.reduce((s,a) =>
    s + Number(a.preis || 0) + Number(a.materialpreis || 0), 0
  );

  const lagerWarnungen = lager.filter(t =>
    Number(t.bestand || 0) <= Number(t.minimum || 0)
  ).length;

  document.getElementById("dashboardInhalt").innerHTML = `
    <p><b>Offene Aufträge:</b> ${offen}</p>
    <p><b>Gesamtumsatz:</b> ${umsatz.toFixed(2)} €</p>
    <p><b>Bestellungen:</b> ${bestellungen.length}</p>
    <p><b>Termine:</b> ${termine.length}</p>
    <p><b>Lagerartikel:</b> ${lager.length}</p>
    <p><b>Lagerwarnungen:</b> ${lagerWarnungen}</p>
  `;
}

function lagerSpeichern() {
  const ek = Number(document.getElementById("lagerEk").value || 0);
  const aufschlag = Number(document.getElementById("lagerAufschlag").value || 0);
  const vk = ek + (ek * aufschlag / 100);

  lager.push({
    id: Date.now(),
    name: document.getElementById("lagerName").value,
    kategorie: document.getElementById("lagerKategorie")?.value || "",
    bestand: Number(document.getElementById("lagerBestand").value || 0),
    minimum: Number(document.getElementById("lagerMinimum")?.value || 0),
    ek,
    vk,
    aufschlag
  });

  speichernDaten();
  allesAktualisieren();
}

function lagerAnzeigen() {
  const liste = document.getElementById("lagerListe");
  if (!liste) return;

  liste.innerHTML = lager.map(t => {
    const warnung = Number(t.bestand || 0) <= Number(t.minimum || 0);

    return `
      <div class="auftrag">
        <b>${t.name}</b><br>
        Kategorie: ${t.kategorie || "-"}<br>
        Bestand: ${t.bestand}<br>
        Mindestbestand: ${t.minimum || 0}<br>
        EK: ${Number(t.ek || 0).toFixed(2)} €<br>
        VK: ${Number(t.vk || 0).toFixed(2)} €<br>
        ${warnung ? "<b>⚠ Nachbestellen</b>" : ""}
      </div>
    `;
  }).join("");
}
