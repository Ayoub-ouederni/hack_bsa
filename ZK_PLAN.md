# ZK Proof Integration Plan

## Principe

Le multi-sign XRPL est limité à 32 signers. Pour les fonds avec >32 membres, on ajoute un ZK path parallèle :
- Les membres votent off-chain (signature stockée en DB)
- Une ZK proof agrège les votes et prouve le quorum
- Le serveur vérifie la preuve → release l'escrow avec la clé du fund wallet
- Le hash de la ZK proof est publié dans le Memo de la transaction XRPL

Le flow actuel (multi-sign ≤32) reste intact et inchangé.

---

## Step 1 — Setup & Circuit ZK

**Fichiers créés :**
- `circuits/vote_verifier.circom` — circuit simple : prend N votes (0 ou 1), vérifie que la somme ≥ quorum
- `src/lib/zk/setup.ts` — script pour compiler le circuit et générer les clés (proving key + verification key)

**Dépendances :**
- `snarkjs` (npm)
- `circomlib` (npm)
- `circom` (binaire à installer sur la machine)

**Validation :** le circuit compile et génère une preuve pour un input test.

---

## Step 2 — Prover & Verifier (backend)

**Fichiers créés :**
- `src/lib/zk/prover.ts` — génère une ZK proof à partir des votes (inputs: votes[], quorum, memberCount)
- `src/lib/zk/verifier.ts` — vérifie une ZK proof (retourne true/false)
- `src/lib/zk/types.ts` — types TypeScript pour les proofs

**Logique :**
- `generateVoteProof(votes, quorum)` → { proof, publicSignals }
- `verifyVoteProof(proof, publicSignals)` → boolean

**Validation :** test unitaire — générer + vérifier une preuve.

---

## Step 3 — API Routes ZK

**Fichiers créés :**
- `src/app/api/zk/prove/route.ts` — POST : reçoit fundId + requestId, récupère les votes en DB, génère la preuve
- `src/app/api/zk/verify/route.ts` — POST : reçoit une preuve, la vérifie, retourne le résultat

**Flow :**
1. Le frontend appelle POST `/api/zk/prove` quand le quorum est atteint sur un fonds >32 membres
2. Le serveur génère la ZK proof
3. Le serveur vérifie la preuve
4. Si valide → release l'escrow avec le fund wallet seed (comme retry-release)
5. Publie le hash de la preuve dans le Memo de la transaction

---

## Step 4 — UI Integration

**Fichiers modifiés :**
- Page de vote (`src/app/fund/[fundId]/vote/[requestId]/page.tsx`) — afficher le statut ZK proof
- Nouveau composant `src/components/vote/ZkProofBadge.tsx` — badge visuel montrant la preuve ZK

**Affichage :**
- Si le fonds utilise le ZK path → afficher "ZK Proof verified ✓" avec le hash
- Lien vers la transaction XRPL contenant le hash en Memo

---

## Step 5 (bonus) — Recursive Proof Scaffold

**Fichiers créés :**
- `circuits/recursive_verifier.circom` — circuit qui vérifie d'autres preuves (scaffold, désactivé)
- `src/lib/zk/recursive.ts` — logique de batch + récursion (scaffold, désactivé)

**Statut :** code structuré mais non activé. Prêt pour activation future.

---

## Règles de sécurité

1. **Ne JAMAIS modifier** les routes existantes dans `src/app/api/fund/`, `src/lib/xrpl/`, etc.
2. **Le ZK path est additionnel** — si la ZK proof échoue, le fonds continue de fonctionner en mode multi-sign normal
3. **Le fund wallet seed** est utilisé côté serveur pour le release (même mécanisme que retry-release)
4. **Aucune donnée privée** ne sort dans la ZK proof — seuls les signaux publics (nombre de votes, quorum, résultat) sont exposés
