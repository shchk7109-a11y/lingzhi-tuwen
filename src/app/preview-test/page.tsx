"use client"
import { useState, useEffect } from "react"
import XhsCoverCard, { CoverData } from "@/components/XhsCoverCard"

const testData: CoverData = {
  title: '职场"续命"神茶！',
  subtitle: '灵芝草本的温润回甘之旅',
  heroEmojis: ['🥤', '🍵', '🌿'],
  leftBlocks: [
    { title: '告别咖啡心慌', icon: '☕', detail: '解决手抖，心慌问题', color: 'teal' },
    { title: '拒中药苦涩', icon: '🫖', detail: '无麻无苦味，入喉顺滑', color: 'amber' }
  ],
  rightSection: {
    highlightTitle: '三重口感层次',
    layers: [
      { label: '入口草本香', desc: '清新自然', color: 'green' },
      { label: '中调回甘', desc: '醇厚甘甜', color: 'amber' },
      { label: '后调不涩', desc: '顺滑舒适', color: 'blue' }
    ],
    techPoint: '25年发酵技术',
    productName: '灵芝草本饮',
    productSlogan: '温润回甘|轻盈舒适|冲泡即饮'
  },
  compareTable: [
    { dimension: '口感', before: '苦涩，易心慌', after: '灵芝草本饮' },
    { dimension: '身体反馈', before: '强制接拌', after: '轻盈舒适' },
    { dimension: '便捷', before: '随主瞎喝', after: '冲泡即饮' }
  ],
  decorativeEmojis: ['🌿', '☕', '🍃'],
  sourceNote: '数据/资料来源：由NotebookLM提供',
  tags: ['灵芝草本', '职场续命', '健康饮品', '告别咖啡'],
  productImageUrl: '/materials/%E8%8D%89%E6%9C%AC%E5%92%96%E5%95%A1/%E6%82%A6%E6%B4%BB%E8%8D%89%E6%9C%AC%E7%BE%8E%E5%BC%8F/%E5%9B%BA%E4%BD%93%E9%A5%AE%E6%96%99%E5%8C%85.jpg'
}

// 12种风格的名称（与XhsCoverCard内部的STYLES对应）
const STYLE_NAMES = [
  '暖米奶茶', '清新薄荷', '深森绿意', '暖阳橙调',
  '玫瑰粉调', '深夜蓝调', '古典棕茶', '清雅薰衣',
  '珊瑚活力', '墨绿沉稳', '柠檬清新', '樱花粉嫩'
]

export default function PreviewTest() {
  const [selectedStyle, setSelectedStyle] = useState(0)
  const [currentData, setCurrentData] = useState<CoverData>({ ...testData, styleId: undefined })
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  if (!mounted) return null

  const handleStyleChange = (idx: number) => {
    setSelectedStyle(idx)
    setCurrentData(prev => ({ ...prev, styleId: String(idx) }))
  }

  const randomStyle = () => {
    const idx = Math.floor(Math.random() * 12)
    handleStyleChange(idx)
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-center text-[#1E4D2B] mb-2">小红书信息图封面 · 12种风格预览</h1>
        <p className="text-center text-gray-500 text-sm mb-6">AI处理时将随机选取风格，确保每条内容视觉差异化</p>

        {/* 风格选择器 */}
        <div className="flex flex-wrap gap-2 justify-center mb-6">
          {STYLE_NAMES.map((name, idx) => (
            <button key={idx} onClick={() => handleStyleChange(idx)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                selectedStyle === idx
                  ? 'bg-[#1E4D2B] text-white border-[#1E4D2B]'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-[#1E4D2B]'
              }`}>
              {name}
            </button>
          ))}
          <button onClick={randomStyle}
            className="px-3 py-1.5 rounded-full text-xs font-medium bg-amber-500 text-white border border-amber-500 hover:bg-amber-600">
            🎲 随机切换
          </button>
        </div>

        {/* 当前选中风格大图预览 */}
        <div className="flex justify-center gap-8 mb-8 flex-wrap">
          <div className="text-center">
            <p className="text-xs text-gray-400 mb-2">标准尺寸 (375×500) · 风格：{STYLE_NAMES[selectedStyle]}</p>
            <div style={{ width: 375, height: 500 }}>
              <XhsCoverCard data={currentData} scale={1} />
            </div>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-400 mb-2">缩略图 (250×333)</p>
            <div style={{ width: 250, height: 333, overflow: "hidden" }}>
              <XhsCoverCard data={currentData} scale={0.667} />
            </div>
          </div>
        </div>

        {/* 全部12种风格网格 */}
        <h2 className="text-lg font-bold text-center text-gray-700 mb-4">全部 12 种风格一览</h2>
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {STYLE_NAMES.map((name, idx) => (
            <div key={idx}
              className={`cursor-pointer rounded-xl overflow-hidden border-2 transition-all hover:scale-105 ${
                selectedStyle === idx ? 'border-[#1E4D2B] shadow-lg' : 'border-transparent hover:border-gray-300'
              }`}
              onClick={() => handleStyleChange(idx)}>
              <div style={{ width: '100%', paddingBottom: '133%', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, width: 375, height: 500, transform: 'scale(0.4)', transformOrigin: 'top left' }}>
                  <XhsCoverCard data={{ ...testData, styleId: String(idx) }} scale={1} />
                </div>
              </div>
              <div className="py-1.5 bg-white text-center border-t border-gray-100">
                <span className="text-xs text-gray-600">{name}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
