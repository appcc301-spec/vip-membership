import "server-only";
import { type PlatformEvent } from "./data";

/**
 * Official Robert Plant artist page on Bandsintown:
 * https://www.bandsintown.com/a/67883-robert-plant
 *
 * Bandsintown Public API documentation:
 * https://help.artists.bandsintown.com/en/articles/9186477-api-documentation
 *
 * The REST API endpoint documented by Bandsintown supports an artist slug
 * (e.g. "robert plant") or the artist id (e.g. "id_67883"). We use the
 * artist id because it is unambiguous and immune to name collisions.
 *
 * A valid BANDSINTOWN_APP_ID is required for live API calls. This is an
 * authenticated app key tied to the artist's Bandsintown for Artists account,
 * not a generic public identifier. Managers can obtain an API key from the
 * artist profile on https://artists.bandsintown.com (Settings > General).
 */
export const ARTIST_ID = "id_67883";
export const ARTIST_NAME = "robert plant";
export const BIT_BASE_URL = "https://rest.bandsintown.com";
export const OFFICIAL_ARTIST_URL = "https://www.bandsintown.com/a/67883-robert-plant";
export const WIDGET_SCRIPT_URL = "https://widgetv3.bandsintown.com/main.js";

export interface BandsintownEvent {
  id: string;
  url: string;
  datetime: string;
  title: string;
  venue: {
    name: string;
    city: string;
    country: string;
    region?: string;
    location?: string;
    latitude?: number;
    longitude?: number;
  };
  offers?: Array<{
    type: string;
    url: string;
    status: string;
  }>;
  artist?: {
    id: string;
    name: string;
    url: string;
    image_url: string;
  };
  description?: string;
  lineup?: string[];
}

export interface BandsintownFetchResult {
  events: PlatformEvent[];
  endpoint: string;
  source: "bandsintown_api";
  apiStatus?: number;
  errorMessage?: string;
}

export interface BandsintownConnectionTest {
  ok: boolean;
  endpoint: string;
  apiStatus?: number;
  errorMessage?: string;
  rawResponse?: string;
}

function getPrimaryEndpoint(appId: string): string {
  return `${BIT_BASE_URL}/artists/${ARTIST_ID}/events/?app_id=${encodeURIComponent(appId)}&date=upcoming`;
}

function getFallbackEndpoint(appId: string): string {
  return `${BIT_BASE_URL}/artists/${encodeURIComponent(ARTIST_NAME)}/events/?app_id=${encodeURIComponent(appId)}&date=upcoming`;
}

export function getEndpoint(appId: string): string {
  return getPrimaryEndpoint(appId);
}

/**
 * Fetch upcoming Robert Plant events from the Bandsintown API.
 * Returns an empty array with a detailed error message if no API key is
 * configured or if the request fails. No demo/fallback data is returned.
 */
export async function fetchBandsintownEvents(): Promise<BandsintownFetchResult> {
  const appId = process.env.BANDSINTOWN_APP_ID;
  const endpoint = appId ? getPrimaryEndpoint(appId) : getPrimaryEndpoint("{{BANDSINTOWN_APP_ID}}");

  if (!appId) {
    const message = "BANDSINTOWN_APP_ID is not configured. Live events are provided by the official Bandsintown widget; add an API key to enable database sync.";
    console.warn(`[Bandsintown] ${message}`);
    return {
      events: [],
      endpoint,
      source: "bandsintown_api",
      errorMessage: message,
    };
  }

  try {
    let result = await tryFetchEvents(getPrimaryEndpoint(appId));
    if (!result.ok && result.apiStatus === 404) {
      console.warn("[Bandsintown] Artist id lookup failed, trying artist name fallback.");
      result = await tryFetchEvents(getFallbackEndpoint(appId));
    }

    if (!result.ok) {
      throw new Error(result.errorMessage || `Bandsintown API returned ${result.apiStatus}`);
    }

    const data = result.data as BandsintownEvent[];
    if (!Array.isArray(data)) {
      throw new Error("Unexpected Bandsintown response format");
    }

    const events = data.map(mapBandsintownEvent);
    console.log(`[Bandsintown] Imported ${events.length} live events for artist ${ARTIST_ID}.`);
    return {
      events,
      endpoint: result.endpoint,
      source: "bandsintown_api",
      apiStatus: result.apiStatus,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[Bandsintown] Fetch failed.", message);
    return {
      events: [],
      endpoint,
      source: "bandsintown_api",
      errorMessage: message,
    };
  }
}

/**
 * Test the Bandsintown API connection without persisting anything.
 * Returns the HTTP status, endpoint, and the first ~500 characters of the
 * raw response body for debugging.
 */
export async function testBandsintownConnection(): Promise<BandsintownConnectionTest> {
  const appId = process.env.BANDSINTOWN_APP_ID;
  if (!appId) {
    return {
      ok: false,
      endpoint: getPrimaryEndpoint("{{BANDSINTOWN_APP_ID}}"),
      errorMessage: "BANDSINTOWN_APP_ID is not configured. The official Bandsintown widget still shows live dates; add an API key to test database sync.",
    };
  }

  const endpoint = getPrimaryEndpoint(appId);
  try {
    const result = await tryFetchEvents(endpoint);
    const rawResponse = result.data ? JSON.stringify(result.data).slice(0, 500) : undefined;
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

async function tryFetchEvents(endpoint: string): Promise<{ ok: boolean; endpoint: string; apiStatus?: number; data?: unknown; errorMessage?: string }> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    const res = await fetch(endpoint, {
      signal: controller.signal,
      next: { revalidate: 0 },
      headers: {
        Accept: "application/json",
      },
    });
    clearTimeout(timeout);

    if (!res.ok) {
      return { ok: false, endpoint, apiStatus: res.status, errorMessage: `Bandsintown API returned ${res.status}` };
    }

    const data = (await res.json()) as unknown;
    return { ok: true, endpoint, apiStatus: res.status, data };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, endpoint, errorMessage: message };
  }
}

function mapBandsintownEvent(event: BandsintownEvent): PlatformEvent {
  const [date, time] = event.datetime ? event.datetime.split("T") : ["", ""];
  const ticketOffer = event.offers?.find((o) => o.type === "Tickets" || o.url);
  const status = inferStatus(event.offers);
  const artistImage = event.artist?.image_url;
  return {
    id: `bit-${event.id}`,
    title: event.title || `Robert Plant Live`,
    date,
    time: time || undefined,
    venue: event.venue?.name || "TBA",
    city: event.venue?.city || "TBA",
    country: event.venue?.country || "TBA",
    imageUrl: artistImage,
    ticketUrl: ticketOffer?.url || event.url,
    bandsintownUrl: event.url || OFFICIAL_ARTIST_URL,
    type: "imported",
    status,
    featured: false,
    visible: true,
    syncedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function inferStatus(offers?: BandsintownEvent["offers"]): PlatformEvent["status"] {
  if (!offers || offers.length === 0) return "upcoming";
  const statuses = offers.map((o) => o.status?.toLowerCase());
  if (statuses.includes("sold out") || statuses.includes("sold_out")) return "sold_out";
  if (statuses.includes("cancelled") || statuses.includes("canceled")) return "cancelled";
  if (statuses.includes("postponed")) return "postponed";
  return "upcoming";
}

export function getOfficialArtistUrl(): string {
  return OFFICIAL_ARTIST_URL;
}
