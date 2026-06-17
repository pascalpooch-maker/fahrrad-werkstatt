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
async function wareneingangArtikelSpeichern() {
  const name = document.getElementById("weArtikel").value;
  const menge = Number(document.getElementById("weMenge").value || 1);
  const ek = Number(document.getElementById("weEk").value || 0);
  const aufschlag = Number(document.getElementById("weAufschlag").value || 0);
  const vk = ek + (ek * aufschlag / 100);
  const pdf = await dateiLesen(document.getElementById("wePdf"));

  if (!name) {
    alert("Bitte Artikel eintragen.");
    return;
  }

  const vorhandenesTeil = lager.find(t =>
    t.name && t.name.toLowerCase() === name.toLowerCase()
  );

  if (vorhandenesTeil) {
    vorhandenesTeil.bestand = Number(vorhandenesTeil.bestand || 0) + menge;
    vorhandenesTeil.ek = ek;
    vorhandenesTeil.vk = vk;
    vorhandenesTeil.aufschlag = aufschlag;
  } else {
    lager.push({
      id: Date.now(),
      name,
      kategorie: "Wareneingang",
      bestand: menge,
      minimum: 0,
      ek,
      vk,
      aufschlag
    });
  }

  wareneingaenge.push({
    id: Date.now() + Math.random(),
    lieferant: document.getElementById("weLieferant").value,
    nummer: document.getElementById("weNummer").value,
    artikel: name,
    menge,
    ek,
    vk,
    pdfName: pdf ? pdf.name : "",
    pdf: pdf ? pdf.daten : "",
    datum: new Date().toLocaleDateString()
  });

  speichernDaten();
  allesAktualisieren();

  document.getElementById("weArtikel").value = "";
  document.getElementById("weMenge").value = 1;
  document.getElementById("weEk").value = "";
}

function wareneingangAnzeigen() {
  const liste = document.getElementById("wareneingangListe");
  if (!liste) return;

  liste.innerHTML = wareneingaenge.map(w => `
    <div class="auftrag">
      <b>${w.artikel}</b><br>
      Lieferant: ${w.lieferant || "-"}<br>
      Rechnung: ${w.nummer || "-"}<br>
      Menge: ${w.menge}<br>
      EK: ${Number(w.ek || 0).toFixed(2)} €<br>
      VK: ${Number(w.vk || 0).toFixed(2)} €<br>
      Datum: ${w.datum}<br>
      ${w.pdf ? `<button onclick="pdfOeffnen('${w.id}','wareneingang')">PDF öffnen</button>` : ""}
    </div>
  `).join("");
}

function pdfOeffnen(id, quelle) {
  let eintrag = null;

  if (quelle === "wareneingang") {
    eintrag = wareneingaenge.find(x => String(x.id) === String(id));
  } else {
    eintrag = belege.find(x => String(x.id) === String(id));
  }

  if (!eintrag || !eintrag.pdf) return;

  const win = window.open();
  win.document.write(`<iframe src="${eintrag.pdf}" style="width:100%;height:100vh;border:0"></iframe>`);
}
function bestellungSpeichern() {
  bestellungen.push({
    id: Date.now(),
    kunde: document.getElementById("bestellKunde").value,
    teil: document.getElementById("bestellTeil").value,
    status: document.getElementById("bestellStatus").value,
    auftrag: document.getElementById("bestellAuftrag").value
  });

  speichernDaten();
  allesAktualisieren();
}

