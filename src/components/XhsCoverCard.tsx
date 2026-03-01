"use client"
import React from "react"
import { COVER_STYLES, getStyleBySeed, getRandomStyle, CoverStyle } from "@/lib/cover-styles"

interface LeftBlock {
  title: string
  icon: string
  detail: string
  color?: string
}

interface Layer {
  label: string
  desc: string
  color?: string
}

interface RightSection {
  highlightTitle: string
  layers: Layer[]
  techPoint: string
  productName: string
  productSlogan: string
}

interface CompareRow {
  dimension: string
  before: string
  after: string
}

export interface CoverData {
  title: string
  subtitle: string
  heroEmojis: string[]
  leftBlocks: LeftBlock[]
  rightSection: RightSection
  compareTable: CompareRow[]
  decorativeEmojis: string[]
  sourceNote: string
  tags: string[]
  // 风格控制
  styleId?: string      // 指定风格ID，不指定则随机
  styleSeed?: string    // 用于确定性随机的种子
  // 产品图叠加（可选）
  productImageUrl?: string
  // 兼容旧版字段
  topEmojis?: string[]
  infoBlocks?: any[]
  rightHighlight?: string
  compareRows?: any[]
  productName?: string
  productSlogan?: string
}

interface XhsCoverCardProps {
  data: CoverData
  scale?: number
  forceStyle?: CoverStyle
}

// 布局变体：决定主图区的排列方式
type LayoutVariant = 'emoji-row' | 'emoji-triangle' | 'emoji-arc'

function getLayoutVariant(styleId: string): LayoutVariant {
  const variants: LayoutVariant[] = ['emoji-row', 'emoji-triangle', 'emoji-arc']
  let hash = 0
  for (let i = 0; i < styleId.length; i++) {
    hash = ((hash << 5) - hash) + styleId.charCodeAt(i)
    hash |= 0
  }
  return variants[Math.abs(hash) % variants.length]
}

