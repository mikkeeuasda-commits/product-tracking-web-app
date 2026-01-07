import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Package2, Calendar, Store, MapPin } from "lucide-react"
import { format } from "date-fns"
import { th } from "date-fns/locale"
import Image from "next/image"
import dynamic from "next/dynamic"

// const MapDisplay = dynamic(() => import("@/components/map-display"), { ssr: false })
const MapDisplay = dynamic(() => import("../../../components/map-display"), { ssr: false })

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

export default async function SharedProductPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const supabase = await createClient()

  const { data: product } = await supabase.from("products").select("*").eq("share_token", token).single<Product>()

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">ไม่พบข้อมูลสินค้า</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground">ลิงก์ที่คุณเข้าถึงอาจไม่ถูกต้องหรือถูกลบไปแล้ว</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8">
      <div className="container mx-auto px-4 max-w-3xl">
        <Card className="shadow-lg">
          <CardHeader className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <CardTitle className="text-3xl">{product.name}</CardTitle>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>{format(new Date(product.purchase_date), "d MMMM yyyy", { locale: th })}</span>
                </div>
              </div>
              <Badge variant="secondary" className="text-2xl font-bold">
                ฿{product.price.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
              </Badge>
            </div>

            {product.image_url && (
              <div className="relative w-full h-64 rounded-lg overflow-hidden">
                <Image
                  src={product.image_url || "/placeholder.svg"}
                  alt={product.name}
                  fill
                  className="object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = "none"
                  }}
                />
              </div>
            )}
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">ร้านค้า</p>
                <div className="flex items-center gap-2">
                  <Store className="h-4 w-4 text-primary" />
                  <p className="font-medium">{product.store}</p>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">ปริมาณ</p>
                <div className="flex items-center gap-2">
                  <Package2 className="h-4 w-4 text-primary" />
                  <p className="font-medium">
                    {product.quantity} {product.quantity_unit} ({product.unit})
                  </p>
                </div>
              </div>
            </div>

            {product.notes && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">หมายเหตุ</p>
                <p className="text-sm bg-muted/50 p-3 rounded-lg">{product.notes}</p>
              </div>
            )}

            {product.latitude && product.longitude && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    ตำแหน่งร้านค้า
                  </p>
                  <a
                    href={`https://www.google.com/maps?q=${product.latitude},${product.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline"
                  >
                    เปิดใน Google Maps →
                  </a>
                </div>
                <div className="rounded-lg overflow-hidden border h-64">
                  <MapDisplay latitude={product.latitude} longitude={product.longitude} storeName={product.store} />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
