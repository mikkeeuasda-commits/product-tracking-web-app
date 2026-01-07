"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Share2, Copy, QrCode, Check } from "lucide-react"
import QRCode from "qrcode"
import Image from "next/image"

type ShareDialogProps = {
  isOpen: boolean
  onClose: () => void
  shareUrl: string
  productName: string
}

export default function ShareDialog({ isOpen, onClose, shareUrl, productName }: ShareDialogProps) {
  const [copied, setCopied] = useState(false)
  const [qrCode, setQrCode] = useState<string>("")
  const [showQR, setShowQR] = useState(false)

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  const handleGenerateQR = async () => {
    try {
      const qr = await QRCode.toDataURL(shareUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#ffffff",
        },
      })
      setQrCode(qr)
      setShowQR(true)
    } catch (err) {
      console.error("Error generating QR code:", err)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            แชร์รายการสินค้า
          </DialogTitle>
          <DialogDescription>แชร์ "{productName}" ให้คนอื่นดูรายละเอียดและตำแหน่งร้านค้า</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-medium">ลิงก์สำหรับแชร์</p>
            <div className="flex gap-2">
              <Input value={shareUrl} readOnly className="flex-1" />
              <Button onClick={handleCopyLink} variant="outline" size="icon">
                {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            {copied && <p className="text-xs text-green-600">คัดลอกลิงก์แล้ว!</p>}
          </div>

          {!showQR ? (
            <Button onClick={handleGenerateQR} variant="outline" className="w-full bg-transparent">
              <QrCode className="h-4 w-4 mr-2" />
              สร้าง QR Code
            </Button>
          ) : (
            <div className="space-y-3">
              <p className="text-sm font-medium text-center">สแกน QR Code เพื่อเปิดลิงก์</p>
              <div className="flex justify-center p-4 bg-white rounded-lg">
                {qrCode && <Image src={qrCode || "/placeholder.svg"} alt="QR Code" width={300} height={300} />}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
