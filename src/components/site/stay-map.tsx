"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import type { StayPlace } from "@/lib/site-content";

// An interactive map (Leaflet + OpenStreetMap) with the venue and each place to stay.
// Clicking a pin opens a small card; clicking a list entry elsewhere on the page can focus a pin via the hash.
export function StayMap({ places }: { places: StayPlace[] }) {
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
    <div ref={el} role="application" aria-label="Map of places to stay around the venue" className="z-0 h-[22rem] w-full bg-secondary sm:h-[30rem]" />
  );
}
