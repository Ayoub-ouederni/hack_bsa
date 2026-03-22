# Instructions projet

## Règles obligatoires

1. **Toujours lire le fichier PLAN.md en premier** avant de commencer toute tâche. Le plan est la source de vérité pour savoir quoi faire et dans quel ordre.

2. **Ne jamais écrire "Co-Authored-By: Claude Code"** dans les messages de commit. Aucune mention de co-authorship Claude dans les commits.

4. **Commits en anglais.** Tous les messages de commit doivent être rédigés en anglais.

5. **Stack technique — ne pas dévier :**
   - Next.js 16 (App Router) + TypeScript + Tailwind CSS + Framer Motion
   - XRPL Testnet via `xrpl.js` (v4)
   - Wallet (connection + payments) : `xrpl-connect` (by XRPL Commons) — GemWallet (confirmed working), Xaman, Crossmark, Ledger, WalletConnect
   - shadcn/ui pour les composants UI
   - Lucide React pour les icônes
   - SQLite via Prisma pour la base de données

6. **Composant HeartbeatPulse — ne pas coder l'implémentation.** Le composant HeartbeatPulse est géré par quelqu'un d'autre. Claude fournit uniquement le **placeholder avec l'interface TypeScript correcte**, jamais l'implémentation finale.

7. **Pas de fichiers inutiles.** Ne pas créer de README, de fichiers de documentation (*.md autres que PLAN.md et CLAUDE.md), ni de fichiers de test sauf si explicitement demandé par l'utilisateur.

8. **`npm run build` obligatoire avant de finir une étape.** Vérifier que le projet compile sans erreur avant de considérer une étape comme terminée. Corriger toute erreur de build avant de passer à la suite.

9. **Langue de l'UI : anglais.** Tous les textes affichés dans l'application (labels, boutons, messages, placeholders) doivent être en anglais.

10. **Ne pas modifier PLAN.md.** Le plan est en lecture seule. Claude le lit pour savoir quoi faire mais ne le modifie jamais.

11. **Utiliser les skills UI obligatoirement.** Pour toute étape ou tâche impliquant du code UI (composants, pages, layouts, formulaires, styling), Claude **doit** invoquer les skills `frontend-ui-ux-engineer`, `shadcn` et/ou `nextjs-shadcn` **avant** d'écrire du code UI. Pas d'exception.

## Workflow par conversation

- **Une étape du plan = une conversation.** Chaque conversation traite une seule étape/phase du plan, puis l'utilisateur switch de conversation pour l'étape suivante.
- **Pour lancer une étape**, l'utilisateur écrit simplement `step 1`, `step 2`, etc. Claude doit alors lire PLAN.md, identifier l'étape correspondante, et l'exécuter entièrement.
- **Ne pas anticiper les étapes suivantes.** Se concentrer uniquement sur l'étape demandée dans la conversation en cours.
