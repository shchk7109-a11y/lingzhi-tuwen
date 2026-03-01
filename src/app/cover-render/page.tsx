"use client"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"
import XhsCoverCardV3, { CoverDataV3 } from "@/components/XhsCoverCardV3"

function CoverRenderContent() {
  const searchParams = useSearchParams()
  const dataStr = searchParams.get("data")

  let coverData: CoverDataV3 | null = null
  try {
    if (dataStr) {
      coverData = JSON.parse(decodeURIComponent(dataStr))
    }
  } catch {}

  if (!coverData) {
    return <div style={{ width: 375, height: 600, background: "#f5f0e8", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: "#666", fontSize: 14 }}>封面数据无效</p>
    </div>
  }

  return (
    <div id="cover-root" style={{ width: 375, height: 600, overflow: "hidden" }}>
      <XhsCoverCardV3 data={coverData} />
    </div>
  )
}

export default function CoverRenderPage() {
  return (
    <Suspense fallback={<div style={{ width: 375, height: 600, background: "#f5f0e8" }} />}>
      <CoverRenderContent />
    </Suspense>
  )
}
