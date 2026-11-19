// ==========================================================
//  My Score — logique de l’application
// ==========================================================
import {
  chargerLocal, sauverLocal, valider, borne, jourLocal,
  normaliserCode, afficherCode, Nuage, nuageConfigure
} from "./store.js";

const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

let etat = chargerLocal();
const nuage = new Nuage();
const reduit = matchMedia("(prefers-reduced-motion: reduce)").matches;

const ui = {
  scene: $("#scene"), coeurG: $("#coeurG"), coeurD: $("#coeurD"),
  message: $("#message"), commun: $("#commun"), statut: $("#statut"),
  curseurs: { a: $("#scoreA"), b: $("#scoreB") },
  chiffres: { a: $("#chiffreA"), b: $("#chiffreB") },
  blocs: { a: $("#blocA"), b: $("#blocB") },
  toast: $("#toast")
};

let connecte = false;
let enMatch = false;
let dernierTexte = "";
let periode = 30;
const derniereSaisie = { a: 0, b: 0 };

/* ==========================================================
   Textes
   ========================================================== */
const PALIERS = [
  [9, "Même pas une étincelle."],
  [24, "Un petit coup d’œil, rien de plus."],
  [39, "Ça commence à intriguer."],
  [54, "On y pense un peu trop souvent."],
  [69, "Ça devient sérieux, là."],
  [84, "Ça craque des deux côtés, avouez."],
  [100, "Complètement accros."]
];
const scoreCommun = (a, b) => Math.round(Math.sqrt(a * b));
const estMatch = (a, b) => a >= 90 && b >= 90;

function texteGlobal(a, b) {
  if (estMatch(a, b)) return "Perdu(e)s d’amour tous les deux. C’est un match !";
  if (Math.abs(a - b) >= 40) return "Les deux cœurs ne battent pas au même rythme.";
  const moy = (a + b) / 2;
  return (PALIERS.find(([max]) => moy <= max) || PALIERS.at(-1))[1];
}

/* ==========================================================
   Petits outils d’interface
   ========================================================== */
let minuterieToast;
function toast(texte) {
  ui.toast.textContent = texte;
  ui.toast.classList.add("visible");
  clearTimeout(minuterieToast);
  minuterieToast = setTimeout(() => ui.toast.classList.remove("visible"), 2600);
}

const LIBELLES_STATUT = {
  local: "Sur cet appareil",
  connexion: "Connexion…",
  sync: "Synchronisé",
  envoi: "Enregistrement…",
  horsligne: "Hors ligne",
  erreur: "Erreur de synchro"
};
function statut(e) {
  ui.statut.dataset.etat = e;
  ui.statut.querySelector(".statut-texte").textContent = LIBELLES_STATUT[e];
}

function relancer(el, classe) {
  el.classList.remove(classe);
  void el.offsetWidth;
  el.classList.add(classe);
}

async function copier(texte) {
  try { await navigator.clipboard.writeText(texte); return true; } catch (_) { return false; }
}

/* ==========================================================
   Rendu : scores et cœurs
   ========================================================== */
function remplir(idRempl, idVague, n) {
  const niveau = 90 - (n / 100) * 90;
  document.getElementById(idRempl).setAttribute("y", niveau);
  document.getElementById(idVague).setAttribute("y", Math.max(niveau - 4, -4));
}

function rythme(coeur, n) {
  const t = n / 100;
  coeur.style.setProperty("--duree", (2.4 - 1.85 * t).toFixed(2) + "s");
  coeur.style.setProperty("--amp", (0.02 + 0.09 * t).toFixed(3));
}

