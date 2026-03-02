"use client"
import { useSearchParams } from "next/navigation"
import { Suspense, useEffect, useRef } from "react"
import XhsCoverCardV3, { CoverDataV3 } from "@/components/XhsCoverCardV3"

function CoverRenderContent() {
  const searchParams = useSearchParams()
  const dataStr = searchParams.get("data")
  const rootRef = useRef<HTMLDivElement>(null)

  let coverData: CoverDataV3 | null = null
  try {
    if (dataStr) {
      coverData = JSON.parse(decodeURIComponent(dataStr))
    }
  } catch {}

  // 渲染完成后标记 data-ready，供 Puppeteer 等待
  useEffect(() => {
    if (!coverData) return
    // 等待图片和字体加载完成后再标记
    const markReady = () => {
      if (rootRef.current) {
        rootRef.current.setAttribute("data-ready", "true")
      }
    }
    // 等待所有图片加载完成
    const images = document.querySelectorAll("img")
    if (images.length === 0) {
      // 没有图片，直接标记（延迟一帧确保 DOM 渲染完成）
      requestAnimationFrame(() => setTimeout(markReady, 300))
    } else {
      let loaded = 0
      const total = images.length
      const onLoad = () => {
        loaded++
        if (loaded >= total) setTimeout(markReady, 200)
      }
      images.forEach((img) => {
        if (img.complete) {
          loaded++
        } else {
          img.addEventListener("load", onLoad)
          img.addEventListener("error", onLoad)
        }
      })
      if (loaded >= total) setTimeout(markReady, 200)
    }
  }, [coverData])

  if (!coverData) {
    return (
      <div
        id="cover-root"
        data-ready="true"
        style={{ width: 375, height: 600, background: "#f5f0e8", display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        <p style={{ color: "#666", fontSize: 14 }}>封面数据无效</p>
      </div>
    )
  }

  return (
    <div ref={rootRef} id="cover-root" style={{ width: 375, height: 600, overflow: "hidden" }}>
      <XhsCoverCardV3 data={coverData} />
    </div>
  )
}

export default function CoverRenderPage() {
  return (
    <Suspense fallback={<div id="cover-root" style={{ width: 375, height: 600, background: "#f5f0e8" }} />}>
      <CoverRenderContent />
    </Suspense>
  )
}
