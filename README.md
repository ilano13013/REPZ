# REPZ — Musculation gamifiée 🏋️⚡

Application mobile (React Native / Expo / TypeScript) qui transforme la
progression en musculation en un véritable jeu : XP par série, niveaux, records,
quêtes, boss hebdomadaire, ligues et fiche de personnage.

> **Avertissement.** REPZ n'est pas un outil médical. En cas de douleur
> persistante ou inhabituelle, consultez un professionnel de santé.

## Stack technique

- **React Native + Expo** (SDK 52), **TypeScript** strict
- **Expo Router** (navigation par fichiers)
- **Zustand** (état global)
- **expo-sqlite** (persistance locale, schéma versionné + migrations)
- **React Hook Form + Zod** (formulaires & validation)
- **Reanimated** (animations : montée de niveau, gains d'XP)
- **react-native-svg** (graphiques compatibles Expo)

L'application fonctionne **entièrement en local**. La couche `src/sync`
prépare l'authentification, le cloud, le classement en ligne et les défis
communautaires — désactivés via `FEATURE_FLAGS` (`src/constants/config.ts`).

## Démarrage

```bash
npm install
npm start          # lance Expo
npm test           # tests unitaires des moteurs
npm run typecheck  # vérification TypeScript
```

### Lancer l'app sur ton téléphone

1. Installe **Expo Go** ([iOS](https://apps.apple.com/app/expo-go/id982107779) /
   [Android](https://play.google.com/store/apps/details?id=host.exp.exponent)).
2. Dans le dossier du projet : `npm install` puis `npm start`.
3. Scanne le QR code affiché dans le terminal (appareil photo sur iOS, Expo Go
   sur Android). Le téléphone et l'ordinateur doivent être sur le même réseau.

> Les notifications locales ne fonctionnent pas dans Expo Go sur Android
> (SDK 53+) : utilise un *development build* (`npx expo run:android`) pour les
> tester. Tout le reste fonctionne dans Expo Go.

### Fonctionnalités principales

| Écran | Contenu |
| --- | --- |
| Onboarding | Profil, objectif, niveau, jours, matériel → programme recommandé |
| Accueil | Niveau, titre, barre d'XP, série, prochaine séance, quêtes, records, muscles |
| Entraînement | Programmes prédéfinis & personnalisés, constructeur, lancement de séance |
| Séance | Check-in de récupération, saisie rapide, chrono, +XP animé, records, note |
| Progression | Graphiques volume/poids, records, historique cliquable, caractéristiques |
| Défis | Quêtes quotidiennes/hebdo, boss hebdomadaire, ligue |
| Profil | Fiche de personnage (radar), badges, réglages, export/import, démo |

## Architecture

```
app/                    Routes Expo Router (onboarding, tabs, séance)
src/
  constants/            thème, configuration, config du moteur d'XP
  models/               types de domaine
  data/                 catalogues : 44 exercices, 9 programmes, niveaux,
                        titres, quêtes, badges, muscles
  engines/              moteurs PURS et testables
    xpEngine            calcul d'XP (charge/reps, poids du corps, durée,
                        distance, cardio) + bonus, plafonds, anti-abus
    levelEngine         100 niveaux, titres, montées multiples
    personalRecordEngine records + 1RM (Epley)
    muscleProgressEngine répartition de l'XP par groupe musculaire
    questEngine         quêtes quotidiennes & hebdomadaires
    recoveryEngine      check-in & avertissements de sécurité
    leagueEngine        score de ligue (progression + assiduité) & divisions
    workoutEngine       agrégations, boss hebdomadaire, stats de personnage
    programEditor       édition immuable de programmes (jours, exercices)
  db/                   schéma, migrations, service SQLite, dépôts, seed démo
  stores/               Zustand : thème, profil, session, jeu
  components/           UI réutilisable (ui/, game/, charts/)
  validation/           schémas Zod
  services/             export/import JSON, mode démo, reset
  sync/                 interfaces cloud/social (préparées, désactivées)
```

## Moteur d'XP (résumé)

```
volume  = charge × répétitions
xpBase  = √volume × coefficientExercice × coefficientDifficulté
poids du corps : chargeEffective = poidsUtilisateur × coefficientPoidsCorps
durée   : xpBase = (secondes / 10) × coefficient
```

Multiplicateurs : progression (+5 à +20 %), record (bonus fixe + ×1,5),
régularité (série de semaines), RPE, adhérence au programme, première série du
jour. **Plafonds** par série / exercice / jour + détection des valeurs
irréalistes et anti-farm. L'utilisateur ne perd **jamais** d'XP.

Tous les paramètres sont centralisés dans `src/constants/xpConfig.ts` et
`src/data/levels.ts` pour un équilibrage facile.

## Tests

61 tests unitaires couvrent l'XP, les plafonds, le 1RM, la détection de
records, les niveaux (montées multiples), la progression musculaire, les quêtes,
les valeurs incohérentes et l'édition de programmes.

```bash
npm test
```

## Mode démonstration

Profil → « Charger le mode démo » génère un utilisateur niveau 12 avec
historique, records, quêtes en cours, boss et ligue fictive.
