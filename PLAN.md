# Pulse — Complete Implementation Plan

## Context
Pulse is a decentralized community emergency fund for the XRPL Commons Hackathon (Best Social Impact track). Members pool XRP, submit emergency requests with SHA-256 proof documents, and community votes via XRPL multi-signature release the funds. Soulbound NFTs (XLS-20) serve as membership cards. The repo is currently empty. We build everything from scratch.

**I (Claude) handle:** All code including the full blockchain/XRPL layer.
**You (user) handle:** Install GemWallet browser extension, switch to Testnet, create `.env.local`.
**Someone else handles:** The 3 animation components (HeartbeatPulse, SolidarityWall, RequestProgressTracker) — I provide placeholder components with correct TypeScript interfaces.

---

## Tech Stack
- **Frontend:** Next.js 14 (App Router) + TypeScript + Tailwind CSS + Framer Motion
- **Blockchain:** XRPL Testnet via `xrpl.js` (v4)
- **Wallet:** GemWallet (browser extension) via `@gemwallet/api`
- **Database:** SQLite via Prisma (zero-config, hackathon-friendly)
- **Icons:** Lucide React

---

## Full File Structure

```
hack_bsa/
├── .env.local                             # XRPL_NETWORK, NEXT_PUBLIC_XRPL_NETWORK
├── prisma/
│   └── schema.prisma                      # Fund, Member, Contribution, Request, Vote
├── src/
│   ├── app/
│   │   ├── layout.tsx                     # Root layout, dark theme, WalletProvider
│   │   ├── page.tsx                       # Landing: connect wallet → see your funds
│   │   ├── globals.css                    # Tailwind imports + custom CSS vars
│   │   ├── onboarding/
│   │   │   └── page.tsx                   # Enter invite code → enter name → connect GemWallet
│   │   ├── fund/
│   │   │   ├── create/
│   │   │   │   └── page.tsx               # Form: name, quorum, min contribution, caps
│   │   │   └── [fundId]/
│   │   │       ├── page.tsx               # Dashboard: heartbeat, pool stats, active requests, members
│   │   │       ├── contribute/
│   │   │       │   └── page.tsx           # Amount input (pre-filled min) → GemWallet sign
│   │   │       ├── request/
│   │   │       │   └── page.tsx           # 3-step form: amount → description → doc upload + SHA-256
│   │   │       └── vote/
│   │   │           └── [requestId]/
│   │   │               └── page.tsx       # Request details + SolidarityWall + "I support"/"I pass"
│   │   ├── test-animations/
│   │   │   └── page.tsx                   # Interactive test page for animation components
│   │   └── api/
│   │       ├── fund/
│   │       │   ├── route.ts               # POST: create fund | GET: list user's funds
│   │       │   └── [fundId]/
│   │       │       ├── route.ts           # GET: fund details + pool balance + members + requests
│   │       │       ├── contribute/
│   │       │       │   └── route.ts       # POST: record contribution (after on-chain confirm)
│   │       │       ├── members/
│   │       │       │   ├── route.ts       # POST: add member (join via invite)
│   │       │       │   └── [memberId]/
│   │       │       │       └── route.ts   # DELETE: remove member (organizer only)
│   │       │       └── request/
│   │       │           ├── route.ts       # POST: create request + escrow | GET: list requests
│   │       │           └── [requestId]/
│   │       │               ├── route.ts   # GET: request details + votes
│   │       │               └── vote/
│   │       │                   └── route.ts # POST: submit vote (support + sig blob, or pass)
│   │       └── xrpl/
│   │           └── status/
│   │               └── route.ts           # GET: XRPL connection health check
│   ├── lib/
│   │   ├── xrpl/
│   │   │   ├── client.ts                  # XRPL WebSocket client singleton (lazy connect, auto-reconnect)
│   │   │   ├── escrow.ts                  # EscrowCreate, EscrowFinish, EscrowCancel
│   │   │   ├── conditions.ts             # PREIMAGE-SHA-256 condition/fulfillment generation
│   │   │   ├── multisig.ts               # SignerListSet, add/remove signer, combine multi-sign blobs
│   │   │   ├── nft.ts                     # NFTokenMint (soulbound), NFTokenCreateOffer, verify membership
│   │   │   ├── payment.ts                # Build Payment TX (contribution + release)
│   │   │   ├── account.ts                # getBalance, getTxHistory, getSignerList, getAccountInfo
│   │   │   └── faucet.ts                 # Testnet faucet: create + fund new wallets
│   │   ├── gemwallet/
│   │   │   └── client.ts                 # isInstalled, getAddress, signTransaction, submitTransaction
│   │   ├── crypto/
│   │   │   └── hash.ts                   # Client-side SHA-256 via Web Crypto API
│   │   ├── db/
│   │   │   └── prisma.ts                 # Prisma client singleton (prevent hot-reload duplication)
│   │   ├── utils/
│   │   │   ├── xrp.ts                    # dropsToXrp, xrpToDrops, formatXrp
│   │   │   └── validation.ts            # Zod schemas for all API inputs
│   │   └── hooks/
│   │       ├── useWallet.ts              # Hook wrapping WalletContext
│   │       ├── useFund.ts                # SWR hook for fund data (5s polling)
│   │       └── useRequest.ts            # SWR hook for request data
│   ├── components/
│   │   ├── animations/
│   │   │   ├── HeartbeatPulse.tsx        # PLACEHOLDER — correct props interface, simple visual
│   │   │   ├── SolidarityWall.tsx        # PLACEHOLDER — correct props interface, simple visual
│   │   │   └── RequestProgressTracker.tsx # PLACEHOLDER — correct props interface, simple visual
│   │   ├── ui/
│   │   │   ├── Button.tsx                # Variants: primary, secondary, danger, ghost
│   │   │   ├── Card.tsx                  # Dark card with border
│   │   │   ├── Input.tsx                 # Styled input with label
│   │   │   ├── Modal.tsx                 # Overlay modal
│   │   │   ├── Badge.tsx                 # Status badges (active, inactive, etc.)
│   │   │   └── Spinner.tsx              # Loading spinner
│   │   ├── layout/
│   │   │   ├── Header.tsx               # Logo, wallet connection status, nav links
│   │   │   └── PageShell.tsx            # Max-width container, padding, title
│   │   ├── fund/
│   │   │   ├── FundCard.tsx             # Fund summary card for list view
│   │   │   ├── MemberList.tsx           # List of members with status indicators
│   │   │   ├── ContributionHistory.tsx  # Recent contributions feed
│   │   │   └── PoolStats.tsx            # Balance, member count, health bar
│   │   ├── request/
│   │   │   ├── RequestCard.tsx          # Request summary in list
│   │   │   ├── RequestForm.tsx          # 3-step wizard (amount → description → doc)
│   │   │   └── DocumentUpload.tsx       # File input + SHA-256 hash display
│   │   ├── vote/
│   │   │   └── VoteButtons.tsx          # "I support" (green) + "I pass" (gray)
│   │   └── wallet/
│   │       └── ConnectWallet.tsx         # "Connect GemWallet" button + status
│   ├── contexts/
│   │   └── WalletContext.tsx             # address, isConnected, connect(), disconnect()
│   └── types/
│       ├── fund.ts                       # Fund, Member, Contribution TypeScript types
│       └── request.ts                    # Request, Vote, RequestStatus types
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## Database Schema (Prisma + SQLite)

### Fund table
| Column | Type | Notes |
|--------|------|-------|
| id | String (cuid) | PK |
| name | String | e.g. "Maple Street Fund" |
| description | String? | Optional description |
| organizerAddress | String | XRPL address of creator |
| fundWalletAddress | String | XRPL address of the pool (unique) |
| fundWalletSeed | String | Wallet secret — testnet only! |
| quorumRequired | Int | N in N-of-M (e.g. 3) |
| minContribution | Int | In drops (5 XRP = 5_000_000) |
| requestCapMultiplier | Float | Default 2.0 |
| maxPoolPercent | Float | Default 0.2 (20%) |
| inviteCode | String | Unique, for joining |
| createdAt | DateTime | |

### Member table
| Column | Type | Notes |
|--------|------|-------|
| id | String (cuid) | PK |
| fundId | String | FK → Fund |
| walletAddress | String | XRPL address |
| displayName | String | Human name |
| totalContributed | Int | In drops, updated on each contribution |
| lastContribution | DateTime? | For inactivity tracking |
| status | String | "active" / "inactive" / "removable" |
| nftTokenId | String? | XLS-20 token ID |
| joinedAt | DateTime | |
| **Unique constraint:** (fundId, walletAddress) |

### Contribution table
| Column | Type | Notes |
|--------|------|-------|
| id | String (cuid) | PK |
| memberId | String | FK → Member |
| amount | Int | In drops |
| txHash | String | XRPL transaction hash (unique) |
| createdAt | DateTime | |

### Request table
| Column | Type | Notes |
|--------|------|-------|
| id | String (cuid) | PK |
| fundId | String | FK → Fund |
| requesterAddress | String | XRPL address of requester |
| amount | Int | Requested amount in drops |
| description | String | "What happened" text |
| documentHash | String | SHA-256 hex of proof document |
| escrowSequence | Int? | XRPL escrow sequence number |
| escrowCondition | String? | PREIMAGE-SHA-256 condition hex |
| escrowFulfillment | String? | Fulfillment hex (server-side only!) |
| status | String | "submitted"/"voting"/"approved"/"released"/"expired"/"cancelled" |
| expiresAt | DateTime? | When the escrow/vote expires |
| createdAt | DateTime | |

### Vote table
| Column | Type | Notes |
|--------|------|-------|
| id | String (cuid) | PK |
| requestId | String | FK → Request |
| voterAddress | String | XRPL address |
| vote | String | "support" or "pass" |
| signature | String? | Multi-sig TX blob (only for "support") |
| createdAt | DateTime | |
| **Unique constraint:** (requestId, voterAddress) |

---

## XRPL Blockchain Layer — Detailed Function Specs

### `src/lib/xrpl/client.ts` — Connection Management
```typescript
// Singleton WebSocket client to XRPL Testnet
getClient(): Promise<Client>        // Lazy connect, returns connected client
disconnectClient(): Promise<void>   // Cleanup on server shutdown
```
- URL from `process.env.XRPL_NETWORK` (default: `wss://s.altnet.rippletest.net:51233`)
- Auto-reconnect on disconnect

