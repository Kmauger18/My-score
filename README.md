# My Score 💘

À quel point on craque l’un pour l’autre ? Deux curseurs de 0 à 100, synchronisés en direct entre vos deux téléphones, avec l’historique jour par jour.

## Fonctions
- **Scores** : un curseur chacun, cœurs animés, score commun, partage.
- **Historique** : graphique (7 j / 30 j / tout), statistiques, journal jour par jour.
- **Synchronisation** (Firebase Realtime Database) : un « espace » à deux avec un code (ex. `K7QM-4XPA`) ou un lien d’invitation. Chacun ne bouge que son curseur.
- **Sauvegarde** : toujours enregistré sur l’appareil, en ligne si l’espace est actif, et export / import d’un fichier JSON de secours.
- **Appli installable** (PWA) : « Ajouter à l’écran d’accueil », fonctionne hors ligne.

## Activer la sauvegarde en ligne (Firebase, offre gratuite Spark)
1. [Console Firebase](https://console.firebase.google.com) → créer un projet (ou réutiliser un existant).
2. *Ajouter une application* → **Web** → copier `firebaseConfig` dans `js/firebase-config.js`.
3. *Authentication* → *Méthodes de connexion* → activer **Anonyme**.
4. *Realtime Database* → *Créer une base de données* (région `europe-west1`, mode verrouillé).
5. Onglet **Règles** → coller le contenu de `database.rules.json` → **Publier**.
6. *Authentication* → *Paramètres* → *Domaines autorisés* → ajouter `kmauger18.github.io`.

Sans configuration, l’appli marche en mode local (sauvegarde sur l’appareil seulement).

## Structure
```
index.html              page unique (3 onglets)
css/style.css           design
js/app.js               interface et logique
js/store.js             sauvegarde locale + Firebase
js/firebase-config.js   clés Firebase (à remplir)
database.rules.json     règles de sécurité Realtime Database
manifest.webmanifest    PWA
sw.js                   cache hors ligne
icons/                  icônes
```

## Données
`espaces/{CODE}` → `noms {a,b}`, `scores {a,b,maj}`, `historique {AAAA-MM-JJ: {a,b}}`.
Les règles exigent une connexion anonyme, n’autorisent que les codes valides, interdisent de lister les espaces et valident chaque valeur (0–100, prénoms ≤ 20 caractères).
