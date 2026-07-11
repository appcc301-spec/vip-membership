"use client";

import Script from "next/script";

const ARTIST_ID = "id_67883";
const OFFICIAL_ARTIST_URL = "https://www.bandsintown.com/a/67883-robert-plant";
const WIDGET_SCRIPT_URL = "https://widgetv3.bandsintown.com/main.js";

/**
 * Official Bandsintown widget integration.
 *
 * Bandsintown provides a free, supported widget that automatically stays in
 * sync with the artist's official tour dates. It is the recommended way to
 * display events on a website when you do not have a Bandsintown API key.
 *
 * Docs:
 * - https://help.artists.bandsintown.com/en/articles/7053415-set-up-your-widget
 * - https://www.artist.bandsintown.com/tutorials/widget-tutorial
 */
export function BandsintownWidget() {
  return (
    <div className="min-h-[200px] w-full">
      <a
        className="bit-widget-initializer"
        data-artist-name={ARTIST_ID}
        data-display-local-dates="false"
        data-display-past-dates="false"
        data-auto-style="false"
        data-text-color="#e5e5e5"
        data-link-color="#c9a84c"
        data-popup-background-color="#1a1a1a"
        data-background-color="transparent"
        data-display-limit="10"
        data-link-text-color="#0a0a0a"
        data-display-lineup="false"
        data-separator-color="rgba(201,168,76,0.25)"
        data-tour-dates-bottom-border-color="rgba(201,168,76,0.25)"
        data-bit-widget-position="above"
        data-bit-widget-title="Robert Plant Upcoming Tour Dates"
        href={OFFICIAL_ARTIST_URL}
      >
        View Robert Plant tour dates on Bandsintown
      </a>
      <Script src={WIDGET_SCRIPT_URL} strategy="lazyOnload" />
    </div>
  );
}
