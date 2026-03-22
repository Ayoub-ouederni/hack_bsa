"use client";

import useSWR from "swr";
import type { Fund } from "@/types/fund";
import type { FundDashboard } from "@/types/fund";

const fetcher = (url: string) => fetch(url).then((res) => {
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
});

interface FundListItem extends Fund {
  memberCount: number;
  requestCount: number;
}

export function useFunds(walletAddress: string | null) {
  return useSWR<FundListItem[]>(
    walletAddress ? `/api/fund?wallet=${walletAddress}` : null,
    fetcher,
    { refreshInterval: 10_000 }
  );
}

export function useFundDashboard(fundId: string | null) {
  return useSWR<FundDashboard>(
    fundId ? `/api/fund/${fundId}` : null,
    fetcher,
    { refreshInterval: 5_000 }
  );
}
