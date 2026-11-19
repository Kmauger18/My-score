// ==========================================================
//  Phrases personnalisées selon les curseurs
//  {A} / {B} : prénoms   {H} : celui qui craque le plus   {L} : l’autre
//  {a} / {b} : scores    {d} : écart
// ==========================================================

const P = {
  zero: [
    "Zéro partout. {A} et {B}, vous vous connaissez au moins ?",
    "Calme plat. Même pas un regard en coin.",
    "Encéphalogramme amoureux : complètement plat.",
    "Deux inconnus qui attendent le même bus."
  ],
  cent: [
    "100 / 100. {A} et {B}, c’est officiel : vous êtes insupportables de bonheur.",
    "Score parfait. On prévient la famille ou vous le faites ?",
    "Plus haut, ça n’existe pas. Vous avez cassé le compteur.",
    "Deux cœurs au maximum. Les violons sont en route."
  ],
  match: [
    "Perdu(e)s d’amour tous les deux. C’est un match !",
    "{A} à {a}, {B} à {b} : là, c’est du sérieux.",
    "Alerte guimauve : niveau critique atteint.",
    "Ça déborde de partout. Attention, ça colle.",
    "Vous êtes ce couple dont tout le monde parle."
  ],
  egal: [
    "{a} chacun. Synchronisés comme des montres suisses.",
    "Même score pile. Vous vous êtes concertés, avouez.",
    "Exactement {a} tous les deux. C’est presque louche.",
    "Égalité parfaite : personne ne pourra dire « c’est toi qui as commencé »."
  ],
  grosEcart: [
    "{H} craque à fond, {L} fait encore semblant de rien.",
    "{d} points d’écart… {L}, il va falloir rattraper.",
    "{H} a déjà choisi les prénoms des enfants. {L} hésite sur le resto.",
    "Les deux cœurs ne battent pas au même rythme.",
    "{H} est à {h}. {L}, réveille-toi !",
    "Un cœur au galop, l’autre au petit trot."
  ],
  ecart: [
    "{H} est un peu plus accro que {L}. Un peu.",
    "Avantage {H}. {L}, à toi de jouer.",
    "{H} mène de {d} points. Rien d’irrattrapable.",
    "{L} se laisse désirer, {H} craque déjà."
  ],
  t1: [ // 1–9
    "Même pas une étincelle.",
    "Une petite braise, quelque part. Peut-être.",
    "On a vu plus chaud dans un congélateur."
  ],
  t2: [ // 10–24
    "Un petit coup d’œil, rien de plus.",
    "{A} et {B} se croisent… et se recroisent.",
    "Ça sourit un peu plus que nécessaire.",
    "Rien de grave. Pour l’instant."
  ],
  t3: [ // 25–39
    "Ça commence à intriguer.",
    "On regarde le téléphone un peu plus souvent, non ?",
    "Les messages deviennent plus longs, bizarrement.",
    "Une petite curiosité qui pointe le bout de son nez."
  ],
  t4: [ // 40–54
    "On y pense un peu trop souvent.",
    "{A} et {B} : à mi-chemin du coup de foudre.",
    "Les papillons font leur échauffement.",
    "Ça devient difficile de faire comme si de rien n’était."
  ],
  t5: [ // 55–69
    "Ça devient sérieux, là.",
    "Les sourires niais sont de sortie.",
    "On parle de {A} et {B} au pluriel, maintenant.",
    "Les papillons ont pris l’abonnement à l’année."
  ],
  t6: [ // 70–84
    "Ça craque des deux côtés, avouez.",
    "{A} à {a}, {B} à {b} : ça sent le grand amour.",
    "Plus moyen de cacher ces yeux qui brillent.",
    "Les amis commencent à trouver ça mignon. Et un peu agaçant."
  ],
  t7: [ // 85–100 (sans match)
    "Complètement accros.",
    "{A} et {B}, vous êtes au bord de l’overdose de câlins.",
    "Encore un effort et c’est le match parfait !",
    "Le cœur de {L} n’attend qu’un petit coup de pouce."
  ]
};

function categorie(a, b) {
  const moy = (a + b) / 2;
  const ecart = Math.abs(a - b);
  if (a === 0 && b === 0) return "zero";
  if (a === 100 && b === 100) return "cent";
  if (a >= 90 && b >= 90) return "match";
  if (a === b && a >= 10) return "egal";
  if (ecart >= 40) return "grosEcart:" + (a > b ? "a" : "b");
  if (ecart >= 20) return "ecart:" + (a > b ? "a" : "b");
  const t = moy < 10 ? 1 : moy < 25 ? 2 : moy < 40 ? 3 : moy < 55 ? 4 : moy < 70 ? 5 : moy < 85 ? 6 : 7;
  return "t" + t;
}

let derniereCle = null;
let dernierIndex = -1;

/** Phrase pour l’état actuel : elle ne change que lorsque la situation change. */
export function phrase(a, b, noms) {
  const cle = categorie(a, b);
  const liste = P[cle.split(":")[0]];
  if (cle !== derniereCle) {
    let i = Math.floor(Math.random() * liste.length);
    if (liste.length > 1 && i === dernierIndex) i = (i + 1) % liste.length;
    dernierIndex = i;
    derniereCle = cle;
  }
  const hautA = a >= b;
  return liste[dernierIndex % liste.length]
    .replaceAll("{A}", noms.a).replaceAll("{B}", noms.b)
    .replaceAll("{H}", hautA ? noms.a : noms.b).replaceAll("{L}", hautA ? noms.b : noms.a)
    .replaceAll("{h}", Math.max(a, b))
    .replaceAll("{a}", a).replaceAll("{b}", b).replaceAll("{d}", Math.abs(a - b));
}

export const cleActuelle = () => derniereCle;
