"use client";

import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import type { StayPlace } from "@/lib/site-content";

// The map of the venue and each place to stay: an interactive Google map when a key is set
// (NEXT_PUBLIC_GOOGLE_MAPS_API_KEY), otherwise, or if Google refuses the key, the OpenStreetMap one below.
const GOOGLE_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim();

export function StayMap({ places }: { places: StayPlace[] }) {
  const [googleFailed, setGoogleFailed] = useState(false);
  if (GOOGLE_KEY && !googleFailed) return <GoogleMap places={places} apiKey={GOOGLE_KEY} onFail={() => setGoogleFailed(true)} />;
  return <LeafletMap places={places} />;
}

// Google reports a refused key (wrong key, referrer not allowed, billing off) after the script has loaded.
const keyRefused = new Set<() => void>();
let googleLoading: Promise<void> | null = null;
function loadGoogleMaps(apiKey: string) {
  if (!googleLoading) {
    googleLoading = new Promise<void>((resolve, reject) => {
      const w = window as unknown as { gm_authFailure?: () => void };
      w.gm_authFailure = () => keyRefused.forEach((f) => f());
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&v=weekly&loading=async&libraries=maps,marker`;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Google Maps did not load"));
      document.head.appendChild(script);
    });
  }
  return googleLoading;
}

const escapeHtml = (v: string) => v.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

// An interactive Google map: drag, pinch or use the buttons to zoom, switch to satellite, open Street View.
// Numbered pins match the list below (the gold one is the venue); clicking a pin opens a small card.
function GoogleMap({ places, apiKey, onFail }: { places: StayPlace[]; apiKey: string; onFail: () => void }) {
  const el = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    const refused = () => onFail();
    keyRefused.add(refused);
    (async () => {
      try {
        await loadGoogleMaps(apiKey);
        const { Map, InfoWindow } = (await google.maps.importLibrary("maps")) as google.maps.MapsLibrary;
        const { AdvancedMarkerElement } = (await google.maps.importLibrary("marker")) as google.maps.MarkerLibrary;
        if (cancelled || !el.current) return;
        const map = new Map(el.current, {
          mapId: "DEMO_MAP_ID", // needed for the custom pins; a styled map ID can replace it later
          gestureHandling: "cooperative", // the page keeps scrolling; two fingers (or ctrl + scroll) move the map
          streetViewControl: true,
          mapTypeControl: true,
          fullscreenControl: true,
        });
        const bounds = new google.maps.LatLngBounds();
        const info = new InfoWindow();
        places.forEach((p, i) => {
          const pin = document.createElement("div");
          pin.textContent = String(i + 1);
          pin.style.cssText = `display:grid;place-items:center;width:34px;height:34px;border-radius:9999px;font:600 14px Raleway,sans-serif;color:#fff;background:${p.onSite ? "#9a7b2f" : "#3a3a3a"};border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.35)`;
          const position = { lat: p.lat, lng: p.lng };
          const marker = new AdvancedMarkerElement({ map, position, content: pin, title: p.name });
          const dist = p.miles != null ? `${p.miles} miles from the venue` : "The wedding venue";
          marker.addListener("click", () => {
            info.setContent(`<div style="font-family:Raleway,sans-serif;font-size:14px;line-height:1.5"><strong>${escapeHtml(p.name)}</strong><br>${dist}<br><a href="#stay-${p.id}">See details</a></div>`);
            info.open({ map, anchor: marker });
          });
          bounds.extend(position);
        });
        map.fitBounds(bounds, 48);
      } catch {
        if (!cancelled) onFail(); // show the other map rather than an empty box
      }
    })();
    return () => {
      cancelled = true;
      keyRefused.delete(refused);
    };
  }, [places, apiKey, onFail]);

  return <div ref={el} role="application" aria-label="Map of places to stay around the venue" className="z-0 h-[26rem] w-full bg-secondary sm:h-[34rem]" />;
}

function LeafletMap({ places }: { places: StayPlace[] }) {
  const el = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let map: import("leaflet").Map | undefined;
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !el.current) return;
      map = L.map(el.current, { scrollWheelZoom: false, attributionControl: true });
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 18,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      const bounds = L.latLngBounds([]);
      places.forEach((p, i) => {
        const venue = !!p.onSite;
        const icon = L.divIcon({
          className: "",
          iconSize: [34, 34],
          iconAnchor: [17, 17],
          html: `<div style="display:grid;place-items:center;width:34px;height:34px;border-radius:9999px;font:600 14px Raleway,sans-serif;color:#fff;background:${venue ? "#9a7b2f" : "#3a3a3a"};border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.35)">${i + 1}</div>`,
        });
        const dist = p.miles != null ? `<br>${p.miles} miles from the venue` : "<br>The wedding venue";
        L.marker([p.lat, p.lng], { icon, title: p.name })
          .addTo(map!)
          .bindPopup(`<strong>${p.name}</strong>${dist}<br><a href="#stay-${p.id}">See details</a>`);
        bounds.extend([p.lat, p.lng]);
      });
      map.fitBounds(bounds, { padding: [36, 36] });
    })();
    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [places]);

  return (
    <div ref={el} role="application" aria-label="Map of places to stay around the venue" className="z-0 h-[26rem] w-full bg-secondary sm:h-[34rem]" />
  );
}
