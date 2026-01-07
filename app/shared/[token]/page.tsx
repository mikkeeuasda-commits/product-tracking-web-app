import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Package2, Calendar, Store, MapPin } from "lucide-react"
import { format } from "date-fns"
import { th } from "date-fns/locale"
import Image from "next/image"
import MapClient from "./map-client"

type Product = {
  id: string
  name: string
  category_id: string | null
  purchase_date: string
  store: string
  price: number
  unit: string
  quantity: number
  quantity_unit: string
  notes: string | null
  image_url: string | null
  latitude: number | null
  longitude: number | null
}

export default async function SharedProductPage({
  params,
}: {
  params: { token: string }
}) {
  const { token } = params
  const supabase = await createClient()

  const { data: product } = await supabase
    .from("products")
    .select("*")
    .eq("share_token", token)
    .single<Product>()

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">ไม่พบข้อมูลสินค้า</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground">
              ลิงก์อาจไม่ถูกต้องหรือถูกลบไปแล้ว
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-3xl">
        <Card>
          <CardHeader className="space-y-4">
            <div className="flex justify-between">
              <div>
                <CardTitle className="text-3xl">{product.name}</CardTitle>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(product.purchase_date), "d MMMM yyyy", {
                    locale: th,
                  })}
                </div>
              </div>
              <Badge className="text-xl">
                ฿{product.price.toLocaleString("th-TH")}
              </Badge>
            </div>

            {product.image_url && (
              <div className="relative h-64 rounded overflow-hidden">
                <Image
                  src={product.image_url}
                  alt={product.name}
                  fill
                  className="object-cover"
                />
              </div>
            )}
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">ร้านค้า</p>
                <div className="flex gap-2">
                  <Store className="h-4 w-4" />
                  {product.store}
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">ปริมาณ</p>
                <div className="flex gap-2">
                  <Package2 className="h-4 w-4" />
                  {product.quantity} {product.quantity_unit}
                </div>
              </div>
            </div>

            {product.latitude && product.longitude && (
              <div className="space-y-2">
                <p className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  ตำแหน่งร้านค้า
                </p>

                <div className="h-64 rounded overflow-hidden border">
                  <MapClient
                    latitude={product.latitude}
                    longitude={product.longitude}
                    storeName={product.store}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
