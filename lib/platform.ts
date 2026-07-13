import "server-only";
import { getActiveArtist } from "./members";
import { type Artist } from "./data";

/**
 * Returns the artist marked as is_active=true in the DB.
 * Used by public pages to drive dynamic artist branding.
 */
export async function getPrimaryArtist(): Promise<Artist | null> {
  try {
    return (await getActiveArtist()) ?? null;
  } catch {
    return null;
  }
}

/** Fallback artist name from env, then generic default */
export const DEFAULT_ARTIST_NAME =
  process.env.ARTIST_NAME || "Robert Plant";
