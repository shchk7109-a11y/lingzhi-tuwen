"use client"
import React from "react"

// ============================================================
// 封面数据接口
// ============================================================
export interface CoverDataV2 {
  title: string           // 大标题（粗体，击中痛点）
  subtitle: string        // 副标题（一句话说明）
  productType: "coffee" | "tea"  // 产品类型，决定主图插画
  leftBlocks: Array<{
    title: string         // 痛点/卖点标题
    icon: string          // emoji图标
    detail: string        // 详细说明
  }>
  rightSection: {
    highlightTitle: string   // 右侧亮点标题（如"25年专利发酵"）
    layers: Array<{
      label: string          // 层次标签（如"入口草本香"）
      desc: string           // 层次描述
    }>
    techPoint: string        // 核心技术点
    productName: string      // 产品名称
    productSlogan: string    // 产品标语（用|分隔）
  }
  compareTable: Array<{
    dimension: string   // 维度
    before: string      // 对比前
    after: string       // 对比后（产品优势）
  }>
  sourceNote?: string
  tags?: string[]
  // 风格控制
  colorScheme?: "herbal" | "amber" | "mint" | "rose" | "forest" | "tea"
  // 产品图叠加
  productImageUrl?: string
}

// ============================================================
// 配色方案
// ============================================================
const COLOR_SCHEMES = {
  herbal: {
    bg: "#F5F0E8",
    titleColor: "#1E4D2B",
    subtitleColor: "#5C4A32",
    accent1: "#2D7A4F",
    accent2: "#F0A030",
    block1Bg: "#E8F4EF",
    block1Border: "#7BC4A0",
    block1Title: "#1E4D2B",
    block2Bg: "#FFF3E0",
    block2Border: "#F0A030",
    block2Title: "#8B5E00",
    rightHighlightBg: "#2D7A4F",
    rightHighlightText: "#FFFFFF",
    layer1: "#4CAF50",
    layer2: "#FFA726",
    layer3: "#42A5F5",
    techColor: "#1E4D2B",
    productBg: "#8B5E00",
    productText: "#FFFFFF",
    tableHeaderBg: "#E8F4EF",
    tableHeaderText: "#1E4D2B",
    tableBeforeBg: "#FFF3E0",
    tableAfterBg: "#E8F4EF",
    tableAfterText: "#1E4D2B",
    divider: "#C8BFA8",
    footer: "#8B7355",
    heroBg: "radial-gradient(ellipse at 50% 60%, #EDE8DC 0%, #F5F0E8 100%)",
    leafColor: "#2D7A4F",
    steamColor: "#C8BFA8",
  },
  amber: {
    bg: "#FFF8F0",
    titleColor: "#8B3A00",
    subtitleColor: "#A0522D",
    accent1: "#E07020",
    accent2: "#4CAF50",
    block1Bg: "#FFF0E0",
    block1Border: "#E07020",
    block1Title: "#8B3A00",
    block2Bg: "#E8F4EF",
    block2Border: "#4CAF50",
    block2Title: "#1E4D2B",
    rightHighlightBg: "#E07020",
    rightHighlightText: "#FFFFFF",
    layer1: "#E07020",
    layer2: "#4CAF50",
    layer3: "#E91E63",
    techColor: "#8B3A00",
    productBg: "#E07020",
    productText: "#FFFFFF",
    tableHeaderBg: "#FFE8D0",
    tableHeaderText: "#8B3A00",
    tableBeforeBg: "#FFF0E0",
    tableAfterBg: "#E8F4EF",
    tableAfterText: "#1E4D2B",
    divider: "#E8C8A0",
    footer: "#A0522D",
    heroBg: "radial-gradient(ellipse at 50% 60%, #FFE8D0 0%, #FFF8F0 100%)",
    leafColor: "#E07020",
    steamColor: "#E8C8A0",
  },
  mint: {
    bg: "#F0FAF6",
    titleColor: "#0D5C3A",
    subtitleColor: "#2E7D5A",
    accent1: "#00A86B",
    accent2: "#FFB300",
    block1Bg: "#D4F0E4",
    block1Border: "#00C47A",
    block1Title: "#005C35",
    block2Bg: "#FFF8E7",
    block2Border: "#FFB300",
    block2Title: "#7A5000",
    rightHighlightBg: "#00A86B",
    rightHighlightText: "#FFFFFF",
    layer1: "#00C47A",
    layer2: "#FFB300",
    layer3: "#00B0D8",
    techColor: "#005C35",
    productBg: "#00A86B",
    productText: "#FFFFFF",
    tableHeaderBg: "#D4F0E4",
    tableHeaderText: "#005C35",
    tableBeforeBg: "#FFF8E7",
    tableAfterBg: "#D4F0E4",
    tableAfterText: "#005C35",
    divider: "#A8DFC4",
    footer: "#4A9A72",
    heroBg: "radial-gradient(ellipse at 50% 60%, #D4F0E4 0%, #F0FAF6 100%)",
    leafColor: "#00A86B",
    steamColor: "#A8DFC4",
  },
  rose: {
    bg: "#FFF5F8",
    titleColor: "#880E4F",
    subtitleColor: "#C2185B",
    accent1: "#E91E63",
    accent2: "#CE93D8",
    block1Bg: "#FCE4EC",
    block1Border: "#F06292",
    block1Title: "#880E4F",
    block2Bg: "#F3E5F5",
    block2Border: "#CE93D8",
    block2Title: "#6A1B9A",
    rightHighlightBg: "#E91E63",
    rightHighlightText: "#FFFFFF",
    layer1: "#E91E63",
    layer2: "#CE93D8",
    layer3: "#FF8A65",
    techColor: "#880E4F",
    productBg: "#E91E63",
    productText: "#FFFFFF",
    tableHeaderBg: "#FCE4EC",
    tableHeaderText: "#880E4F",
    tableBeforeBg: "#F3E5F5",
    tableAfterBg: "#FCE4EC",
    tableAfterText: "#880E4F",
    divider: "#F8BBD9",
    footer: "#C2185B",
    heroBg: "radial-gradient(ellipse at 50% 60%, #FCE4EC 0%, #FFF5F8 100%)",
    leafColor: "#E91E63",
    steamColor: "#F8BBD9",
  },
  forest: {
    bg: "#F1F8F4",
    titleColor: "#1B4332",
    subtitleColor: "#2D6A4F",
    accent1: "#40916C",
    accent2: "#F9A825",
    block1Bg: "#D8F3DC",
    block1Border: "#52B788",
    block1Title: "#1B4332",
    block2Bg: "#FFF9C4",
    block2Border: "#F9A825",
    block2Title: "#7A5000",
    rightHighlightBg: "#2D6A4F",
    rightHighlightText: "#FFFFFF",
    layer1: "#40916C",
    layer2: "#74C69D",
    layer3: "#52B788",
    techColor: "#1B4332",
    productBg: "#2D6A4F",
    productText: "#FFFFFF",
    tableHeaderBg: "#D8F3DC",
    tableHeaderText: "#1B4332",
    tableBeforeBg: "#FFF9C4",
    tableAfterBg: "#D8F3DC",
    tableAfterText: "#1B4332",
    divider: "#95D5B2",
    footer: "#52B788",
    heroBg: "radial-gradient(ellipse at 50% 60%, #D8F3DC 0%, #F1F8F4 100%)",
    leafColor: "#40916C",
    steamColor: "#95D5B2",
  },
  tea: {
    bg: "#FAF5EC",
    titleColor: "#4A3728",
    subtitleColor: "#6D4C41",
    accent1: "#795548",
    accent2: "#A1887F",
    block1Bg: "#EFE8DC",
    block1Border: "#A1887F",
    block1Title: "#4A3728",
    block2Bg: "#F5F0E8",
    block2Border: "#BCAAA4",
    block2Title: "#5D4037",
    rightHighlightBg: "#6D4C41",
    rightHighlightText: "#FFFFFF",
    layer1: "#795548",
    layer2: "#A1887F",
    layer3: "#8D6E63",
    techColor: "#4A3728",
    productBg: "#6D4C41",
    productText: "#FFFFFF",
    tableHeaderBg: "#EFE8DC",
    tableHeaderText: "#4A3728",
    tableBeforeBg: "#F5F0E8",
    tableAfterBg: "#EFE8DC",
    tableAfterText: "#4A3728",
    divider: "#D7CCC8",
    footer: "#8D6E63",
    heroBg: "radial-gradient(ellipse at 50% 60%, #EFE8DC 0%, #FAF5EC 100%)",
    leafColor: "#795548",
    steamColor: "#D7CCC8",
  },
}