### `src/lib/xrpl/faucet.ts` — Testnet Wallet Creation
```typescript
fundTestnetWallet(): Promise<{ address: string, seed: string, balance: number }>
```
- Calls XRPL Testnet faucet API: `POST https://faucet.altnet.rippletest.net/accounts`
- Returns funded wallet (1000 test XRP)
- Used when creating a new fund (creates the pool wallet)

### `src/lib/xrpl/account.ts` — Account Queries
```typescript
getAccountBalance(address: string): Promise<number>          // Returns drops
getAccountInfo(address: string): Promise<AccountInfoResponse>
getAccountTransactions(address: string, limit?: number): Promise<Transaction[]>
getSignerList(address: string): Promise<SignerEntry[]>        // Current signers on account
```

### `src/lib/xrpl/payment.ts` — XRP Transfers
```typescript
// Build unsigned Payment TX (for GemWallet to sign)
buildContributionTx(params: {
  fromAddress: string,
  fundWalletAddress: string,
  amountDrops: number,
  fundId: string               // Stored in memo field
}): Promise<Payment>

// Build unsigned release Payment (to be multi-signed)
buildReleaseTx(params: {
  fundWalletAddress: string,
  recipientAddress: string,
  amountDrops: number,
  requestId: string            // Stored in memo field
}): Promise<Payment>
```
- Memos encode fund/request IDs for on-chain traceability
- Memo format: `{ MemoType: hex("pulse/contribution"), MemoData: hex(fundId) }`

