"use client"
import React from "react"

// ============================================================
// 封面数据接口
// ============================================================
export interface CoverDataV3 {
  title: string
  subtitle: string
  illustrationUrl: string   // AI生成的插画URL
  leftBlocks: Array<{
    title: string
    icon: string
    detail: string
  }>
  rightSection: {
    highlightTitle: string
    layers: Array<{ label: string; desc: string; emoji?: string; icon?: string }>
    techPoint: string
    productName: string
    productSlogan: string
  }
  compareTable: Array<{
    dimension: string
    before: string
    after: string
  }>
  sourceNote?: string
  tags?: string[]
  layout?: "classic" | "hero-top" | "split" | "magazine" | "minimal"
  colorScheme?: "herbal" | "amber" | "mint" | "rose" | "forest" | "tea" | "midnight" | "coral"
  productImageUrl?: string
}

// ============================================================
// 配色方案（8种）
// ============================================================
const SCHEMES = {
  herbal: {
    bg: "#F5F0E8", title: "#1E4D2B", subtitle: "#5C4A32",
    accent: "#2D7A4F", accent2: "#F0A030",
    block1Bg: "#E8F4EF", block1Border: "#7BC4A0", block1Text: "#1E4D2B",
    block2Bg: "#FFF3E0", block2Border: "#F0A030", block2Text: "#8B5E00",
    highlightBg: "#1E4D2B", highlightText: "#FFFFFF",
    layer: ["#4CAF50", "#FFA726", "#42A5F5"],
    productBg: "#8B5E00", productText: "#FFFFFF",
    tableBg: "rgba(255,255,255,0.8)", tableHeader: "#E8F4EF", tableHeaderText: "#1E4D2B",
    tableBefore: "#FFF3E0", tableAfter: "#E8F4EF", tableAfterText: "#1E4D2B",
    divider: "#C8BFA8", footer: "#8B7355",
    tagBg: "#E8F4EF", tagText: "#1E4D2B",
    heroBg: "linear-gradient(160deg, #EDE8DC 0%, #F5F0E8 100%)",
  },
  amber: {
    bg: "#FFF8F0", title: "#8B3A00", subtitle: "#A0522D",
    accent: "#E07020", accent2: "#4CAF50",
    block1Bg: "#FFF0E0", block1Border: "#E07020", block1Text: "#8B3A00",
    block2Bg: "#E8F4EF", block2Border: "#4CAF50", block2Text: "#1E4D2B",
    highlightBg: "#E07020", highlightText: "#FFFFFF",
    layer: ["#E07020", "#4CAF50", "#E91E63"],
    productBg: "#E07020", productText: "#FFFFFF",
    tableBg: "rgba(255,255,255,0.8)", tableHeader: "#FFE8D0", tableHeaderText: "#8B3A00",
    tableBefore: "#FFF0E0", tableAfter: "#E8F4EF", tableAfterText: "#1E4D2B",
    divider: "#E8C8A0", footer: "#A0522D",
    tagBg: "#FFF0E0", tagText: "#8B3A00",
    heroBg: "linear-gradient(160deg, #FFE8D0 0%, #FFF8F0 100%)",
  },
  mint: {
    bg: "#F0FAF6", title: "#0D5C3A", subtitle: "#2E7D5A",
    accent: "#00A86B", accent2: "#FFB300",
    block1Bg: "#D4F0E4", block1Border: "#00C47A", block1Text: "#005C35",
    block2Bg: "#FFF8E7", block2Border: "#FFB300", block2Text: "#7A5000",
    highlightBg: "#00A86B", highlightText: "#FFFFFF",
    layer: ["#00C47A", "#FFB300", "#00B0D8"],
    productBg: "#00A86B", productText: "#FFFFFF",
    tableBg: "rgba(255,255,255,0.8)", tableHeader: "#D4F0E4", tableHeaderText: "#005C35",
    tableBefore: "#FFF8E7", tableAfter: "#D4F0E4", tableAfterText: "#005C35",
    divider: "#A8DFC4", footer: "#4A9A72",
    tagBg: "#D4F0E4", tagText: "#005C35",
    heroBg: "linear-gradient(160deg, #D4F0E4 0%, #F0FAF6 100%)",
  },
  rose: {
    bg: "#FFF5F8", title: "#880E4F", subtitle: "#C2185B",
    accent: "#E91E63", accent2: "#CE93D8",
    block1Bg: "#FCE4EC", block1Border: "#F06292", block1Text: "#880E4F",
    block2Bg: "#F3E5F5", block2Border: "#CE93D8", block2Text: "#6A1B9A",
    highlightBg: "#E91E63", highlightText: "#FFFFFF",
    layer: ["#E91E63", "#CE93D8", "#FF8A65"],
    productBg: "#E91E63", productText: "#FFFFFF",
    tableBg: "rgba(255,255,255,0.8)", tableHeader: "#FCE4EC", tableHeaderText: "#880E4F",
    tableBefore: "#F3E5F5", tableAfter: "#FCE4EC", tableAfterText: "#880E4F",
    divider: "#F8BBD9", footer: "#C2185B",
    tagBg: "#FCE4EC", tagText: "#880E4F",
    heroBg: "linear-gradient(160deg, #FCE4EC 0%, #FFF5F8 100%)",
  },
  forest: {
    bg: "#F1F8F4", title: "#1B4332", subtitle: "#2D6A4F",
    accent: "#40916C", accent2: "#F9A825",
    block1Bg: "#D8F3DC", block1Border: "#52B788", block1Text: "#1B4332",
    block2Bg: "#FFF9C4", block2Border: "#F9A825", block2Text: "#7A5000",
    highlightBg: "#2D6A4F", highlightText: "#FFFFFF",
    layer: ["#40916C", "#74C69D", "#52B788"],
    productBg: "#2D6A4F", productText: "#FFFFFF",
    tableBg: "rgba(255,255,255,0.8)", tableHeader: "#D8F3DC", tableHeaderText: "#1B4332",
    tableBefore: "#FFF9C4", tableAfter: "#D8F3DC", tableAfterText: "#1B4332",
    divider: "#95D5B2", footer: "#52B788",
    tagBg: "#D8F3DC", tagText: "#1B4332",
    heroBg: "linear-gradient(160deg, #D8F3DC 0%, #F1F8F4 100%)",
  },
  tea: {
    bg: "#FAF5EC", title: "#4A3728", subtitle: "#6D4C41",
    accent: "#795548", accent2: "#A1887F",
    block1Bg: "#EFE8DC", block1Border: "#A1887F", block1Text: "#4A3728",
    block2Bg: "#F5F0E8", block2Border: "#BCAAA4", block2Text: "#5D4037",
    highlightBg: "#6D4C41", highlightText: "#FFFFFF",
    layer: ["#795548", "#A1887F", "#8D6E63"],
    productBg: "#6D4C41", productText: "#FFFFFF",
    tableBg: "rgba(255,255,255,0.8)", tableHeader: "#EFE8DC", tableHeaderText: "#4A3728",
    tableBefore: "#F5F0E8", tableAfter: "#EFE8DC", tableAfterText: "#4A3728",
    divider: "#D7CCC8", footer: "#8D6E63",
    tagBg: "#EFE8DC", tagText: "#4A3728",
    heroBg: "linear-gradient(160deg, #EFE8DC 0%, #FAF5EC 100%)",
  },
  midnight: {
    bg: "#1A1A2E", title: "#E0E0FF", subtitle: "#A0A8D0",
    accent: "#7C83FD", accent2: "#FFC857",
    block1Bg: "#16213E", block1Border: "#7C83FD", block1Text: "#E0E0FF",
    block2Bg: "#0F3460", block2Border: "#FFC857", block2Text: "#FFC857",
    highlightBg: "#7C83FD", highlightText: "#FFFFFF",
    layer: ["#7C83FD", "#FFC857", "#FF6B6B"],
    productBg: "#7C83FD", productText: "#FFFFFF",
    tableBg: "rgba(255,255,255,0.08)", tableHeader: "#16213E", tableHeaderText: "#E0E0FF",
    tableBefore: "#0F3460", tableAfter: "#16213E", tableAfterText: "#7C83FD",
    divider: "#334", footer: "#A0A8D0",
    tagBg: "#16213E", tagText: "#7C83FD",
    heroBg: "linear-gradient(160deg, #16213E 0%, #1A1A2E 100%)",
  },
  coral: {
    bg: "#FFF5F3", title: "#B71C1C", subtitle: "#C62828",
    accent: "#EF5350", accent2: "#FFA726",
    block1Bg: "#FFEBEE", block1Border: "#EF5350", block1Text: "#B71C1C",
    block2Bg: "#FFF3E0", block2Border: "#FFA726", block2Text: "#7A4000",
    highlightBg: "#EF5350", highlightText: "#FFFFFF",
    layer: ["#EF5350", "#FFA726", "#66BB6A"],
    productBg: "#EF5350", productText: "#FFFFFF",
    tableBg: "rgba(255,255,255,0.8)", tableHeader: "#FFEBEE", tableHeaderText: "#B71C1C",
    tableBefore: "#FFF3E0", tableAfter: "#FFEBEE", tableAfterText: "#B71C1C",
    divider: "#FFCDD2", footer: "#C62828",
    tagBg: "#FFEBEE", tagText: "#B71C1C",
    heroBg: "linear-gradient(160deg, #FFEBEE 0%, #FFF5F3 100%)",
  },
}

