"use client";

import { useEffect, useRef, useState } from "react";
import "maplibre-gl/dist/maplibre-gl.css";

type Props = {
  latitude: number | null;
  longitude: number | null;
  onSelect?: (lat: number, lon: number) => void;
  readOnly?: boolean;
};

export default function LandLocationPicker({
  latitude,
  longitude,
  onSelect,
  readOnly = false
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("maplibre-gl").Map | null>(null);
  const markerRef = useRef<import("maplibre-gl").Marker | null>(null);
  const libraryRef = useRef<typeof import("maplibre-gl") | null>(null);

  const callbackRef = useRef(onSelect);
  const locationRef = useRef({ latitude, longitude });
  const [error, setError] = useState("");

  callbackRef.current = onSelect;
  locationRef.current = { latitude, longitude };

  useEffect(() => {
    let disposed = false;
    let localMap: import("maplibre-gl").Map | null = null;

    async function initialize() {
      try {
        const gl = await import("maplibre-gl");

        if (disposed || !containerRef.current) return;

        libraryRef.current = gl;

        const current = locationRef.current;
        const hasLocation =
          current.latitude != null &&
          current.longitude != null;

        const map = new gl.Map({
          container: containerRef.current,
          center: hasLocation
            ? [current.longitude!, current.latitude!]
            : [35, 39],
          zoom: hasLocation ? 10 : 5,
          style: {
            version: 8,
            sources: {
              osm: {
                type: "raster",
                tiles: [
                  "https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                ],
                tileSize: 256,
                attribution: "© OpenStreetMap contributors"
              }
            },
            layers: [
              {
                id: "osm-tiles",
                type: "raster",
                source: "osm"
              }
            ]
          }
        });

        localMap = map;
        mapRef.current = map;

        map.addControl(
          new gl.NavigationControl(),
          "top-right"
        );

        if (hasLocation) {
          markerRef.current = new gl.Marker({
            color: "#166534"
          })
            .setLngLat([
              current.longitude!,
              current.latitude!
            ])
            .addTo(map);
        }

        if (!readOnly) {
          map.on("click", event => {
            // Yaklaşık 1 km ölçeğinde yuvarlama.
            const lat = Number(event.lngLat.lat.toFixed(2));
            const lon = Number(event.lngLat.lng.toFixed(2));
            callbackRef.current?.(lat, lon);
          });
        }
      } catch {
        if (!disposed) {
          setError("Harita yüklenemedi. Tarayıcı ve internet bağlantısını kontrol et.");
        }
      }
    }

    void initialize();

    return () => {
      disposed = true;
      localMap?.remove();
      mapRef.current = null;
      markerRef.current = null;
      libraryRef.current = null;
    };
  }, [readOnly]);

  useEffect(() => {
    const map = mapRef.current;
    const gl = libraryRef.current;

    if (!map || !gl) return;

    if (latitude == null || longitude == null) {
      markerRef.current?.remove();
      markerRef.current = null;
      return;
    }

    if (markerRef.current) {
      markerRef.current.setLngLat([longitude, latitude]);
    } else {
      markerRef.current = new gl.Marker({
        color: "#166534"
      })
        .setLngLat([longitude, latitude])
        .addTo(map);
    }

    map.flyTo({
      center: [longitude, latitude],
      zoom: Math.max(map.getZoom(), 9),
      essential: true
    });
  }, [latitude, longitude]);

  return (
    <div className="space-y-3">
      <div
        ref={containerRef}
        className="h-[340px] w-full overflow-hidden rounded-2xl border border-green-100 bg-green-50"
        aria-label="Arazi konumu haritası"
      />

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      {latitude != null && longitude != null ? (
        <p className="text-sm text-green-800">
          Yaklaşık konum: {latitude.toFixed(2)}°, {longitude.toFixed(2)}°
        </p>
      ) : (
        <p className="text-sm text-gray-500">
          Henüz konum seçilmedi.
        </p>
      )}

      {!readOnly && (
        <p className="text-xs leading-6 text-gray-500">
          Haritayı yakınlaştırıp istediğin bölgeye tıkla.
          Tam parsel konumunu işaretleme; seçimin yaklaşık
          koordinata yuvarlanıp herkese açık kaydedilecek.
        </p>
      )}
    </div>
  );
}
