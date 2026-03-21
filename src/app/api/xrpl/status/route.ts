import { NextResponse } from "next/server";
import { getClient, getXrplUrl } from "@/lib/xrpl/client";

export async function GET() {
  const url = getXrplUrl();

  try {
    const client = await getClient();
    const serverInfo = await client.request({ command: "server_info" });
    const info = serverInfo.result.info;

    return NextResponse.json({
      status: "connected",
      url,
      serverVersion: info.build_version,
      completeLedgers: info.complete_ledgers,
      networkId: info.network_id,
      validatedLedger: info.validated_ledger?.seq,
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        url,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 503 }
    );
  }
}
