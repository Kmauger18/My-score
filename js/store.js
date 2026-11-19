// ==========================================================
//  Sauvegarde : locale (toujours) + Firebase Realtime Database (si configuré)
// ==========================================================
import { firebaseConfig } from "./firebase-config.js";

const CLE = "my-score:v3";
const ANCIENNE_CLE = "my-score:v2";
const SDK = "https://www.gstatic.com/firebasejs/10.14.1/";
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sans 0/O, 1/I

export const DEFAUT = {
  noms: { a: "Calypso", b: "Kéliann" },
  scores: { a: 0, b: 0 },
  historique: {},       // { "2026-11-19": { a: 72, b: 80 } } — dernier score de chaque jour (graphique)
  journal: {},          // { id: { qui: "a", de: 45, a: 72, t: 1763561520000 } } — chaque changement
  moi: "deux",          // "a" | "b" | "deux"
  espace: null          // code de l’espace partagé (8 caractères) ou null
};

/* ---------- Outils ---------- */
export const borne = (n) => Math.max(0, Math.min(100, Math.round(Number(n) || 0)));

export function jourLocal(d = new Date()) {
  const p = (x) => String(x).padStart(2, "0");
  return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate());
}

export function genererCode() {
  const octets = crypto.getRandomValues(new Uint8Array(8));
  return Array.from(octets, (o) => ALPHABET[o % ALPHABET.length]).join("");
}

export function normaliserCode(saisie) {
  const c = String(saisie || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  return c.length === 8 && [...c].every((x) => ALPHABET.includes(x)) ? c : null;
}

export const afficherCode = (c) => (c ? c.slice(0, 4) + "-" + c.slice(4) : "");

function nettoyerNom(n, defaut) {
  const s = String(n ?? "").trim().slice(0, 20);
  return s || defaut;
}

function nettoyerHistorique(h) {
  const sortie = {};
  if (h && typeof h === "object") {
    for (const [jour, v] of Object.entries(h)) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(jour) && v && typeof v === "object") {
        sortie[jour] = { a: borne(v.a), b: borne(v.b) };
      }
    }
  }
  return sortie;
}

const MAX_JOURNAL = 3000;
export const nouvelId = () => Date.now().toString(36) + "-" + Array.from(crypto.getRandomValues(new Uint8Array(4)), (o) => (o % 36).toString(36)).join("");

export function nettoyerJournal(j) {
  const entrees = [];
  if (j && typeof j === "object") {
    for (const [id, v] of Object.entries(j)) {
      if (/^[a-z0-9-]{4,30}$/.test(id) && v && (v.qui === "a" || v.qui === "b") && Number.isFinite(v.t)) {
        entrees.push([id, { qui: v.qui, de: borne(v.de), a: borne(v.a), t: Math.round(v.t) }]);
      }
    }
  }
  entrees.sort((x, y) => x[1].t - y[1].t);
  return Object.fromEntries(entrees.slice(-MAX_JOURNAL));
}

export function valider(brut) {
  const e = structuredClone(DEFAUT);
  if (!brut || typeof brut !== "object") return e;
  e.noms.a = nettoyerNom(brut.noms?.a, DEFAUT.noms.a);
  e.noms.b = nettoyerNom(brut.noms?.b, DEFAUT.noms.b);
  e.scores.a = borne(brut.scores?.a);
  e.scores.b = borne(brut.scores?.b);
  e.historique = nettoyerHistorique(brut.historique);
  e.journal = nettoyerJournal(brut.journal);
  if (["a", "b", "deux"].includes(brut.moi)) e.moi = brut.moi;
  e.espace = normaliserCode(brut.espace);
  return e;
}

/* ---------- Local ---------- */
export function chargerLocal() {
  try {
    const v3 = localStorage.getItem(CLE);
    if (v3) return valider(JSON.parse(v3));
    // Migration depuis l’ancienne version (une seule paire de scores)
    const v2 = JSON.parse(localStorage.getItem(ANCIENNE_CLE));
    if (v2 && typeof v2.a === "number") {
      const e = valider({ scores: v2 });
      e.historique[jourLocal()] = { ...e.scores };
      return e;
    }
  } catch (_) { /* stockage indisponible ou corrompu */ }
  return structuredClone(DEFAUT);
}

