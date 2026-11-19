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
  apiKey: "",
  authDomain: "",
  databaseURL: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: ""
};
