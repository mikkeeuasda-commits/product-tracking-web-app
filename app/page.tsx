"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Package2,
  Plus,
  Search,
  Calendar,
  Store,
  Tag,
  Pencil,
  Trash2,
  Filter,
  ImageIcon,
  Share2,
  MapPin,
} from "lucide-react"
import { format } from "date-fns"
import { th } from "date-fns/locale"

import dynamic from "next/dynamic"
const MapPicker = dynamic(() => import("@/components/map-picker"), { ssr: false })
const MapDisplay = dynamic(() => import("@/components/map-display"), { ssr: false })
const ShareDialog = dynamic(() => import("@/components/share-dialog"), { ssr: false })

type Category = {
  id: string
  name: string
  description: string | null
}

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
  created_at: string
  latitude: number | null
  longitude: number | null
  share_token: string | null
  categories?: Category
}

export default function Page() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [filterCategory, setFilterCategory] = useState<string>("all")
  const [filterStore, setFilterStore] = useState<string>("all")
  const [isAddProductOpen, setIsAddProductOpen] = useState(false)
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const [shareDialogProduct, setShareDialogProduct] = useState<Product | null>(null)
  const [shareUrl, setShareUrl] = useState("")

  const supabase = createClient()

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    category_id: "",
    purchase_date: new Date().toISOString().split("T")[0],
    store: "",
    price: "",
    unit: "",
    quantity: "",
    quantity_unit: "",
    notes: "",
    latitude: null as number | null,
    longitude: null as number | null,
  })

  const [categoryForm, setCategoryForm] = useState({
    name: "",
    description: "",
  })

  const standardUnits = ["ซอง", "กรัม", "กก.", "ml", "ลิตร"]
  const standardQuantityUnits = ["ซอง", "กรัม", "กก.", "ml", "ลิตร", "ขวด", "กล่อง", "ชิ้น"]

  const uniqueStores = Array.from(new Set(products.map((p) => p.store).filter(Boolean)))
  const uniqueUnits = Array.from(new Set(products.map((p) => p.unit).filter(Boolean)))
  const uniqueQuantityUnits = Array.from(new Set(products.map((p) => p.quantity_unit).filter(Boolean)))

  useEffect(() => {
    fetchCategories()
    fetchProducts()
  }, [])

  useEffect(() => {
    filterProducts()
  }, [products, searchQuery, filterCategory, filterStore])

  const fetchCategories = async () => {
    const { data, error } = await supabase.from("categories").select("*").order("name")

    if (!error && data) {
      setCategories(data)
    }
  }

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from("products")
      .select("*, categories(*)")
      .order("purchase_date", { ascending: false })

    if (!error && data) {
      setProducts(data)
    }
  }

  const filterProducts = () => {
    let filtered = products

    if (searchQuery) {
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.store.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.notes?.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    if (filterCategory !== "all") {
      filtered = filtered.filter((p) => p.category_id === filterCategory)
    }

    if (filterStore !== "all") {
      filtered = filtered.filter((p) => p.store === filterStore)
    }

    setFilteredProducts(filtered)
  }

  const uploadImage = async (file: File): Promise<string | null> => {
    const fileExt = file.name.split(".").pop()
    const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`
    const filePath = fileName

    const { error: uploadError } = await supabase.storage.from("product-images").upload(filePath, file)

    if (uploadError) {
      console.error("Error uploading image:", uploadError)
      return null
    }

    const { data } = supabase.storage.from("product-images").getPublicUrl(filePath)

    return data.publicUrl
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      // Clean up previous preview URL
      if (imagePreview && imagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview)
      }
      // Create new object URL for preview
      const objectUrl = URL.createObjectURL(file)
      setImagePreview(objectUrl)
    }
  }

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    let imageUrl = null
    if (imageFile) {
      imageUrl = await uploadImage(imageFile)
    }

    const { error } = await supabase.from("products").insert({
      name: formData.name,
      category_id: formData.category_id || null,
      purchase_date: formData.purchase_date,
      store: formData.store,
      price: Number.parseFloat(formData.price),
      unit: formData.unit,
      quantity: Number.parseFloat(formData.quantity),
      quantity_unit: formData.quantity_unit,
      notes: formData.notes || null,
      image_url: imageUrl,
      latitude: formData.latitude,
      longitude: formData.longitude,
    })

    setIsLoading(false)

    if (!error) {
      setIsAddProductOpen(false)
      resetForm()
      fetchProducts()
    }
  }

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingProduct) return
    setIsLoading(true)

    let imageUrl = editingProduct.image_url
    if (imageFile) {
      imageUrl = await uploadImage(imageFile)
    }

    const { error } = await supabase
      .from("products")
      .update({
        name: formData.name,
        category_id: formData.category_id || null,
        purchase_date: formData.purchase_date,
        store: formData.store,
        price: Number.parseFloat(formData.price),
        unit: formData.unit,
        quantity: Number.parseFloat(formData.quantity),
        quantity_unit: formData.quantity_unit,
        notes: formData.notes || null,
        image_url: imageUrl,
        updated_at: new Date().toISOString(),
        latitude: formData.latitude,
        longitude: formData.longitude,
      })
      .eq("id", editingProduct.id)

    setIsLoading(false)

    if (!error) {
      setEditingProduct(null)
      resetForm()
      fetchProducts()
    }
  }

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("คุณต้องการลบสินค้านี้ใช่หรือไม่?")) return

    const { error } = await supabase.from("products").delete().eq("id", id)

    if (!error) {
      fetchProducts()
    }
  }

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const { error } = await supabase.from("categories").insert({
      name: categoryForm.name,
      description: categoryForm.description || null,
    })

    setIsLoading(false)

    if (!error) {
      setIsAddCategoryOpen(false)
      setCategoryForm({ name: "", description: "" })
      fetchCategories()
    }
  }

  const handleDeleteCategory = async (id: string) => {
    if (!confirm("คุณต้องการลบประเภทนี้ใช่หรือไม่?")) return

    const { error } = await supabase.from("categories").delete().eq("id", id)

    if (!error) {
      fetchCategories()
    }
  }

  const handleShare = async (product: Product) => {
    let token = product.share_token

    if (!token) {
      token = crypto.randomUUID()
      const { error } = await supabase.from("products").update({ share_token: token }).eq("id", product.id)

      if (error) {
        console.error("Error creating share link:", error)
        return
      }
    }

    const url = `${window.location.origin}/shared/${token}`
    setShareUrl(url)
    setShareDialogProduct(product)
  }

  const resetForm = () => {
    setFormData({
      name: "",
      category_id: "",
      purchase_date: new Date().toISOString().split("T")[0],
      store: "",
      price: "",
      unit: "",
      quantity: "",
      quantity_unit: "",
      notes: "",
      latitude: null,
      longitude: null,
    })
    if (imagePreview && imagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreview)
    }
    setImageFile(null)
    setImagePreview(null)
  }

  const openEditDialog = (product: Product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      category_id: product.category_id || "",
      purchase_date: product.purchase_date,
      store: product.store,
      price: product.price.toString(),
      unit: product.unit,
      quantity: product.quantity.toString(),
      quantity_unit: product.quantity_unit,
      notes: product.notes || "",
      latitude: product.latitude,
      longitude: product.longitude,
    })
    setImagePreview(product.image_url)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto p-6 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-primary p-2 rounded-lg">
              <Package2 className="h-8 w-8 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-balance">ระบบจัดการรายการสินค้า</h1>
              <p className="text-muted-foreground">จัดเก็บและติดตามสินค้าที่ซื้อได้อย่างสะดวก</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="products" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="products">สินค้า</TabsTrigger>
            <TabsTrigger value="categories">ประเภทสินค้า</TabsTrigger>
          </TabsList>

          {/* Products Tab */}
          <TabsContent value="products" className="space-y-6">
            {/* Search and Filter Bar */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="ค้นหาชื่อสินค้า, ร้านค้า, หมายเหตุ..."
                      className="pl-10"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger className="w-full md:w-[200px]">
                      <SelectValue placeholder="ทุกประเภท" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">ทุกประเภท</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={filterStore} onValueChange={setFilterStore}>
                    <SelectTrigger className="w-full md:w-[200px]">
                      <SelectValue placeholder="ทุกร้านค้า" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">ทุกร้านค้า</SelectItem>
                      {uniqueStores.map((store) => (
                        <SelectItem key={store} value={store}>
                          {store}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Dialog open={isAddProductOpen} onOpenChange={setIsAddProductOpen}>
                    <DialogTrigger asChild>
                      <Button className="whitespace-nowrap">
                        <Plus className="mr-2 h-4 w-4" />
                        เพิ่มสินค้า
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>เพิ่มสินค้าใหม่</DialogTitle>
                        <DialogDescription>กรอกข้อมูลสินค้าที่คุณซื้อเพื่อบันทึกลงระบบ</DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleAddProduct} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="name">ชื่อสินค้า *</Label>
                            <Input
                              id="name"
                              required
                              value={formData.name}
                              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                              placeholder="เช่น มาม่าต้มยำ"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="category">ประเภท</Label>
                            <Select
                              value={formData.category_id}
                              onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="เลือกประเภท" />
                              </SelectTrigger>
                              <SelectContent>
                                {categories.map((cat) => (
                                  <SelectItem key={cat.id} value={cat.id}>
                                    {cat.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="purchase_date">วันที่ซื้อ *</Label>
                            <Input
                              id="purchase_date"
                              type="date"
                              required
                              value={formData.purchase_date}
                              onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="store">ร้านค้า *</Label>
                            <Input
                              id="store"
                              required
                              value={formData.store}
                              onChange={(e) => setFormData({ ...formData, store: e.target.value })}
                              placeholder="เช่น Lotus"
                              list="store-suggestions"
                            />
                            <datalist id="store-suggestions">
                              {uniqueStores.map((store) => (
                                <option key={store} value={store} />
                              ))}
                            </datalist>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="price">ราคา (บาท) *</Label>
                            <Input
                              id="price"
                              type="number"
                              step="0.01"
                              required
                              value={formData.price}
                              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                              placeholder="7"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="unit">หน่วย</Label>
                            <Select
                              value={formData.unit}
                              onValueChange={(value) => setFormData({ ...formData, unit: value })}
                            >
                              <SelectTrigger id="unit">
                                <SelectValue placeholder="เลือกหน่วย" />
                              </SelectTrigger>
                              <SelectContent>
                                {standardUnits.map((unit) => (
                                  <SelectItem key={unit} value={unit}>
                                    {unit}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="quantity">ปริมาณ *</Label>
                            <Input
                              id="quantity"
                              type="number"
                              step="0.01"
                              required
                              value={formData.quantity}
                              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                              placeholder="55"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="quantity_unit">หน่วยปริมาณ</Label>
                            <Select
                              value={formData.quantity_unit}
                              onValueChange={(value) => setFormData({ ...formData, quantity_unit: value })}
                            >
                              <SelectTrigger id="quantity_unit">
                                <SelectValue placeholder="เลือกหน่วยปริมาณ" />
                              </SelectTrigger>
                              <SelectContent>
                                {standardQuantityUnits.map((unit) => (
                                  <SelectItem key={unit} value={unit}>
                                    {unit}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="notes">หมายเหตุ</Label>
                          <Textarea
                            id="notes"
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            placeholder="เช่น ซื้อช่วงลดราคา"
                            rows={3}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="image">รูปภาพสินค้า</Label>
                          <Input id="image" type="file" accept="image/*" onChange={handleImageChange} />
                          {imagePreview && (
                            <div className="mt-2 relative">
                              <img
                                src={imagePreview || "/placeholder.svg"}
                                alt="Preview"
                                className="h-32 w-32 object-cover rounded-lg border"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement
                                  target.style.display = "none"
                                }}
                              />
                            </div>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label>ตำแหน่งร้านค้า (ไม่บังคับ)</Label>
                          <MapPicker
                            latitude={formData.latitude}
                            longitude={formData.longitude}
                            onLocationSelect={(lat, lng) => setFormData({ ...formData, latitude: lat, longitude: lng })}
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setIsAddProductOpen(false)
                              resetForm()
                            }}
                          >
                            ยกเลิก
                          </Button>
                          <Button type="submit" disabled={isLoading}>
                            {isLoading ? "กำลังบันทึก..." : "บันทึก"}
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
                <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                  <Filter className="h-4 w-4" />
                  <span>
                    พบ {filteredProducts.length} รายการจากทั้งหมด {products.length} รายการ
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Products Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  {product.image_url ? (
                    <div className="relative h-48 bg-muted">
                      <img
                        src={product.image_url || "/placeholder.svg"}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="relative h-48 bg-muted flex items-center justify-center">
                      <ImageIcon className="h-16 w-16 text-muted-foreground/30" />
                    </div>
                  )}
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-lg text-balance">{product.name}</CardTitle>
                      <Badge variant="secondary" className="shrink-0">
                        {product.categories?.name || "ไม่มีประเภท"}
                      </Badge>
                    </div>
                    <CardDescription className="space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(product.purchase_date), "d MMMM yyyy", { locale: th })}
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Store className="h-4 w-4" />
                        {product.store}
                      </div>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">ราคา</span>
                      <span className="font-semibold text-lg">{product.price.toFixed(2)} บาท</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">จำนวน</span>
                      <span>
                        {product.quantity} {product.quantity_unit} / {product.unit}
                      </span>
                    </div>
                    {product.notes && (
                      <div className="pt-2 border-t">
                        <p className="text-sm text-muted-foreground italic text-pretty">{product.notes}</p>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="flex justify-between pt-4">
                    <div className="flex gap-2">
                      <Dialog
                        open={editingProduct?.id === product.id}
                        onOpenChange={(open) => !open && setEditingProduct(null)}
                      >
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="bg-transparent"
                            onClick={() => openEditDialog(product)}
                          >
                            <Pencil className="h-4 w-4 mr-2" />
                            แก้ไข
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>แก้ไขสินค้า</DialogTitle>
                            <DialogDescription>แก้ไขข้อมูลสินค้าของคุณ</DialogDescription>
                          </DialogHeader>
                          <form onSubmit={handleUpdateProduct} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="edit-name">ชื่อสินค้า *</Label>
                                <Input
                                  id="edit-name"
                                  required
                                  value={formData.name}
                                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="edit-category">ประเภท</Label>
                                <Select
                                  value={formData.category_id}
                                  onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="เลือกประเภท" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {categories.map((cat) => (
                                      <SelectItem key={cat.id} value={cat.id}>
                                        {cat.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="edit-purchase_date">วันที่ซื้อ *</Label>
                                <Input
                                  id="edit-purchase_date"
                                  type="date"
                                  required
                                  value={formData.purchase_date}
                                  onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="edit-store">ร้านค้า *</Label>
                                <Input
                                  id="edit-store"
                                  required
                                  value={formData.store}
                                  onChange={(e) => setFormData({ ...formData, store: e.target.value })}
                                  list="store-suggestions"
                                />
                                <datalist id="store-suggestions">
                                  {uniqueStores.map((store) => (
                                    <option key={store} value={store} />
                                  ))}
                                </datalist>
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="edit-price">ราคา (บาท) *</Label>
                                <Input
                                  id="edit-price"
                                  type="number"
                                  step="0.01"
                                  required
                                  value={formData.price}
                                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="edit-unit">หน่วย</Label>
                                <Select
                                  value={formData.unit}
                                  onValueChange={(value) => setFormData({ ...formData, unit: value })}
                                >
                                  <SelectTrigger id="edit-unit">
                                    <SelectValue placeholder="เลือกหน่วย" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {standardUnits.map((unit) => (
                                      <SelectItem key={unit} value={unit}>
                                        {unit}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="edit-quantity">ปริมาณ *</Label>
                                <Input
                                  id="edit-quantity"
                                  type="number"
                                  step="0.01"
                                  required
                                  value={formData.quantity}
                                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="edit-quantity_unit">หน่วยปริมาณ</Label>
                                <Select
                                  value={formData.quantity_unit}
                                  onValueChange={(value) => setFormData({ ...formData, quantity_unit: value })}
                                >
                                  <SelectTrigger id="edit-quantity_unit">
                                    <SelectValue placeholder="เลือกหน่วยปริมาณ" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {standardQuantityUnits.map((unit) => (
                                      <SelectItem key={unit} value={unit}>
                                        {unit}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="edit-notes">หมายเหตุ</Label>
                              <Textarea
                                id="edit-notes"
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                rows={3}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="edit-image">รูปภาพสินค้า</Label>
                              <Input id="edit-image" type="file" accept="image/*" onChange={handleImageChange} />
                              {imagePreview && (
                                <div className="mt-2 relative">
                                  <img
                                    src={imagePreview || "/placeholder.svg"}
                                    alt="Preview"
                                    className="h-32 w-32 object-cover rounded-lg border"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement
                                      target.style.display = "none"
                                    }}
                                  />
                                </div>
                              )}
                            </div>
                            <div className="space-y-2">
                              <Label>ตำแหน่งร้านค้า (ไม่บังคับ)</Label>
                              <MapPicker
                                latitude={formData.latitude}
                                longitude={formData.longitude}
                                onLocationSelect={(lat, lng) =>
                                  setFormData({ ...formData, latitude: lat, longitude: lng })
                                }
                              />
                            </div>
                            <div className="flex justify-end gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                  setEditingProduct(null)
                                  resetForm()
                                }}
                              >
                                ยกเลิก
                              </Button>
                              <Button type="submit" disabled={isLoading}>
                                {isLoading ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}
                              </Button>
                            </div>
                          </form>
                        </DialogContent>
                      </Dialog>
                      <Button variant="destructive" size="sm" onClick={() => handleDeleteProduct(product.id)}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        ลบ
                      </Button>
                    </div>
                    <Button variant="default" size="sm" onClick={() => handleShare(product)}>
                      <Share2 className="h-4 w-4 mr-2" />
                      แชร์
                    </Button>
                  </CardFooter>

                  {product.latitude && product.longitude && (
                    <div className="px-6 pb-6">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-primary" />
                            ตำแหน่งร้านค้า
                          </p>
                          <a
                            href={`https://www.google.com/maps?q=${product.latitude},${product.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline"
                          >
                            Google Maps →
                          </a>
                        </div>
                        <div className="rounded-lg overflow-hidden border h-48">
                          <MapDisplay
                            latitude={product.latitude}
                            longitude={product.longitude}
                            storeName={product.store}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>

            {filteredProducts.length === 0 && (
              <Card className="p-12">
                <div className="text-center space-y-2">
                  <Package2 className="h-16 w-16 mx-auto text-muted-foreground" />
                  <h3 className="text-lg font-semibold">ไม่พบสินค้า</h3>
                  <p className="text-sm text-muted-foreground">ลองเปลี่ยนตัวกรองหรือเพิ่มสินค้าใหม่</p>
                </div>
              </Card>
            )}
          </TabsContent>

          {/* Categories Tab */}
          <TabsContent value="categories" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">จัดการประเภทสินค้า</h2>
                <p className="text-muted-foreground">เพิ่ม แก้ไข หรือลบประเภทสินค้า</p>
              </div>
              <Dialog open={isAddCategoryOpen} onOpenChange={setIsAddCategoryOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    เพิ่มประเภท
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>เพิ่มประเภทใหม่</DialogTitle>
                    <DialogDescription>สร้างประเภทสินค้าใหม่เพื่อจัดหมวดหมู่</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleAddCategory} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="category-name">ชื่อประเภท *</Label>
                      <Input
                        id="category-name"
                        required
                        value={categoryForm.name}
                        onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                        placeholder="เช่น อาหารแห้ง"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="category-description">คำอธิบาย</Label>
                      <Textarea
                        id="category-description"
                        value={categoryForm.description}
                        onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                        placeholder="อธิบายประเภทสินค้า"
                        rows={3}
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsAddCategoryOpen(false)
                          setCategoryForm({ name: "", description: "" })
                        }}
                      >
                        ยกเลิก
                      </Button>
                      <Button type="submit" disabled={isLoading}>
                        {isLoading ? "กำลังบันทึก..." : "บันทึก"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((category) => {
                const productCount = products.filter((p) => p.category_id === category.id).length
                return (
                  <Card key={category.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Tag className="h-5 w-5 text-primary" />
                          <CardTitle className="text-lg">{category.name}</CardTitle>
                        </div>
                        <Badge variant="outline">{productCount}</Badge>
                      </div>
                      {category.description && <CardDescription>{category.description}</CardDescription>}
                    </CardHeader>
                    <CardFooter>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="w-full"
                        onClick={() => handleDeleteCategory(category.id)}
                        disabled={productCount > 0}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        {productCount > 0 ? `มีสินค้า ${productCount} รายการ` : "ลบ"}
                      </Button>
                    </CardFooter>
                  </Card>
                )
              })}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {shareDialogProduct && (
        <ShareDialog
          isOpen={!!shareDialogProduct}
          onClose={() => setShareDialogProduct(null)}
          shareUrl={shareUrl}
          productName={shareDialogProduct.name}
        />
      )}
    </div>
  )
}
