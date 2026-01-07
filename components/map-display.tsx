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

    const map = L.map(mapRef.current).setView(
      [latitude, longitude],
      15
    )

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map)

    const customIcon = L.divIcon({
      className: "custom-marker",
      html: "📍",
      iconSize: [32, 32],
      iconAnchor: [16, 32],
    })

    L.marker([latitude, longitude], { icon: customIcon })
      .addTo(map)
      .bindPopup(`<b>${storeName}</b>`)

    mapInstanceRef.current = map

    return () => {
      map.remove()
      mapInstanceRef.current = null
    }
  }, [latitude, longitude, storeName])

  return <div ref={mapRef} className="w-full h-full" />
}