export default function XhsCoverCard({ data, scale = 1, forceStyle }: XhsCoverCardProps) {
  // 确定使用的风格
  const style: CoverStyle = React.useMemo(() => {
    if (forceStyle) return forceStyle
    if (data.styleId) {
      return COVER_STYLES.find(s => s.id === data.styleId) || COVER_STYLES[0]
    }
    if (data.styleSeed) {
      return getStyleBySeed(data.styleSeed)
    }
    return getRandomStyle()
  }, [data.styleId, data.styleSeed, forceStyle])

  const layout = getLayoutVariant(style.id)

  // 兼容旧版数据格式
  const heroEmojis = data.heroEmojis || data.topEmojis || ["🍵", "🌿", "✨"]
  const leftBlocks = data.leftBlocks || (data.infoBlocks?.map((b: any, i: number) => ({
    title: b.title, icon: b.icon, detail: b.detail,
  })) as LeftBlock[]) || []
  const rightSection = data.rightSection || {
    highlightTitle: data.rightHighlight || "产品亮点",
    layers: [
      { label: "入口草本香", desc: "清香自然" },
      { label: "中调回甘", desc: "醇厚甘甜" },
      { label: "后调不涩", desc: "顺滑舒适" },
    ],
    techPoint: "传统工艺精制",
    productName: data.productName || "灵芝草本饮",
    productSlogan: data.productSlogan || "温润回甘|轻盈舒适|冲泡即饮",
  }
  const compareTable = data.compareTable || (data.compareRows?.map((r: any) => ({
    dimension: r.label, before: r.before, after: r.after,
  })) as CompareRow[]) || []
  const decorativeEmojis = data.decorativeEmojis || ["🍃", "☕", "🌸"]
  const sloganParts = (rightSection.productSlogan || "").split("|")

  const W = 375
  const H = 500

  // 左侧两个信息块的颜色，从风格中取
  const block1Style = {
    bg: style.leftBlock1Bg,
    border: style.leftBlock1Border,
    titleColor: style.leftBlock1Title,
    titleBg: style.leftBlock1Bg,
  }
  const block2Style = {
    bg: style.leftBlock2Bg,
    border: style.leftBlock2Border,
    titleColor: style.leftBlock2Title,
    titleBg: style.leftBlock2Bg,
  }
  const blockStyles = [block1Style, block2Style]

  return (
    <div
      style={{
        width: W,
        height: H,
        transform: scale !== 1 ? `scale(${scale})` : undefined,
        transformOrigin: scale !== 1 ? "top left" : undefined,
        position: "relative",
        overflow: "hidden",
        borderRadius: 18,
        background: style.bgColor,
        fontFamily: '"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans SC", sans-serif',
        boxShadow: "0 6px 32px rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.08)",
      }}
    >
      {/* 背景装饰 */}
      <div style={{
        position: "absolute", top: -20, right: -20, fontSize: 100, opacity: 0.04,
        transform: "rotate(25deg)", pointerEvents: "none", userSelect: "none", lineHeight: 1,
        color: style.decorColor,
      }}>🌿</div>
      <div style={{
        position: "absolute", bottom: 30, left: -20, fontSize: 80, opacity: 0.04,
        transform: "rotate(-15deg)", pointerEvents: "none", userSelect: "none", lineHeight: 1,
        color: style.decorColor,
      }}>🍃</div>

      {/* ===== 顶部标题区 ===== */}
      <div style={{ padding: "14px 20px 6px", textAlign: "center", position: "relative" }}>
        {/* 顶部装饰线 */}
        <div style={{
          position: "absolute", top: 8, left: "50%", transform: "translateX(-50%)",
          width: 40, height: 3,
          background: `linear-gradient(90deg, ${style.titleColor}, ${style.heroAccent})`,
          borderRadius: 2,
        }} />
        <div style={{
          fontSize: 27,
          fontWeight: 900,
          color: style.titleColor,
          lineHeight: 1.2,
          letterSpacing: "-0.3px",
          marginTop: 8,
          textShadow: "0 1px 0 rgba(255,255,255,0.5)",
        }}>
          {data.title}
        </div>
        <div style={{
          fontSize: 12.5,
          color: style.subtitleColor,
          marginTop: 4,
          lineHeight: 1.4,
          fontWeight: 500,
          letterSpacing: "0.3px",
        }}>
          {data.subtitle}
        </div>
      </div>

      {/* ===== 中部主图区 ===== */}
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: layout === 'emoji-triangle' ? "flex-end" : "center",
        gap: layout === 'emoji-arc' ? 6 : 10,
        padding: layout === 'emoji-triangle' ? "2px 24px 4px" : "4px 24px 6px",
        position: "relative",
        minHeight: 70,
      }}>
        {layout === 'emoji-row' && (
          <>
            <div style={{ fontSize: 36, filter: "drop-shadow(0 3px 6px rgba(0,0,0,0.12))", transform: "rotate(-8deg)", marginBottom: 4 }}>
              {heroEmojis[0]}
            </div>
            <div style={{
              fontSize: 54, filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.18))",
              background: "radial-gradient(circle, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.1) 70%)",
              borderRadius: "50%", padding: "6px 10px", lineHeight: 1,
            }}>
              {heroEmojis[1]}
            </div>
            <div style={{ fontSize: 36, filter: "drop-shadow(0 3px 6px rgba(0,0,0,0.12))", transform: "rotate(8deg)", marginBottom: 4 }}>
              {heroEmojis[2]}
            </div>
          </>
        )}
        {layout === 'emoji-triangle' && (
          <>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
              <div style={{ fontSize: 28, opacity: 0.8 }}>{heroEmojis[0]}</div>
              <div style={{ fontSize: 28, opacity: 0.8 }}>{heroEmojis[2]}</div>
            </div>
            <div style={{
              fontSize: 56, filter: "drop-shadow(0 4px 10px rgba(0,0,0,0.2))",
              background: `radial-gradient(circle, ${style.heroBg} 0%, transparent 70%)`,
              borderRadius: "50%", padding: "4px 8px", lineHeight: 1,
            }}>
              {heroEmojis[1]}
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
              <div style={{ fontSize: 28, opacity: 0.8 }}>{heroEmojis[3] || heroEmojis[0]}</div>
              <div style={{ fontSize: 28, opacity: 0.8 }}>{heroEmojis[4] || heroEmojis[2]}</div>
            </div>
          </>
        )}
        {layout === 'emoji-arc' && (
          <>
            {[0, 1, 2, 3, 4].map((i) => {
              const emoji = heroEmojis[i % heroEmojis.length]
              const sizes = [28, 36, 50, 36, 28]
              const rotations = [-12, -6, 0, 6, 12]
              const yOffsets = [8, 4, 0, 4, 8]
              return (
                <div key={i} style={{
                  fontSize: sizes[i],
                  transform: `rotate(${rotations[i]}deg) translateY(${yOffsets[i]}px)`,
                  filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))",
                  lineHeight: 1,
                }}>
                  {emoji}
                </div>
              )
            })}
          </>
        )}

      </div>

      {/* 产品图叠加（左下角固定位置，叠加在整个封面上） */}
      {data.productImageUrl && (
        <div style={{
          position: "absolute",
          bottom: 28,
          left: 10,
          width: 68,
          height: 68,
          borderRadius: 12,
          overflow: "hidden",
          border: `2.5px solid rgba(255,255,255,0.9)`,
          boxShadow: `0 4px 14px rgba(0,0,0,0.22), 0 1px 4px ${style.heroAccent}60`,
          background: "#fff",
          zIndex: 10,
        }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={data.productImageUrl}
            alt="产品图"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>
      )}

      {/* 分割线 */}
      <div style={{
        height: 1.5,
        background: `linear-gradient(90deg, transparent 5%, ${style.decorColor} 30%, ${style.decorColor} 70%, transparent 95%)`,
        margin: "0 16px 8px",
        opacity: 0.7,
      }} />

      {/* ===== 底部信息图区 ===== */}
      <div style={{ display: "flex", gap: 7, padding: "0 10px", flex: 1 }}>

        {/* 左栏 - 痛点信息块 */}
        <div style={{ flex: "0 0 47%", display: "flex", flexDirection: "column", gap: 6 }}>
          {leftBlocks.slice(0, 2).map((block, idx) => {
            const bs = blockStyles[idx] || blockStyles[0]
            return (
              <div key={idx} style={{
                background: bs.bg,
                border: `1.5px solid ${bs.border}`,
                borderRadius: 10,
                overflow: "hidden",
                boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
              }}>
                <div style={{
                  background: bs.bg,
                  borderBottom: `1px solid ${bs.border}60`,
                  padding: "5px 10px",
                  fontSize: 11.5,
                  fontWeight: 800,
                  color: bs.titleColor,
                  textAlign: "center",
                  letterSpacing: "0.2px",
                }}>
                  {block.title}
                </div>
                <div style={{ padding: "6px 8px", display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{
                    background: "rgba(255,255,255,0.7)",
                    borderRadius: 6, padding: "3px 4px",
                    fontSize: 18, lineHeight: 1, flexShrink: 0,
                  }}>
                    {block.icon}
                  </div>
                  <span style={{ fontSize: 10.5, color: bs.titleColor, lineHeight: 1.4, fontWeight: 500 }}>
                    {block.detail}
                  </span>
                </div>
              </div>
            )
          })}

          {/* 底部装饰小图 */}
          <div style={{
            display: "flex", justifyContent: "space-around",
            padding: "3px 4px", fontSize: 18, opacity: 0.65, marginTop: 2,
          }}>
            {decorativeEmojis.slice(0, 3).map((e, i) => (
              <span key={i} style={{
                filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.1))",
                transform: i === 1 ? "scale(1.15)" : "scale(0.9)",
              }}>{e}</span>
            ))}
          </div>
        </div>

        {/* 右栏 - 产品卖点区 */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 5 }}>
          {/* 亮点标题块 */}
          <div style={{
            background: `linear-gradient(135deg, ${style.leftBlock2Border}CC, ${style.leftBlock2Border})`,
            borderRadius: 8,
            padding: "5px 8px",
            textAlign: "center",
            fontSize: 11.5,
            fontWeight: 800,
            color: style.leftBlock2Title,
            border: `1.5px solid ${style.leftBlock2Border}`,
            boxShadow: `0 2px 4px ${style.leftBlock2Border}30`,
            letterSpacing: "0.2px",
          }}>
            {rightSection.highlightTitle}
          </div>

          {/* 三层渐变条 */}
          <div style={{
            display: "flex", borderRadius: 7, overflow: "hidden",
            height: 22, border: "1px solid rgba(0,0,0,0.1)",
            boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
          }}>
            {rightSection.layers.map((layer, idx) => {
              const colors = style.layerColors
              const bg = colors[idx % colors.length]
              return (
                <div key={idx} style={{
                  flex: 1, background: bg,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 8, fontWeight: 700, color: "#fff",
                  letterSpacing: "0.1px",
                  borderRight: idx < rightSection.layers.length - 1 ? "1px solid rgba(255,255,255,0.3)" : "none",
                }}>
                  {layer.label}
                </div>
              )
            })}
          </div>
          {/* 层描述 */}
          <div style={{
            display: "flex", justifyContent: "space-around",
            fontSize: 8.5, color: style.subtitleColor, marginTop: -2,
          }}>
            {rightSection.layers.map((layer, idx) => (
              <span key={idx} style={{ textAlign: "center" }}>{layer.desc}</span>
            ))}
          </div>

          {/* 核心技术点 */}
          <div style={{
            textAlign: "center", fontSize: 13.5, fontWeight: 900,
            color: style.titleColor, padding: "1px 0", letterSpacing: "0.5px",
            textShadow: "0 1px 0 rgba(255,255,255,0.5)",
          }}>
            {rightSection.techPoint}
          </div>

          {/* 产品标签块 */}
          <div style={{
            background: `linear-gradient(135deg, ${style.productBg}EE, ${style.productBg})`,
            borderRadius: 8, padding: "5px 8px", textAlign: "center",
            boxShadow: `0 2px 6px ${style.productBg}40`,
            border: "1px solid rgba(255,255,255,0.15)",
          }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: style.productText, marginBottom: 2, letterSpacing: "0.5px" }}>
              {rightSection.productName}
            </div>
            <div style={{ fontSize: 8.5, color: `${style.productText}E0`, letterSpacing: "0.3px" }}>
              {sloganParts.map((p, i) => (
                <React.Fragment key={i}>
                  {i > 0 && <span style={{ opacity: 0.7 }}> | </span>}
                  {p.trim()}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* 对比表格 */}
          {compareTable.length > 0 && (
            <div style={{
              background: "rgba(255,255,255,0.75)",
              borderRadius: 7, border: `1px solid ${style.decorColor}`,
              overflow: "hidden", fontSize: 8.5,
              boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
            }}>
              {compareTable.slice(0, 3).map((row, idx) => (
                <div key={idx} style={{
                  display: "flex",
                  borderBottom: idx < Math.min(compareTable.length, 3) - 1 ? `1px solid ${style.decorColor}` : "none",
                }}>
                  <div style={{
                    flex: "0 0 30%", padding: "3px 5px",
                    background: style.tableHeaderBg,
                    color: style.tableHeaderText,
                    fontWeight: 700, display: "flex", alignItems: "center",
                    fontSize: 8, borderRight: `1px solid ${style.decorColor}`,
                  }}>
                    {row.dimension}
                  </div>
                  <div style={{
                    flex: 1, padding: "3px 4px",
                    background: style.tableBeforeBg,
                    color: style.subtitleColor,
                    borderRight: `1px solid ${style.decorColor}`,
                    display: "flex", alignItems: "center", fontSize: 8,
                  }}>
                    {row.before}
                  </div>
                  <div style={{
                    flex: 1, padding: "3px 4px",
                    background: style.tableAfterBg,
                    color: style.tableAfterText,
                    fontWeight: 700, display: "flex", alignItems: "center", fontSize: 8,
                  }}>
                    {row.after}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ===== 底部来源说明 ===== */}
      <div style={{
        textAlign: "center", fontSize: 8.5, color: style.footerColor,
        padding: "5px 12px 7px", marginTop: 3, letterSpacing: "0.2px",
      }}>
        {data.sourceNote || "数据/资料来源：AI内容生成系统"}
      </div>
    </div>
  )
}

// 导出风格列表供外部使用
export { COVER_STYLES }