// ============================================================
// 子组件：信息块
// ============================================================
function InfoBlock({ title, icon, detail, bg, border, textColor }: {
  title: string; icon: string; detail: string;
  bg: string; border: string; textColor: string;
}) {
  return (
    <div style={{
      background: bg,
      border: `1.5px solid ${border}`,
      borderRadius: 12,
      overflow: "hidden",
      boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
    }}>
      <div style={{
        background: `${border}25`,
        borderBottom: `1px solid ${border}50`,
        padding: "6px 10px",
        fontSize: 12,
        fontWeight: 800,
        color: textColor,
        display: "flex",
        alignItems: "center",
        gap: 5,
      }}>
        <span style={{ fontSize: 14 }}>{icon}</span>
        {title}
      </div>
      <div style={{
        padding: "7px 10px",
        fontSize: 10.5,
        color: textColor,
        lineHeight: 1.5,
        fontWeight: 500,
      }}>
        {detail}
      </div>
    </div>
  )
}

// ============================================================
// 子组件：对比表格
// ============================================================
function CompareTable({ rows, scheme }: { rows: CoverDataV3["compareTable"]; scheme: typeof SCHEMES["herbal"] }) {
  if (!rows || rows.length === 0) return null
  return (
    <div style={{
      background: scheme.tableBg,
      borderRadius: 8,
      border: `1px solid ${scheme.divider}`,
      overflow: "hidden",
      fontSize: 8.5,
      boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
    }}>
      {/* 标题行：使用前 vs 使用后 */}
      <div style={{
        display: "flex",
        borderBottom: `1px solid ${scheme.divider}`,
      }}>
        <div style={{
          flex: "0 0 28%",
          padding: "4px 6px",
          background: scheme.tableHeader,
          borderRight: `1px solid ${scheme.divider}`,
        }} />
        <div style={{
          flex: 1, padding: "4px 5px",
          background: "#9E9E9E",
          color: "#FFFFFF",
          fontWeight: 800,
          fontSize: 8,
          display: "flex", alignItems: "center", justifyContent: "center",
          gap: 2,
          borderRight: `1px solid ${scheme.divider}`,
        }}>
          <span style={{ fontSize: 9 }}>😩</span> 以前的我
        </div>
        <div style={{
          flex: 1, padding: "4px 5px",
          background: scheme.highlightBg,
          color: scheme.highlightText,
          fontWeight: 800,
          fontSize: 8,
          display: "flex", alignItems: "center", justifyContent: "center",
          gap: 2,
        }}>
          <span style={{ fontSize: 9 }}>✨</span> 现在的我
        </div>
      </div>
      {rows.slice(0, 3).map((row, idx) => (
        <div key={idx} style={{
          display: "flex",
          borderBottom: idx < Math.min(rows.length, 3) - 1 ? `1px solid ${scheme.divider}` : "none",
        }}>
          <div style={{
            flex: "0 0 28%", padding: "4px 6px",
            background: scheme.tableHeader, color: scheme.tableHeaderText,
            fontWeight: 700, display: "flex", alignItems: "center",
            borderRight: `1px solid ${scheme.divider}`,
          }}>{row.dimension}</div>
          <div style={{
            flex: 1, padding: "4px 5px",
            background: scheme.tableBefore, color: "#757575",
            borderRight: `1px solid ${scheme.divider}`,
            display: "flex", alignItems: "center",
            textDecoration: "line-through",
            textDecorationColor: "rgba(0,0,0,0.25)",
          }}>{row.before}</div>
          <div style={{
            flex: 1, padding: "4px 5px",
            background: scheme.tableAfter, color: scheme.tableAfterText,
            fontWeight: 700, display: "flex", alignItems: "center",
          }}>{row.after}</div>
        </div>
      ))}
    </div>
  )
}

