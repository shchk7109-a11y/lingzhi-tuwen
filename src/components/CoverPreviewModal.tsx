"use client"
import React, { useRef } from "react"
import { Button } from "@/components/ui/button"
import { X, Download } from "lucide-react"
import XhsCoverCardV3, { CoverDataV3 } from "./XhsCoverCardV3"
import { toPng } from "html-to-image"
import { toast } from "sonner"

interface CoverPreviewModalProps {
  data: CoverDataV3
  customerName: string
  onClose: () => void
}

export default function CoverPreviewModal({ data, customerName, onClose }: CoverPreviewModalProps) {
  const coverRef = useRef<HTMLDivElement>(null)

  const downloadCover = async () => {
    if (!coverRef.current) return
    try {
      const dataUrl = await toPng(coverRef.current, {
        width: 375,
        height: 600,
        pixelRatio: 3,
        style: { transform: "scale(1)", transformOrigin: "top left" }
      })
      const link = document.createElement("a")
      link.download = `xhs_cover_${customerName}_${Date.now()}.png`
      link.href = dataUrl
      link.click()
      toast.success("封面图片已下载")
    } catch (e) {
      toast.error("下载失败，请重试")
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* 模态框头部 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E8E4DC]">
          <div>
            <h3 className="font-bold text-[#1E4D2B] text-lg">封面预览</h3>
            <p className="text-xs text-[#8B7355] mt-0.5">客户：{customerName}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={downloadCover}>
              <Download className="w-4 h-4 mr-1" />
              下载封面
            </Button>
            <Button size="icon" variant="ghost" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* 封面预览区 */}
        <div className="p-6 flex justify-center bg-[#F5F0E8]">
          <div ref={coverRef} style={{ width: 375, height: 600 }}>
            <XhsCoverCardV3 data={data} scale={1} />
          </div>
        </div>

        {/* 标签区 */}
        {data.tags && data.tags.length > 0 && (
          <div className="px-5 py-3 border-t border-[#E8E4DC]">
            <p className="text-xs text-[#8B7355] mb-2">推荐话题标签：</p>
            <div className="flex flex-wrap gap-2">
              {data.tags.map((tag, i) => (
                <span key={i} className="text-xs bg-[#A8D5C2]/30 text-[#1E4D2B] px-2 py-1 rounded-full border border-[#A8D5C2]">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
