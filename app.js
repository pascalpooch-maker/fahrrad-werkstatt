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
  firmaStundensatz:45,
  logo:""
};

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

function wert(id){
  return document.getElementById(id)?.value || "";
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
    r.onload = e => resolve({ name:datei.name, daten:e.target.result });
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
    return { name, preis:Number(preis || 0) };
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
  const editId = wert("editId");
  const neueBilder = await bilderLesen(document.getElementById("bilder"));
  const preis = leistungen.reduce((s,l)=>s+l.preis,0);

  const daten = {
    id: editId || Date.now(),
    kunde: wert("kunde"),
    telefon: wert("telefon"),
    email: wert("email"),
    adresse: wert("kundenAdresse"),
    fahrrad: wert("fahrrad"),
    seriennummer: wert("seriennummer"),
    leistungen,
    leistung: leistungen.map(l=>l.name).join(", "),
    preis,
    notiz: wert("notiz"),
    material: wert("material"),
    materialpreis: Number(wert("materialpreis") || 0),
    status: wert("status"),
    zahlungsart: wert("zahlungsart"),
    fertigTermin: wert("fertigTermin"),
    erinnerung: wert("erinnerung"),
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
      daten.rechnungsnummer = auftraege[i].rechnungsnummer || "";
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
  ["editId","kunde","telefon","email","kundenAdresse","fahrrad","seriennummer","notiz","material","materialpreis","fertigTermin","erinnerung"].forEach(id=>{
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
  document.getElementById("kundenAdresse").value = a.adresse || "";
  document.getElementById("fahrrad").value = a.fahrrad || "";
  document.getElementById("seriennummer").value = a.seriennummer || "";
  document.getElementById("notiz").value = a.notiz || "";
  document.getElementById("material").value = a.material || "";
  document.getElementById("materialpreis").value = a.materialpreis || 0;
  document.getElementById("status").value = a.status || "Offen";
  document.getElementById("zahlungsart").value = a.zahlungsart || "Offen";
  document.getElementById("fertigTermin").value = a.fertigTermin || "";
  document.getElementById("erinnerung").value = a.erinnerung || "";

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

function auftragStatus(id,status){
  const a = auftraege.find(x => String(x.id) === String(id));
  if(!a) return;
  a.status = status;
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
        <p><b>Adresse:</b><br>${(a.adresse || "-").replaceAll("\n","<br>")}</p>
        <p><b>Leistungen:</b> ${a.leistung || "-"}</p>
        <p><b>Material:</b><br>${(a.material || "-").replaceAll("\n","<br>")}</p>
        <p><b>Status:</b> ${a.status}</p>
        <p><b>Zahlung:</b> ${a.zahlungsart || "Offen"}</p>
        <p><b>Fertigstellung:</b> ${a.fertigTermin || "-"}</p>
        <p><b>Erinnerung:</b> ${a.erinnerung || "-"}</p>
        <p><b>Gesamt:</b> ${gesamt.toFixed(2)} €</p>
        <div>${(a.bilder||[]).map(b=>`<img src="${b}">`).join("")}</div>
        <button onclick="auftragStatus('${a.id}','In Arbeit')">In Arbeit</button>
        <button onclick="auftragStatus('${a.id}','Fertig')">Fertig</button>
        <button onclick="auftragStatus('${a.id}','Abgeholt')">Abgeholt</button>
        <button onclick="auftragStatus('${a.id}','Bezahlt')">Bezahlt</button>
        <button onclick="auftragBearbeiten('${a.id}')">Bearbeiten</button>
        <button onclick="rechnungErstellen('${a.id}')">Rechnung</button>
        <button onclick="auftragLoeschen('${a.id}')">Löschen</button>
      </div>
    `;
  }).join("");
}

function leistungSpeichern(){
  const name = wert("leistungName").trim();
  const zeit = Number(wert("leistungZeit") || 0);
  const stundensatz = Number(wert("leistungStundensatz") || einstellungen.firmaStundensatz || 45);
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
  const name = wert("neueKategorie").trim();
  if(!name){ alert("Bitte Kategorie eintragen."); return; }
  if(lagerKategorien.includes(name)){ alert("Kategorie gibt es schon."); return; }
  lagerKategorien.push(name);
  document.getElementById("neueKategorie").value = "";
  speichernDaten();
  allesAktualisieren();
}

function lagerSpeichern(){
  const ek = Number(wert("lagerEk") || 0);
  const aufschlag = Number(wert("lagerAufschlag") || 0);
  const daten = {
    id: wert("lagerEditId") || Date.now(),
    name: wert("lagerName"),
    kategorie: wert("lagerKategorie"),
    lieferant: wert("lagerLieferant"),
    bestand: Number(wert("lagerBestand") || 0),
    minimum: Number(wert("lagerMinimum") || 0),
    ek,
    vk: ek + (ek * aufschlag / 100),
    aufschlag
  };

  if(!daten.name){ alert("Bitte Artikelname eintragen."); return; }

  const i = lager.findIndex(t => String(t.id) === String(daten.id));
  if(i >= 0) lager[i] = daten;
  else lager.push(daten);

  ["lagerEditId","lagerName","lagerLieferant","lagerBestand","lagerEk"].forEach(id=>{
    const el = document.getElementById(id);
    if(el) el.value="";
  });

  speichernDaten();
  allesAktualisieren();
}

function lagerBearbeiten(id){
  const t = lager.find(x => String(x.id) === String(id));
  if(!t) return;

  document.getElementById("lagerEditId").value = t.id;
  document.getElementById("lagerName").value = t.name || "";
  document.getElementById("lagerKategorie").value = t.kategorie || "";
  document.getElementById("lagerLieferant").value = t.lieferant || "";
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

function lagerBestandAendern(id,wert){
  const t = lager.find(x => String(x.id) === String(id));
  if(!t) return;
  t.bestand = Number(t.bestand || 0) + wert;
  if(t.bestand < 0) t.bestand = 0;
  speichernDaten();
  allesAktualisieren();
}

function lagerAnzeigen(){
  const liste = document.getElementById("lagerListe");
  if(!liste) return;
  liste.innerHTML = lager.map(t=>{
    const warnung = Number(t.bestand||0) <= Number(t.minimum||0);
    return `
      <div class="auftrag" style="${warnung ? 'border:2px solid red' : ''}">
        <b>${t.name}</b><br>
        Kategorie: ${t.kategorie || "-"}<br>
        Lieferant: ${t.lieferant || "-"}<br>
        Bestand: ${t.bestand}<br>
        Mindestbestand: ${t.minimum || 0}<br>
        EK: ${Number(t.ek||0).toFixed(2)} € · VK: ${Number(t.vk||0).toFixed(2)} €<br>
        ${warnung ? "<b>🔴 Nachbestellen</b><br>" : ""}
        <button onclick="lagerBestandAendern('${t.id}',1)">+ Bestand</button>
        <button onclick="lagerBestandAendern('${t.id}',-1)">- Bestand</button>
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
  const id = wert("auftragLagerArtikel");
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
  const name = wert("weArtikel");
  const menge = Number(wert("weMenge") || 1);
  const ek = Number(wert("weEk") || 0);
  const aufschlag = Number(wert("weAufschlag") || 0);
  const vk = ek + (ek * aufschlag / 100);
  const pdf = await dateiLesen(document.getElementById("wePdf"));

  if(!name){ alert("Bitte Artikel eintragen."); return; }

  const teil = lager.find(t => t.name && t.name.toLowerCase() === name.toLowerCase());
  if(teil){
    teil.bestand = Number(teil.bestand||0) + menge;
    teil.ek = ek;
    teil.vk = vk;
    teil.aufschlag = aufschlag;
  } else {
    lager.push({id:Date.now(), name, kategorie:"Wareneingang", bestand:menge, minimum:0, ek, vk, aufschlag});
  }

  wareneingaenge.push({
    id:Date.now()+Math.random(),
    lieferant:wert("weLieferant"),
    nummer:wert("weNummer"),
    artikel:name,
    menge,
    ek,
    vk,
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
    kunde:wert("bestellKunde"),
    auftrag:wert("bestellAuftrag"),
    teil:wert("bestellTeil"),
    status:wert("bestellStatus")
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
    datum:wert("terminDatum"),
    zeit:wert("terminZeit"),
    text:wert("terminText")
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
    auftragId:wert("belegAuftrag"),
    lieferant:wert("belegLieferant"),
    nummer:wert("belegNummer"),
    betrag:Number(wert("belegBetrag") || 0),
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
    const fahrraeder = [...new Set(kunden[name].map(a=>a.fahrrad))];

    return `
      <div class="auftrag">
        <h3>${name}</h3>
        Adresse:<br>${(kunden[name][0].adresse || "-").replaceAll("\n","<br>")}<br><br>
        Fahrräder: ${fahrraeder.join(", ")}<br>
        Aufträge: ${kunden[name].length}<br>
        Gesamtumsatz: ${summe.toFixed(2)} €<br>
        ${kunden[name].map(a=>`
          <div class="auftrag">
            ${a.datum} · ${a.fahrrad} · ${a.leistung} · ${a.status}
          </div>
        `).join("")}
      </div>
    `;
  }).join("");
}

async function logoLesen(){
  const input = document.getElementById("firmaLogo");
  if(!input || !input.files[0]) return einstellungen.logo || "";
  const datei = input.files[0];
  return await new Promise(resolve=>{
    const r = new FileReader();
    r.onload = e => resolve(e.target.result);
    r.readAsDataURL(datei);
  });
}

async function einstellungenSpeichern(){
  einstellungen = {
    firmaName:wert("firmaName"),
    firmaAdresse:wert("firmaAdresse"),
    firmaTelefon:wert("firmaTelefon"),
    firmaEmail:wert("firmaEmail"),
    firmaSteuer:wert("firmaSteuer"),
    firmaMwst:Number(wert("firmaMwst") || 0),
    firmaStundensatz:Number(wert("firmaStundensatz") || 45),
    logo: await logoLesen()
  };
  speichernDaten();
  alert("Einstellungen gespeichert.");
}

function einstellungenLaden(){
  Object.keys(einstellungen).forEach(k=>{
    const el = document.getElementById(k);
    if(el && k !== "logo") el.value = einstellungen[k];
  });
}

function rechnungsNummer(a){
  if(!a.rechnungsnummer){
    const jahr = new Date().getFullYear();
    const nr = Number(localStorage.getItem("rechnungNr") || 1);
    a.rechnungsnummer = `${jahr}-${String(nr).padStart(4,"0")}`;
    localStorage.setItem("rechnungNr", nr + 1);
    speichernDaten();
  }
  return a.rechnungsnummer;
}

function rechnungErstellen(id){
  const a = auftraege.find(x => String(x.id) === String(id));
  if(!a) return;

  const nr = rechnungsNummer(a);
  const netto = Number(a.preis||0)+Number(a.materialpreis||0);
  const mwstSatz = Number(einstellungen.firmaMwst || 0);
  const mwst = netto * mwstSatz / 100;
  const brutto = netto + mwst;

  document.getElementById("rechnungInhalt").innerHTML = `
    <div style="padding:20px">
      ${einstellungen.logo ? `<img src="${einstellungen.logo}" style="max-width:160px">` : ""}
      <h1>${einstellungen.firmaName || "Fahrrad Werkstatt"}</h1>
      <p>${(einstellungen.firmaAdresse || "").replaceAll("\n","<br>")}</p>
      <p>${einstellungen.firmaTelefon || ""} · ${einstellungen.firmaEmail || ""}</p>
      <p>${einstellungen.firmaSteuer || ""}</p>
      <hr>

      <h2>Rechnung ${nr}</h2>
      <p><b>Datum:</b> ${a.datum}</p>
      <p><b>Zahlungsstatus:</b> ${a.zahlungsart || "Offen"}</p>

      <h3>Kunde</h3>
      <p>${a.kunde}<br>${(a.adresse || "").replaceAll("\n","<br>")}<br>${a.email || ""}</p>

      <h3>Fahrrad</h3>
      <p>${a.fahrrad}<br>Seriennummer: ${a.seriennummer || "-"}</p>

      <table width="100%" border="1" cellspacing="0" cellpadding="6">
        <tr><th align="left">Position</th><th align="right">Preis</th></tr>
        ${(a.leistungen || []).map(l=>`
          <tr><td>${l.name}</td><td align="right">${Number(l.preis||0).toFixed(2)} €</td></tr>
        `).join("")}
        <tr><td>${(a.material || "Material").replaceAll("\n","<br>")}</td><td align="right">${Number(a.materialpreis||0).toFixed(2)} €</td></tr>
      </table>

      <h3>Netto: ${netto.toFixed(2)} €</h3>
      <p>MwSt. ${mwstSatz}%: ${mwst.toFixed(2)} €</p>
      <h2>Gesamt: ${brutto.toFixed(2)} €</h2>
      <br><br>_________________________<br>Unterschrift
    </div>
  `;

  zeigeTab("rechnung");
}

function dashboardAnzeigen(){
  const heute = new Date().toLocaleDateString();
  const monat = new Date().getMonth();
  const jahr = new Date().getFullYear();

  const tagesumsatz = auftraege
    .filter(a => a.datum === heute)
    .reduce((s,a)=>s+Number(a.preis||0)+Number(a.materialpreis||0),0);

  const monatsumsatz = auftraege.reduce((s,a)=>{
    const teile = (a.datum || "").split(".");
    if(teile.length < 3) return s;
    const d = new Date(teile[2], teile[1]-1, teile[0]);
    return d.getMonth() === monat && d.getFullYear() === jahr
      ? s + Number(a.preis||0)+Number(a.materialpreis||0)
      : s;
  },0);

  const offene = auftraege.filter(a => !["Bezahlt","Storniert"].includes(a.status)).length;
  const lagerwarnungen = lager.filter(t=>Number(t.bestand||0)<=Number(t.minimum||0)).length;
  const offeneBestellungen = bestellungen.filter(b=>b.status !== "Eingebaut").length;
  const offeneRechnungen = auftraege.filter(a=>a.zahlungsart === "Offen" && a.status !== "Storniert").length;

  document.getElementById("dashboardInhalt").innerHTML = `
    <p><b>Tagesumsatz:</b> ${tagesumsatz.toFixed(2)} €</p>
    <p><b>Monatsumsatz:</b> ${monatsumsatz.toFixed(2)} €</p>
    <p><b>Offene Aufträge:</b> ${offene}</p>
    <p><b>Offene Rechnungen:</b> ${offeneRechnungen}</p>
    <p><b>Lagerwarnungen:</b> ${lagerwarnungen}</p>
    <p><b>Offene Bestellungen:</b> ${offeneBestellungen}</p>
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
    auftraege=d.auftraege||[];
    lager=d.lager||[];
    bestellungen=d.bestellungen||[];
    termine=d.termine||[];
    belege=d.belege||[];
    wareneingaenge=d.wareneingaenge||[];
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
}

window.onload = function(){
  zeigeTab("dashboard");
  allesAktualisieren();
};