### `src/lib/xrpl/conditions.ts` — Crypto-Conditions (PREIMAGE-SHA-256)
```typescript
generateConditionAndFulfillment(): { condition: string, fulfillment: string }
```
- Generates random 32-byte preimage
- Produces PREIMAGE-SHA-256 condition (RFC draft-thomas-crypto-conditions)
- Returns both as uppercase hex strings
- Uses `five-bells-condition` npm package for correct encoding
- The condition goes into EscrowCreate; the fulfillment is stored server-side and used in EscrowFinish

### `src/lib/xrpl/escrow.ts` — Escrow Management
```typescript
// Create escrow locking funds with a condition + time expiry
createEscrow(params: {
  fundWalletSeed: string,       // Server-side signing (fund wallet)
  recipientAddress: string,
  amountDrops: number,
  conditionHex: string,         // From generateConditionAndFulfillment()
  cancelAfterSeconds: number    // 600 for demo (10min), 172800 for prod (48h)
}): Promise<{ escrowSequence: number, txHash: string }>

// Finish escrow (releases funds) — this TX gets multi-signed
buildEscrowFinishTx(params: {
  ownerAddress: string,         // Fund wallet address
  escrowSequence: number,
  conditionHex: string,
  fulfillmentHex: string
}): Promise<EscrowFinish>       // Unsigned TX for multi-signing

// Cancel expired escrow (server-side, after expiry time)
cancelEscrow(params: {
  fundWalletSeed: string,
  ownerAddress: string,
  escrowSequence: number
}): Promise<{ txHash: string }>
```

### `src/lib/xrpl/multisig.ts` — Multi-Signature Voting
```typescript
// Set up the signer list on the fund wallet
setupSignerList(params: {
  fundWalletSeed: string,
  signers: Array<{ account: string, weight: number }>,  // weight=1 for all
  quorum: number                                          // N in N-of-M
}): Promise<{ txHash: string }>

// Add a new signer (replaces entire list — XRPL requirement)
addSigner(params: {
  fundWalletSeed: string,
  currentSigners: SignerEntry[],
  newSignerAddress: string,
  quorum: number
}): Promise<{ txHash: string }>

// Remove a signer
removeSigner(params: {
  fundWalletSeed: string,
  currentSigners: SignerEntry[],
  signerToRemove: string,
  quorum: number
}): Promise<{ txHash: string }>

// Combine individual multi-sign blobs into one TX
combineSignatures(signedTxBlobs: string[]): string  // Uses xrpl.multisign()

// Submit the combined multi-signed TX
submitMultiSigned(combinedBlob: string): Promise<{ txHash: string, result: string }>
```