// ============================================================
// SVG 手绘风格插画组件
// ============================================================

// 茶杯SVG（手绘风格）
function TeaCupSVG({ color = "#2D7A4F", steamColor = "#C8BFA8" }: { color?: string; steamColor?: string }) {
  return (
    <svg width="100" height="90" viewBox="0 0 100 90" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* 蒸汽 */}
      <path d="M38 18 Q36 12 38 6 Q40 0 38 -4" stroke={steamColor} strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.7"/>
      <path d="M50 16 Q48 10 50 4 Q52 -2 50 -6" stroke={steamColor} strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.8"/>
      <path d="M62 18 Q64 12 62 6 Q60 0 62 -4" stroke={steamColor} strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.7"/>
      {/* 茶碟 */}
      <ellipse cx="50" cy="78" rx="38" ry="7" fill={color} opacity="0.15"/>
      <ellipse cx="50" cy="76" rx="34" ry="5.5" fill="white" stroke={color} strokeWidth="1.5" opacity="0.9"/>
      {/* 杯身 */}
      <path d="M22 38 L28 70 Q50 76 72 70 L78 38 Z" fill="white" stroke={color} strokeWidth="1.8" opacity="0.95"/>
      {/* 杯内液体 */}
      <path d="M25 42 L30 68 Q50 73 70 68 L75 42 Z" fill={color} opacity="0.18"/>
      {/* 杯口椭圆 */}
      <ellipse cx="50" cy="38" rx="28" ry="6" fill="white" stroke={color} strokeWidth="1.8"/>
      {/* 杯内液面 */}
      <ellipse cx="50" cy="38" rx="26" ry="5" fill={color} opacity="0.25"/>
      {/* 把手 */}
      <path d="M78 45 Q90 45 90 55 Q90 65 78 63" stroke={color} strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      {/* 草本装饰 */}
      <circle cx="42" cy="52" r="3" fill={color} opacity="0.4"/>
      <circle cx="55" cy="48" r="2.5" fill={color} opacity="0.35"/>
      <circle cx="62" cy="55" r="2" fill={color} opacity="0.3"/>
    </svg>
  )
}

