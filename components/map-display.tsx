"use client"

import { useEffect, useRef } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

type MapDisplayProps = {
  latitude: number
  longitude: number
  storeName: string
}

export default function MapDisplay({
  latitude,
  longitude,
  storeName,
}: MapDisplayProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    // 🔧 Fix leaflet icon (กัน marker หายใน production)
    delete (L.Icon.Default.prototype as any)._getIconUrl
    L.Icon.Default.mergeOptions({
      iconRetinaUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      iconUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      shadowUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    })

    // 🗺️ Initialize map
    const map = L.map(mapRef.current).setView(
      [latitude, longitude],
      15
    )

    // 🌍 Tile layer
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map)

    // 📍 Custom marker
    const customIcon = L.divIcon({
      className: "custom-marker",
      html: `
        <div style="
          background-color: #ef4444;
          width: 32px;
          height: 32px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        ">
          <div style="
            transform: rotate(45deg);
            margin-top: 6px;
            text-align: center;
            font-size: 16px;
          ">
            📍
          </div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
    })

    L.marker([latitude, longitude], { icon: customIcon })
      .addTo(map)
      .bindPopup(`<b>${storeName}</b>`)

    mapInstanceRef.current = map

    // 🧹 Cleanup
    return () => {
      mapInstanceRef.current?.remove()
      mapInstanceRef.current = null
    }
  }, [latitude, longitude, storeName])

  // ⚠️ ต้องกำหนด height ชัด ไม่งั้น map ไม่ขึ้น
  return (
    <div
      ref={mapRef}
      className="w-full h-[400px] rounded-lg overflow-hidden"
    />
  )
}