function bestellungenAnzeigen() {
  const liste = document.getElementById("bestellListe");
  if (!liste) return;

  liste.innerHTML = bestellungen.map(b => `
    <div class="auftrag">
      <b>${b.kunde}</b><br>
      Auftrag: ${b.auftrag || "-"}<br>
      Teil: ${b.teil}<br>
      Status: ${b.status}
    </div>
  `).join("");
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

function termineAnzeigen() {
  const liste = document.getElementById("terminListe");
  if (!liste) return;

  liste.innerHTML = termine.map(t => `
    <div class="auftrag">
      <b>${t.datum} ${t.zeit}</b><br>
      ${t.text}
    </div>
  `).join("");
}

async function belegSpeichern() {
  const pdf = await dateiLesen(document.getElementById("belegDatei"));

  belege.push({
    id: Date.now(),
    auftragId: document.getElementById("belegAuftrag").value,
    lieferant: document.getElementById("belegLieferant").value,
    nummer: document.getElementById("belegNummer").value,
    betrag: Number(document.getElementById("belegBetrag").value || 0),
    pdfName: pdf ? pdf.name : "",
    pdf: pdf ? pdf.daten : ""
  });

  speichernDaten();
  allesAktualisieren();
}

function belegAuftraegeFuellen() {
  const select = document.getElementById("belegAuftrag");
  if (!select) return;

  select.innerHTML =
    `<option value="">Kein Auftrag</option>` +
    auftraege.map(a =>
      `<option value="${a.id}">
        ${a.kunde} - ${a.fahrrad}
      </option>`
    ).join("");
}

function belegeAnzeigen() {
  const liste = document.getElementById("belegListe");
  if (!liste) return;

  liste.innerHTML = belege.map(b => `
    <div class="auftrag">
      <b>${b.lieferant}</b><br>
      Rechnung: ${b.nummer}<br>
      Betrag: ${Number(b.betrag || 0).toFixed(2)} €<br>
      ${b.pdf ? `<button onclick="pdfOeffnen('${b.id}','beleg')">PDF öffnen</button>` : ""}
    </div>
  `).join("");
}

function rechnungErstellen(id) {
  const a = auftraege.find(x => String(x.id) === String(id));
  if (!a) return;

  const gesamt =
    Number(a.preis || 0) +
    Number(a.materialpreis || 0);

  document.getElementById("rechnungInhalt").innerHTML = `
    <h2>Rechnung</h2>
    <p><b>Kunde:</b> ${a.kunde}</p>
    <p><b>Fahrrad:</b> ${a.fahrrad}</p>
    <p><b>Leistung:</b> ${a.leistung}</p>
    <p><b>Material:</b> ${a.material || "-"}</p>
    <h3>Gesamt: ${gesamt.toFixed(2)} €</h3>
  `;

  zeigeTab("rechnung");
}

function backupExport() {
  document.getElementById("backupText").value =
    JSON.stringify({
      auftraege,
      lager,
      bestellungen,
      termine,
      belege,
      wareneingaenge
    });
}

function backupImport() {
  try {
    const daten =
      JSON.parse(document.getElementById("backupText").value);

    auftraege = daten.auftraege || [];
    lager = daten.lager || [];
    bestellungen = daten.bestellungen || [];
    termine = daten.termine || [];
    belege = daten.belege || [];
    wareneingaenge = daten.wareneingaenge || [];

    speichernDaten();
    allesAktualisieren();

    alert("Backup importiert");
  } catch {
    alert("Fehler beim Import");
  }
}

function allesAktualisieren() {
  dashboardAnzeigen();
  auftraegeAnzeigen();
  kundenAnzeigen();
  lagerAnzeigen();
  wareneingangAnzeigen();
  bestellungenAnzeigen();
  termineAnzeigen();
  belegeAnzeigen();
  belegAuftraegeFuellen();
}

window.onload = function() {
  zeigeTab("dashboard");
  allesAktualisieren();
};
function terminLoeschen(id) {
  if (!confirm("Termin wirklich löschen?")) return;

  termine = termine.filter(t => String(t.id) !== String(id));

  speichernDaten();
  allesAktualisieren();
}

function termineAnzeigen() {
  const liste = document.getElementById("terminListe");
  if (!liste) return;

  liste.innerHTML = termine.map(t => `
    <div class="auftrag">
      <b>${t.datum} ${t.zeit}</b><br>
      ${t.text}<br>
      <button onclick="terminLoeschen('${t.id}')">Termin löschen</button>
    </div>
  `).join("");
}
function leistungenAuslesen() {
  return Array.from(document.querySelectorAll(".leistungCheck:checked")).map(c => {
    const [name, preis] = c.value.split("|");
    return { name, preis: Number(preis || 0) };
  });
}

async function auftragSpeichern() {
  const leistungen = leistungenAuslesen();
  const gesamtLeistung = leistungen.reduce((s,l) => s + l.preis, 0);
  const editId = document.getElementById("editId").value;
  const neueBilder = await bilderLesen(document.getElementById("bilder"));

  const daten = {
    id: editId || Date.now(),
    kunde: document.getElementById("kunde").value,
    telefon: document.getElementById("telefon").value,
    email: document.getElementById("email")?.value || "",
    fahrrad: document.getElementById("fahrrad").value,
    seriennummer: document.getElementById("seriennummer")?.value || "",
    leistung: leistungen.map(l => l.name).join(", "),
    leistungen,
    preis: gesamtLeistung,
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
      daten.bilder = [...(auftraege[index].bilder || []), ...neueBilder];
      auftraege[index] = daten;
    }
  } else {
    daten.bilder = neueBilder;
    daten.leistungen.forEach(l => lagerFuerAuftragPruefen({ ...daten, leistung: l.name }));
    auftraege.push(daten);
  }

  speichernDaten();
  formularLeeren();
  allesAktualisieren();
  zeigeTab("liste");
}
let eigeneLeistungen = JSON.parse(localStorage.getItem("eigeneLeistungen")) || [
  { name:"Frühjahrs-Check", zeit:1.2, stundensatz:45, preis:55 },
  { name:"Reifenwechsel", zeit:0.45, stundensatz:45, preis:20 },
  { name:"Schlauch wechseln", zeit:0.33, stundensatz:45, preis:15 },
  { name:"Bremsen einstellen", zeit:0.33, stundensatz:45, preis:15 },
  { name:"Schaltung einstellen", zeit:0.45, stundensatz:45, preis:20 },
  { name:"Kette wechseln", zeit:0.55, stundensatz:45, preis:25 },
  { name:"Große Inspektion", zeit:2.9, stundensatz:45, preis:129 },
  { name:"E-Bike Diagnose", zeit:0.8, stundensatz:45, preis:35 }
];

