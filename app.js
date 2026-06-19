let auftraege = JSON.parse(localStorage.getItem("auftraege")) || [];
let lager = JSON.parse(localStorage.getItem("lager")) || [];
let bestellungen = JSON.parse(localStorage.getItem("bestellungen")) || [];
let termine = JSON.parse(localStorage.getItem("termine")) || [];
let belege = JSON.parse(localStorage.getItem("belege")) || [];
let wareneingaenge = JSON.parse(localStorage.getItem("wareneingaenge")) || [];
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

let lagerKategorien = JSON.parse(localStorage.getItem("lagerKategorien")) || [
  "Schlauch","Reifen","Kette","Kassette","Bremsbelag","Reinigung","E-Bike","Werkzeug","Sonstiges"
];

let einstellungen = JSON.parse(localStorage.getItem("einstellungen")) || {
  firmaName:"Fahrrad Werkstatt",
  firmaAdresse:"",
  firmaTelefon:"",
  firmaEmail:"",
  firmaSteuer:"",
  firmaMwst:20,
  firmaStundensatz:45
};

let lagerEditId = null;

const leistungsTeile = {
  "Schlauch wechseln":["Schlauch"],
  "Reifenwechsel":["Reifen"],
  "Kette wechseln":["Kette"],
  "Frühjahrs-Check":["Kettenöl"],
  "Große Inspektion":["Kettenöl","Bremsreiniger"]
};

function speichernDaten(){
  localStorage.setItem("auftraege", JSON.stringify(auftraege));
  localStorage.setItem("lager", JSON.stringify(lager));
  localStorage.setItem("bestellungen", JSON.stringify(bestellungen));
  localStorage.setItem("termine", JSON.stringify(termine));
  localStorage.setItem("belege", JSON.stringify(belege));
  localStorage.setItem("wareneingaenge", JSON.stringify(wareneingaenge));
  localStorage.setItem("eigeneLeistungen", JSON.stringify(eigeneLeistungen));
  localStorage.setItem("lagerKategorien", JSON.stringify(lagerKategorien));
  localStorage.setItem("einstellungen", JSON.stringify(einstellungen));
}

function zeigeTab(id){
  document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
  const el = document.getElementById(id);
  if(el) el.classList.add("active");
}

async function dateiLesen(input){
  const datei = input?.files?.[0];
  if(!datei) return null;
  return await new Promise(resolve=>{
    const r = new FileReader();
    r.onload = e => resolve({name:datei.name,daten:e.target.result});
    r.readAsDataURL(datei);
  });
}

async function bilderLesen(input){
  const dateien = Array.from(input?.files || []);
  const bilder = [];
  for(const d of dateien){
    const bild = await new Promise(resolve=>{
      const r = new FileReader();
      r.onload = e => resolve(e.target.result);
      r.readAsDataURL(d);
    });
    bilder.push(bild);
  }
  return bilder;
}

function leistungsCheckboxenAktualisieren(){
  const c = document.getElementById("leistungenContainer");
  if(!c) return;
  c.innerHTML = eigeneLeistungen.map(l=>`
    <label>
      <input type="checkbox" class="leistungCheck" value="${l.name}|${l.preis}">
      ${l.name} – ${Number(l.preis).toFixed(2)} €
    </label><br>
  `).join("");
}

function leistungenAuslesen(){
  return Array.from(document.querySelectorAll(".leistungCheck:checked")).map(c=>{
    const [name,preis] = c.value.split("|");
    return {name, preis:Number(preis || 0)};
  });
}

function lagerTeilFinden(name){
  return lager.find(t => t.name && t.name.toLowerCase().includes(name.toLowerCase()));
}

