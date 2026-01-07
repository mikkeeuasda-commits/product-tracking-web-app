"use client"

import { useEffect, useRef, useState } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { Button } from "@/components/ui/button"
import { MapPin, Navigation } from "lucide-react"

type MapPickerProps = {
  latitude: number | null
  longitude: number | null
  onLocationSelect: (lat: number, lng: number) => void
}

export default function MapPicker({ latitude, longitude, onLocationSelect }: MapPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const markerRef = useRef<L.Marker | null>(null)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    const defaultLat = latitude || 13.7563
    const defaultLng = longitude || 100.5018

    const map = L.map(mapRef.current).setView([defaultLat, defaultLng], 13)

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map)

    const customIcon = L.divIcon({
      className: "custom-marker",
      html: `<div style="background-color: #3b82f6; width: 36px; height: 36px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 3px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.4);"><div style="transform: rotate(45deg); margin-top: 7px; text-align: center; font-size: 18px;">📍</div></div>`,
      iconSize: [36, 36],
      iconAnchor: [18, 36],
    })

    if (latitude && longitude) {
      const marker = L.marker([latitude, longitude], { icon: customIcon, draggable: true }).addTo(map)
      marker.on("dragend", (e) => {
        const pos = e.target.getLatLng()
        onLocationSelect(pos.lat, pos.lng)
      })
      markerRef.current = marker
    }

    map.on("click", (e) => {
      if (markerRef.current) {
        markerRef.current.setLatLng(e.latlng)
      } else {
        const marker = L.marker(e.latlng, { icon: customIcon, draggable: true }).addTo(map)
        marker.on("dragend", (dragEvent) => {
          const pos = dragEvent.target.getLatLng()
          onLocationSelect(pos.lat, pos.lng)
        })
        markerRef.current = marker
      }
      onLocationSelect(e.latlng.lat, e.latlng.lng)
    })

    mapInstanceRef.current = map

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude
          const lng = position.coords.longitude
          setUserLocation({ lat, lng })
          onLocationSelect(lat, lng)

          if (mapInstanceRef.current) {
            mapInstanceRef.current.setView([lat, lng], 15)

            const customIcon = L.divIcon({
              className: "custom-marker",
              html: `<div style="background-color: #3b82f6; width: 36px; height: 36px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 3px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.4);"><div style="transform: rotate(45deg); margin-top: 7px; text-align: center; font-size: 18px;">📍</div></div>`,
              iconSize: [36, 36],
              iconAnchor: [18, 36],
            })

            if (markerRef.current) {
              markerRef.current.setLatLng([lat, lng])
            } else {
              const marker = L.marker([lat, lng], { icon: customIcon, draggable: true }).addTo(mapInstanceRef.current)
              marker.on("dragend", (e) => {
                const pos = e.target.getLatLng()
                onLocationSelect(pos.lat, pos.lng)
              })
              markerRef.current = marker
            }
          }
        },
        (error) => {
          console.error("Error getting location:", error)
          alert("ไม่สามารถเข้าถึงตำแหน่งปัจจุบันได้ กรุณาอนุญาตการเข้าถึงตำแหน่ง")
        },
      )
    } else {
      alert("เบราว์เซอร์ของคุณไม่รองรับการระบุตำแหน่ง")
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          คลิกบนแผนที่เพื่อปักหมุด
        </p>
        <Button type="button" onClick={handleGetCurrentLocation} variant="outline" size="sm">
          <Navigation className="h-4 w-4 mr-2" />
          ใช้ตำแหน่งปัจจุบัน
        </Button>
      </div>
      <div ref={mapRef} className="w-full h-64 rounded-lg border overflow-hidden" />
      {latitude && longitude && (
        <p className="text-xs text-muted-foreground">
          พิกัด: {latitude.toFixed(6)}, {longitude.toFixed(6)}
        </p>
      )}
    </div>
  )
}
