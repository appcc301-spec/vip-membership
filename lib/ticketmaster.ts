import "server-only";
import { type PlatformEvent } from "./data";
import { getActiveArtistRecord } from "./db";

/**
 * Ticketmaster Discovery API v2
 * Free public API — register at https://developer.ticketmaster.com to get a key.
 * No artist account required. Searches by keyword and returns structured event data.
 * Docs: https://developer.ticketmaster.com/products-and-docs/apis/discovery-api/v2/
 */

const TM_BASE = "https://app.ticketmaster.com/discovery/v2";
const DEFAULT_ARTIST = process.env.ARTIST_NAME || "Robert Plant";

async function getArtistKeyword(): Promise<string> {
  try {
    const active = await getActiveArtistRecord();
    if (active?.name) return active.name;
  } catch {}
  return DEFAULT_ARTIST;
}

export interface TicketmasterFetchResult {
  events: PlatformEvent[];
  endpoint: string;
  source: "ticketmaster";
  apiStatus?: number;
  errorMessage?: string;
}

export interface TicketmasterConnectionTest {
  ok: boolean;
  endpoint: string;
  apiStatus?: number;
  errorMessage?: string;
  rawResponse?: string;
}

interface TmEvent {
  id: string;
  name: string;
  url: string;
  dates?: {
    start?: { localDate?: string; localTime?: string };
    status?: { code?: string };
  };
  _embedded?: {
    venues?: Array<{
      name?: string;
      city?: { name?: string };
      country?: { name?: string; countryCode?: string };
    }>;
  };
  images?: Array<{ url: string; width: number; height: number }>;
  priceRanges?: Array<{ min?: number; max?: number }>;
  status?: { code?: string };
}

interface TmResponse {
  _embedded?: { events?: TmEvent[] };
  page?: { totalElements?: number };
}

// Keyword search endpoint — uses active artist name
export function getKeywordEndpoint(apiKey: string, keyword: string): string {
  return `${TM_BASE}/events.json?apikey=${apiKey}&keyword=${encodeURIComponent(keyword)}&sort=date,asc&size=50`;
}

// Keep for backward compat (used in testTicketmasterConnection)
export function getEndpoint(apiKey: string, keyword?: string): string {
  return getKeywordEndpoint(apiKey, keyword || DEFAULT_ARTIST);
}

/**
 * Fetch upcoming Robert Plant events from the Ticketmaster Discovery API.
 * Returns an empty array with a detailed error message if no API key is
 * configured or if the request fails. No demo/fallback data is returned.
 */
export async function fetchTicketmasterEvents(): Promise<TicketmasterFetchResult> {
  const apiKey = process.env.TICKETMASTER_API_KEY;
  const keyword = await getArtistKeyword();
  const endpoint = apiKey ? getKeywordEndpoint(apiKey, keyword) : getKeywordEndpoint("{{TICKETMASTER_API_KEY}}", keyword);

  if (!apiKey) {
    const message =
      "TICKETMASTER_API_KEY is not configured. Get a free key at https://developer.ticketmaster.com — no artist account needed.";
    console.warn(`[Ticketmaster] ${message}`);
    return { events: [], endpoint, source: "ticketmaster", errorMessage: message };
  }

  console.log(`[Ticketmaster] Fetching events for artist: "${keyword}"`);

  try {
    const result = await tryFetch(getKeywordEndpoint(apiKey, keyword));
    if (result.ok) return buildResult(result, result.endpoint);
    throw new Error(result.errorMessage || `Ticketmaster API returned ${result.apiStatus}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[Ticketmaster] Fetch failed.", message);
    return { events: [], endpoint, source: "ticketmaster", errorMessage: message };
  }
}

function buildResult(
  result: Awaited<ReturnType<typeof tryFetch>>,
  endpoint: string
): TicketmasterFetchResult {
  const body = result.data as TmResponse | undefined;
  const rawEvents: TmEvent[] = body?._embedded?.events ?? [];
  const events = rawEvents.map(mapTmEvent);
  console.log(`[Ticketmaster] Imported ${events.length} events.`);
  return {
    events,
    endpoint,
    source: "ticketmaster",
    apiStatus: result.apiStatus,
  };
}

export async function testTicketmasterConnection(): Promise<TicketmasterConnectionTest> {
  const apiKey = process.env.TICKETMASTER_API_KEY;
  if (!apiKey) {
    return {
      ok: false,
      endpoint: getEndpoint("{{TICKETMASTER_API_KEY}}"),
      errorMessage:
        "TICKETMASTER_API_KEY is not configured. Register free at https://developer.ticketmaster.com",
    };
  }

  const endpoint = getEndpoint(apiKey);
  try {
    const result = await tryFetch(endpoint);
    const rawResponse = result.data
      ? JSON.stringify(result.data).slice(0, 500)
      : undefined;
    return {
      ok: result.ok,
      endpoint: result.endpoint,
      apiStatus: result.apiStatus,
      errorMessage: result.errorMessage,
      rawResponse,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, endpoint, errorMessage: message };
  }
}

async function tryFetch(endpoint: string): Promise<{
  ok: boolean;
  endpoint: string;
  apiStatus?: number;
  data?: unknown;
  errorMessage?: string;
}> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    const res = await fetch(endpoint, {
      signal: controller.signal,
      next: { revalidate: 0 },
      headers: { Accept: "application/json" },
    });
    clearTimeout(timeout);

    if (!res.ok) {
      return {
        ok: false,
        endpoint,
        apiStatus: res.status,
        errorMessage: `Ticketmaster API returned ${res.status}`,
      };
    }

    const data = (await res.json()) as unknown;
    return { ok: true, endpoint, apiStatus: res.status, data };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, endpoint, errorMessage: message };
  }
}

function mapTmEvent(event: TmEvent): PlatformEvent {
  const venue = event._embedded?.venues?.[0];
  const date = event.dates?.start?.localDate ?? "";
  const time = event.dates?.start?.localTime ?? undefined;
  const status = inferStatus(event.dates?.status?.code);

  const bestImage = event.images
    ?.filter((i) => i.width >= 640)
    .sort((a, b) => b.width - a.width)[0];

  return {
    id: `tm-${event.id}`,
    title: event.name || "Live Event",
    date,
    time,
    venue: venue?.name ?? "TBA",
    city: venue?.city?.name ?? "TBA",
    country: venue?.country?.name ?? venue?.country?.countryCode ?? "TBA",
    imageUrl: bestImage?.url,
    ticketUrl: event.url,
    bandsintownUrl: undefined,
    type: "imported",
    status,
    featured: false,
    visible: true,
    syncedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function inferStatus(code?: string): PlatformEvent["status"] {
  switch (code?.toLowerCase()) {
    case "cancelled":
    case "canceled":
      return "cancelled";
    case "postponed":
      return "postponed";
    case "offsale":
    case "sold-out":
      return "sold_out";
    default:
      return "upcoming";
  }
}