// 咖啡杯SVG（手绘风格）
function CoffeeCupSVG({ color = "#8B3A00", steamColor = "#E8C8A0" }: { color?: string; steamColor?: string }) {
  return (
    <svg width="100" height="90" viewBox="0 0 100 90" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* 蒸汽 */}
      <path d="M38 18 Q36 12 38 6 Q40 0 38 -4" stroke={steamColor} strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.7"/>
      <path d="M50 16 Q48 10 50 4 Q52 -2 50 -6" stroke={steamColor} strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.8"/>
      <path d="M62 18 Q64 12 62 6 Q60 0 62 -4" stroke={steamColor} strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.7"/>
      {/* 茶碟 */}
      <ellipse cx="50" cy="78" rx="38" ry="7" fill={color} opacity="0.15"/>
      <ellipse cx="50" cy="76" rx="34" ry="5.5" fill="white" stroke={color} strokeWidth="1.5" opacity="0.9"/>
      {/* 杯身（咖啡杯更矮更宽） */}
      <path d="M20 40 L27 70 Q50 76 73 70 L80 40 Z" fill="white" stroke={color} strokeWidth="1.8" opacity="0.95"/>
      {/* 杯内咖啡液体（深棕色） */}
      <path d="M23 44 L29 68 Q50 73 71 68 L77 44 Z" fill="#6B3A1F" opacity="0.75"/>
      {/* 杯口椭圆 */}
      <ellipse cx="50" cy="40" rx="30" ry="6.5" fill="white" stroke={color} strokeWidth="1.8"/>
      {/* 咖啡液面 */}
      <ellipse cx="50" cy="40" rx="28" ry="5.5" fill="#6B3A1F" opacity="0.85"/>
      {/* 奶泡圆圈 */}
      <circle cx="44" cy="40" r="5" fill="white" opacity="0.5"/>
      <circle cx="56" cy="40" r="4" fill="white" opacity="0.4"/>
      {/* 把手 */}
      <path d="M80 47 Q93 47 93 57 Q93 67 80 65" stroke={color} strokeWidth="2.5" fill="none" strokeLinecap="round"/>
    </svg>
  )
}

