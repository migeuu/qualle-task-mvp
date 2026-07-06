import { createClient, type Client } from 'graphql-ws';
import { getToken } from './auth';
import { env } from './env';

let client: Client | null = null;

function getWsUrl(): string {
  return env.apiUrl.replace(/^http/, 'ws');
}

export function getSubscriptionClient(): Client {
  if (!client) {
    const token = getToken();
    client = createClient({
      url: getWsUrl(),
      connectionParams: () => ({
        Authorization: token ? `Bearer ${token}` : undefined,
      }),
    });
  }

  return client;
}

export function reconnectSubscriptionClient(): void {
  client?.terminate();
  client = null;
}

export function disconnectSubscriptionClient(): void {
  client?.terminate();
  client = null;
}