function rendreScores(cleModifiee) {
  const { a, b } = etat.scores;
  const t = (a + b) / 200;

  for (const k of ["a", "b"]) {
    const v = etat.scores[k];
    if (document.activeElement !== ui.curseurs[k] || k !== cleModifiee) ui.curseurs[k].value = v;
    ui.chiffres[k].textContent = v;
    ui.curseurs[k].style.setProperty("--p", v);
    ui.curseurs[k].setAttribute("aria-valuetext", v + " sur 100");
  }
  if (cleModifiee) relancer(ui.chiffres[cleModifiee], "saute");

  ui.commun.textContent = scoreCommun(a, b);

  const texte = texteGlobal(a, b);
  if (texte !== dernierTexte) {
    ui.message.textContent = texte;
    relancer(ui.message, "change");
    dernierTexte = texte;
  }

  remplir("remplG", "vagueG", a);
  remplir("remplD", "vagueD", b);
  rythme(ui.coeurG, a);
  rythme(ui.coeurD, b);
  ui.coeurG.style.setProperty("--dx", -(80 - 62 * t) + "px");
  ui.coeurD.style.setProperty("--dx", 80 - 62 * t + "px");
  ui.coeurG.style.setProperty("--rot", -6 + 20 * t + "deg");
  ui.coeurD.style.setProperty("--rot", 6 - 20 * t + "deg");

  const match = estMatch(a, b);
  ui.scene.classList.toggle("match", match);
  if (match && !enMatch) explosion();
  enMatch = match;
}

const COULEURS = ["#ff3d6e", "#ffa183", "#ffd6e0", "#ff7aa0"];
function coeurVolant(depart) {
  const el = document.createElement("span");
  el.className = "flottant";
  el.textContent = "♥";
  Object.assign(el.style, depart);
  ui.scene.appendChild(el);
  return el;
}

function flotter() {
  const moy = (etat.scores.a + etat.scores.b) / 2;
  if (!reduit && moy >= 10 && !document.hidden && !$("#vue-scores").hidden) {
    const el = coeurVolant({
      left: 50 + (Math.random() * 40 - 20) + "%",
      color: COULEURS[Math.floor(Math.random() * COULEURS.length)],
      fontSize: 0.8 + Math.random() * 1.1 + moy / 100 + "rem"
    });
    const dx = Math.random() * 90 - 45;
    const haut = 120 + Math.random() * 90;
    el.animate([
      { transform: "translate(0,0) scale(.6)", opacity: 0 },
      { transform: `translate(${dx / 2}px,${-haut / 2}px) scale(1)`, opacity: 1, offset: 0.35 },
      { transform: `translate(${dx}px,${-haut}px) scale(1.1)`, opacity: 0 }
    ], { duration: 1800 + Math.random() * 900, easing: "ease-out" }).onfinish = () => el.remove();
  }
  setTimeout(flotter, 950 - 800 * (moy / 100));
}

function explosion() {
  if (reduit) return;
  for (let i = 0; i < 28; i++) {
    const el = coeurVolant({ left: "50%", bottom: "46%", color: COULEURS[i % 4], fontSize: 1 + Math.random() * 1.4 + "rem" });
    const ang = (Math.PI * 2 * i) / 28 + Math.random() * 0.3;
    const d = 90 + Math.random() * 110;
    el.animate([
      { transform: "translate(0,0) scale(.4)", opacity: 1 },
      { transform: `translate(${Math.cos(ang) * d}px,${Math.sin(ang) * d}px) scale(1.2) rotate(${Math.random() * 120 - 60}deg)`, opacity: 0 }
    ], { duration: 1100 + Math.random() * 500, easing: "cubic-bezier(.1,.7,.3,1)" }).onfinish = () => el.remove();
  }
  navigator.vibrate?.([30, 40, 30]);
}

/* ==========================================================
   Rendu : noms, « qui es-tu », synchro
   ========================================================== */
function rendreNoms() {
  $$("[data-nom]").forEach((el) => { el.textContent = etat.noms[el.dataset.nom]; });
  if (document.activeElement !== $("#nomA")) $("#nomA").value = etat.noms.a;
  if (document.activeElement !== $("#nomB")) $("#nomB").value = etat.noms.b;
}

