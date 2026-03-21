# Specs Animations — Pulse

## Le projet

Pulse est une app React/Next.js. Tu vas créer 3 composants d'animation qu'on branche directement dans le projet.

---

## Setup

Le projet utilise :
- **React** (Next.js)
- **TypeScript** (.tsx)
- **Tailwind CSS** pour le style
- **Framer Motion** pour les animations (`npm install framer-motion`)

Tu n'as pas besoin de toucher au backend ni à la blockchain. Tu fais juste des composants React visuels qui reçoivent des données en props.

---

## Composant 1 : HeartbeatPulse

**Fichier à créer :** `src/components/animations/HeartbeatPulse.tsx`

**Ce que ça fait :** Un indicateur visuel de la santé du pool. Ça pulse comme un battement de cœur. Quand une contribution arrive, ça pulse plus fort. Quand les fonds sont libérés, le rythme accélère et une animation de flux part du pool vers le bénéficiaire.

**Props que le composant reçoit :**

```typescript
interface HeartbeatPulseProps {
  poolBalance: number;          // Solde actuel du pool en XRP (ex: 450)
  poolTarget: number;           // Objectif du pool en XRP (ex: 1000)
  status: "healthy" | "warning" | "critical"; // Santé du pool
  lastContribution?: {          // Dernière contribution (pour animation de pulse)
    amount: number;
    timestamp: number;
  };
  activeRelease?: {             // Release en cours (pour animation de flux)
    amount: number;
    recipientName: string;
  };
}
```

**Comportement attendu :**
- `healthy` (vert) : pulse lent et régulier (1 pulse toutes les 2 secondes)
- `warning` (orange) : pulse plus lent (1 toutes les 3 secondes) — signal d'alarme visuel
- `critical` (rouge) : pulse très lent et faible (1 toutes les 4 secondes)
- Quand `lastContribution` change : un pulse plus fort/grand pendant 1 seconde
- Quand `activeRelease` est défini : le rythme accélère et des particules/points se déplacent du centre vers le bas (représentant le flux de XRP vers le bénéficiaire)

**Taille :** Le composant doit faire environ 300x300px. Il sera placé en haut du dashboard.

---

## Composant 2 : SolidarityWall

**Fichier à créer :** `src/components/animations/SolidarityWall.tsx`

**Ce que ça fait :** Un mur vide qui se remplit de silhouettes de personnes à chaque vote "oui". Quand le quorum est atteint, toutes les silhouettes s'illuminent.

**Props que le composant reçoit :**

```typescript
interface SolidarityWallProps {
  currentVotes: number;    // Nombre de votes "oui" actuels (ex: 2)
  quorumRequired: number;  // Nombre de votes nécessaires (ex: 3)
  totalMembers: number;    // Nombre total de membres pouvant voter (ex: 5)
  voterNames?: string[];   // Noms des votants (ex: ["Alice", "Carol"])
  quorumReached: boolean;  // true quand le quorum est atteint
}
```

**Comportement attendu :**
- Au départ : mur vide (ou avec des emplacements grisés pour chaque membre)
- Chaque vote "oui" : une silhouette apparaît avec une animation (fade-in + slide-up depuis le bas, durée ~0.5s). Le nom du votant peut apparaître sous la silhouette.
- Quand `quorumReached` passe à `true` : toutes les silhouettes changent de couleur (gris → vert lumineux) avec un effet de glow/pulse. C'est le moment "wow".
- Si le vote expire sans quorum : les silhouettes restent mais s'estompent (gris très clair)

**Silhouettes :** Utilise des SVG simples de personnes debout. Tu peux les trouver sur :
- Heroicons (heroicons.com) — icône "user"
- Lucide Icons (lucide.dev) — icône "user"
- Ou dessiner un SVG custom simple (tête ronde + corps)

**Taille :** Largeur 100% du conteneur, hauteur ~200px. Les silhouettes font ~60px de haut chacune, espacées régulièrement.

---

## Composant 3 : RequestProgressTracker

**Fichier à créer :** `src/components/animations/RequestProgressTracker.tsx`

