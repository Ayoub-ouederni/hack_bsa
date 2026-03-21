import { Client } from "xrpl";

const XRPL_URL =
  process.env.XRPL_NETWORK ?? "wss://s.altnet.rippletest.net:51233";

const CONNECTION_TIMEOUT_MS = 10_000;

let client: Client | null = null;
let connectPromise: Promise<Client> | null = null;

export async function getClient(): Promise<Client> {
  if (client && client.isConnected()) {
    return client;
  }

  if (connectPromise) {
    return connectPromise;
  }

  connectPromise = connectWithTimeout();
  try {
    return await connectPromise;
  } finally {
    connectPromise = null;
  }
}

async function connectWithTimeout(): Promise<Client> {
  if (!client) {
    client = new Client(XRPL_URL, { timeout: CONNECTION_TIMEOUT_MS });
    setupAutoReconnect(client);
  }

  await client.connect();
  return client;
}

function setupAutoReconnect(c: Client): void {
  c.on("disconnected", (code: number) => {
    if (code !== 1000) {
      console.warn(`[XRPL] Disconnected unexpectedly (code ${code})`);
    }
    client = null;
    connectPromise = null;
  });

  c.on("error", (error) => {
    console.error("[XRPL] Client error:", error);
  });
}

export async function disconnectClient(): Promise<void> {
  if (client) {
    await client.disconnect();
    client = null;
  }
}