function lagerFuerLeistungPruefen(auftrag, leistungName){
  const teile = leistungsTeile[leistungName] || [];
  teile.forEach(teilName=>{
    const teil = lagerTeilFinden(teilName);
    if(teil && Number(teil.bestand) > 0){
      teil.bestand = Number(teil.bestand) - 1;
    } else {
      bestellungen.push({
        id:Date.now()+Math.random(),
        kunde:auftrag.kunde,
        auftrag:auftrag.id,
        teil:teilName,
        status:"Offen"
      });
    }
  });
}

async function auftragSpeichern(){
  const leistungen = leistungenAuslesen();
  const editId = document.getElementById("editId").value;
  const neueBilder = await bilderLesen(document.getElementById("bilder"));
  const preis = leistungen.reduce((s,l)=>s+l.preis,0);

  const daten = {
    id: editId || Date.now(),
    kunde: document.getElementById("kunde").value,
    telefon: document.getElementById("telefon").value,
    email: document.getElementById("email").value,
    adresse: document.getElementById("kundenAdresse")?.value || "",
    fahrrad: document.getElementById("fahrrad").value,
    seriennummer: document.getElementById("seriennummer").value,
    leistungen,
    leistung: leistungen.map(l=>l.name).join(", "),
    preis,
    notiz: document.getElementById("notiz").value,
    material: document.getElementById("material").value,
    materialpreis: Number(document.getElementById("materialpreis").value || 0),
    status: document.getElementById("status").value,
    zahlungsart: document.getElementById("zahlungsart")?.value || "Offen",
    datum: new Date().toLocaleDateString()
  };

  if(!daten.kunde || !daten.fahrrad){
    alert("Bitte Kunde und Fahrrad eintragen.");
    return;
  }

  if(editId){
    const i = auftraege.findIndex(a => String(a.id) === String(editId));
    if(i >= 0){
      daten.bilder = [...(auftraege[i].bilder || []), ...neueBilder];
      auftraege[i] = daten;
    }
  } else {
    daten.bilder = neueBilder;
    leistungen.forEach(l => lagerFuerLeistungPruefen(daten, l.name));
    auftraege.push(daten);
  }

  speichernDaten();
  formularLeeren();
  allesAktualisieren();
  zeigeTab("liste");
}

function formularLeeren(){
  ["editId","kunde","telefon","email","kundenAdresse","fahrrad","seriennummer","notiz","material","materialpreis"].forEach(id=>{
    const el = document.getElementById(id);
    if(el) el.value = "";
  });
  document.querySelectorAll(".leistungCheck").forEach(c=>c.checked=false);
  if(document.getElementById("status")) document.getElementById("status").value = "Offen";
  if(document.getElementById("zahlungsart")) document.getElementById("zahlungsart").value = "Offen";
  if(document.getElementById("bilder")) document.getElementById("bilder").value = "";
  document.getElementById("formularTitel").innerText = "Neuer Auftrag";
}

function auftragBearbeiten(id){
  const a = auftraege.find(x => String(x.id) === String(id));
  if(!a) return;

  document.getElementById("editId").value = a.id;
  document.getElementById("kunde").value = a.kunde || "";
  document.getElementById("telefon").value = a.telefon || "";
  document.getElementById("email").value = a.email || "";
  if(document.getElementById("kundenAdresse")) document.getElementById("kundenAdresse").value = a.adresse || "";
  document.getElementById("fahrrad").value = a.fahrrad || "";
  document.getElementById("seriennummer").value = a.seriennummer || "";
  document.getElementById("notiz").value = a.notiz || "";
  document.getElementById("material").value = a.material || "";
  document.getElementById("materialpreis").value = a.materialpreis || 0;
  document.getElementById("status").value = a.status || "Offen";
  if(document.getElementById("zahlungsart")) document.getElementById("zahlungsart").value = a.zahlungsart || "Offen";

  document.querySelectorAll(".leistungCheck").forEach(c=>{
    c.checked = (a.leistungen || []).some(l => c.value.startsWith(l.name + "|"));
  });

  document.getElementById("formularTitel").innerText = "Auftrag bearbeiten";
  zeigeTab("auftrag");
}