### `src/lib/xrpl/nft.ts` — Soulbound Membership NFTs
```typescript
// Mint a non-transferable NFT on the fund wallet
mintMembershipNFT(params: {
  fundWalletSeed: string,
  recipientAddress: string,
  fundId: string,
  fundName: string,
  memberName: string
}): Promise<{ nftTokenId: string, txHash: string }>
```
- Uses `NFTokenMint` with `Flags: 0` (no `tfTransferable` = soulbound)
- URI encodes: `pulse://membership/{fundId}/{memberAddress}`
- `NFTokenTaxon`: constant (e.g. 1) to group all Pulse NFTs
- After minting: creates `NFTokenCreateOffer` with amount=0 and `Destination=recipient`
- **Simplified for hackathon:** Auto-accept offer server-side if possible, or skip acceptance step to reduce onboarding friction

```typescript
// Verify a wallet holds a membership NFT from this fund
verifyMembership(params: {
  walletAddress: string,
  fundWalletAddress: string   // issuer
}): Promise<boolean>

// Burn a membership NFT (organizer action, for removal)
burnMembershipNFT(params: {
  fundWalletSeed: string,
  nftTokenId: string
}): Promise<{ txHash: string }>
```

### ~~`src/lib/xrpl/subscribe.ts`~~ — REMOVED
> Replaced by SWR polling at 5s intervals. Simpler for hackathon, fewer bugs.

---

## GemWallet Integration — `src/lib/gemwallet/client.ts`

```typescript
// Check if GemWallet browser extension is installed
checkGemWallet(): Promise<boolean>

// Get user's XRPL address from GemWallet
getWalletAddress(): Promise<string>

// Sign a transaction (returns signed blob, does NOT submit)
signTransaction(tx: Transaction): Promise<{ signature: string }>

// Sign for multi-signature (returns blob with only this signer's signature)
multiSignTransaction(tx: Transaction): Promise<{ signature: string }>

// Sign and submit a transaction in one step
submitTransaction(tx: Transaction): Promise<{ txHash: string }>
```

All functions use `@gemwallet/api` under the hood:
- `isInstalled()` → `checkGemWallet()`
- `getAddress()` → `getWalletAddress()`
- `signTransaction({ transaction })` → `signTransaction()`
- `submitTransaction({ transaction })` → `submitTransaction()`

---

## Client-Side SHA-256 — `src/lib/crypto/hash.ts`

```typescript
// Hash a file using Web Crypto API (runs in browser, file never leaves device)
async hashFile(file: File): Promise<string>
// Returns lowercase hex string of SHA-256 hash
// Uses: crypto.subtle.digest("SHA-256", await file.arrayBuffer())
```

---

## API Routes — Detailed Request/Response Specs

### `POST /api/fund` — Create a new fund
**Input:**
```json
{
  "name": "Maple Street Fund",
  "description": "Emergency fund for our neighborhood",
  "organizerAddress": "rXXXX...",
  "quorumRequired": 3,
  "minContribution": 5000000,
  "requestCapMultiplier": 2.0,
  "maxPoolPercent": 0.2
}
```
**Logic:**
1. Validate input with Zod
2. Call `fundTestnetWallet()` → get pool wallet address + seed
3. Call `setupSignerList()` with organizer as first signer (weight=1, quorum=quorumRequired)
4. Call `mintMembershipNFT()` for organizer
5. Generate random invite code (8 chars alphanumeric)
6. Save Fund + first Member to DB
7. Return fund details + invite code
- **Error handling:** Wrap steps 2-6 in try/catch. On failure, rollback DB records and return error with details. Fund marked "failed" if chain ops succeed but DB fails.

**Output:** `{ fund: Fund, inviteCode: string, nftOfferId: string }`

### `POST /api/fund/[fundId]/members` — Join a fund
**Input:**
```json
{
  "inviteCode": "ABC12345",
  "walletAddress": "rYYYY...",
  "displayName": "Bob"
}
```
**Logic:**
1. Validate invite code matches fund
2. Check member not already in fund
3. Check signer count < 32 (XRPL limit)
4. Get current signer list from XRPL
5. Call `addSigner()` → add to signer list
6. Call `mintMembershipNFT()` → mint soulbound NFT
7. Save Member to DB
8. Return member details + NFT offer ID (member must accept in GemWallet)

### `GET /api/fund/[fundId]` — Get fund dashboard data
**Logic:**
1. Fetch fund from DB with members and active requests
2. Call `getAccountBalance()` for pool wallet
3. Calculate pool health: balance > 80% target → "healthy", 40-80% → "warning", <40% → "critical"
4. Check each member's inactivity:
   - lastContribution > 30 days ago → status = "inactive"
   - lastContribution > 90 days ago → status = "removable"
5. Check active requests for expiry (past expiresAt) → cancel escrow if needed → **reclaim reserves**
6. Return everything

**Output:**
```json
{
  "fund": { "id", "name", "quorumRequired", "minContribution", ... },
  "poolBalance": 450000000,
  "poolHealth": "healthy",
  "members": [{ "displayName", "walletAddress", "status", "totalContributed", ... }],
  "activeRequests": [{ "id", "amount", "description", "status", "votes", ... }],
  "recentContributions": [{ "amount", "txHash", "memberName", "createdAt" }]
}
```