// ============================================================
// 子组件：右侧卖点区
// ============================================================
function RightSection({ section, scheme }: {
  section: CoverDataV3["rightSection"];
  scheme: typeof SCHEMES["herbal"];
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {/* 产品名称块（只显示名称，无功能宣传词） */}
      <div style={{
        background: scheme.highlightBg,
        borderRadius: 10, padding: "9px 10px",
        textAlign: "center", fontSize: 13, fontWeight: 800,
        color: scheme.highlightText,
        boxShadow: `0 3px 8px ${scheme.accent}40`,
      }}>
        {section.highlightTitle}
      </div>

      {/* 核心原料展示（原料名+原料小图） */}
      <div style={{ padding: "7px 8px", background: scheme.block1Bg, borderRadius: 8, border: `1px solid ${scheme.block1Border}` }}>
        <div style={{ fontSize: 9.5, color: scheme.subtitle, marginBottom: 5, textAlign: "center", fontWeight: 600 }}>核心原料</div>
        <div style={{ display: "flex", justifyContent: "space-around" }}>
          {(section.layers || []).map((l, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
              {(l as any).icon ? (
                <img src={(l as any).icon} alt={l.desc} style={{ width: 32, height: 32, objectFit: "contain", borderRadius: 6 }} />
              ) : (
                <div style={{ width: 32, height: 32, borderRadius: 6, background: `${scheme.block1Border}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
                  {(l as any).emoji || "🌿"}
                </div>
              )}
              <span style={{ fontSize: 10.5, fontWeight: 700, color: scheme.block1Text, textAlign: "center" }}>{l.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ============================================================
// 布局1：经典布局（插画居中，下方左右分栏）
// ============================================================
function LayoutClassic({ data, scheme }: { data: CoverDataV3; scheme: typeof SCHEMES["herbal"] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* 标题区 */}
      <div style={{ padding: "16px 20px 8px", textAlign: "center", flexShrink: 0 }}>
        <div style={{ width: 44, height: 3, background: `linear-gradient(90deg, ${scheme.accent}, ${scheme.accent2})`, borderRadius: 2, margin: "0 auto 10px" }} />
        <div style={{ fontSize: 28, fontWeight: 900, color: scheme.title, lineHeight: 1.25, letterSpacing: "-0.5px" }}>
          {data.title}
        </div>
        <div style={{ fontSize: 12.5, color: scheme.subtitle, marginTop: 5, lineHeight: 1.5 }}>
          {data.subtitle}
        </div>
      </div>

      {/* 插画区 */}
      <div style={{
        position: "relative", flexShrink: 0,
        height: 180, margin: "0 16px",
        borderRadius: 16, overflow: "hidden",
        background: scheme.heroBg,
        boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
      }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={data.illustrationUrl}
          alt="产品插画"
          style={{ width: "100%", height: "100%", objectFit: "contain", padding: "8px" }}
        />
        {/* 产品小图叠加 */}
        {data.productImageUrl && (
          <div style={{
            position: "absolute", bottom: 8, left: 8,
            width: 52, height: 52, borderRadius: 10,
            overflow: "hidden", border: "2px solid rgba(255,255,255,0.9)",
            boxShadow: "0 3px 10px rgba(0,0,0,0.18)",
          }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={data.productImageUrl} alt="产品" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        )}
      </div>

      {/* 分割线 */}
      <div style={{ height: 1.5, background: `linear-gradient(90deg, transparent 5%, ${scheme.divider} 40%, ${scheme.divider} 60%, transparent 95%)`, margin: "8px 16px", opacity: 0.8 }} />

      {/* 底部信息区 */}
      <div style={{ display: "flex", gap: 8, padding: "0 10px", flex: 1, minHeight: 0 }}>
        {/* 左栏 */}
        <div style={{ flex: "0 0 47%", display: "flex", flexDirection: "column", gap: 6 }}>
          {data.leftBlocks.slice(0, 2).map((block, idx) => (
            <InfoBlock key={idx} {...block}
              bg={idx === 0 ? scheme.block1Bg : scheme.block2Bg}
              border={idx === 0 ? scheme.block1Border : scheme.block2Border}
              textColor={idx === 0 ? scheme.block1Text : scheme.block2Text}
            />
          ))}
          <CompareTable rows={data.compareTable} scheme={scheme} />
        </div>
        {/* 右栏 */}
        <div style={{ flex: 1 }}>
          <RightSection section={data.rightSection} scheme={scheme} />
        </div>
      </div>

    </div>
  )
}

// ============================================================
// 布局2：大图顶部（插画占上半部分，信息在下）
// ============================================================
function LayoutHeroTop({ data, scheme }: { data: CoverDataV3; scheme: typeof SCHEMES["herbal"] }) {
  const sloganParts = (data.rightSection.productSlogan || "").split("|")
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* 大图主区（上半部分） */}
      <div style={{
        position: "relative", flexShrink: 0,
        height: 240,
        background: scheme.heroBg,
        overflow: "hidden",
      }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={data.illustrationUrl}
          alt="产品插画"
          style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center" }}
        />
        {/* 标题叠加在图上 */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          background: "linear-gradient(transparent, rgba(0,0,0,0.55))",
          padding: "24px 18px 14px",
        }}>
          <div style={{ fontSize: 26, fontWeight: 900, color: "#FFFFFF", lineHeight: 1.25, textShadow: "0 2px 8px rgba(0,0,0,0.5)" }}>
            {data.title}
          </div>
          <div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.88)", marginTop: 4, lineHeight: 1.4 }}>
            {data.subtitle}
          </div>
        </div>
        {/* 产品小图 */}
        {data.productImageUrl && (
          <div style={{
            position: "absolute", top: 12, right: 12,
            width: 52, height: 52, borderRadius: 10,
            overflow: "hidden", border: "2px solid rgba(255,255,255,0.9)",
            boxShadow: "0 3px 10px rgba(0,0,0,0.3)",
          }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={data.productImageUrl} alt="产品" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        )}
      </div>

      {/* 下半信息区 */}
      <div style={{ flex: 1, padding: "10px 12px 0", display: "flex", flexDirection: "column", gap: 8 }}>
        {/* 两个信息块横排 */}
        <div style={{ display: "flex", gap: 8 }}>
          {data.leftBlocks.slice(0, 2).map((block, idx) => (
            <div key={idx} style={{ flex: 1 }}>
              <InfoBlock {...block}
                bg={idx === 0 ? scheme.block1Bg : scheme.block2Bg}
                border={idx === 0 ? scheme.block1Border : scheme.block2Border}
                textColor={idx === 0 ? scheme.block1Text : scheme.block2Text}
              />
            </div>
          ))}
        </div>

        {/* 产品名称展示 */}
        <div style={{
          background: scheme.highlightBg,
          borderRadius: 10, padding: "8px 12px",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: scheme.highlightText, letterSpacing: "0.5px" }}>
            {data.rightSection.techPoint}
          </div>
        </div>

        {/* 核心原料展示 */}
        <div style={{ padding: "7px 8px", background: scheme.block1Bg, borderRadius: 8, border: `1px solid ${scheme.block1Border}` }}>
          <div style={{ fontSize: 9.5, color: scheme.subtitle, marginBottom: 5, textAlign: "center", fontWeight: 600 }}>核心原料</div>
          <div style={{ display: "flex", justifyContent: "space-around" }}>
            {(data.rightSection.layers || []).map((l, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                {l.icon ? (
                  <img src={l.icon} alt={l.desc} style={{ width: 32, height: 32, objectFit: "contain", borderRadius: 6 }} />
                ) : (
                  <div style={{ width: 32, height: 32, borderRadius: 6, background: `${scheme.block1Border}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
                    {l.emoji || "🌿"}
                  </div>
                )}
                <span style={{ fontSize: 10.5, fontWeight: 700, color: scheme.block1Text, textAlign: "center" }}>{l.desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 对比表格 */}
        <CompareTable rows={data.compareTable} scheme={scheme} />
      </div>

    </div>
  )
}

// ============================================================
// 布局3：左图右文（杂志风格）
// ============================================================
function LayoutMagazine({ data, scheme }: { data: CoverDataV3; scheme: typeof SCHEMES["herbal"] }) {
  const sloganParts = (data.rightSection.productSlogan || "").split("|")
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* 顶部标题 */}
      <div style={{
        padding: "14px 18px 10px",
        background: scheme.highlightBg,
        flexShrink: 0,
      }}>
        <div style={{ fontSize: 26, fontWeight: 900, color: scheme.highlightText, lineHeight: 1.2 }}>
          {data.title}
        </div>
        <div style={{ fontSize: 11.5, color: `${scheme.highlightText}CC`, marginTop: 4 }}>
          {data.subtitle}
        </div>
      </div>

      {/* 中部：左图右文 */}
      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        {/* 左侧插画 */}
        <div style={{
          flex: "0 0 48%",
          background: scheme.heroBg,
          position: "relative",
          overflow: "hidden",
        }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={data.illustrationUrl}
            alt="产品插画"
            style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center" }}
          />
          {data.productImageUrl && (
            <div style={{
              position: "absolute", bottom: 8, left: 8,
              width: 44, height: 44, borderRadius: 8,
              overflow: "hidden", border: "2px solid rgba(255,255,255,0.9)",
              boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
            }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={data.productImageUrl} alt="产品" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
          )}
        </div>

        {/* 右侧信息 */}
        <div style={{ flex: 1, padding: "10px 10px 10px 8px", display: "flex", flexDirection: "column", gap: 6, overflow: "hidden" }}>
          {/* 信息块 */}
          {data.leftBlocks.slice(0, 2).map((block, idx) => (
            <InfoBlock key={idx} {...block}
              bg={idx === 0 ? scheme.block1Bg : scheme.block2Bg}
              border={idx === 0 ? scheme.block1Border : scheme.block2Border}
              textColor={idx === 0 ? scheme.block1Text : scheme.block2Text}
            />
          ))}

          {/* 产品名称（只显示名称） */}
          <div style={{
            background: scheme.highlightBg,
            borderRadius: 10, padding: "8px 8px", textAlign: "center",
          }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: scheme.highlightText, letterSpacing: "0.5px" }}>
              {data.rightSection.techPoint}
            </div>
          </div>

          {/* 核心原料展示 */}
          <div style={{ padding: "6px 6px", background: scheme.block1Bg, borderRadius: 8, border: `1px solid ${scheme.block1Border}` }}>
            <div style={{ fontSize: 8.5, color: scheme.subtitle, marginBottom: 4, textAlign: "center", fontWeight: 600 }}>核心原料</div>
            <div style={{ display: "flex", justifyContent: "space-around" }}>
              {(data.rightSection.layers || []).map((l, i) => (
                <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                  {l.icon ? (
                    <img src={l.icon} alt={l.desc} style={{ width: 28, height: 28, objectFit: "contain", borderRadius: 5 }} />
                  ) : (
                    <div style={{ width: 28, height: 28, borderRadius: 5, background: `${scheme.block1Border}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
                      {l.emoji || "🌿"}
                    </div>
                  )}
                  <span style={{ fontSize: 9.5, fontWeight: 700, color: scheme.block1Text, textAlign: "center" }}>{l.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 底部对比表格 */}
      <div style={{ padding: "0 10px 8px" }}>
        <CompareTable rows={data.compareTable} scheme={scheme} />
      </div>

    </div>
  )
}

// ============================================================
// 布局4：极简风（大图+大字标题，信息精简）
// ============================================================
// 布局：极简大图（优化版）- 大图铺满上方，标题叠加，下方信息简洁
// ============================================================
function LayoutMinimal({ data, scheme }: { data: CoverDataV3; scheme: typeof SCHEMES["herbal"] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: scheme.bg }}>
      {/* 大图区（占上方约55%） */}
      <div style={{
        position: "relative",
        flex: "0 0 56%",
        background: scheme.heroBg,
        overflow: "hidden",
        borderRadius: "0 0 0 0",
      }}>
        {/* 插画 */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={data.illustrationUrl}
          alt="产品插画"
          style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center" }}
        />

        {/* 顶部标题区：渐变遮罩 + 大标题 */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0,
          padding: "0",
          background: "linear-gradient(180deg, rgba(0,0,0,0.62) 0%, rgba(0,0,0,0.35) 60%, transparent 100%)",
          paddingBottom: "20px",
        }}>
          {/* 标题文字块 */}
          <div style={{
            padding: "14px 16px 0 16px",
          }}>
            <div style={{
              fontSize: 26,
              fontWeight: 900,
              color: "#FFFFFF",
              lineHeight: 1.25,
              letterSpacing: "0.5px",
              textShadow: "0 2px 12px rgba(0,0,0,0.6)",
              wordBreak: "break-all",
            }}>
              {data.title}
            </div>
          </div>
        </div>

        {/* 底部副标题条 */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          padding: "18px 16px 10px",
          background: "linear-gradient(transparent, rgba(0,0,0,0.55))",
        }}>
          <div style={{
            fontSize: 12,
            color: "rgba(255,255,255,0.92)",
            lineHeight: 1.5,
            letterSpacing: "0.3px",
          }}>
            {data.subtitle}
          </div>
        </div>
      </div>

      {/* 下方信息区 */}
      <div style={{
        flex: 1,
        padding: "10px 12px 8px",
        display: "flex",
        flexDirection: "column",
        gap: 8,
        background: scheme.bg,
      }}>
        {/* 产品名称横条 */}
        <div style={{
          background: scheme.highlightBg,
          borderRadius: 10,
          padding: "9px 14px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
          <div style={{
            fontSize: 15,
            fontWeight: 800,
            color: scheme.highlightText,
            letterSpacing: "1px",
          }}>
            {data.rightSection.techPoint}
          </div>
        </div>

        {/* 两个信息块横排 */}
        <div style={{ display: "flex", gap: 8, flex: "0 0 auto" }}>
          {data.leftBlocks.slice(0, 2).map((block, idx) => (
            <div key={idx} style={{ flex: 1 }}>
              <InfoBlock {...block}
                bg={idx === 0 ? scheme.block1Bg : scheme.block2Bg}
                border={idx === 0 ? scheme.block1Border : scheme.block2Border}
                textColor={idx === 0 ? scheme.block1Text : scheme.block2Text}
              />
            </div>
          ))}
        </div>

        {/* 对比表格 */}
        <div style={{ flex: 1 }}>
          <CompareTable rows={data.compareTable} scheme={scheme} />
        </div>
      </div>
    </div>
  )
}

// ============================================================
// 主组件
// ============================================================
interface XhsCoverCardV3Props {
  data: CoverDataV3
  scale?: number
}

export default function XhsCoverCardV3({ data, scale = 1 }: XhsCoverCardV3Props) {
  const scheme = SCHEMES[data.colorScheme || "herbal"]
  const layout = data.layout || "classic"

  const W = 375
  const H = 600

  const content = () => {
    switch (layout) {
      case "hero-top": return <LayoutHeroTop data={data} scheme={scheme} />
      case "magazine": return <LayoutMagazine data={data} scheme={scheme} />
      case "minimal": return <LayoutMinimal data={data} scheme={scheme} />
      default: return <LayoutClassic data={data} scheme={scheme} />
    }
  }

  return (
    <div style={{
      width: W, height: H,
      transform: scale !== 1 ? `scale(${scale})` : undefined,
      transformOrigin: scale !== 1 ? "top left" : undefined,
      position: "relative",
      overflow: "hidden",
      borderRadius: 20,
      background: scheme.bg,
      fontFamily: '"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans SC", sans-serif',
      boxShadow: "0 8px 40px rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.08)",
    }}>
      {content()}
    </div>
  )
}