function auftragLoeschen(id){
  if(!confirm("Auftrag wirklich löschen?")) return;
  auftraege = auftraege.filter(a => String(a.id) !== String(id));
  speichernDaten();
  allesAktualisieren();
}

function auftraegeAnzeigen(){
  const liste = document.getElementById("auftragsliste");
  if(!liste) return;
  const suche = (document.getElementById("suche")?.value || "").toLowerCase();

  liste.innerHTML = auftraege.filter(a =>
    (a.kunde||"").toLowerCase().includes(suche) ||
    (a.fahrrad||"").toLowerCase().includes(suche) ||
    (a.status||"").toLowerCase().includes(suche)
  ).map(a=>{
    const gesamt = Number(a.preis||0)+Number(a.materialpreis||0);
    return `
      <div class="auftrag">
        <h3>${a.kunde}</h3>
        <p><b>Fahrrad:</b> ${a.fahrrad}</p>
        <p><b>Leistungen:</b> ${a.leistung || "-"}</p>
        <p><b>Material:</b><br>${(a.material || "-").replaceAll("\n","<br>")}</p>
        <p><b>Status:</b> ${a.status}</p>
        <p><b>Gesamt:</b> ${gesamt.toFixed(2)} €</p>
        <div>${(a.bilder||[]).map(b=>`<img src="${b}">`).join("")}</div>
        <button onclick="auftragBearbeiten('${a.id}')">Bearbeiten</button>
        <button onclick="rechnungErstellen('${a.id}')">Rechnung</button>
        <button onclick="auftragLoeschen('${a.id}')">Löschen</button>
      </div>
    `;
  }).join("");
}

function leistungSpeichern(){
  const name = document.getElementById("leistungName").value.trim();
  const zeit = Number(document.getElementById("leistungZeit").value || 0);
  const stundensatz = Number(document.getElementById("leistungStundensatz").value || einstellungen.firmaStundensatz || 45);
  const preis = zeit * stundensatz;

  if(!name){ alert("Bitte Leistungsname eintragen."); return; }

  eigeneLeistungen.push({name,zeit,stundensatz,preis});
  speichernDaten();
  document.getElementById("leistungName").value = "";
  document.getElementById("leistungZeit").value = 1;
  allesAktualisieren();
}