function rendreMoi() {
  $$("#choixMoi button").forEach((b) => b.setAttribute("aria-checked", String(b.dataset.moi === etat.moi)));
  const partage = Boolean(etat.espace) && etat.moi !== "deux";
  for (const k of ["a", "b"]) {
    const verrou = partage && etat.moi !== k;
    ui.curseurs[k].disabled = verrou;
    ui.blocs[k].classList.toggle("verrouille", verrou);
    ui.blocs[k].querySelector(".verrou").hidden = !verrou;
    ui.blocs[k].querySelector(".moi").hidden = etat.moi !== k;
  }
}

function rendreSync() {
  $("#syncIndispo").hidden = nuageConfigure;
  $("#syncHors").hidden = !nuageConfigure || Boolean(etat.espace);
  $("#syncDans").hidden = !nuageConfigure || !etat.espace;
  $("#codeEspace").textContent = afficherCode(etat.espace);
}

/* ==========================================================
   Rendu : historique
   ========================================================== */
const fmtCourt = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" });
const fmtLong = new Intl.DateTimeFormat("fr-FR", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
const enDate = (j) => new Date(j + "T12:00:00");

function entreesPeriode() {
  const toutes = Object.entries(etat.historique).sort(([x], [y]) => x.localeCompare(y));
  if (!periode) return toutes;
  const limite = new Date();
  limite.setDate(limite.getDate() - (periode - 1));
  const min = jourLocal(limite);
  return toutes.filter(([j]) => j >= min);
}

function rendreGraphique(entrees) {
  const zone = $("#graphique");
  if (!entrees.length) {
    zone.innerHTML = '<p class="vide">Pas encore de score sur cette période.<br>Bougez vos curseurs, chaque jour sera gardé ici.</p>';
    return;
  }
  const L = 320, H = 170, g = 28, d = 8, h = 10, bas = 22;
  const lx = L - g - d, ly = H - h - bas;
  const n = entrees.length;
  const x = (i) => g + (n === 1 ? lx / 2 : (i / (n - 1)) * lx);
  const y = (v) => h + ly - (v / 100) * ly;

  let svg = `<svg viewBox="0 0 ${L} ${H}" role="img" aria-label="Évolution des scores">
    <defs>
      <linearGradient id="aireA" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff3d6e" stop-opacity=".35"/><stop offset="1" stop-color="#ff3d6e" stop-opacity="0"/></linearGradient>
      <linearGradient id="aireB" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffa183" stop-opacity=".3"/><stop offset="1" stop-color="#ffa183" stop-opacity="0"/></linearGradient>
    </defs>`;
  for (const v of [0, 50, 100]) {
    svg += `<line class="grille" x1="${g}" x2="${L - d}" y1="${y(v)}" y2="${y(v)}"/><text class="axe" x="${g - 6}" y="${y(v) + 3}" text-anchor="end">${v}</text>`;
  }
  const idx = n === 1 ? [0] : [...new Set([0, Math.floor((n - 1) / 2), n - 1])];
  for (const i of idx) {
    svg += `<text class="axe" x="${x(i)}" y="${H - 4}" text-anchor="middle">${fmtCourt.format(enDate(entrees[i][0]))}</text>`;
  }
  for (const k of ["b", "a"]) {
    const pts = entrees.map(([, v], i) => [x(i), y(v[k])]);
    if (n > 1) {
      const chemin = pts.map(([px, py], i) => (i ? "L" : "M") + px.toFixed(1) + " " + py.toFixed(1)).join("");
      svg += `<path class="aire l${k}" d="${chemin}L${pts.at(-1)[0]} ${y(0)}L${pts[0][0]} ${y(0)}Z"/>`;
      svg += `<path class="ligne l${k}" d="${chemin}"/>`;
    }
    if (n <= 31) pts.forEach(([px, py]) => { svg += `<circle class="pt l${k}" cx="${px}" cy="${py}" r="${n > 14 ? 2.5 : 3.5}"/>`; });
  }
  zone.innerHTML = svg + "</svg>";
}

function rendreHistorique() {
  const toutes = Object.entries(etat.historique);
  $("#statJours").textContent = toutes.length;
  $("#statMoy").textContent = toutes.length
    ? Math.round(toutes.reduce((s, [, v]) => s + scoreCommun(v.a, v.b), 0) / toutes.length)
    : "–";
  $("#statMatch").textContent = toutes.filter(([, v]) => estMatch(v.a, v.b)).length;

  rendreGraphique(entreesPeriode());

  const journal = $("#journal");
  journal.textContent = "";
  const tri = toutes.sort(([x], [y]) => y.localeCompare(x));
  if (!tri.length) {
    journal.innerHTML = '<li class="vide" style="display:block">Rien pour l’instant.</li>';
    return;
  }
  for (const [jour, v] of tri) {
    const li = document.createElement("li");
    li.innerHTML = `<span class="date"></span><span class="va"></span><span class="vb"></span><span class="vc"></span>`;
    li.children[0].textContent = jour === jourLocal() ? "Aujourd’hui" : fmtLong.format(enDate(jour));
    li.children[1].textContent = v.a;
    li.children[1].title = etat.noms.a;
    li.children[2].textContent = v.b;
    li.children[2].title = etat.noms.b;
    li.children[3].textContent = scoreCommun(v.a, v.b);
    li.children[3].classList.toggle("match", estMatch(v.a, v.b));
    journal.appendChild(li);
  }
}

function toutRendre() {
  rendreNoms();
  rendreMoi();
  rendreSync();
  rendreScores();
  if (!$("#vue-historique").hidden) rendreHistorique();
}

/* ==========================================================
   Synchronisation
   ========================================================== */
const enAttente = new Set();
let minuterieEnvoi = null;

function planifierEnvoi(k) {
  if (!etat.espace || !nuage.code) return;
  enAttente.add(k);
  if (minuterieEnvoi) return;
  minuterieEnvoi = setTimeout(() => {
    const cles = [...enAttente];
    enAttente.clear();
    minuterieEnvoi = null;
    statut(connecte ? "envoi" : "horsligne");
    nuage.envoyerScores(cles, etat.scores)
      .then(() => statut(connecte ? "sync" : "horsligne"))
      .catch((e) => { console.error(e); statut("erreur"); });
  }, 300);
}

function recevoir(d) {
  if (!d) {
    toast("Cet espace n’existe plus.");
    quitterEspace(true);
    return;
  }
  const v = valider({ ...d, moi: etat.moi, espace: etat.espace });
  if (document.activeElement !== $("#nomA") && document.activeElement !== $("#nomB")) etat.noms = v.noms;
  const maintenant = Date.now();
  for (const k of ["a", "b"]) {
    // On ne remplace pas un curseur que l’on est en train de bouger
    if (maintenant - derniereSaisie[k] > 1500) etat.scores[k] = v.scores[k];
  }
  etat.historique = v.historique;
  sauverLocal(etat);
  toutRendre();
}

async function brancherEspace(code) {
  statut("connexion");
  try {
    await nuage.ecouter(code, {
      donnees: recevoir,
      connexion: (ok) => { connecte = ok; if (!minuterieEnvoi) statut(ok ? "sync" : "horsligne"); },
      erreur: (e) => { console.error(e); statut("erreur"); toast("Accès à l’espace refusé."); }
    });
  } catch (e) {
    statut("erreur");
    toast("Impossible de joindre Firebase.");
  }
}

async function creerEspace() {
  const bouton = $("#creerEspace");
  bouton.disabled = true;
  statut("connexion");
  try {
    etat.historique[jourLocal()] ??= { ...etat.scores };
    const code = await nuage.creer(etat);
    etat.espace = code;
    if (etat.moi === "deux") etat.moi = "b";
    sauverLocal(etat);
    await brancherEspace(code);
    toutRendre();
    toast("Espace créé ! Envoie le lien à l’autre.");
  } catch (e) {
    console.error(e);
    statut("erreur");
    toast("Création impossible. Vérifie la config Firebase.");
  } finally {
    bouton.disabled = false;
  }
}

async function rejoindreEspace(saisie) {
  const code = normaliserCode(saisie);
  if (!code) { toast("Code invalide (8 caractères)."); return false; }
  statut("connexion");
  try {
    if (!(await nuage.existe(code))) { toast("Aucun espace avec ce code."); statut("local"); return false; }
    etat.espace = code;
    if (etat.moi === "deux") etat.moi = "a";
    sauverLocal(etat);
    await brancherEspace(code);
    toutRendre();
    toast("Espace rejoint, vous êtes synchronisés.");
    return true;
  } catch (e) {
    console.error(e);
    statut("erreur");
    toast("Connexion impossible.");
    return false;
  }
}

function quitterEspace(silencieux) {
  nuage.arreter();
  etat.espace = null;
  sauverLocal(etat);
  statut("local");
  toutRendre();
  if (!silencieux) toast("Espace quitté. Les scores restent sur cet appareil.");
}

/* ==========================================================
   Événements
   ========================================================== */
for (const k of ["a", "b"]) {
  ui.curseurs[k].addEventListener("input", () => {
    etat.scores[k] = borne(ui.curseurs[k].value);
    etat.historique[jourLocal()] = { ...etat.scores };
    derniereSaisie[k] = Date.now();
    rendreScores(k);
    sauverLocal(etat);
    planifierEnvoi(k);
  });
}

// Onglets
function afficherVue(nom) {
  $$(".vue").forEach((v) => { v.hidden = v.id !== "vue-" + nom; v.classList.toggle("active", !v.hidden); });
  $$(".onglets button").forEach((b) => {
    const actif = b.dataset.vue === nom;
    b.classList.toggle("actif", actif);
    if (actif) b.setAttribute("aria-current", "page"); else b.removeAttribute("aria-current");
  });
  if (nom === "historique") rendreHistorique();
  scrollTo({ top: 0, behavior: reduit ? "auto" : "smooth" });
}
$$(".onglets button").forEach((b) => b.addEventListener("click", () => afficherVue(b.dataset.vue)));
ui.statut.addEventListener("click", () => afficherVue("reglages"));

// Période du graphique
$$("[data-periode]").forEach((b) => b.addEventListener("click", () => {
  periode = Number(b.dataset.periode);
  $$("[data-periode]").forEach((x) => x.classList.toggle("actif", x === b));
  rendreGraphique(entreesPeriode());
}));

// Partager
$("#partager").addEventListener("click", async () => {
  const { a, b } = etat.scores;
  const texte = `${etat.noms.a} : ${a}/100 · ${etat.noms.b} : ${b}/100 — score commun ${scoreCommun(a, b)}. ${texteGlobal(a, b)}`;
  if (navigator.share) {
    try { await navigator.share({ title: "My Score", text: texte }); return; }
    catch (e) { if (e.name === "AbortError") return; }
  }
  toast((await copier(texte)) ? "Scores copiés." : "Copie impossible sur cet appareil.");
});

// Qui es-tu
$$("#choixMoi button").forEach((b) => b.addEventListener("click", () => {
  etat.moi = b.dataset.moi;
  sauverLocal(etat);
  rendreMoi();
}));

// Prénoms
let minuterieNoms;
for (const [id, k] of [["#nomA", "a"], ["#nomB", "b"]]) {
  $(id).addEventListener("input", (e) => {
    const v = e.target.value.trim().slice(0, 20);
    if (!v) return;
    etat.noms[k] = v;
    sauverLocal(etat);
    $$(`[data-nom="${k}"]`).forEach((el) => { el.textContent = v; });
    clearTimeout(minuterieNoms);
    minuterieNoms = setTimeout(() => nuage.envoyerNoms(etat.noms).catch(() => statut("erreur")), 500);
  });
  $(id).addEventListener("blur", (e) => { e.target.value = etat.noms[k]; });
}

// Synchro
$("#creerEspace").addEventListener("click", creerEspace);
$("#formRejoindre").addEventListener("submit", async (e) => {
  e.preventDefault();
  if (await rejoindreEspace($("#codeRejoindre").value)) $("#codeRejoindre").value = "";
});
$("#codeRejoindre").addEventListener("input", (e) => {
  const c = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8);
  e.target.value = c.length > 4 ? c.slice(0, 4) + "-" + c.slice(4) : c;
});
$("#copierLien").addEventListener("click", async () => {
  const lien = location.origin + location.pathname + "?espace=" + etat.espace;
  if (navigator.share) {
    try { await navigator.share({ title: "Rejoins notre My Score", text: "Rejoins-moi sur My Score 💘", url: lien }); return; }
    catch (e) { if (e.name === "AbortError") return; }
  }
  toast((await copier(lien)) ? "Lien copié." : lien);
});
$("#quitterEspace").addEventListener("click", () => {
  if (confirm("Quitter l’espace partagé ? Vos scores restent sur cet appareil, et l’espace reste en ligne pour l’autre personne.")) quitterEspace();
});