// 灵芝SVG
function GanodermasSVG({ color = "#2D7A4F" }: { color?: string }) {
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* 菌柄 */}
      <path d="M22 42 L22 28" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
      {/* 菌盖 */}
      <path d="M8 28 Q10 18 22 16 Q34 18 36 28 Q30 32 22 32 Q14 32 8 28Z" fill={color} opacity="0.8"/>
      {/* 菌盖高光 */}
      <path d="M12 24 Q16 18 24 18" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
      {/* 同心圆纹路 */}
      <path d="M10 27 Q12 22 22 20 Q32 22 34 27" stroke="white" strokeWidth="1" fill="none" opacity="0.3"/>
    </svg>
  )
}

// 草本叶子SVG
function LeafSVG({ color = "#2D7A4F", size = 28, rotate = 0 }: { color?: string; size?: number; rotate?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={{ transform: `rotate(${rotate}deg)` }}>
      <path d="M14 24 Q4 20 4 10 Q10 4 20 8 Q24 14 14 24Z" fill={color} opacity="0.7"/>
      <path d="M14 24 L14 10" stroke="white" strokeWidth="1" opacity="0.5"/>
      <path d="M14 18 Q10 14 8 12" stroke="white" strokeWidth="0.8" opacity="0.4"/>
      <path d="M14 14 Q18 12 20 10" stroke="white" strokeWidth="0.8" opacity="0.4"/>
    </svg>
  )
}

// 发酵罐SVG（技术标志）
function FermentTankSVG({ color = "#2D7A4F" }: { color?: string }) {
  return (
    <svg width="32" height="38" viewBox="0 0 32 38" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* 罐体 */}
      <rect x="6" y="8" width="20" height="24" rx="4" fill={color} opacity="0.15" stroke={color} strokeWidth="1.5"/>
      {/* 罐盖 */}
      <rect x="8" y="4" width="16" height="6" rx="3" fill={color} opacity="0.4"/>
      {/* 罐底 */}
      <rect x="10" y="32" width="12" height="4" rx="2" fill={color} opacity="0.3"/>
      {/* 观察窗 */}
      <circle cx="16" cy="20" r="5" fill="white" stroke={color} strokeWidth="1.2" opacity="0.9"/>
      <circle cx="16" cy="20" r="3" fill={color} opacity="0.3"/>
      {/* 气泡 */}
      <circle cx="12" cy="16" r="1.5" fill={color} opacity="0.5"/>
      <circle cx="20" cy="24" r="1" fill={color} opacity="0.4"/>
      {/* 管道 */}
      <path d="M26 14 Q30 14 30 18" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round"/>
    </svg>
  )
}

// 产品小包装SVG
function ProductPackSVG({ color = "#2D7A4F" }: { color?: string }) {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* 包装袋 */}
      <path d="M8 8 Q8 4 12 4 L24 4 Q28 4 28 8 L30 28 Q30 32 26 32 L10 32 Q6 32 6 28 Z" 
        fill={color} opacity="0.2" stroke={color} strokeWidth="1.5"/>
      {/* 封口 */}
      <path d="M10 10 L26 10" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      {/* 品牌圆 */}
      <circle cx="18" cy="20" r="6" fill={color} opacity="0.3"/>
      <circle cx="18" cy="20" r="3" fill={color} opacity="0.5"/>
      {/* 撕口 */}
      <path d="M24 4 L28 0" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

// ============================================================
// 主封面组件 V2
// ============================================================
interface XhsCoverCardV2Props {
  data: CoverDataV2
  scale?: number
}

