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

function zeigeTab(id){
  document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
  const el = document.getElementById(id);
  if(el) el.classList.add("active");
}

function wert(id){ return document.getElementById(id)?.value || ""; }

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
  const aufschlag