// Sauvegarde de secours
$("#exporter").addEventListener("click", () => {
  const donnees = { app: "my-score", version: 3, exporteLe: new Date().toISOString(), noms: etat.noms, scores: etat.scores, historique: etat.historique };
  const url = URL.createObjectURL(new Blob([JSON.stringify(donnees, null, 2)], { type: "application/json" }));
  const lien = Object.assign(document.createElement("a"), { href: url, download: `my-score-${jourLocal()}.json` });
  document.body.appendChild(lien);
  lien.click();
  lien.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  toast("Sauvegarde téléchargée.");
});
$("#importer").addEventListener("change", async (e) => {
  const fichier = e.target.files[0];
  e.target.value = "";
  if (!fichier) return;
  try {
    const brut = JSON.parse(await fichier.text());
    if (brut.app !== "my-score") throw new Error("format");
    const v = valider(brut);
    etat = { ...v, historique: { ...etat.historique, ...v.historique }, moi: etat.moi, espace: etat.espace };
    sauverLocal(etat);
    if (etat.espace) await nuage.envoyerTout(etat);
    toutRendre();
    toast("Sauvegarde importée.");
  } catch (_) {
    toast("Ce fichier n’est pas une sauvegarde My Score.");
  }
});
$("#reinitialiser").addEventListener("click", async () => {
  const msg = etat.espace
    ? "Remettre les deux scores à 0 et effacer tout l’historique, pour vous deux ?"
    : "Remettre les scores à 0 et effacer l’historique de cet appareil ?";
  if (!confirm(msg)) return;
  etat.scores = { a: 0, b: 0 };
  etat.historique = {};
  sauverLocal(etat);
  if (etat.espace) {
    try { await nuage.viderHistorique(); await nuage.envoyerScores(["a", "b"], etat.scores); } catch (_) { statut("erreur"); }
    etat.historique = {};
  }
  toutRendre();
  toast("Tout est remis à zéro.");
});

/* ==========================================================
   Démarrage
   ========================================================== */
toutRendre();
flotter();
statut("local");

(async () => {
  const invitation = normaliserCode(new URLSearchParams(location.search).get("espace"));
  if (invitation) history.replaceState(null, "", location.pathname);

  if (!nuageConfigure) {
    if (invitation) toast("La synchro n’est pas configurée sur ce site.");
    return;
  }
  if (invitation && invitation !== etat.espace) {
    if (!etat.espace || confirm("Rejoindre l’espace " + afficherCode(invitation) + " ? Tu quitteras l’espace actuel.")) {
      if (await rejoindreEspace(invitation)) { afficherVue("reglages"); return; }
    }
  }
  if (etat.espace) brancherEspace(etat.espace);
})();

if ("serviceWorker" in navigator && location.protocol === "https:") {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}
