export type RequestStatus =
  | "submitted"
  | "voting"
  | "approved"
  | "released"
  | "expired"
  | "cancelled";

export interface Request {
  id: string;
  fundId: string;
  requesterAddress: string;
  amount: number;
  description: string;
  documentHash: string;
  escrowSequence: number | null;
  escrowCondition: string | null;
  status: RequestStatus;
  expiresAt: string | null;
  createdAt: string;
}

export interface Vote {
  id: string;
  requestId: string;
  voterAddress: string;
  signature: string;
  createdAt: string;
}

export interface VoteTally {
  support: number;
  total: number;
}

export interface RequestDetails {
  request: Request;
  votes: VoteTally;
  supporterNames: string[];
  quorumRequired: number;
  unsignedEscrowFinishTx: Record<string, unknown> | null;
  timeRemaining: string | null;
}