### `POST /api/fund/[fundId]/contribute` — Record a contribution
**Input:**
```json
{
  "walletAddress": "rXXXX...",
  "amount": 5000000,
  "txHash": "ABCDEF123..."
}
```
**Logic:**
1. Verify the TX hash exists on XRPL and matches (destination = fund wallet, amount correct)
2. Find the member by walletAddress + fundId
3. Update member: totalContributed += amount, lastContribution = now, status = "active"
4. Save Contribution to DB
5. Return updated member stats

### `POST /api/fund/[fundId]/request` — Submit an emergency request
**Input:**
```json
{
  "requesterAddress": "rXXXX...",
  "amount": 20000000,
  "description": "Medical emergency — hospital bill",
  "documentHash": "a1b2c3d4..."
}
```
**Logic:**
1. Validate requester is an active member
2. Check no other active request from this member
3. Calculate request cap:
   - `individualCap = member.totalContributed * fund.requestCapMultiplier`
   - `poolCap = poolBalance * fund.maxPoolPercent`
   - `maxAllowed = min(individualCap, poolCap)`
   - Reject if amount > maxAllowed
4. Call `generateConditionAndFulfillment()` → get condition + fulfillment
5. Call `createEscrow()` with condition and 10-min expiry (configurable)
6. Save Request to DB (fulfillment stored server-side only, NEVER exposed to client)
7. Set status = "voting", expiresAt = now + 10min
8. Return request details (without fulfillment)

### `POST /api/fund/[fundId]/request/[requestId]/vote` — Cast a vote
**Input:**
```json
{
  "voterAddress": "rYYYY...",
  "vote": "support",
  "signedTxBlob": "1200..."
}
```
**Logic:**
1. Validate voter is an active member, not the requester
2. Check voter hasn't already voted on this request
3. Check request is still in "voting" status and not expired
4. Save Vote to DB
5. If vote = "support":
   a. Validate `signedTxBlob` is a valid multi-sign of the expected EscrowFinish TX
   b. Store the signature blob
   c. Count total "support" votes
   d. If support count >= quorumRequired:
      - Collect all signature blobs
      - Call `combineSignatures()` → combined multi-signed TX
      - Call `submitMultiSigned()` → submit to XRPL
      - Update request status to "released"
      - Return `{ status: "released", txHash: "..." }`
6. If vote = "pass": just save, no on-chain action
7. Return current vote tally

### `GET /api/fund/[fundId]/request/[requestId]` — Get request for voting
**Output:**
```json
{
  "request": { "id", "amount", "description", "documentHash", "status", "expiresAt" },
  "votes": { "support": 2, "pass": 1, "total": 3 },
  "voterNames": ["Alice", "Carol"],
  "quorumRequired": 3,
  "unsignedEscrowFinishTx": { ... },
  "timeRemaining": "8m 30s"
}
```
- The `unsignedEscrowFinishTx` is the TX that voters sign via GemWallet multi-sign
- This TX is the same for all voters (they each add their own signature)

---

## Frontend Pages — Detailed

### Landing Page (`src/app/page.tsx`)
- If wallet not connected: Pulse logo, tagline, "Connect GemWallet" button
- If connected but no funds: "Create a Fund" + "Join a Fund (enter invite code)" buttons
- If connected with funds: list of FundCards → click to go to dashboard

### Onboarding (`src/app/onboarding/page.tsx`)
- Step 1: Enter invite code (text input)
- Step 2: Enter your name (text input)
- Step 3: Connect GemWallet (button → `getWalletAddress()`)
- NFT minted automatically server-side (no manual acceptance step)
- Human language: "Welcome to the community! Your membership card is ready."

### Create Fund (`src/app/fund/create/page.tsx`)
- Form fields: Fund name, Description, Quorum (N-of-M with dropdowns), Min monthly XRP (number input), Request cap multiplier (dropdown: 1x/2x/3x), Max pool % (dropdown: 10%/20%/30%)
- Submit → shows invite code to share with members
- Human language: "Your community fund is ready! Share this code with your neighbors."

### Fund Dashboard (`src/app/fund/[fundId]/page.tsx`)
- **Top:** HeartbeatPulse placeholder (pool health)
- **Stats row:** Pool balance (XRP), Members count, Active requests count
- **Health bar:** Green/orange/red color bar
- **Quick actions:** "Contribute" button (green, prominent), "I need help" button (if eligible)
- **Active requests:** List of RequestCards with RequestProgressTracker
- **Members:** MemberList with status badges
- **Recent activity:** "Alice contributed 5 XRP — 2 hours ago" style feed
- **Personal countdown:** "12 days left to contribute" warning if applicable
- Auto-refreshes via SWR with 5-second polling

### Contribute (`src/app/fund/[fundId]/contribute/page.tsx`)
- Amount input pre-filled with minimum (e.g. "5 XRP")
- Option to give more (slider or manual input)
- "Send contribution" button → builds Payment TX → GemWallet signs and submits
- Success state: "Your contribution is secured! Thank you." with pulse animation
- Post-success: calls `POST /api/fund/[fundId]/contribute` with the txHash to record it