**Ce que ça fait :** Une barre de progression horizontale avec 5 étapes. L'étape active est mise en évidence.

**Props que le composant reçoit :**

```typescript
type RequestStatus = "submitted" | "voting" | "approved" | "released" | "expired";

interface RequestProgressTrackerProps {
  status: RequestStatus;
  currentVotes?: number;    // Nombre de votes actuels (affiché dans l'étape "voting")
  quorumRequired?: number;  // Quorum nécessaire
  timeRemaining?: string;   // Temps restant pour voter (ex: "23h 15m")
}
```

**Comportement attendu :**
- 5 étapes en ligne horizontale : Submitted → Voting → Approved → Released
- L'étape "Expired" remplace "Approved → Released" si le vote échoue
- Étapes passées : remplies (couleur verte)
- Étape active : couleur accent (vert vif) avec une légère animation de pulse
- Étapes futures : grises
- Sous l'étape "Voting" : afficher "2/3 signatures" et le temps restant
- Transition animée quand on passe d'une étape à la suivante (la barre se remplit)

**Taille :** Largeur 100% du conteneur, hauteur ~80px.

---

## Comment tester tes composants

Crée un fichier de test pour voir tes composants en isolation :

```tsx
// src/app/test-animations/page.tsx

"use client";
import { useState } from "react";
import { HeartbeatPulse } from "@/components/animations/HeartbeatPulse";
import { SolidarityWall } from "@/components/animations/SolidarityWall";
import { RequestProgressTracker } from "@/components/animations/RequestProgressTracker";

export default function TestAnimations() {
  const [votes, setVotes] = useState(0);

  return (
    <div className="p-8 space-y-12 bg-gray-950 min-h-screen text-white">
      <h1 className="text-2xl font-bold">Test Animations</h1>

      {/* Heartbeat */}
      <section>
        <h2 className="text-xl mb-4">Heartbeat</h2>
        <HeartbeatPulse
          poolBalance={450}
          poolTarget={1000}
          status="healthy"
        />
      </section>

      {/* Solidarity Wall */}
      <section>
        <h2 className="text-xl mb-4">Solidarity Wall</h2>
        <button
          onClick={() => setVotes(v => Math.min(v + 1, 5))}
          className="mb-4 px-4 py-2 bg-green-600 rounded"
        >
          Simuler un vote (+1)
        </button>
        <SolidarityWall
          currentVotes={votes}
          quorumRequired={3}
          totalMembers={5}
          voterNames={["Alice", "Carol", "Eve", "Dave", "Bob"].slice(0, votes)}
          quorumReached={votes >= 3}
        />
      </section>

      {/* Progress Tracker */}
      <section>
        <h2 className="text-xl mb-4">Progress Tracker</h2>
        <RequestProgressTracker
          status="voting"
          currentVotes={votes}
          quorumRequired={3}
          timeRemaining="23h 15m"
        />
      </section>
    </div>
  );
}
```

Pour lancer : `npm run dev` puis ouvre `http://localhost:3000/test-animations`

---

## Checklist

- [ ] HeartbeatPulse.tsx — pulse qui change selon le status, animation de flux sur release
- [ ] SolidarityWall.tsx — silhouettes qui apparaissent, glow quand quorum atteint
- [ ] RequestProgressTracker.tsx — barre d'étapes avec transitions animées
- [ ] Chaque composant exporté en `export default` ou `export { NomDuComposant }`
- [ ] Testé visuellement sur la page test-animations

---

## Ressources

- **Framer Motion docs :** https://www.framer.com/motion/
- **Framer Motion exemples :** `<motion.div animate={{ scale: 1.2 }} transition={{ duration: 0.5 }} />`
- **AnimatePresence** (pour les éléments qui apparaissent/disparaissent) : https://www.framer.com/motion/animate-presence/
- **Tailwind CSS :** https://tailwindcss.com/docs
- **Lucide icons (SVG) :** https://lucide.dev/
- **Heroicons (SVG) :** https://heroicons.com/