function leistungSpeichern(){
  const name = document.getElementById("leistungName").value;
  const zeit = Number(document.getElementById("leistungZeit").value || 0);
  const stundensatz = Number(document.getElementById("leistungStundensatz").value || 0);
  const preis = zeit * stundensatz;

  if(!name){
    alert("Bitte Leistungsname eintragen.");
    return;
  }

  eigeneLeistungen.push({
    name,
    zeit,
    stundensatz,
    preis
  });

  localStorage.setItem("eigeneLeistungen", JSON.stringify(eigeneLeistungen));

  document.getElementById("leistungName").value = "";
  document.getElementById("leistungZeit").value = 1;

  leistungenAnzeigen();
  leistungsCheckboxenAktualisieren();
}

function leistungenAnzeigen(){
  const liste = document.getElementById("leistungenListe");
  if(!liste) return;

  liste.innerHTML = eigeneLeistungen.map((l,i)=>`
    <div class="auftrag">
      <b>${l.name}</b><br>
      Zeit: ${l.zeit} h<br>
      Stundensatz: ${Number(l.stundensatz).toFixed(2)} €<br>
      Preis: ${Number(l.preis).toFixed(2)} €<br>
      <button onclick="leistungLoeschen(${i})">Löschen</button>
    </div>
  `).join("");
}

function leistungLoeschen(index){
  if(!confirm("Leistung löschen?")) return;

  eigeneLeistungen.splice(index,1);
  localStorage.setItem("eigeneLeistungen", JSON.stringify(eigeneLeistungen));

  leistungenAnzeigen();
  leistungsCheckboxenAktualisieren();
}

function leistungsCheckboxenAktualisieren(){
  const container = document.getElementById("leistungenContainer");
  if(!container) return;

  container.innerHTML = eigeneLeistungen.map(l=>`
    <label>
      <input type="checkbox" class="leistungCheck" value="${l.name}|${l.preis}">
      ${l.name} – ${Number(l.preis).toFixed(2)} €
    </label><br>
  `).join("");
}

const alteSpeichernDatenLeistungen = speichernDaten;
speichernDaten = function(){
  alteSpeichernDatenLeistungen();
  localStorage.setItem("eigeneLeistungen", JSON.stringify(eigeneLeistungen));
};

const alteAllesAktualisierenLeistungen = allesAktualisieren;
allesAktualisieren = function(){
  alteAllesAktualisierenLeistungen();
  leistungenAnzeigen();
  leistungsCheckboxenAktualisieren();
};

window.addEventListener("load", function(){
  leistungsCheckboxenAktualisieren();
  leistungenAnzeigen();
});
let lagerKategorien = JSON.parse(localStorage.getItem("lagerKategorien")) || [
  "Schlauch",
  "Reifen",
  "Kette",
  "Kassette",
  "Bremsbelag",
  "Reinigung",
  "E-Bike",
  "Werkzeug",
  "Sonstiges"
];