### Emergency Request (`src/app/fund/[fundId]/request/page.tsx`)
- Step 1: "How much do you need?" — Amount slider/input showing max cap
  - Shows: "You can request up to X XRP (based on your contributions and pool size)"
- Step 2: "What happened?" — Textarea for description
- Step 3: "Add a supporting document" — File upload (photo/PDF)
  - Client-side SHA-256 hash computed and displayed
  - "Your document stays on your device. Only its fingerprint is recorded for verification."
- Submit → calls `POST /api/fund/[fundId]/request`
- Success: "Your request has been submitted. Your neighbors will vote within 10 minutes."

### Voting (`src/app/fund/[fundId]/vote/[requestId]/page.tsx`)
- Request details: who, how much, description
- Document hash displayed (for verification)
- SolidarityWall placeholder (shows current voters)
- RequestProgressTracker placeholder (shows status)
- Time remaining countdown
- Two buttons:
  - "I support this" (green) → fetches unsigned EscrowFinish TX → GemWallet multi-sign → POST signature to API
  - "I'll pass" (gray) → POST pass vote → no on-chain action, anonymous
- Human language: "Sarah needs help — she has a medical emergency."

---

## App-Layer Business Rules (enforced in API routes, not on-chain)

1. **Request cap:** `min(memberContributions × multiplier, poolBalance × maxPoolPercent)` — checked before escrow creation
2. **Inactivity:** No contribution in 30 days → status "inactive" (lose vote/request rights). 90 days → "removable".
3. **No rage quit:** No withdrawal mechanism. Contributions are permanent.
4. **One active request per member.** Reject new request if existing one is pending.
5. **Requester excluded from own vote.** Cannot sign own EscrowFinish.
6. **No signer list changes during active vote.** Reject add/remove member if a request is in "voting" status.
7. **Auto-cancel expired escrows.** On dashboard load, check requests past expiresAt → call `cancelEscrow()`.

---

## Implementation Steps (Small Modules)

Each step is a self-contained unit of work that can be done in one conversation. Steps are ordered by dependency.

### Step 1: Project Scaffolding
- `npx create-next-app` with TypeScript + Tailwind + App Router
- Install all deps: `xrpl`, `@gemwallet/api`, `framer-motion`, `lucide-react`, `prisma`, `@prisma/client`, `five-bells-condition`, `swr`, `zod`
- Create `.env.local` template
- Set up `tailwind.config.ts` with dark theme colors
- Create `globals.css` with Tailwind imports
- Create root `layout.tsx` (dark theme, font, metadata)
- Create `src/lib/db/prisma.ts` singleton
- **Files created:** `package.json`, `tailwind.config.ts`, `src/app/layout.tsx`, `src/app/globals.css`, `src/lib/db/prisma.ts`, `.env.local`

### Step 2: Prisma Database Schema
- Write full `prisma/schema.prisma` (Fund, Member, Contribution, Request, Vote)
- Run `npx prisma db push` to create SQLite DB
- Generate Prisma client
- **Files created:** `prisma/schema.prisma`

### Step 3: TypeScript Types + Utilities
- Create `src/types/fund.ts` (Fund, Member, Contribution interfaces)
- Create `src/types/request.ts` (Request, Vote, RequestStatus types)
- Create `src/lib/utils/xrp.ts` (dropsToXrp, xrpToDrops, formatXrp)
- Create `src/lib/utils/validation.ts` (Zod schemas for all API inputs)
- **Files created:** `src/types/fund.ts`, `src/types/request.ts`, `src/lib/utils/xrp.ts`, `src/lib/utils/validation.ts`

### Step 4: XRPL Client + Account Utilities
- Create `src/lib/xrpl/client.ts` — singleton WebSocket client
- Create `src/lib/xrpl/account.ts` — getBalance, getAccountInfo, getTxHistory, getSignerList
- Create `src/lib/xrpl/faucet.ts` — testnet wallet creation
- Create `GET /api/xrpl/status/route.ts` — health check endpoint
- **Test:** Call the health check API to verify XRPL connection works
- **Files created:** `src/lib/xrpl/client.ts`, `src/lib/xrpl/account.ts`, `src/lib/xrpl/faucet.ts`, `src/app/api/xrpl/status/route.ts`

### Step 5: XRPL Payment + Conditions
- Create `src/lib/xrpl/payment.ts` — buildContributionTx, buildReleaseTx
- Create `src/lib/xrpl/conditions.ts` — generateConditionAndFulfillment (using five-bells-condition)
- Create `src/lib/crypto/hash.ts` — client-side SHA-256
- **Files created:** `src/lib/xrpl/payment.ts`, `src/lib/xrpl/conditions.ts`, `src/lib/crypto/hash.ts`

### Step 6: XRPL Escrow
- Create `src/lib/xrpl/escrow.ts` — createEscrow, buildEscrowFinishTx, cancelEscrow
- **Test:** Create a testnet escrow, then finish it with fulfillment
- **Files created:** `src/lib/xrpl/escrow.ts`