export default function XhsCoverCardV2({ data, scale = 1 }: XhsCoverCardV2Props) {
  const scheme = COLOR_SCHEMES[data.colorScheme || "herbal"]
  const leftBlocks = data.leftBlocks || []
  const rightSection = data.rightSection || {
    highlightTitle: "25年专利发酵",
    layers: [
      { label: "入口草本香", desc: "清香自然" },
      { label: "中调回甘", desc: "醇厚甘甜" },
      { label: "后调不涩", desc: "顺滑舒适" },
    ],
    techPoint: "25年发酵技术",
    productName: "灵芝草本饮",
    productSlogan: "温润回甘|轻盈舒适|冲泡即饮",
  }
  const compareTable = data.compareTable || []
  const sloganParts = (rightSection.productSlogan || "").split("|")

  const W = 375
  const H = 600  // 增高到600，更接近3:4比例

  return (
    <div
      style={{
        width: W,
        height: H,
        transform: scale !== 1 ? `scale(${scale})` : undefined,
        transformOrigin: scale !== 1 ? "top left" : undefined,
        position: "relative",
        overflow: "hidden",
        borderRadius: 20,
        background: scheme.bg,
        fontFamily: '"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans SC", sans-serif',
        boxShadow: "0 8px 40px rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.08)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* ===== 背景装饰叶子 ===== */}
      <div style={{ position: "absolute", top: -8, right: -8, opacity: 0.12, pointerEvents: "none" }}>
        <LeafSVG color={scheme.leafColor} size={60} rotate={30} />
      </div>
      <div style={{ position: "absolute", bottom: 40, left: -10, opacity: 0.1, pointerEvents: "none" }}>
        <LeafSVG color={scheme.leafColor} size={50} rotate={-20} />
      </div>
      <div style={{ position: "absolute", top: 120, right: -5, opacity: 0.08, pointerEvents: "none" }}>
        <LeafSVG color={scheme.leafColor} size={40} rotate={15} />
      </div>

      {/* ===== 顶部标题区 ===== */}
      <div style={{
        padding: "18px 22px 10px",
        textAlign: "center",
        position: "relative",
        flexShrink: 0,
      }}>
        {/* 顶部装饰线 */}
        <div style={{
          position: "absolute", top: 10, left: "50%", transform: "translateX(-50%)",
          width: 48, height: 3.5,
          background: `linear-gradient(90deg, ${scheme.accent1}, ${scheme.accent2})`,
          borderRadius: 2,
        }} />
        {/* 主标题 */}
        <div style={{
          fontSize: 30,
          fontWeight: 900,
          color: scheme.titleColor,
          lineHeight: 1.25,
          letterSpacing: "-0.5px",
          marginTop: 12,
          textShadow: "0 1px 0 rgba(255,255,255,0.6)",
        }}>
          {data.title}
        </div>
        {/* 副标题 */}
        <div style={{
          fontSize: 13,
          color: scheme.subtitleColor,
          marginTop: 6,
          lineHeight: 1.5,
          fontWeight: 500,
          letterSpacing: "0.3px",
        }}>
          {data.subtitle}
        </div>
      </div>

      {/* ===== 中央主图区（手绘插画风格） ===== */}
      <div style={{
        position: "relative",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "6px 20px 8px",
        flexShrink: 0,
        minHeight: 110,
      }}>
        {/* 主图背景光晕 */}
        <div style={{
          position: "absolute",
          width: 160, height: 100,
          borderRadius: "50%",
          background: scheme.heroBg,
          filter: "blur(20px)",
          opacity: 0.8,
        }} />

        {/* 左侧装饰元素 */}
        <div style={{ position: "absolute", left: 28, top: 10, opacity: 0.85 }}>
          <GanodermasSVG color={scheme.accent1} />
        </div>
        <div style={{ position: "absolute", left: 14, bottom: 8, opacity: 0.7 }}>
          <LeafSVG color={scheme.leafColor} size={24} rotate={-30} />
        </div>

        {/* 中央主杯图 */}
        <div style={{ position: "relative", zIndex: 2 }}>
          {data.productType === "coffee"
            ? <CoffeeCupSVG color={scheme.accent1} steamColor={scheme.steamColor} />
            : <TeaCupSVG color={scheme.accent1} steamColor={scheme.steamColor} />
          }
        </div>

        {/* 右侧装饰元素 */}
        <div style={{ position: "absolute", right: 28, top: 8, opacity: 0.85 }}>
          <ProductPackSVG color={scheme.accent1} />
        </div>
        <div style={{ position: "absolute", right: 16, bottom: 10, opacity: 0.7 }}>
          <LeafSVG color={scheme.leafColor} size={22} rotate={20} />
        </div>

        {/* 产品图叠加（如有） */}
        {data.productImageUrl && (
          <div style={{
            position: "absolute",
            bottom: 4,
            left: 18,
            width: 56,
            height: 56,
            borderRadius: 10,
            overflow: "hidden",
            border: "2px solid rgba(255,255,255,0.9)",
            boxShadow: "0 3px 10px rgba(0,0,0,0.18)",
            background: "#fff",
            zIndex: 5,
          }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={data.productImageUrl} alt="产品图" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        )}
      </div>

      {/* 分割线 */}
      <div style={{
        height: 1.5,
        background: `linear-gradient(90deg, transparent 5%, ${scheme.divider} 30%, ${scheme.divider} 70%, transparent 95%)`,
        margin: "0 18px 10px",
        opacity: 0.8,
        flexShrink: 0,
      }} />

      {/* ===== 底部信息图区 ===== */}
      <div style={{
        display: "flex",
        gap: 8,
        padding: "0 10px",
        flex: 1,
        minHeight: 0,
      }}>

        {/* 左栏 - 痛点信息块 */}
        <div style={{ flex: "0 0 47%", display: "flex", flexDirection: "column", gap: 7 }}>
          {leftBlocks.slice(0, 2).map((block, idx) => {
            const bg = idx === 0 ? scheme.block1Bg : scheme.block2Bg
            const border = idx === 0 ? scheme.block1Border : scheme.block2Border
            const titleColor = idx === 0 ? scheme.block1Title : scheme.block2Title
            return (
              <div key={idx} style={{
                background: bg,
                border: `1.5px solid ${border}`,
                borderRadius: 12,
                overflow: "hidden",
                boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
              }}>
                {/* 标题行 */}
                <div style={{
                  background: `${border}22`,
                  borderBottom: `1px solid ${border}50`,
                  padding: "6px 10px",
                  fontSize: 12.5,
                  fontWeight: 800,
                  color: titleColor,
                  letterSpacing: "0.3px",
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                }}>
                  <span style={{ fontSize: 14 }}>{block.icon}</span>
                  {block.title}
                </div>
                {/* 详情行 */}
                <div style={{
                  padding: "7px 10px",
                  fontSize: 11,
                  color: titleColor,
                  lineHeight: 1.5,
                  fontWeight: 500,
                }}>
                  {block.detail}
                </div>
              </div>
            )
          })}

          {/* 底部装饰小图标行 */}
          <div style={{
            display: "flex",
            justifyContent: "space-around",
            alignItems: "center",
            padding: "4px 6px",
            marginTop: 2,
          }}>
            <ProductPackSVG color={scheme.accent1} />
            <TeaCupSVG color={scheme.accent1} steamColor={scheme.steamColor} />
          </div>
        </div>

        {/* 右栏 - 产品卖点区 */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>

          {/* 亮点标题块 */}
          <div style={{
            background: scheme.rightHighlightBg,
            borderRadius: 10,
            padding: "7px 10px",
            textAlign: "center",
            fontSize: 12.5,
            fontWeight: 800,
            color: scheme.rightHighlightText,
            boxShadow: `0 3px 8px ${scheme.accent1}40`,
            letterSpacing: "0.3px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 5,
          }}>
            <FermentTankSVG color={scheme.rightHighlightText} />
            <span>{rightSection.highlightTitle}</span>
          </div>

          {/* 产品标签块 */}
          <div style={{
            background: `linear-gradient(135deg, ${scheme.accent1}DD, ${scheme.accent1}AA)`,
            borderRadius: 10,
            padding: "7px 10px",
            textAlign: "center",
            boxShadow: `0 2px 6px ${scheme.accent1}30`,
          }}>
            <div style={{
              fontSize: 12,
              fontWeight: 800,
              color: "#FFFFFF",
              marginBottom: 3,
              letterSpacing: "0.5px",
            }}>
              {rightSection.productName}
            </div>
            <div style={{
              fontSize: 9.5,
              color: "rgba(255,255,255,0.9)",
              letterSpacing: "0.3px",
              display: "flex",
              justifyContent: "center",
              flexWrap: "wrap",
              gap: 2,
            }}>
              {sloganParts.map((p, i) => (
                <span key={i} style={{
                  background: "rgba(255,255,255,0.2)",
                  borderRadius: 4,
                  padding: "1px 5px",
                  fontSize: 9,
                }}>
                  {p.trim()}
                </span>
              ))}
            </div>
          </div>

          {/* 三层渐变条（口感层次） */}
          <div>
            <div style={{
              display: "flex",
              borderRadius: 8,
              overflow: "hidden",
              height: 24,
              border: "1px solid rgba(0,0,0,0.1)",
              boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
              marginBottom: 3,
            }}>
              {rightSection.layers.map((layer, idx) => {
                const colors = [scheme.layer1, scheme.layer2, scheme.layer3]
                const bg = colors[idx % colors.length]
                return (
                  <div key={idx} style={{
                    flex: 1,
                    background: bg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 8.5,
                    fontWeight: 700,
                    color: "#fff",
                    letterSpacing: "0.1px",
                    borderRight: idx < rightSection.layers.length - 1 ? "1px solid rgba(255,255,255,0.3)" : "none",
                  }}>
                    {layer.label}
                  </div>
                )
              })}
            </div>
            <div style={{
              display: "flex",
              justifyContent: "space-around",
              fontSize: 8.5,
              color: scheme.subtitleColor,
            }}>
              {rightSection.layers.map((layer, idx) => (
                <span key={idx} style={{ textAlign: "center" }}>{layer.desc}</span>
              ))}
            </div>
          </div>

          {/* 核心技术点 */}
          <div style={{
            textAlign: "center",
            fontSize: 14,
            fontWeight: 900,
            color: scheme.techColor,
            padding: "2px 0",
            letterSpacing: "0.5px",
            textShadow: "0 1px 0 rgba(255,255,255,0.5)",
          }}>
            {rightSection.techPoint}
          </div>

          {/* 对比表格 */}
          {compareTable.length > 0 && (
            <div style={{
              background: "rgba(255,255,255,0.8)",
              borderRadius: 8,
              border: `1px solid ${scheme.divider}`,
              overflow: "hidden",
              fontSize: 8.5,
              boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
            }}>
              {compareTable.slice(0, 3).map((row, idx) => (
                <div key={idx} style={{
                  display: "flex",
                  borderBottom: idx < Math.min(compareTable.length, 3) - 1 ? `1px solid ${scheme.divider}` : "none",
                }}>
                  <div style={{
                    flex: "0 0 30%",
                    padding: "4px 6px",
                    background: scheme.tableHeaderBg,
                    color: scheme.tableHeaderText,
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    fontSize: 8.5,
                    borderRight: `1px solid ${scheme.divider}`,
                  }}>
                    {row.dimension}
                  </div>
                  <div style={{
                    flex: 1,
                    padding: "4px 5px",
                    background: scheme.tableBeforeBg,
                    color: scheme.subtitleColor,
                    borderRight: `1px solid ${scheme.divider}`,
                    display: "flex",
                    alignItems: "center",
                    fontSize: 8.5,
                  }}>
                    {row.before}
                  </div>
                  <div style={{
                    flex: 1,
                    padding: "4px 5px",
                    background: scheme.tableAfterBg,
                    color: scheme.tableAfterText,
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    fontSize: 8.5,
                  }}>
                    {row.after}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ===== 底部标签与来源 ===== */}
      <div style={{
        padding: "6px 14px 10px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {(data.tags || []).slice(0, 3).map((tag, i) => (
            <span key={i} style={{
              fontSize: 8.5,
              color: scheme.accent1,
              background: `${scheme.accent1}15`,
              borderRadius: 4,
              padding: "1px 5px",
              fontWeight: 600,
            }}>
              #{tag}
            </span>
          ))}
        </div>
        <div style={{
          fontSize: 8,
          color: scheme.footer,
          textAlign: "right",
          letterSpacing: "0.2px",
        }}>
          {data.sourceNote || "数据来源：AI内容生成系统"}
        </div>
      </div>
    </div>
  )
}
