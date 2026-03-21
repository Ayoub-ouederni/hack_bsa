import { Client } from "xrpl";

const XRPL_URL =
  process.env.XRPL_NETWORK ?? "wss://s.altnet.rippletest.net:51233";

const CONNECTION_TIMEOUT_MS = 10_000;

let client: Client | null = null;

export async function getClient(): Promise<Client> {
  if (client && client.isConnected()) {
    return client;
  }

  if (!client) {
    client = new Client(XRPL_URL);
  }

  await client.connect();
  return client;
}

export async function disconnectClient(): Promise<void> {
  if (client) {
    await client.disconnect();
    client = null;
  }
}
