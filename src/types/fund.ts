export interface Fund {
  id: string;
  name: string;
  description: string | null;
  organizerAddress: string;
  fundWalletAddress: string;
  quorumRequired: number;
  minContribution: number;
  requestCapMultiplier: number;
  maxPoolPercent: number;
  inviteCode: string;
  createdAt: string;
}

export type MemberStatus = "active" | "inactive" | "removable";

export interface Member {
  id: string;
  fundId: string;
  walletAddress: string;
  signerAddress: string;
  displayName: string;
  totalContributed: number;
  lastContribution: string | null;
  status: MemberStatus;
  nftTokenId: string | null;
  joinedAt: string;
}

export interface Contribution {
  id: string;
  memberId: string;
  amount: number;
  txHash: string;
  createdAt: string;
}

export type PoolHealth = "healthy" | "warning" | "critical";

export interface FundDashboard {
  fund: Fund;
  poolBalance: number;
  poolHealth: PoolHealth;
  members: Member[];
  activeRequests: import("./request").Request[];
  recentContributions: (Contribution & { memberName: string })[];
}
