import { z } from "zod";

const xrplAddress = z
  .string()
  .min(25)
  .max(35)
  .regex(/^r[1-9A-HJ-NP-Za-km-z]+$/, "Invalid XRPL address");

export const createFundSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  organizerAddress: xrplAddress,
  quorumRequired: z.number().int().min(1).max(32),
  minContribution: z.number().int().min(1),
  requestCapMultiplier: z.number().min(0.1).max(10).default(2.0),
  maxPoolPercent: z.number().min(0.01).max(1).default(0.2),
});

export const joinFundSchema = z.object({
  inviteCode: z.string().min(1).max(20),
  walletAddress: xrplAddress,
  signerAddress: xrplAddress,
  displayName: z.string().min(1).max(50),
});

export const contributeSchema = z.object({
  walletAddress: xrplAddress,
  amount: z.number().int().min(1),
  txHash: z.string().min(1).max(128),
});

export const createRequestSchema = z.object({
  requesterAddress: xrplAddress,
  amount: z.number().int().min(1),
  description: z.string().min(1).max(1000),
  documentHash: z
    .string()
    .length(64)
    .regex(/^[a-f0-9]+$/, "Invalid SHA-256 hash"),
});

export const castVoteSchema = z.object({
  voterAddress: xrplAddress,
  signerAddress: xrplAddress,
  signedTxBlob: z.string().min(1),
});

export type CreateFundInput = z.infer<typeof createFundSchema>;
export type JoinFundInput = z.infer<typeof joinFundSchema>;
export type ContributeInput = z.infer<typeof contributeSchema>;
export type CreateRequestInput = z.infer<typeof createRequestSchema>;
export type CastVoteInput = z.infer<typeof castVoteSchema>;