function kategorieSpeichern(){
  const name = document.getElementById("neueKategorie").value.trim();

  if(!name){
    alert("Bitte Kategorie eintragen.");
    return;
  }

  if(lagerKategorien.includes(name)){
    alert("Kategorie gibt es schon.");
    return;
  }

  lagerKategorien.push(name);
  localStorage.setItem("lagerKategorien", JSON.stringify(lagerKategorien));

  document.getElementById("neueKategorie").value = "";

  kategorienAnzeigen();
}

function kategorienAnzeigen(){
  const select = document.getElementById("lagerKategorie");
  if(!select) return;

  select.innerHTML = lagerKategorien.map(k =>
    `<option>${k}</option>`
  ).join("");
}

window.addEventListener("load", kategorienAnzeigen);

let lagerEditId = null;

function lagerBearbeiten(id) {
  const teil = lager.find(t => String(t.id) === String(id));
  if (!teil) return;

  lagerEditId = id;

  document.getElementById("lagerName").value = teil.name || "";
  document.getElementById("lagerKategorie").value = teil.kategorie || "";
  document.getElementById("lagerBestand").value = teil.bestand || 0;
  document.getElementById("lagerMinimum").value = teil.minimum || 0;
  document.getElementById("lagerEk").value = teil.ek || 0;
  document.getElementById("lagerAufschlag").value = teil.aufschlag || 0;

  zeigeTab("lager");
}

function lagerLoeschen(id) {
  if (!confirm("Lagerartikel wirklich löschen?")) return;

  lager = lager.filter(t => String(t.id) !== String(id));

  speichernDaten();
  allesAktualisieren();
}

function lagerSpeichern() {
  const ek = Number(document.getElementById("lagerEk").value || 0);
  const aufschlag = Number(document.getElementById("lagerAufschlag").value || 0);
  const vk = ek + (ek * aufschlag / 100);

  const daten = {
    id: lagerEditId || Date.now(),
    name: document.getElementById("lagerName").value,
    kategorie: document.getElementById("lagerKategorie")?.value || "",
    bestand: Number(document.getElementById("lagerBestand").value || 0),
    minimum: Number(document.getElementById("lagerMinimum")?.value || 0),
    ek,
    vk,
    aufschlag
  };

  if (!daten.name) {
    alert("Bitte Artikelnamen eintragen.");
    return;
  }

  if (lagerEditId) {
    const index = lager.findIndex(t => String(t.id) === String(lagerEditId));
    if (index >= 0) lager[index] = daten;
    lagerEditId = null;
  } else {
    lager.push(daten);
  }

  document.getElementById("lagerName").value = "";
  document.getElementById("lagerBestand").value = "";
  document.getElementById("lagerEk").value = "";

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
        ${warnung ? "<b>⚠ Nachbestellen</b><br>" : ""}
        <button onclick="lagerBearbeiten('${t.id}')">Bearbeiten</button>
        <button onclick="lagerLoeschen('${t.id}')">Löschen</button>
      </div>
    `;
  }).join("");

  lagerSelectAktualisieren();
}

function lagerSelectAktualisieren() {
  const select = document.getElementById("auftragLagerArtikel");
  if (!select) return;

  select.innerHTML =
    `<option value="">Artikel auswählen</option>` +
    lager.map(t => `
      <option value="${t.id}">
        ${t.name} · Bestand ${t.bestand} · VK ${Number(t.vk || 0).toFixed(2)} €
      </option>
    `).join("");
}

function lagerArtikelZumAuftrag() {
  const id = document.getElementById("auftragLagerArtikel").value;
  if (!id) return;

  const teil = lager.find(t => String(t.id) === String(id));
  if (!teil) return;

  if (Number(teil.bestand || 0) <= 0) {
    alert("Artikel ist nicht auf Lager.");
    return;
  }

  teil.bestand = Number(teil.bestand || 0) - 1;

  const materialFeld = document.getElementById("material");
  const preisFeld = document.getElementById("materialpreis");

  const bisher = materialFeld.value ? materialFeld.value + "\n" : "";
  materialFeld.value = bisher + `${teil.name} (${Number(teil.vk || 0).toFixed(2)} €)`;

  preisFeld.value =
    Number(preisFeld.value || 0) + Number(teil.vk || 0);

  speichernDaten();
  allesAktualisieren();
}