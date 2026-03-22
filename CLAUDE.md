# Instructions projet

## STATUT DU PROJET

**Le projet Pulse est TERMINÉ et FONCTIONNEL.** Le backend, les API routes, la logique XRPL, le wallet, le UI — tout est fini. **La prochaine feature est l'intégration ZK Proofs.**

**Claude ne doit PLUS toucher au code suivant (sauf exception ZK ci-dessous) :**
- `src/app/api/` — API routes existantes (fund, members, requests, votes, profile, xrpl)
- `src/lib/xrpl/` — escrow, multisig, payment, NFT, faucet, conditions, client
- `src/lib/wallet/` — client wallet + signer (GemWallet)
- `src/lib/crypto/` — hash pour preuve de documents
- `src/lib/hooks/` — useFund, useRequest, useWallet (SWR)
- `src/lib/db/` — Prisma client
- `src/contexts/WalletContext.tsx` — contexte wallet global
- `prisma/` — schema et migrations
- `src/types/` — types TypeScript
- `src/lib/utils/` — validation, xrp utils
- `src/components/` — composants UI existants
- `src/app/page.tsx`, `src/app/layout.tsx`, `src/app/providers.tsx` — pages existantes
- `src/app/globals.css`, `tailwind.config.*`, `postcss.config.*` — styles

**Exception ZK Proofs — Claude peut CRÉER de nouveaux fichiers :**
- `src/lib/zk/` — nouveau module ZK isolé (circuits, prover, verifier)
- `src/app/api/zk/` — nouvelles API routes ZK uniquement
- `circuits/` — fichiers circom à la racine du projet
- `src/components/vote/ZkProofBadge.tsx` — nouveau composant UI pour afficher la preuve ZK
- Les fichiers existants restent interdits de modification

## Règles obligatoires

1. **Lire `Pulse_UI_Guide.pdf`** (nom exact du fichier) à la racine du projet si besoin de référence UI.

2. **Ne jamais écrire "Co-Authored-By: Claude Code"** dans les messages de commit. Aucune mention de co-authorship Claude dans les commits.

4. **Commits en anglais.** Tous les messages de commit doivent être rédigés en anglais.

5. **Stack technique — ne pas dévier :**
   - Next.js 16 (App Router) + TypeScript + Tailwind CSS + Framer Motion
   - XRPL Testnet via `xrpl.js` (v4)
   - Wallet (connection + payments) : `@gemwallet/api` — GemWallet only
   - shadcn/ui pour les composants UI
   - Lucide React pour les icônes
   - SQLite via Prisma pour la base de données

6. **Composant HeartbeatPulse — ne pas coder l'implémentation.** Le composant HeartbeatPulse est géré par quelqu'un d'autre. Claude fournit uniquement le **placeholder avec l'interface TypeScript correcte**, jamais l'implémentation finale.

7. **Pas de fichiers inutiles.** Ne pas créer de README, de fichiers de documentation (*.md autres que PLAN.md, CLAUDE.md et ZK_PLAN.md), ni de fichiers de test sauf si explicitement demandé par l'utilisateur.

8. **`npm run build` obligatoire avant de finir une étape.** Vérifier que le projet compile sans erreur avant de considérer une étape comme terminée. Corriger toute erreur de build avant de passer à la suite.

9. **Langue de l'UI : anglais.** Tous les textes affichés dans l'application (labels, boutons, messages, placeholders) doivent être en anglais.

10. **Ne pas modifier PLAN.md.** Le plan est en lecture seule. Claude le lit pour savoir quoi faire mais ne le modifie jamais.

11. **Utiliser les skills UI obligatoirement.** Pour toute étape ou tâche impliquant du code UI (composants, pages, layouts, formulaires, styling), Claude **doit** invoquer les skills `frontend-ui-ux-engineer`, `shadcn` et/ou `nextjs-shadcn` **avant** d'écrire du code UI. Pas d'exception.

## ZK Proofs Integration

Le plan d'implémentation ZK est dans `ZK_PLAN.md`. Claude le lit pour savoir quoi faire.

**Workflow :** l'utilisateur demande `zk step 1`, `zk step 2`, etc. Claude lit ZK_PLAN.md et exécute l'étape correspondante.