function leistungLoeschen(i){
  if(!confirm("Leistung löschen?")) return;
  eigeneLeistungen.splice(i,1);
  speichernDaten();
  allesAktualisieren();
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

function kategorienAnzeigen(){
  const s = document.getElementById("lagerKategorie");
  if(!s) return;
  s.innerHTML = lagerKategorien.map(k=>`<option>${k}</option>`).join("");
}

function kategorieSpeichern(){
  const name = document.getElementById("neueKategorie").value.trim();
  if(!name){ alert("Bitte Kategorie eintragen."); return; }
  if(lagerKategorien.includes(name)){ alert("Kategorie gibt es schon."); return; }
  lagerKategorien.push(name);
  document.getElementById("neueKategorie").value = "";
  speichernDaten();
  allesAktualisieren();
}

function lagerSpeichern(){
  const ek = Number(document.getElementById("lagerEk").value || 0);
  const aufschlag = Number(document.getElementById("lagerAufschlag").value || 0);
  const daten = {
    id: document.getElementById("lagerEditId").value || Date.now(),
    name: document.getElementById("lagerName").value,
    kategorie: document.getElementById("lagerKategorie").value,
    bestand: Number(document.getElementById("lagerBestand").value || 0),
    minimum: Number(document.getElementById("lagerMinimum").value || 0),
    ek,
    vk: ek + (ek * aufschlag / 100),
    aufschlag
  };

  if(!daten.name){ alert("Bitte Artikelname eintragen."); return; }

  const i = lager.findIndex(t => String(t.id) === String(daten.id));
  if(i >= 0) lager[i] = daten;
  else lager.push(daten);

  ["lagerEditId","lagerName","lagerBestand","lagerEk"].forEach(id=>document.getElementById(id).value="");
  speichernDaten();
  allesAktualisieren();
}

function lagerBearbeiten(id){
  const t = lager.find(x => String(x.id) === String(id));
  if(!t) return;
  document.getElementById("lagerEditId").value = t.id;
  document.getElementById("lagerName").value = t.name || "";
  document.getElementById("lagerKategorie").value = t.kategorie || "";
  document.getElementById("lagerBestand").value = t.bestand || 0;
  document.getElementById("lagerMinimum").value = t.minimum || 0;
  document.getElementById("lagerEk").value = t.ek || 0;
  document.getElementById("lagerAufschlag").value = t.aufschlag || 0;
  zeigeTab("lager");
}

function lagerLoeschen(id){
  if(!confirm("Lagerartikel löschen?")) return;
  lager = lager.filter(t => String(t.id) !== String(id));
  speichernDaten();
  allesAktualisieren();
}

function lagerAnzeigen(){
  const liste = document.getElementById("lagerListe");
  if(!liste) return;
  liste.innerHTML = lager.map(t=>{
    const warnung = Number(t.bestand||0) <= Number(t.minimum||0);
    return `
      <div class="auftrag">
        <b>${t.name}</b><br>
        Kategorie: ${t.kategorie || "-"}<br>
        Bestand: ${t.bestand}<br>
        EK: ${Number(t.ek||0).toFixed(2)} € · VK: ${Number(t.vk||0).toFixed(2)} €<br>
        ${warnung ? "<b>⚠ Nachbestellen</b><br>" : ""}
        <button onclick="lagerBearbeiten('${t.id}')">Bearbeiten</button>
        <button onclick="lagerLoeschen('${t.id}')">Löschen</button>
      </div>
    `;
  }).join("");
  lagerSelectAktualisieren();
}

function lagerSelectAktualisieren(){
  const s = document.getElementById("auftragLagerArtikel");
  if(!s) return;
  s.innerHTML = `<option value="">Artikel auswählen</option>` + lager.map(t=>`
    <option value="${t.id}">${t.name} · Bestand ${t.bestand} · VK ${Number(t.vk||0).toFixed(2)} €</option>
  `).join("");
}

function lagerArtikelZumAuftrag(){
  const id = document.getElementById("auftragLagerArtikel").value;
  const t = lager.find(x => String(x.id) === String(id));
  if(!t) return;
  if(Number(t.bestand||0) <= 0){ alert("Artikel ist nicht auf Lager."); return; }

  t.bestand = Number(t.bestand) - 1;
  const m = document.getElementById("material");
  const p = document.getElementById("materialpreis");
  m.value = (m.value ? m.value + "\n" : "") + `${t.name} (${Number(t.vk||0).toFixed(2)} €)`;
  p.value = Number(p.value || 0) + Number(t.vk || 0);

  speichernDaten();
  allesAktualisieren();
}

async function wareneingangArtikelSpeichern(){
  const name = document.getElementById("weArtikel").value;
  const menge = Number(document.getElementById("weMenge").value || 1);
  const ek = Number(document.getElementById("weEk").value || 0);
  const aufschlag = Number(document.getElementById("weAufschlag").value || 0);
  const pdf = await dateiLesen(document.getElementById("wePdf"));
  const vk = ek + (ek * aufschlag / 100);

  if(!name){ alert("Bitte Artikel eintragen."); return; }

  const teil = lager.find(t => t.name && t.name.toLowerCase() === name.toLowerCase());
  if(teil){
    teil.bestand = Number(teil.bestand||0) + menge;
    teil.ek = ek; teil.vk = vk; teil.aufschlag = aufschlag;
  } else {
    lager.push({id:Date.now(), name, kategorie:"Wareneingang", bestand:menge, minimum:0, ek, vk, aufschlag});
  }

  wareneingaenge.push({
    id:Date.now()+Math.random(),
    lieferant:document.getElementById("weLieferant").value,
    nummer:document.getElementById("weNummer").value,
    artikel:name, menge, ek, vk,
    pdfName: pdf ? pdf.name : "",
    pdf: pdf ? pdf.daten : "",
    datum:new Date().toLocaleDateString()
  });

  speichernDaten();
  allesAktualisieren();
  document.getElementById("weArtikel").value="";
  document.getElementById("weMenge").value=1;
  document.getElementById("weEk").value="";
}

function wareneingangAnzeigen(){
  const liste = document.getElementById("wareneingangListe");
  if(!liste) return;
  liste.innerHTML = wareneingaenge.map(w=>`
    <div class="auftrag">
      <b>${w.artikel}</b><br>
      Lieferant: ${w.lieferant || "-"}<br>
      Rechnung: ${w.nummer || "-"}<br>
      Menge: ${w.menge}<br>
      EK: ${Number(w.ek||0).toFixed(2)} € · VK: ${Number(w.vk||0).toFixed(2)} €<br>
      ${w.pdf ? `<button onclick="pdfOeffnen('${w.id}','wareneingang')">PDF öffnen</button>` : ""}
    </div>
  `).join("");
}

function bestellungSpeichern(){
  bestellungen.push({
    id:Date.now(),
    kunde:document.getElementById("bestellKunde").value,
    auftrag:document.getElementById("bestellAuftrag").value,
    teil:document.getElementById("bestellTeil").value,
    status:document.getElementById("bestellStatus").value
  });
  speichernDaten();
  allesAktualisieren();
}

function bestellStatusAendern(id,status){
  const b = bestellungen.find(x => String(x.id) === String(id));
  if(!b) return;
  b.status = status;
  speichernDaten();
  allesAktualisieren();
}

function bestellungenAnzeigen(){
  const liste = document.getElementById("bestellListe");
  if(!liste) return;
  liste.innerHTML = bestellungen.map(b=>`
    <div class="auftrag">
      <b>${b.kunde}</b><br>
      Auftrag: ${b.auftrag || "-"}<br>
      Teil: ${b.teil}<br>
      Status: ${b.status}<br>
      <button onclick="bestellStatusAendern('${b.id}','Bestellt')">Bestellt</button>
      <button onclick="bestellStatusAendern('${b.id}','Geliefert')">Geliefert</button>
      <button onclick="bestellStatusAendern('${b.id}','Eingebaut')">Eingebaut</button>
    </div>
  `).join("");
}

function terminSpeichern(){
  termine.push({
    id:Date.now(),
    datum:document.getElementById("terminDatum").value,
    zeit:document.getElementById("terminZeit").value,
    text:document.getElementById("terminText").value
  });
  speichernDaten();
  allesAktualisieren();
}

function terminLoeschen(id){
  if(!confirm("Termin löschen?")) return;
  termine = termine.filter(t => String(t.id) !== String(id));
  speichernDaten();
  allesAktualisieren();
}

function termineAnzeigen(){
  const liste = document.getElementById("terminListe");
  if(!liste) return;
  liste.innerHTML = termine.map(t=>`
    <div class="auftrag">
      <b>${t.datum} ${t.zeit}</b><br>
      ${t.text}<br>
      <button onclick="terminLoeschen('${t.id}')">Löschen</button>
    </div>
  `).join("");
}

async function belegSpeichern(){
  const pdf = await dateiLesen(document.getElementById("belegDatei"));
  belege.push({
    id:Date.now(),
    auftragId:document.getElementById("belegAuftrag").value,
    lieferant:document.getElementById("belegLieferant").value,
    nummer:document.getElementById("belegNummer").value,
    betrag:Number(document.getElementById("belegBetrag").value || 0),
    pdfName: pdf ? pdf.name : "",
    pdf: pdf ? pdf.daten : ""
  });
  speichernDaten();
  allesAktualisieren();
}

function belegAuftraegeFuellen(){
  const s = document.getElementById("belegAuftrag");
  if(!s) return;
  s.innerHTML = `<option value="">Kein Auftrag</option>` + auftraege.map(a=>`
    <option value="${a.id}">${a.kunde} - ${a.fahrrad}</option>
  `).join("");
}

function belegeAnzeigen(){
  const liste = document.getElementById("belegListe");
  if(!liste) return;
  liste.innerHTML = belege.map(b=>`
    <div class="auftrag">
      <b>${b.lieferant || "-"}</b><br>
      Rechnung: ${b.nummer || "-"}<br>
      Betrag: ${Number(b.betrag||0).toFixed(2)} €<br>
      ${b.pdf ? `<button onclick="pdfOeffnen('${b.id}','beleg')">PDF öffnen</button>` : ""}
    </div>
  `).join("");
}

function pdfOeffnen(id, quelle){
  const e = quelle === "wareneingang"
    ? wareneingaenge.find(x => String(x.id) === String(id))
    : belege.find(x => String(x.id) === String(id));
  if(!e || !e.pdf) return;
  const win = window.open();
  win.document.write(`<iframe src="${e.pdf}" style="width:100%;height:100vh;border:0"></iframe>`);
}

function kundenAnzeigen(){
  const liste = document.getElementById("kundenListe");
  if(!liste) return;
  const kunden = {};
  auftraege.forEach(a=>{
    if(!kunden[a.kunde]) kunden[a.kunde]=[];
    kunden[a.kunde].push(a);
  });
  liste.innerHTML = Object.keys(kunden).map(name=>{
    const summe = kunden[name].reduce((s,a)=>s+Number(a.preis||0)+Number(a.materialpreis||0),0);
    return `
      <div class="auftrag">
        <h3>${name}</h3>
        Aufträge: ${kunden[name].length}<br>
        Umsatz: ${summe.toFixed(2)} €<br>
        ${kunden[name].map(a=>`<div class="auftrag">${a.fahrrad} · ${a.leistung} · ${a.status}</div>`).join("")}
      </div>
    `;
  }).join("");
}

function einstellungenSpeichern(){
  einstellungen = {
    firmaName:document.getElementById("firmaName").value,
    firmaAdresse:document.getElementById("firmaAdresse").value,
    firmaTelefon:document.getElementById("firmaTelefon").value,
    firmaEmail:document.getElementById("firmaEmail").value,
    firmaSteuer:document.getElementById("firmaSteuer").value,
    firmaMwst:Number(document.getElementById("firmaMwst").value || 0),
    firmaStundensatz:Number(document.getElementById("firmaStundensatz").value || 45)
  };
  speichernDaten();
  alert("Einstellungen gespeichert.");
}

function einstellungenLaden(){
  Object.keys(einstellungen).forEach(k=>{
    const el = document.getElementById(k);
    if(el) el.value = einstellungen[k];
  });
}

function rechnungErstellen(id){
  const a = auftraege.find(x => String(x.id) === String(id));
  if(!a) return;

  const netto = Number(a.preis||0)+Number(a.materialpreis||0);
  const mwstSatz = Number(einstellungen.firmaMwst || 0);
  const mwst = netto * mwstSatz / 100;
  const brutto = netto + mwst;

  document.getElementById("rechnungInhalt").innerHTML = `
    <div style="padding:20px">
      <h1>${einstellungen.firmaName || "Fahrrad Werkstatt"}</h1>
      <p>${(einstellungen.firmaAdresse || "").replaceAll("\n","<br>")}</p>
      <p>${einstellungen.firmaTelefon || ""} · ${einstellungen.firmaEmail || ""}</p>
      <p>${einstellungen.firmaSteuer || ""}</p>
      <hr>

      <h2>Rechnung R-${a.id}</h2>
      <p><b>Datum:</b> ${a.datum}</p>

      <h3>Kunde</h3>
      <p>${a.kunde}<br>${(a.adresse || "").replaceAll("\n","<br>")}<br>${a.email || ""}</p>

      <h3>Fahrrad</h3>
      <p>${a.fahrrad}<br>Seriennummer: ${a.seriennummer || "-"}</p>

      <table width="100%" border="1" cellspacing="0" cellpadding="6">
        <tr><th align="left">Position</th><th align="right">Preis</th></tr>
        ${(a.leistungen || [{name:a.leistung,preis:a.preis}]).map(l=>`
          <tr><td>${l.name}</td><td align="right">${Number(l.preis||0).toFixed(2)} €</td></tr>
        `).join("")}
        <tr><td>${(a.material || "Material").replaceAll("\n","<br>")}</td><td align="right">${Number(a.materialpreis||0).toFixed(2)} €</td></tr>
      </table>

      <h3>Netto: ${netto.toFixed(2)} €</h3>
      <p>MwSt. ${mwstSatz}%: ${mwst.toFixed(2)} €</p>
      <h2>Gesamt: ${brutto.toFixed(2)} €</h2>
      <p><b>Zahlungsart:</b> ${a.zahlungsart || "Offen"}</p>
      <br><br>_________________________<br>Unterschrift
    </div>
  `;
  zeigeTab("rechnung");
}

function dashboardAnzeigen(){
  const offen = auftraege.filter(a=>a.status !== "Bezahlt").length;
  const umsatz = auftraege.reduce((s,a)=>s+Number(a.preis||0)+Number(a.materialpreis||0),0);
  const warnungen = lager.filter(t=>Number(t.bestand||0)<=Number(t.minimum||0)).length;
  document.getElementById("dashboardInhalt").innerHTML = `
    <p><b>Offene Aufträge:</b> ${offen}</p>
    <p><b>Gesamtumsatz:</b> ${umsatz.toFixed(2)} €</p>
    <p><b>Bestellungen:</b> ${bestellungen.length}</p>
    <p><b>Termine:</b> ${termine.length}</p>
    <p><b>Lagerwarnungen:</b> ${warnungen}</p>
  `;
}

function backupExport(){
  document.getElementById("backupText").value = JSON.stringify({
    auftraege,lager,bestellungen,termine,belege,wareneingaenge,eigeneLeistungen,lagerKategorien,einstellungen
  });
}

function backupImport(){
  try{
    const d = JSON.parse(document.getElementById("backupText").value);
    auftraege=d.auftraege||[]; lager=d.lager||[]; bestellungen=d.bestellungen||[];
    termine=d.termine||[]; belege=d.belege||[]; wareneingaenge=d.wareneingaenge||[];
    eigeneLeistungen=d.eigeneLeistungen||eigeneLeistungen;
    lagerKategorien=d.lagerKategorien||lagerKategorien;
    einstellungen=d.einstellungen||einstellungen;
    speichernDaten();
    allesAktualisieren();
    alert("Backup importiert.");
  }catch{
    alert("Fehler beim Backup-Import.");
  }
}

function sicher(fn){
  try { fn(); } catch(e){ console.log("Fehler:", e.message); }
}

function allesAktualisieren(){
  sicher(leistungsCheckboxenAktualisieren);
  sicher(leistungenAnzeigen);
  sicher(kategorienAnzeigen);
  sicher(lagerAnzeigen);
  sicher(auftraegeAnzeigen);
  sicher(kundenAnzeigen);
  sicher(wareneingangAnzeigen);
  sicher(bestellungenAnzeigen);
  sicher(termineAnzeigen);
  sicher(belegeAnzeigen);
  sicher(belegAuftraegeFuellen);
  sicher(dashboardAnzeigen);
  sicher(einstellungenLaden);

window.onload = function(){
  zeigeTab("dashboard");
  allesAktualisieren();
};
