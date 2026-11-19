// ==========================================================
//  Configuration Firebase de My Score
// ----------------------------------------------------------
//  1. Console Firebase → créer (ou réutiliser) un projet, offre Spark (gratuite)
//  2. Ajouter une application Web → copier l’objet firebaseConfig ci-dessous
//  3. Authentication → Méthodes de connexion → activer « Anonyme »
//  4. Realtime Database → créer la base (région europe-west1)
//     → onglet Règles → coller le contenu de database.rules.json → Publier
//  5. Authentication → Paramètres → Domaines autorisés → ajouter
//     kmauger18.github.io (ou ton domaine)
//
//  Tant que apiKey reste vide, l’appli fonctionne en mode local
//  (sauvegarde sur l’appareil uniquement).
//  Ces clés ne sont pas secrètes : c’est le fichier de règles qui protège les données.
// ==========================================================
export const firebaseConfig = {
  apiKey: "AIzaSyBNO5HHW0nv-C_FyyGEUH0FgY15xw7Rrd4",
  authDomain: "my-score-b2b95.firebaseapp.com",
  // Région Belgique (europe-west1). Si tu choisis une autre région, recopie l’URL affichée dans Realtime Database.
  databaseURL: "https://my-score-b2b95-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "my-score-b2b95",
  storageBucket: "my-score-b2b95.firebasestorage.app",
  messagingSenderId: "761575856869",
  appId: "1:761575856869:web:0291f3cc5085b32a9b520c"
};
