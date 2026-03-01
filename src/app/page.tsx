"use client"

import React, { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  Upload, FileSpreadsheet, Users, Wand2, Download, Loader2, Eye,
  RefreshCw, CheckCircle2, AlertCircle, Clock, Trash2, Info,
  ArrowRight, ImageIcon, History, Smartphone, MessageCircle
} from "lucide-react"
import Link from "next/link"
import * as XLSX from "xlsx"
import { toast } from "sonner"
import XhsCoverCardV3, { CoverDataV3 } from "@/components/XhsCoverCardV3"
import CoverPreviewModal from "@/components/CoverPreviewModal"
import BatchHistoryModal from "@/components/BatchHistoryModal"
import { saveBatchToHistory, loadBatchHistory } from "@/lib/batchHistory"

interface ContentItem {
  text: string
  customerId?: string
  customerName?: string
  customerProfile?: string
  customerXhsAccount?: string
  customerWechatAccount?: string
  customerCategory?: string
  customerCity?: string
  cleanedText?: string
  // 三档清洗版本
  cleanVersions?: { light: string; medium: string; heavy: string }
  cleanExplanations?: { light: string; medium: string; heavy: string }
  activeVersion?: 'light' | 'medium' | 'heavy'
  // AI味检测结果
  aiDetection?: Array<{ dimension: string; rating: number; description: string }>
  aiTotalScore?: number
  aiChecklist?: { likeFriendChat: boolean; hasDetails: boolean; hasEmotion: boolean; hasColloquial: boolean; hasRealFeel: boolean }
  recommendedVersion?: string
  coverData?: CoverDataV3
  coverUrl?: string        // 封面图服务器URL（服务端Puppeteer生成）
  coverRendering?: boolean // 封面图是否正在后台生成
  image2Url?: string
  image3Url?: string
  image4Url?: string       // 朋友圈第4张图
  productImageUrl?: string
  status: "pending" | "cleaning" | "cover" | "matching" | "done" | "error"
  errorMsg?: string
}

const STEPS = [
  { id: 1, label: "上传文案", icon: "📄" },
  { id: 2, label: "分配客户", icon: "👥" },
  { id: 3, label: "AI处理", icon: "🤖" },
  { id: 4, label: "查看结果", icon: "🎨" },
]

// 生成批次号：日期+序号，如 20260227-001
function generateBatchId(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, "0")
  const d = String(now.getDate()).padStart(2, "0")
  const date = `${y}${m}${d}`
  const key = `batch_count_${date}`
  const count = parseInt(localStorage.getItem(key) || "0") + 1
  localStorage.setItem(key, String(count))
  return `${date}-${String(count).padStart(3, "0")}`
}

