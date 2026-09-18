# OMAZA — Contrôle Technique Auto

Application web de présentation et de gestion des rendez-vous du centre de contrôle technique OMAZA, à Akbou (Béjaïa, Algérie).

Le projet est entièrement statique : HTML, CSS et JavaScript côté navigateur. Firebase fournit l'authentification, Firestore stocke les données et EmailJS assure les e-mails transactionnels.

## Fonctionnalités

- Site vitrine, services, tarifs ENACTA et simulateur de devis.
- Inscription et connexion par e-mail/mot de passe Firebase.
- Réinitialisation de mot de passe par e-mail.
- Réservation avec calendrier, créneaux disponibles et détails du véhicule.
- Champ obligatoire « Autre wilaya » lorsqu'il est sélectionné.
- Prévention des doubles réservations au moyen d'un verrou Firestore atomique par créneau.
- Espace client : consultation et annulation des rendez-vous.
- Espace administrateur : statistiques, recherche, filtres, export Excel, gestion des clients et journal d'audit.
- E-mails EmailJS au centre à la création, puis au client lors d'une confirmation, annulation ou clôture.

## Statuts des rendez-vous

Les valeurs stockées sont techniques ; l'interface les traduit en français.

| Valeur Firestore | Libellé |
| --- | --- |
| `pending` | En attente |
| `confirmed` | Confirmé |
| `cancelled` | Annulé |
| `completed` | Terminé |

Les anciennes valeurs françaises restent lisibles. Depuis le tableau de bord, un administrateur peut exécuter « Migrer les statuts » pour les convertir définitivement.

## Technologies

- HTML5, CSS3 et JavaScript ES modules
- Firebase Authentication et Cloud Firestore (SDK Web 10.7.1)
- Firebase Hosting
- EmailJS
- Font Awesome, Google Fonts et SheetJS/XLSX via CDN

## Arborescence

```text
.
├── index.html
├── pages/
│   ├── inscription.html       # Inscription, connexion et mot de passe oublié
│   ├── rendez-vous.html       # Réservation
│   ├── mes-rendez-vous.html   # Espace client
│   ├── admin.html             # Tableau de bord administrateur
│   ├── admin-clients.html     # Gestion des clients
│   ├── devis.html             # Simulateur de devis
│   └── services.html          # Services et tarifs
├── js/
│   ├── firebase-config.js     # Initialisation Firebase
│   ├── auth.js                # Authentification et réinitialisation de mot de passe
│   ├── appointments.js        # RDV, créneaux, e-mails et migrations
│   ├── statuses.js            # Codes et libellés des statuts
│   ├── session.js             # Session et contrôle d'accès admin
│   └── toast.js               # Notifications visuelles
├── css/style.css
├── firestore.rules
├── firestore.indexes.json
└── firebase.json
```

## Démarrer en local

Le projet ne nécessite aucune installation npm ni compilation. Servez simplement le dossier via HTTP :

```powershell
npx serve .
```

Puis ouvrez l'adresse indiquée (souvent `http://localhost:3000`). Live Server pour VS Code convient aussi.

## Configuration Firebase et EmailJS

Pour cloner le projet dans votre propre environnement :

1. Créez un projet Firebase et activez **Authentication > E-mail/Mot de passe** et **Cloud Firestore**.
2. Ajoutez une application Web Firebase et remplacez les valeurs de `js/firebase-config.js`.
3. Dans Firebase Authentication, ajoutez vos domaines de développement et de production dans **Authorized domains** ; configurez également le modèle d'e-mail de réinitialisation si nécessaire.
4. Créez les services et modèles EmailJS utilisés dans `js/emailjs-config.js`, puis reconnectez le compte e-mail expéditeur dans EmailJS si son autorisation expire.
5. Créez dans Firestore un document `users/{uid}` avec `role: "admin"` pour votre compte administrateur. Les inscriptions publiques créent seulement le rôle `client`.
6. Déployez les règles Firestore avant d'accepter des réservations publiques.

Les clés Firebase Web et la clé publique EmailJS sont prévues pour être présentes côté navigateur. Protégez l'accès par les règles Firestore, les domaines autorisés et les restrictions configurées dans Firebase et EmailJS.

## Collections Firestore

| Collection | Usage |
| --- | --- |
| `users` | Profil, coordonnées et rôle (`client` ou `admin`). |
| `appointments` | Rendez-vous, véhicule, wilaya, année, commentaire, statut et `slotId`. |
| `appointmentSlots` | Verrou sans données personnelles pour empêcher deux réservations au même créneau. |
| `auditLogs` | Historique des actions administratives. |

Après le déploiement, utilisez une fois « Synchroniser les créneaux » dans le dashboard administrateur pour créer les verrous des rendez-vous historiques. Les nouveaux rendez-vous créent leur verrou automatiquement. Lorsqu'un rendez-vous est annulé, le verrou est supprimé et le créneau redevient disponible.

## Déploiement Firebase

```powershell
npx firebase-tools login
npx firebase-tools deploy --only firestore:rules,firestore:indexes,hosting
```

Le fichier `firebase.json` publie la racine du projet. Les pages HTML ne sont pas mises en cache ; les ressources CSS et JavaScript ont une durée de cache d'une heure.

## Publication sur GitHub

Avant le premier envoi, vérifiez que `firebase-debug.log`, `.firebase/`, `node_modules/` et vos fichiers `.env` restent ignorés par Git. Ne placez jamais de clé privée, mot de passe ou identifiant de compte dans le dépôt.

```powershell
git init
git add .
git commit -m "Initial commit: OMAZA contrôle technique"
git branch -M main
git remote add origin https://github.com/<votre-compte>/<votre-depot>.git
git push -u origin main
```

## Vérifications de mise en production

- Testez l'inscription, la connexion et le lien « Mot de passe oublié ? ».
- Testez une réservation, une annulation client et les actions administrateur.
- Vérifiez les e-mails EmailJS avec un compte réel après toute reconnexion du service Gmail.
- Lancez les deux migrations depuis le dashboard admin si des rendez-vous existaient avant les statuts techniques et les verrous de créneaux.
