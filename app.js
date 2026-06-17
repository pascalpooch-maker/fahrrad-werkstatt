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
function lagerSpeichern() {
  const ek = Number(document.getElementById("lagerEk").value || 0);
  const aufschlag = Number(document.getElementById("lagerAufschlag").value || 0);
  const vk = ek + (ek * aufschlag / 100);

  lager.push({
    id: Date.now(),
    name: document.getElementById("lagerName").value,
    bestand: Number(document.getElementById("lagerBestand").value || 0),
    ek,
    vk,
    aufschlag
  });

  speichernDaten();
  allesAktualisieren();
}

function bestellungSpeichern() {
  bestellungen.push({
    id: Date.now(),
    kunde: document.getElementById("bestellKunde").value,
    teil: document.getElementById("bestellTeil").value,
    status: document.getElementById("bestellStatus").value
  });

  speichernDaten();
  allesAktualisieren();
}

function terminSpeichern() {
  termine.push({
    id: Date.now(),
    datum: document.getElementById("terminDatum").value,
    zeit: document.getElementById("terminZeit").value,
    text: document.getElementById("terminText").value
  });

  speichernDaten();
  allesAktualisieren();
}

function lagerAnzeigen() {
  document.getElementById("lagerListe").innerHTML = lager.map(t => `
    <div class="auftrag">
      <b>${t.name}</b><br>
      Bestand: ${t.bestand}<br>
      EK: ${Number(t.ek).toFixed(2)} €<br>
      VK: ${Number(t.vk).toFixed(2)} €
    </div>
  `).join("");
}

function bestellungenAnzeigen() {
  document.getElementById("bestellListe").innerHTML = bestellungen.map(b => `
    <div class="auftrag">
      <b>${b.kunde}</b><br>
      Teil: ${b.teil}<br>
      Status: ${b.status}
    </div>
  `).join("");
}

function termineAnzeigen() {
  document.getElementById("terminListe").innerHTML = termine.map(t => `
    <div class="auftrag">
      <b>${t.datum} ${t.zeit}</b><br>
      ${t.text}
    </div>
  `).join("");
}

function dashboardAnzeigen() {
  const offen = auftraege.filter(a => a.status !== "Bezahlt").length;
  const umsatz = auftraege.reduce((s,a) => s + Number(a.preis || 0) + Number(a.materialpreis || 0), 0);

  document.getElementById("dashboardInhalt").innerHTML = `
    <p><b>Offene Aufträge:</b> ${offen}</p>
    <p><b>Gesamtumsatz:</b> ${umsatz.toFixed(2)} €</p>
    <p><b>Bestellungen:</b> ${bestellungen.length}</p>
    <p><b>Termine:</b> ${termine.length}</p>
    <p><b>Lagerartikel:</b> ${lager.length}</p>
  `;
}

function rechnungErstellen(id) {
  const a = auftraege.find(x => x.id === id);
  if (!a) return;

  const gesamt = Number(a.preis || 0) + Number(a.materialpreis || 0);
  const qrText = location.origin + location.pathname + "?auftrag=" + a.id;

  document.getElementById("rechnungInhalt").innerHTML = `
    <h2>Rechnung</h2>
    <p><b>Auftrag:</b> ${a.id}</p>
    <p><b>Kunde:</b> ${a.kunde}</p>
    <p><b>Fahrrad:</b> ${a.fahrrad}</p>
    <hr>
    <p>${a.leistung}: ${Number(a.preis || 0).toFixed(2)} €</p>
    <p>${a.material || "Material"}: ${Number(a.materialpreis || 0).toFixed(2)} €</p>
    <h3>Gesamt: ${gesamt.toFixed(2)} €</h3>
    <p><b>QR-Code Link:</b></p>
    <div style="font-size:12px;word-break:break-all">${qrText}</div>
  `;

  zeigeTab("rechnung");
}

function backupExport() {
  const backup = {
    auftraege,
    lager,
    bestellungen,
    termine
  };

  document.getElementById("backupText").value = JSON.stringify(backup);
}

