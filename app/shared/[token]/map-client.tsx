"use client"

import dynamic from "next/dynamic"

const MapDisplay = dynamic(
  () => import("../../../components/map-display"),
  { ssr: false }
)

type Props = {
  latitude: number
  longitude: number
  storeName: string
}

export default function MapClient(props: Props) {
  return <MapDisplay {...props} />
}