### Step 7: XRPL Multi-Signature
- Create `src/lib/xrpl/multisig.ts` — setupSignerList, addSigner, removeSigner, combineSignatures, submitMultiSigned
- **Test:** Set up a 2-of-3 signer list on a testnet account, sign a TX with 2 signers, submit
- **Files created:** `src/lib/xrpl/multisig.ts`

### Step 8: XRPL NFT (Soulbound)
- Create `src/lib/xrpl/nft.ts` — mintMembershipNFT, verifyMembership, burnMembershipNFT
- **Test:** Mint a non-transferable NFT, verify it appears on recipient account
- **Files created:** `src/lib/xrpl/nft.ts`

### ~~Step 9: XRPL WebSocket Subscriptions~~ — REMOVED
> Replaced by SWR polling. No files to create.

### Step 10: GemWallet Integration
- Create `src/lib/gemwallet/client.ts` — checkGemWallet, getWalletAddress, signTransaction, multiSignTransaction, submitTransaction
- Create `src/contexts/WalletContext.tsx` — React context with address, isConnected, connect, disconnect (persists in localStorage)
- Create `src/lib/hooks/useWallet.ts` — convenience hook
- **Files created:** `src/lib/gemwallet/client.ts`, `src/contexts/WalletContext.tsx`, `src/lib/hooks/useWallet.ts`

### Step 11: UI Components
- Create all UI components: Button, Card, Input, Modal, Badge, Spinner
- Create layout components: Header, PageShell
- Create ConnectWallet component
- **Files created:** `src/components/ui/*.tsx`, `src/components/layout/*.tsx`, `src/components/wallet/ConnectWallet.tsx`

### Step 12: Placeholder Animation Components
- Create `src/components/animations/HeartbeatPulse.tsx` — correct props interface + simple placeholder visual (green/orange/red circle with balance text)
- Create `src/components/animations/SolidarityWall.tsx` — correct props interface + simple placeholder (list of voter names with checkmarks)
- Create `src/components/animations/RequestProgressTracker.tsx` — correct props interface + simple placeholder (horizontal step indicator)
- Create `src/app/test-animations/page.tsx` — interactive test page (from ANIMATION_SPECS.md)
- **Files created:** `src/components/animations/*.tsx`, `src/app/test-animations/page.tsx`

### Step 13: Fund API Routes
- Create `POST /api/fund` — create fund (wallet creation + signer list + NFT + DB)
- Create `GET /api/fund` — list funds for a wallet address
- Create `GET /api/fund/[fundId]` — full dashboard data
- Create `POST /api/fund/[fundId]/members` — join fund via invite
- Create `DELETE /api/fund/[fundId]/members/[memberId]` — remove member (organizer)
- **Files created:** `src/app/api/fund/route.ts`, `src/app/api/fund/[fundId]/route.ts`, `src/app/api/fund/[fundId]/members/route.ts`, `src/app/api/fund/[fundId]/members/[memberId]/route.ts`

### Step 14: Contribution API Route
- Create `POST /api/fund/[fundId]/contribute` — record contribution after on-chain confirm
- **Files created:** `src/app/api/fund/[fundId]/contribute/route.ts`

### Step 15: Request + Vote API Routes
- Create `POST /api/fund/[fundId]/request` — create request + escrow
- Create `GET /api/fund/[fundId]/request` — list requests
- Create `GET /api/fund/[fundId]/request/[requestId]` — request details + unsigned TX for voting
- Create `POST /api/fund/[fundId]/request/[requestId]/vote` — cast vote + signature collection + quorum check + auto-release
- **Files created:** `src/app/api/fund/[fundId]/request/route.ts`, `src/app/api/fund/[fundId]/request/[requestId]/route.ts`, `src/app/api/fund/[fundId]/request/[requestId]/vote/route.ts`

### Step 16: Fund Components
- Create FundCard, MemberList, ContributionHistory, PoolStats
- Create SWR hooks: `useFund.ts`, `useRequest.ts`
- **Files created:** `src/components/fund/*.tsx`, `src/lib/hooks/useFund.ts`, `src/lib/hooks/useRequest.ts`

### Step 17: Request + Vote Components
- Create RequestCard, RequestForm (3-step wizard), DocumentUpload
- Create VoteButtons ("I support" / "I pass")
- **Files created:** `src/components/request/*.tsx`, `src/components/vote/VoteButtons.tsx`

### Step 18: Landing Page + Onboarding Page
- Create `src/app/page.tsx` — landing with wallet connection + fund list
- Create `src/app/onboarding/page.tsx` — invite code → name → connect → accept NFT
- **Files created:** `src/app/page.tsx`, `src/app/onboarding/page.tsx`

### Step 19: Create Fund Page
- Create `src/app/fund/create/page.tsx` — form with all parameters + invite code display
- **Files created:** `src/app/fund/create/page.tsx`

