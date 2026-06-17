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
