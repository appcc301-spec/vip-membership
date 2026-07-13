import "server-only";
import { getActiveArtists } from "./members";
import { type Artist } from "./data";

/**
 * Returns the first active artist from the DB.
 * Used by public pages that need a default artist brand.
 */
export async function getPrimaryArtist(): Promise<Artist | null> {
  try {
    const artists = await getActiveArtists();
    return artists[0] ?? null;
  } catch {
    return null;
  }
}

/** Fallback artist name from env, then generic default */
export const DEFAULT_ARTIST_NAME =
  process.env.ARTIST_NAME || "Robert Plant";
