import { NextRequest, NextResponse } from "next/server";
import { getAvailableBalance, isValidAddress } from "@/lib/xrpl";

export async function GET(request: NextRequest) {
  const address = request.nextUrl.searchParams.get("address");

  if (!address || !isValidAddress(address)) {
    return NextResponse.json({ error: "Invalid address" }, { status: 400 });
  }

  try {
    const availableDrops = await getAvailableBalance(address);
    return NextResponse.json({ availableDrops });
  } catch {
    return NextResponse.json({ error: "Failed to fetch balance" }, { status: 500 });
  }
}