export function sauverLocal(etat) {
  try { localStorage.setItem(CLE, JSON.stringify(etat)); } catch (_) {}
}

/* ---------- Firebase ---------- */
export const nuageConfigure = Boolean(firebaseConfig.apiKey && firebaseConfig.databaseURL);

export class Nuage {
  constructor() {
    this.pret = null;
    this.desabonner = [];
    this.code = null;
  }

  /** Charge le SDK et connecte l’utilisateur anonymement. */
  demarrer() {
    if (!nuageConfigure) return Promise.resolve(false);
    if (!this.pret) {
      this.pret = (async () => {
        const [app, auth, db] = await Promise.all([
          import(SDK + "firebase-app.js"),
          import(SDK + "firebase-auth.js"),
          import(SDK + "firebase-database.js")
        ]);
        this.fb = db;
        const appli = app.initializeApp(firebaseConfig);
        const a = auth.getAuth(appli);
        if (!a.currentUser) {
          await new Promise((ok) => { const u = auth.onAuthStateChanged(a, () => { u(); ok(); }); });
        }
        if (!a.currentUser) await auth.signInAnonymously(a);
        this.db = db.getDatabase(appli);
        return true;
      })().catch((err) => { console.error("[My Score] Firebase :", err); this.pret = null; throw err; });
    }
    return this.pret;
  }

  ref(chemin) { return this.fb.ref(this.db, "espaces/" + this.code + (chemin ? "/" + chemin : "")); }

  /** Crée un nouvel espace à partir de l’état local. */
  async creer(etat) {
    await this.demarrer();
    const code = genererCode();
    const r = this.fb.ref(this.db, "espaces/" + code);
    await this.fb.set(r, {
      creeLe: this.fb.serverTimestamp(),
      noms: etat.noms,
      scores: { ...etat.scores, maj: this.fb.serverTimestamp() },
      historique: etat.historique,
      journal: etat.journal
    });
    return code;
  }

  /** Vérifie qu’un espace existe. */
  async existe(code) {
    await this.demarrer();
    const snap = await this.fb.get(this.fb.ref(this.db, "espaces/" + code + "/noms"));
    return snap.exists();
  }

  /** S’abonne aux changements de l’espace. */
  async ecouter(code, { donnees, connexion, erreur }) {
    await this.demarrer();
    this.arreter();
    this.code = code;
    this.desabonner.push(
      this.fb.onValue(this.ref(), (snap) => donnees(snap.val()), (e) => erreur && erreur(e)),
      this.fb.onValue(this.fb.ref(this.db, ".info/connected"), (snap) => connexion(snap.val() === true))
    );
  }

  arreter() {
    this.desabonner.forEach((f) => f());
    this.desabonner = [];
    this.code = null;
  }

  /** Envoie un score modifié + l’entrée du jour dans l’historique. */
  envoyerScores(cles, scores) {
    if (!this.code) return Promise.resolve();
    const maj = { "scores/maj": this.fb.serverTimestamp() };
    cles.forEach((k) => { maj["scores/" + k] = scores[k]; });
    maj["historique/" + jourLocal()] = { a: scores.a, b: scores.b };
    return this.fb.update(this.ref(), maj);
  }

  /** Ajoute un changement au journal partagé. */
  envoyerChangement(id, evt) {
    if (!this.code) return Promise.resolve();
    return this.fb.set(this.ref("journal/" + id), evt);
  }

  envoyerNoms(noms) {
    if (!this.code) return Promise.resolve();
    return this.fb.update(this.ref("noms"), noms);
  }

  envoyerTout(etat) {
    if (!this.code) return Promise.resolve();
    const maj = {
      noms: etat.noms,
      "scores/a": etat.scores.a,
      "scores/b": etat.scores.b,
      "scores/maj": this.fb.serverTimestamp()
    };
    for (const [jour, v] of Object.entries(etat.historique)) maj["historique/" + jour] = v;
    for (const [id, v] of Object.entries(etat.journal)) maj["journal/" + id] = v;
    return this.fb.update(this.ref(), maj);
  }

  viderHistorique() {
    if (!this.code) return Promise.resolve();
    return this.fb.update(this.ref(), { historique: null, journal: null });
  }
}