function backupImport() {
  try {
    const backup = JSON.parse(document.getElementById("backupText").value);
    auftraege = backup.auftraege || [];
    lager = backup.lager || [];
    bestellungen = backup.bestellungen || [];
    termine = backup.termine || [];
    speichernDaten();
    allesAktualisieren();
    alert("Backup importiert.");
  } catch {
    alert("Backup konnte nicht importiert werden.");
  }
}

function allesAktualisieren() {
  auftraegeAnzeigen();
  lagerAnzeigen();
  bestellungenAnzeigen();
  termineAnzeigen();
  dashboardAnzeigen();
}

window.onload = function() {
  zeigeTab("dashboard");
  allesAktualisieren();
};
const leistungsTeile = {
  "Schlauch wechseln": ["Schlauch"],
  "Reifenwechsel": ["Reifen"],
  "Kette wechseln": ["Kette"],
  "Bremsen einstellen": [],
  "Schaltung einstellen": [],
  "Frühjahrs-Check": ["Kettenöl"],
  "Große Inspektion": ["Kettenöl", "Bremsreiniger"]
};

function lagerTeilFinden(name){
  return lager.find(t => t.name.toLowerCase().includes(name.toLowerCase()));
}

function lagerFuerAuftragPruefen(auftrag){
  const teile = leistungsTeile[auftrag.leistung] || [];

  teile.forEach(teilName => {
    const teil = lagerTeilFinden(teilName);

    if(teil && teil.bestand > 0){
      teil.bestand -= 1;
    } else {
      bestellungen.push({
        id: Date.now() + Math.random(),
        kunde: auftrag.kunde,
        teil: teilName,
        status: "Offen",
        auftrag: auftrag.id
      });
    }
  });
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
      daten.lagerVerarbeitet = auftraege[index].lagerVerarbeitet || false;
      auftraege[index] = daten;
    }
  } else {
    daten.id = Date.now();
    daten.bilder = neueBilder;
    daten.lagerVerarbeitet = true;
    lagerFuerAuftragPruefen(daten);
    auftraege.push(daten);
  }

  speichernDaten();
  formularLeeren();
  allesAktualisieren();
  zeigeTab("liste");
}

function bestellungenAnzeigen() {
  document.getElementById("bestellListe").innerHTML = bestellungen.map(b => `
    <div class="auftrag">
      <b>${b.kunde}</b><br>
      Teil: ${b.teil}<br>
      Auftrag: ${b.auftrag || "-"}<br>
      Status: ${b.status}<br>
      <button onclick="bestellStatusAendern(${b.id}, 'Bestellt')">Bestellt</button>
      <button onclick="bestellStatusAendern(${b.id}, 'Geliefert')">Geliefert</button>
      <button onclick="bestellStatusAendern(${b.id}, 'Eingebaut')">Eingebaut</button>
    </div>
  `).join("");
}

function bestellStatusAendern(id,status){
  const b = bestellungen.find(x => String(x.id) === String(id));
  if(!b) return;
  b.status = status;
  speichernDaten();
  allesAktualisieren();
}

function termineAnzeigen() {
  document.getElementById("terminListe").innerHTML = termine.map(t => `
    <div class="auftrag">
      <b>${t.datum} ${t.zeit}</b><br>
      ${t.text}<br>
      <button onclick="appleKalender(${t.id})">In Apple Kalender</button>
    </div>
  `).join("");
}

function appleKalender(id){
  const t = termine.find(x => x.id === id);
  if(!t) return;

  const start = t.datum.replaceAll("-","") + "T" + t.zeit.replace(":","") + "00";
  const ende = t.datum.replaceAll("-","") + "T" + (Number(t.zeit.split(":")[0])+1).toString().padStart(2,"0") + t.zeit.split(":")[1] + "00";

  const ics = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
SUMMARY:Fahrrad Werkstatt - ${t.text}
DTSTART:${start}
DTEND:${ende}
DESCRIPTION:Termin aus Fahrrad Werkstatt App
END:VEVENT
END:VCALENDAR`;

  const blob = new Blob([ics], {type:"text/calendar"});
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "werkstatt-termin.ics";
  link.click();
}
