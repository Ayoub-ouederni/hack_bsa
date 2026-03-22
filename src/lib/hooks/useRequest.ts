"use client";

import useSWR from "swr";
import type { Request } from "@/types/request";
import type { RequestDetails } from "@/types/request";

const fetcher = (url: string) => fetch(url).then((res) => {
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
});

export function useRequests(fundId: string | null) {
  return useSWR<Request[]>(
    fundId ? `/api/fund/${fundId}/request` : null,
    fetcher,
    { refreshInterval: 5_000 }
  );
}

export function useRequestDetails(fundId: string | null, requestId: string | null) {
  return useSWR<RequestDetails>(
    fundId && requestId ? `/api/fund/${fundId}/request/${requestId}` : null,
    fetcher,
    { refreshInterval: 5_000 }
  );
}
