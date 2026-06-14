import axios from "axios";

const TOKEN_URL = "https://id.twitch.tv/oauth2/token";
const EXPIRY_MARGIN_MS = 60 * 1000;

interface TwitchTokenResponse {
  access_token: string;
  expires_in: number;
}

let cachedToken: string | null = null;
let expiresAt = 0;
let inFlight: Promise<string> | null = null;

async function requestToken(): Promise<string> {
  const clientId = process.env.IGDB_CLIENT_ID;
  const clientSecret = process.env.IGDB_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("IGDB_CLIENT_ID e IGDB_CLIENT_SECRET não configurados.");
  }

  const response = await axios.post<TwitchTokenResponse>(TOKEN_URL, null, {
    params: { client_id: clientId, client_secret: clientSecret, grant_type: "client_credentials" },
    timeout: 10000,
  });

  cachedToken = response.data.access_token;
  expiresAt = Date.now() + response.data.expires_in * 1000 - EXPIRY_MARGIN_MS;
  return cachedToken;
}

export async function getIgdbToken(forceRefresh = false): Promise<string> {
  if (!forceRefresh && cachedToken && Date.now() < expiresAt) return cachedToken;
  if (!inFlight) {
    inFlight = requestToken().finally(() => {
      inFlight = null;
    });
  }
  return inFlight;
}

export function getIgdbClientId(): string {
  const clientId = process.env.IGDB_CLIENT_ID;
  if (!clientId) throw new Error("IGDB_CLIENT_ID não configurado.");
  return clientId;
}