export default function Home() {
  const [platform, setPlatform] = useState<'xhs' | 'pyq'>('xhs')
  const [step, setStep] = useState(1)
  const [allContents, setAllContents] = useState<ContentItem[]>([])
  const [currentBatch, setCurrentBatch] = useState<ContentItem[]>([])
  const [currentBatchOffset, setCurrentBatchOffset] = useState(0)
  const [customers, setCustomers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [processingIndex, setProcessingIndex] = useState(-1)
  const [processingStage, setProcessingStage] = useState("")
  const [progress, setProgress] = useState(0)
  const [previewItem, setPreviewItem] = useState<ContentItem | null>(null)
  const [detailItem, setDetailItem] = useState<ContentItem | null>(null)
  const [batchId, setBatchId] = useState("")
  const [batchDone, setBatchDone] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const currentBatchRef = useRef<ContentItem[]>([])
  const [historyModalOpen, setHistoryModalOpen] = useState(false)
  const [historyCount, setHistoryCount] = useState(0)

  const BATCH_SIZE = platform === 'pyq' ? 20 : 10

  React.useEffect(() => {
    currentBatchRef.current = currentBatch
  }, [currentBatch])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const records = loadBatchHistory()
      setHistoryCount(records.length)
    }
  }, [])

  const loadCustomers = async () => {
    try {
      const res = await fetch("/api/customers?pageSize=500")
      const data = await res.json()
      const list = Array.isArray(data) ? data : (data.customers || [])
      setCustomers(list)
      return list
    } catch {
      toast.error("加载客户失败")
      return []
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: "array" })
        const sheet = workbook.Sheets[workbook.SheetNames[0]]
        const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" })
        if (rows.length === 0) { toast.error("表格为空"); return }
        const sample = rows[0] as any
        let maxLen = 0, contentKey = ""
        Object.keys(sample).forEach((k) => {
          const v = String(sample[k] || "")
          if (v.length > maxLen) { maxLen = v.length; contentKey = k }
        })
        if (!contentKey) { toast.error("无法识别内容列"); return }
        const items: ContentItem[] = rows
          .map((row: any) => ({ text: String(row[contentKey] || ""), status: "pending" as const }))
          .filter(item => item.text.trim().length > 0)
        setAllContents(items)
        setCurrentBatchOffset(0)
        setBatchDone(false)
        setStep(2)
        const customerList = await loadCustomers()
        const totalBatches = Math.ceil(items.length / BATCH_SIZE)
        toast.success(`已加载 ${items.length} 条文案，共 ${customerList.length} 位客户，预计 ${totalBatches} 批`)
      } catch {
        toast.error("文件解析失败，请检查格式")
      }
    }
    reader.readAsArrayBuffer(file)
    e.target.value = ""
  }

  const assignCurrentBatch = async (offset: number, customerList: any[], contentsList?: ContentItem[]) => {
    // 动态获取当前批次大小
    const currentBatchSize = platform === 'pyq' ? 20 : 10
    // 优先使用传入的 contentsList，避免 stale closure 读到旧的 allContents
    const contents = contentsList ?? allContents
    const batchItems = contents.slice(offset, offset + currentBatchSize)
    const batchCount = batchItems.length
    if (batchCount === 0) return { assignedBatch: [] }

    const customerMap = new Map(customerList.map(c => [c.id, c]))
    let selectedIds: string[] = []
    
    try {
      const queueRes = await fetch('/api/customers/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: batchCount }),
      })
      if (queueRes.ok) {
        const queueData = await queueRes.json()
        selectedIds = queueData.selectedIds || []
      } else {
        throw new Error('Queue API returned error')
      }
    } catch (err) {
      console.error('Queue API failed:', err)
      toast.error('客户队列 API 调用失败，请检查服务器连接')
      return { assignedBatch: [] }
    }

    // 确保获取到了足够的客户ID
    if (selectedIds.length < batchCount) {
      toast.error(`客户队列不足：需要 ${batchCount} 个，实际只获得 ${selectedIds.length} 个`)
      return { assignedBatch: [], contents }
    }

    const assignedBatch: ContentItem[] = batchItems.map((item, i) => {
      const customerId = selectedIds[i]
      const customer = customerMap.get(customerId)
      
      if (!customer) {
        console.error(`Customer not found for ID: ${customerId}`)
        return item
      }

      const profile = [
        `姓名：${customer.name}`,
        customer.occupation ? `职业：${customer.occupation}` : '',
        customer.city ? `城市：${customer.city}` : '',
        customer.painPoints ? `痛点：${customer.painPoints}` : '',
        customer.needs ? `需求：${customer.needs}` : '',
        customer.scenes ? `常用场景：${customer.scenes}` : '',
        customer.language ? `语言风格：${customer.language}` : '',
        customer.lifestyle ? `生活方式：${customer.lifestyle}` : '',
      ].filter(Boolean).join('，')

      return {
        ...item,
        customerId: customer.id,
        customerName: customer.name,
        customerProfile: profile,
        customerXhsAccount: customer.xhsAccount || '',
        customerWechatAccount: customer.wechatAccount || customer.wechatId || '',
        customerCategory: customer.category || '',
        customerCity: customer.city || '',
      }
    })

    return { assignedBatch, contents }
  }

  const randomAssign = async () => {
    if (customers.length === 0) { toast.error("请先在客户管理中添加客户"); return }
    const { assignedBatch } = await assignCurrentBatch(currentBatchOffset, customers, allContents)
    if (assignedBatch.length === 0) { 
      toast.error("客户分配失败，请重试")
      return 
    }
    setCurrentBatch(assignedBatch)
    setBatchDone(false)
    setStep(3)
    const currentBatchSize = platform === 'pyq' ? 20 : 10
    const batchNo = Math.floor(currentBatchOffset / currentBatchSize) + 1
    const totalBatches = Math.ceil(allContents.length / currentBatchSize)
    toast.success(`第 ${batchNo}/${totalBatches} 批已分配 ${assignedBatch.length} 条，每条分配不同客户`)
  }

  const renderCoverAsync = async (
    index: number,
    coverData: CoverDataV3,
    customerName: string,
    currentBatchId: string
  ) => {
    try {
      const baseUrl = typeof window !== "undefined" ? window.location.origin : "http://localhost:3001"
      const safeName = customerName.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, "_")
      const filename = `${currentBatchId}_${safeName}_${index + 1}`
      const res = await fetch("/api/covers/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coverData, filename, baseUrl })
      })
      if (res.ok) {
        const data = await res.json()
        // 将相对路径转换为完整绝对 URL，确保外部系统可以直接访问
        const relUrl = data.url || ""
        const origin = typeof window !== "undefined" ? window.location.origin : ""
        const url = relUrl.startsWith("http") ? relUrl : `${origin}${relUrl}`
        setCurrentBatch(prev => prev.map((c, idx) =>
          idx === index ? { ...c, coverUrl: url, coverRendering: false } : c
        ))
        return url
      }
    } catch (err) {
      console.error("服务端封面渲染失败:", err)
    }
    setCurrentBatch(prev => prev.map((c, idx) =>
      idx === index ? { ...c, coverRendering: false } : c
    ))
    return ""
  }

  const processItem = async (item: ContentItem, index: number, currentBatchId: string, excludeImageIds: string[] = [], excludeIllustrations: string[] = []): Promise<{
    usedImageIds: string[]
    usedIllustration: string
    processedItem: {
      customerId?: string
      text: string
      cleanedText?: string
      coverData?: any
      image2Url?: string
      image3Url?: string
      image4Url?: string
      customerXhsAccount?: string
      customerWechatAccount?: string
      status: 'done'
    }
  }> => {
    // Step 1: 去AI化清洗
    setProcessingStage("去AI化清洗")
    setCurrentBatch(prev => prev.map((c, idx) => idx === index ? { ...c, status: "cleaning" } : c))
    const cleanRes = await fetch("/api/ai/clean", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: item.text, customerProfile: item.customerProfile, platform })
    })
    if (!cleanRes.ok) throw new Error("文案清洗失败")
    const cleanData = await cleanRes.json()
    const cleanedText = cleanData.cleanedText || cleanData.versions?.light || cleanData.versions?.medium || item.text
    const cleanVersions = cleanData.versions || { light: cleanedText, medium: cleanedText, heavy: cleanedText }
    const cleanExplanations = typeof cleanData.explanation === 'string'
      ? { light: cleanData.explanation, medium: '', heavy: '' }
      : (cleanData.explanation || { light: '', medium: '', heavy: '' })
    const aiDetection = cleanData.detection || []
    const aiTotalScore = cleanData.totalScore ?? aiDetection.reduce((s: number, d: { rating: number }) => s + (d.rating || 0), 0)
    const aiChecklist = cleanData.checklist || null
    const recommendedVersion = 'light'

    let coverData: any = null
    let usedIllustration = ''

    if (platform === 'xhs') {
      // Step 2: 生成封面数据 (仅小红书)
      setProcessingStage("生成信息图封面")
      setCurrentBatch(prev => prev.map((c, idx) => idx === index ? {
        ...c, cleanedText, cleanVersions, cleanExplanations,
        aiDetection, aiTotalScore, aiChecklist, recommendedVersion,
        activeVersion: recommendedVersion as 'light' | 'medium' | 'heavy',
        status: "cover"
      } : c))
      const coverRes = await fetch("/api/ai/cover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: cleanedText, profile: item.customerProfile, excludeIllustrations })
      })
      if (!coverRes.ok) throw new Error("封面生成失败")
      coverData = await coverRes.json()
      usedIllustration = coverData.illustrationUrl || ''
    } else {
      // 朋友圈模式：直接更新清洗后的文案
      setCurrentBatch(prev => prev.map((c, idx) => idx === index ? {
        ...c, cleanedText, cleanVersions, cleanExplanations,
        aiDetection, aiTotalScore, aiChecklist, recommendedVersion,
        activeVersion: recommendedVersion as 'light' | 'medium' | 'heavy',
      } : c))
    }

    // Step 3: 匹配配图
    setProcessingStage("匹配配图素材")
    setCurrentBatch(prev => prev.map((c, idx) => idx === index ? { ...c, coverData, status: "matching" } : c))
    let image2Url = '', image3Url = '', image4Url = '', productImageUrl = ''
    let newUsedImageIds: string[] = []
    try {
      // 从原始文案和清洗后文案中提取精准产品名（共享同一关键词表）
      const PRODUCT_NAME_KEYWORDS: Record<string, string[]> = {
        '清脂纤纤草本茶饮': ['清脂纤纤', '纤纤茶', '清脂茶', '清脂纤纤茶'],
        '红颜透润草本茶饮': ['红颜透润', '红颜茶', '透润茶'],
        '湿祛轻畅草本茶饮': ['湿祛轻畅', '祛湿茶', '轻畅茶', '湿祛'],
        '补气焕活草本茶饮': ['补气焕活', '补气茶', '焕活茶'],
        '悦活草本美式': ['悦活', '悦活咖啡', '悦活美式'],
        '悦纤草本美式': ['悦纤', '悦纤咖啡', '悦纤美式'],
        '悦轻草本美式': ['悦轻', '悦轻咖啡', '悦轻美式'],
        '悦颜草本美式': ['悦颜', '悦颜咖啡', '悦颜美式'],
      }
      const extractProductName = (text: string): string | null => {
        for (const [name, kws] of Object.entries(PRODUCT_NAME_KEYWORDS)) {
          if (kws.some(kw => text.includes(kw))) return name
        }
        return null
      }
      // 先从原始文案提取（包含产品名的可能性更大），再从清洗后文案提取
      const detectedProductName = coverData?.productName
        || extractProductName(item.text)
        || extractProductName(cleanedText)
        || undefined

      const matchRes = await fetch("/api/materials/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cleanedContent: cleanedText,
          // 同时传入原始文案，让后端也能从中提取产品名
          originalContent: item.text,
          customerBackground: item.customerProfile,
          productLine: (() => {
            if (coverData) {
              const code = coverData.productCode || ''
              if (code.includes('coffee')) return '草本咖啡'
              if (code.includes('tea')) return '草本茶饮'
            }
            if (item.text.includes('咖啡') || cleanedText.includes('咖啡')) return '草本咖啡'
            return '草本茶饮'
          })(),
          productName: detectedProductName,
          excludeIds: excludeImageIds,
          platform
        })
      })
      if (matchRes.ok) {
        const matchData = await matchRes.json()
        image2Url = matchData.formulaImage?.webPath || ''
        image3Url = matchData.sceneImage1?.webPath || ''
        image4Url = matchData.sceneImage2?.webPath || ''
        productImageUrl = matchData.productImage?.webPath || ''
        newUsedImageIds = matchData.usedIds || []
      }
    } catch (err) {
      console.error("素材匹配失败:", err)
    }

    // Step 4: 完成并触发异步渲染
    setCurrentBatch(prev => prev.map((c, idx) => idx === index ? {
      ...c, image2Url, image3Url, image4Url, productImageUrl,
      status: "done", coverRendering: platform === 'xhs'
    } : c))

    if (platform === 'xhs' && coverData) {
      renderCoverAsync(index, coverData, item.customerName || "customer", currentBatchId)
    }

    return {
      usedImageIds: newUsedImageIds,
      usedIllustration,
      // 返回完整处理结果，用于保存到数据库
      processedItem: {
        customerId: item.customerId,
        text: item.text,
        cleanedText,
        coverData,
        image2Url,
        image3Url,
        image4Url,
        customerXhsAccount: item.customerXhsAccount,
        customerWechatAccount: item.customerWechatAccount,
        status: 'done' as const,
      }
    }
  }

  const startProcessing = async () => {
    if (currentBatch.length === 0) return
    setLoading(true)
    setProgress(0)
    const currentBatchId = generateBatchId()
    setBatchId(currentBatchId)

    // 从 localStorage 读取跨批次已用图片 ID，实现跨批次轮换
    const USED_IDS_KEY = `usedImageIds_${platform}`
    const storedUsedIds = typeof window !== 'undefined' ? localStorage.getItem(USED_IDS_KEY) : null
    let excludeImageIds: string[] = storedUsedIds ? JSON.parse(storedUsedIds) : []
    let excludeIllustrations: string[] = []

    const processedResults: Array<{
      customerId?: string
      text: string
      cleanedText?: string
      coverData?: any
      image2Url?: string
      image3Url?: string
      image4Url?: string
      customerXhsAccount?: string
      customerWechatAccount?: string
      status: 'done' | 'error'
    }> = []

    for (let i = 0; i < currentBatch.length; i++) {
      setProcessingIndex(i)
      try {
        const { usedImageIds, usedIllustration, processedItem } = await processItem(
          currentBatchRef.current[i],
          i,
          currentBatchId,
          excludeImageIds,
          excludeIllustrations
        )
        excludeImageIds = [...excludeImageIds, ...usedImageIds]
        if (usedIllustration) excludeIllustrations.push(usedIllustration)
        processedResults.push(processedItem)
      } catch (err: any) {
        setCurrentBatch(prev => prev.map((c, idx) => idx === i ? { ...c, status: "error", errorMsg: err.message } : c))
        processedResults.push({ ...currentBatchRef.current[i], status: 'error' })
      }
      setProgress(Math.round(((i + 1) / currentBatch.length) * 100))
    }

    setLoading(false)
    setProcessingIndex(-1)
    setBatchDone(true)
    toast.success("本批次处理完成！")

    // 将已用图片 ID 保存到 localStorage，实现跨批次轮换
    if (typeof window !== 'undefined') {
      // 限制存储数量，避免 localStorage 过大（保留最近 500 个）
      const maxIds = 500
      const trimmedIds = excludeImageIds.slice(-maxIds)
      localStorage.setItem(USED_IDS_KEY, JSON.stringify(trimmedIds))
    }

    // 处理完成后自动保存到历史记录（不再依赖导出按鈕）
    const finalBatch = currentBatchRef.current
    const currentBatchSize = platform === 'pyq' ? 20 : 10
    saveBatchToHistory({
      batchId: currentBatchId,
      batchNo: Math.floor(currentBatchOffset / currentBatchSize) + 1,
      totalBatches: Math.ceil(allContents.length / currentBatchSize),
      doneCount: finalBatch.filter(c => c.status === 'done').length,
      totalCount: finalBatch.length,
      platform,
      items: finalBatch.map(item => ({
        customerName: item.customerName,
        customerXhsAccount: item.customerXhsAccount,
        customerWechatAccount: item.customerWechatAccount,
        customerCategory: item.customerCategory,
        customerCity: item.customerCity,
        cleanedText: item.cleanedText,
        coverUrl: item.coverUrl,
        image2Url: item.image2Url,
        image3Url: item.image3Url,
        image4Url: item.image4Url,
        status: item.status,
      }))
    })
    setHistoryCount(prev => prev + 1)

    // 保存到数据库（使用 processedResults 而不是 currentBatchRef）
    try {
      const savePromises = processedResults
        .filter(item => item.status === 'done' && item.customerId && item.text)
        .map(item => fetch('/api/contents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customerId: item.customerId,
            originalText: item.text,
            cleanedText: item.cleanedText || null,
            coverData: item.coverData || null,
            coverUrl: null, // coverUrl 是异步生成的，初始保存时为空
            title: item.coverData?.title || null,
            subtitle: item.coverData?.subtitle || null,
            productName: item.coverData?.rightSection?.productName || null,
            productSlogan: item.coverData?.rightSection?.productSlogan || null,
            image2Url: item.image2Url || null,
            image3Url: item.image3Url || null,
            image4Url: item.image4Url || null,
            platform,
            status: 'done',
            tags: item.coverData?.tags || null,
            xhsAccount: item.customerXhsAccount || null,
          })
        }))
      const results = await Promise.all(savePromises)
      console.log(`已保存 ${savePromises.length} 条记录到数据库`)
      // 将数据库返回的 ID 存入 dbContentIds，以便后续更新 coverUrl
      const savedContents = await Promise.all(results.map(r => r.json()))
      const dbIdMap: Record<number, string> = {}
      let dbIdx = 0
      processedResults.forEach((item, i) => {
        if (item.status === 'done' && item.customerId && item.text) {
          if (savedContents[dbIdx]?.id) dbIdMap[i] = savedContents[dbIdx].id
          dbIdx++
        }
      })
      // dbIdMap 已就绪，可用于后续更新 coverUrl
      console.log('数据库 ID 映射:', dbIdMap)
    } catch (err) {
      console.error('保存到数据库失败:', err)
    }
  }

  const exportToExcel = () => {
    let data: any[] = []
    if (platform === 'pyq') {
      // 朋友圈模式：仅保留编号、客户名称、微信号、文案、配图1、配图2、配图3
      data = currentBatch.map((item, i) => ({
        "编号": i + 1,
        "客户名称": item.customerName,
        "微信号": item.customerWechatAccount || '',
        "文案": item.cleanedText,
        "配图1": item.image2Url ? `${window.location.origin}${item.image2Url}` : "",
        "配图2": item.image3Url ? `${window.location.origin}${item.image3Url}` : "",
        "配图3": item.image4Url ? `${window.location.origin}${item.image4Url}` : "",
      }))
    } else {
      // 小红书模式：去掉原始文案和AI味评分，保留账号
      data = currentBatch.map((item, i) => ({
        "批次号": batchId,
        "序号": i + 1,
        "平台": '小红书',
        "客户姓名": item.customerName,
        "客户分类": item.customerCategory,
        "小红书账号": item.customerXhsAccount,
        "清洗后文案": item.cleanedText,
        "封面图URL": item.coverUrl || "生成中...",
        "配图2URL": item.image2Url ? `${window.location.origin}${item.image2Url}` : "",
        "配图3URL": item.image3Url ? `${window.location.origin}${item.image3Url}` : "",
      }))
    }
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "处理结果")
    XLSX.writeFile(wb, `灵芝文案优化_${platform.toUpperCase()}_${batchId}.xlsx`)

    saveBatchToHistory({
      batchId,
      batchNo: Math.floor(currentBatchOffset / BATCH_SIZE) + 1,
      totalBatches: Math.ceil(allContents.length / BATCH_SIZE),
      doneCount: currentBatch.filter(c => c.status === 'done').length,
      totalCount: currentBatch.length,
      platform,
      items: currentBatch.map(item => ({
        customerName: item.customerName,
        customerXhsAccount: item.customerXhsAccount,
        customerWechatAccount: item.customerWechatAccount,
        customerCategory: item.customerCategory,
        customerCity: item.customerCity,
        cleanedText: item.cleanedText,
        coverUrl: item.coverUrl,
        image2Url: item.image2Url,
        image3Url: item.image3Url,
        image4Url: item.image4Url,
        status: item.status,
      }))
    })
    setHistoryCount(prev => prev + 1)
  }

  const nextBatch = async () => {
    const currentBatchSize = platform === 'pyq' ? 20 : 10
    const nextOffset = currentBatchOffset + currentBatchSize
    if (nextOffset >= allContents.length) {
      toast.info("所有文案已处理完毕")
      setStep(1)
      return
    }
    setCurrentBatchOffset(nextOffset)
    // 显式传入 allContents，避免 stale closure 问题
    const { assignedBatch } = await assignCurrentBatch(nextOffset, customers, allContents)
    if (assignedBatch.length === 0) {
      toast.error("下一批次分配失败，请重试")
      return
    }
    setCurrentBatch(assignedBatch)
    setBatchDone(false)
    setProgress(0)
    setStep(3)
    const batchNo = Math.floor(nextOffset / currentBatchSize) + 1
    const totalBatches = Math.ceil(allContents.length / currentBatchSize)
    toast.success(`已切换至第 ${batchNo}/${totalBatches} 批，共 ${assignedBatch.length} 条`)
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">L</div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">
              灵芝内容生成系统
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => setHistoryModalOpen(true)} className="gap-2">
              <History className="w-4 h-4" />
              历史记录 {historyCount > 0 && <span className="bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full text-xs font-medium">{historyCount}</span>}
            </Button>
            <Link href="/history">
              <Button variant="ghost" size="sm" className="gap-2">
                <Eye className="w-4 h-4" />
                查看最近50条
              </Button>
            </Link>
            <Link href="/customers">
              <Button variant="ghost" size="sm" className="gap-2">
                <Users className="w-4 h-4" />
                客户管理
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div className="flex gap-4">
            {STEPS.map((s) => (
              <div key={s.id} className={`flex items-center gap-2 ${step >= s.id ? "text-indigo-600" : "text-slate-400"}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= s.id ? "bg-indigo-100 border-2 border-indigo-600" : "bg-slate-100 border-2 border-slate-200"}`}>
                  {step > s.id ? <CheckCircle2 className="w-5 h-5" /> : s.id}
                </div>
                <span className="font-medium">{s.label}</span>
                {s.id < 4 && <ArrowRight className="w-4 h-4 text-slate-300" />}
              </div>
            ))}
          </div>
          {step === 1 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const key = `usedImageIds_${platform}`
                  localStorage.removeItem(key)
                  toast.success(`已清空 ${platform === 'xhs' ? '小红书' : '朋友圈'}配图轮换历史`)
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-slate-500 hover:text-red-600 hover:bg-red-50 border border-slate-200 transition-all"
                title="清空配图轮换历史，下次处理从第一张图开始"
              >
                重置配图历史
              </button>
              <div className="flex bg-slate-100 p-1 rounded-lg">
              <button
                onClick={() => setPlatform('xhs')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${platform === 'xhs' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
              >
                <Smartphone className="w-4 h-4" />
                小红书
              </button>
              <button
                onClick={() => setPlatform('pyq')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${platform === 'pyq' ? 'bg-white text-green-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
              >
                <MessageCircle className="w-4 h-4" />
                朋友圈
              </button>
              </div>
            </div>
          )}
        </div>

        {step === 1 && (
          <Card className="border-dashed border-2 bg-white/50">
            <CardContent className="flex flex-col items-center justify-center py-20">
              <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-6">
                <Upload className="w-10 h-10 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">上传原始文案表格</h3>
              <p className="text-slate-500 mb-8 text-center max-w-md">
                支持 .xlsx 格式，系统将自动识别内容列。<br />
                当前选择平台：<span className="font-bold text-indigo-600">{platform === 'xhs' ? '小红书' : '朋友圈'}</span>
              </p>
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".xlsx" className="hidden" />
              <Button size="lg" onClick={() => fileInputRef.current?.click()} className="px-8 bg-indigo-600 hover:bg-indigo-700">
                选择文件
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>已加载 {allContents.length} 条文案</CardTitle>
                <p className="text-sm text-slate-500 mt-1">系统将为每条文案分配一位客户身份进行改写</p>
              </div>
              <Button onClick={randomAssign} className="bg-indigo-600 hover:bg-indigo-700">
                开始分配并处理
              </Button>
            </CardHeader>
            <CardContent>
              <div className="max-h-[500px] overflow-y-auto border rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-slate-500 border-b">序号</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-500 border-b">文案内容</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {allContents.map((item, i) => (
                      <tr key={i} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3 text-slate-400">{i + 1}</td>
                        <td className="px-4 py-3 line-clamp-2">{item.text}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <Card className="bg-indigo-600 text-white border-none shadow-lg overflow-hidden relative">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <Wand2 className="w-32 h-32" />
              </div>
              <CardContent className="pt-8 pb-8 relative z-10">
                <div className="flex justify-between items-end mb-4">
                  <div>
                    <p className="text-indigo-100 text-sm font-medium mb-1">正在处理第 {Math.floor(currentBatchOffset / BATCH_SIZE) + 1} 批次</p>
                    <h2 className="text-3xl font-bold">AI 智能处理中</h2>
                  </div>
                  <div className="text-right">
                    <span className="text-4xl font-black">{progress}%</span>
                  </div>
                </div>
                <Progress value={progress} className="h-3 bg-indigo-400/30" />
                <div className="mt-4 flex items-center gap-2 text-indigo-100">
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>正在{processingStage}...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>本批次处理完成</span>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {currentBatch.map((item, i) => (
                <Card key={i} className={`transition-all duration-300 ${processingIndex === i ? "ring-2 ring-indigo-600 shadow-md" : ""}`}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-xs font-bold">
                          {i + 1}
                        </div>
                        <div>
                          <p className="text-sm font-bold">{item.customerName}</p>
                          <p className="text-[10px] text-slate-400">{item.customerCategory} · {item.customerCity}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {item.status === "pending" && <Clock className="w-4 h-4 text-slate-300" />}
                        {item.status === "cleaning" && <RefreshCw className="w-4 h-4 text-indigo-500 animate-spin" />}
                        {item.status === "cover" && <ImageIcon className="w-4 h-4 text-violet-500 animate-pulse" />}
                        {item.status === "matching" && <Wand2 className="w-4 h-4 text-blue-500 animate-pulse" />}
                        {item.status === "done" && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                        {item.status === "error" && <AlertCircle className="w-4 h-4 text-red-500" />}
                        <span className={`text-xs font-medium ${
                          item.status === "done" ? "text-green-600" :
                          item.status === "error" ? "text-red-600" : "text-slate-500"
                        }`}>
                          {item.status === "pending" && "等待中"}
                          {item.status === "cleaning" && "清洗文案"}
                          {item.status === "cover" && "生成封面"}
                          {item.status === "matching" && "匹配素材"}
                          {item.status === "done" && "已完成"}
                          {item.status === "error" && "失败"}
                        </span>
                      </div>
                    </div>
                    <div className="bg-slate-50 rounded p-3 mb-3 h-24 overflow-hidden">
                      <p className="text-xs text-slate-600 line-clamp-4 leading-relaxed">
                        {item.cleanedText || item.text}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1 text-xs h-8" disabled={item.status !== "done"} onClick={() => setDetailItem(item)}>
                        查看详情
                      </Button>
                      {platform === 'xhs' && (
                        <Button variant="outline" size="sm" className="flex-1 text-xs h-8" disabled={item.status !== "done"} onClick={() => setPreviewItem(item)}>
                          预览封面
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex justify-center pt-4">
              {!loading && !batchDone && (
                <Button size="lg" onClick={startProcessing} className="px-12 bg-indigo-600 hover:bg-indigo-700 shadow-lg">
                  开始处理本批次
                </Button>
              )}
              {batchDone && (
                <div className="flex gap-4">
                  <Button size="lg" variant="outline" onClick={exportToExcel} className="px-8 border-indigo-200 text-indigo-700 hover:bg-indigo-50">
                    <Download className="w-5 h-5 mr-2" />
                    导出本批次 Excel
                  </Button>
                  <Button size="lg" onClick={nextBatch} className="px-8 bg-indigo-600 hover:bg-indigo-700 shadow-lg">
                    处理下一批次
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* 预览模态框 */}
      {previewItem && previewItem.coverData && (
        <CoverPreviewModal
          data={previewItem.coverData}
          onClose={() => setPreviewItem(null)}
          customerName={previewItem.customerName || ""}
        />
      )}

      {/* 详情模态框 */}
      {detailItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                  {detailItem.customerName?.[0]}
                </div>
                <div>
                  <h3 className="text-xl font-bold">{detailItem.customerName} 的处理结果</h3>
                  <p className="text-sm text-slate-500">{detailItem.customerCategory} · {detailItem.customerCity}</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setDetailItem(null)} className="rounded-full">
                <Trash2 className="w-5 h-5" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <section>
                    <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <Info className="w-4 h-4" /> 原始文案
                    </h4>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm leading-relaxed text-slate-600">
                      {detailItem.text}
                    </div>
                  </section>
                  <section>
                    <h4 className="text-sm font-bold text-indigo-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <Wand2 className="w-4 h-4" /> 清洗后文案 ({platform === 'xhs' ? '小红书' : '朋友圈'}风格)
                    </h4>
                    <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 text-sm leading-relaxed whitespace-pre-wrap">
                      {detailItem.cleanedText}
                    </div>
                  </section>
                  {detailItem.aiTotalScore !== undefined && (
                    <section>
                      <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">AI味检测评分</h4>
                      <div className="flex items-center gap-4">
                        <div className={`text-3xl font-black ${detailItem.aiTotalScore > 15 ? 'text-red-500' : 'text-green-500'}`}>
                          {detailItem.aiTotalScore}
                        </div>
                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full ${detailItem.aiTotalScore > 15 ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${Math.min(100, (detailItem.aiTotalScore / 40) * 100)}%` }}></div>
                        </div>
                      </div>
                    </section>
                  )}
                </div>
                <div className="space-y-6">
                  <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">配图预览</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {platform === 'xhs' && (
                      <div className="aspect-[3/4] bg-slate-100 rounded-lg overflow-hidden border relative group">
                        {detailItem.coverUrl ? (
                          <img src={detailItem.coverUrl} alt="封面" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 p-4 text-center">
                            <Loader2 className="w-6 h-6 animate-spin mb-2" />
                            <span className="text-[10px]">封面渲染中...</span>
                          </div>
                        )}
  
                      </div>
                    )}
                    <div className="aspect-[3/4] bg-slate-100 rounded-lg overflow-hidden border relative">
                      {detailItem.image2Url ? (
                        <img src={detailItem.image2Url} alt="配图2" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300"><ImageIcon className="w-8 h-8" /></div>
                      )}

                    </div>
                    <div className="aspect-[3/4] bg-slate-100 rounded-lg overflow-hidden border relative">
                      {detailItem.image3Url ? (
                        <img src={detailItem.image3Url} alt="配图3" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300"><ImageIcon className="w-8 h-8" /></div>
                      )}

                    </div>
                    {platform === 'pyq' && (
                      <div className="aspect-[3/4] bg-slate-100 rounded-lg overflow-hidden border relative">
                        {detailItem.image4Url ? (
                          <img src={detailItem.image4Url} alt="配图4" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-300"><ImageIcon className="w-8 h-8" /></div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6 border-t bg-slate-50 flex justify-end">
              <Button onClick={() => setDetailItem(null)} className="bg-slate-900 hover:bg-slate-800 px-8">
                关闭
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 历史批次模态框 */}
      <BatchHistoryModal
        open={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
      />
    </div>
  )
}