### Step 20: Fund Dashboard Page
- Create `src/app/fund/[fundId]/page.tsx` — assembles HeartbeatPulse, PoolStats, MemberList, RequestCards, ContributionHistory
- Real-time refresh via SWR (5s polling)
- **Files created:** `src/app/fund/[fundId]/page.tsx`

### Step 21: Contribute Page
- Create `src/app/fund/[fundId]/contribute/page.tsx` — amount input + GemWallet sign + success state
- **Files created:** `src/app/fund/[fundId]/contribute/page.tsx`

### Step 22: Emergency Request Page
- Create `src/app/fund/[fundId]/request/page.tsx` — 3-step form with SHA-256 hashing
- **Files created:** `src/app/fund/[fundId]/request/page.tsx`

### Step 23: Voting Page
- Create `src/app/fund/[fundId]/vote/[requestId]/page.tsx` — request details + SolidarityWall + vote buttons + countdown
- **Files created:** `src/app/fund/[fundId]/vote/[requestId]/page.tsx`

### Step 24: Polish + Human-Friendly Copy
- Replace all blockchain jargon with human language across all pages
- Add loading states (Spinner) and error handling to all pages
- Add mobile responsiveness
- Ensure all user-facing text follows the UX guidelines from the spec
- Add "View on ledger" links (discreet) for XRPL explorer

---

## What YOU Must Do (cannot be automated)

1. **Install GemWallet browser extension** from the Chrome Web Store
2. **Switch GemWallet to XRPL Testnet** — Settings → Network → Testnet
3. **Create `.env.local`** (I'll provide the template, you just create the file):
   ```
   XRPL_NETWORK=wss://s.altnet.rippletest.net:51233
   NEXT_PUBLIC_XRPL_NETWORK=testnet
   DATABASE_URL="file:./dev.db"
   ESCROW_EXPIRY_SECONDS=600
   ```
4. **For multi-user demo:** Use multiple Chrome profiles, each with GemWallet installed and a separate testnet wallet
5. **Fund testnet wallets** — The app uses the faucet API automatically, but you can also get test XRP at faucet.altnet.rippletest.net

---

## Verification Plan (End-to-End Test)

1. **Start the app:** `npm run dev` → visit `http://localhost:3000`
2. **Connect wallet:** Click "Connect GemWallet" → verify address shown
3. **Create fund:** Fill form → verify fund wallet created on testnet explorer → verify invite code shown
4. **Join fund (2nd profile):** Enter invite code → verify added to signer list → verify NFT minted
5. **Contribute:** Each member contributes 20 XRP → verify balance on dashboard + heartbeat pulse
6. **Submit request:** One member submits request → verify escrow created on-chain → verify voting UI appears
7. **Vote:** Other members vote "I support" → verify signatures collected → when quorum reached, verify funds released
8. **Check release:** Requester's balance increased → dashboard shows "Funds released" → progress tracker at "Released"
9. **Test expiry:** Submit a request, don't vote → wait 10 min → verify escrow cancelled + status "Expired"
10. **Test inactivity:** Check that inactive member warnings display correctly

---

## Key Risk Mitigations

| Risk | Mitigation |
|------|-----------|
| GemWallet multi-sign might not support `multisign: true` | User will test manually. Fall back: server-side signing with stored seed for demo. Document the limitation. |
| Crypto-conditions encoding is tricky | Use `five-bells-condition` npm package for correct RFC encoding. Manual `.d.ts` declaration file if no @types available. |
| Escrow creation might fail if fund wallet has insufficient reserve | Fund wallet starts with 1000 test XRP; reserve is 2 XRP + 2 XRP per escrow. **Add cleanup of cancelled/finished escrows to reclaim reserves.** |
| Signer list changes invalidate pending multi-sign TXs | Block signer list changes while a vote is active |
| SQLite concurrent writes | Use Prisma's built-in connection pooling; hackathon-scale traffic is fine |
| Partial failure during fund creation | Wrap fund creation in try/catch with rollback (delete DB record on chain failure) or mark fund status as "failed" |
| Members don't know there's a vote pending | Dashboard shows active requests with a prominent "X votes pending" badge. No push notifications for hackathon. |

---

## Design Decisions (Post-Review)

1. **Drop WebSocket subscriptions (Step 9) — use SWR polling only.** Both mechanisms overlap. SWR polling at 5s is simpler and less bug-prone for hackathon. Remove `src/lib/xrpl/subscribe.ts` from the plan.
2. **Simplify NFT acceptance.** Skip `NFTokenAcceptOffer` step in onboarding. Mint NFT directly to recipient (server-side) to reduce friction. If XRPL requires a two-step mint+offer flow, auto-accept server-side using the fund wallet.
3. **Escrow cleanup.** On dashboard load, check for expired escrows → cancel them → reclaim reserves. Add to `GET /api/fund/[fundId]` logic.
4. **GemWallet multi-sign.** User tests this independently. If it doesn't work, voting falls back to server-side signing with stored fund wallet seed.
