"use client"
import { useState } from "react"
import XhsCoverCardV3, { CoverDataV3 } from "@/components/XhsCoverCardV3"

// ============================================================
// 示例数据
// ============================================================
const SAMPLE_QI_TEA: CoverDataV3 = {
  title: "补气焕活！这杯草本茶让我脱胎换骨",
  subtitle: "灵芝+黄芪+西洋参，越喝越有精神！",
  illustrationUrl: "/ai-illustrations/qi-tea-general.png",
  leftBlocks: [
    { title: "补气不上火", icon: "🌿", detail: "黄芪温补正气，灵芝调和阴阳，不燥不热" },
    { title: "焕活细胞", icon: "✨", detail: "西洋参多糖激活细胞活力，气色红润有光泽" },
  ],
  rightSection: {
    highlightTitle: "补气焕活草本茶饮",
    layers: [
      { label: "补气养血", desc: "黄芪", emoji: "🌾" },
      { label: "安神护肝", desc: "灵芝", emoji: "🍄" },
      { label: "生津提神", desc: "西洋参", emoji: "🌱" },
    ],
    techPoint: "补气焕活草本茶饮",
    productName: "悦活补气茶",
    productSlogan: "补气|焕活|养血",
  },
  compareTable: [
    { dimension: "精力", before: "总是疲惫", after: "精力充沛" },
    { dimension: "气色", before: "面色暗黄", after: "红润透亮" },
    { dimension: "睡眠", before: "浅睡易醒", after: "深度好眠" },
  ],
  sourceNote: "数据来源：用户亲测反馈",
  tags: ["灵芝水铺", "补气养血", "草本茶饮"],
  layout: "classic",
  colorScheme: "tea",
}

const SAMPLE_COFFEE: CoverDataV3 = {
  title: "咖啡续命3个月 差点废了！",
  subtitle: "空腹喝不伤胃，提神不心慌，我的养生咖啡平替！",
  illustrationUrl: "/ai-illustrations/herbal-coffee.png",
  leftBlocks: [
    { title: "告别能量过山车", icon: "🎢", detail: "平稳续航一整天，不心慌！" },
    { title: "解锁养生新喝法", icon: "🌱", detail: "温和护胃又养颜，气色透亮！" },
  ],
  rightSection: {
    highlightTitle: "25年专利发酵",
    layers: [
      { label: "平稳续航", desc: "灵芝", emoji: "🍄" },
      { label: "温和护胃", desc: "黄芪", emoji: "🌾" },
      { label: "回味甘甜", desc: "西洋参", emoji: "🌱" },
    ],
    techPoint: "灵芝草本咖啡",
    productName: "悦活草本美式",
    productSlogan: "提神醒脑|温和护胃|回味甘甜",
  },
  compareTable: [
    { dimension: "提神", before: "能量过山车", after: "平稳续航" },
    { dimension: "肠胃", before: "反酸胃痛", after: "温和护胃" },
    { dimension: "气色", before: "脸色暗黄", after: "素颜透亮" },
  ],
  sourceNote: "数据来源：打工人亲测对比反馈",
  tags: ["灵芝水铺", "咖啡对比", "打工人续命"],
  layout: "classic",
  colorScheme: "herbal",
}

const SAMPLE_TEA_WORKPLACE: CoverDataV3 = {
  title: "下午3点犯困？这杯茶救了我！",
  subtitle: "灵芝+西洋参，提神不失眠，打工人必备养生茶",
  illustrationUrl: "/ai-illustrations/herbal-tea.png",
  leftBlocks: [
    { title: "提神不焦虑", icon: "⚡", detail: "西洋参温和提气，不心慌不失眠" },
    { title: "护肝抗疲劳", icon: "🍄", detail: "灵芝多糖修复肝细胞，越喝越精神" },
  ],
  rightSection: {
    highlightTitle: "3倍提神效果",
    layers: [
      { label: "提神醒脑", desc: "西洋参", emoji: "🌱" },
      { label: "护肝排毒", desc: "灵芝", emoji: "🍄" },
      { label: "安神助眠", desc: "酸枣仁", emoji: "🌰" },
    ],
    techPoint: "灵芝草本茶",
    productName: "悦活草本茶",
    productSlogan: "提神|护肝|安神",
  },
  compareTable: [
    { dimension: "精力", before: "下午犯困", after: "精力充沛" },
    { dimension: "睡眠", before: "失眠多梦", after: "安稳入睡" },
    { dimension: "肝脏", before: "转氨酶高", after: "指标正常" },
  ],
  sourceNote: "数据来源：打工人亲测反馈",
  tags: ["灵芝水铺", "养生茶", "打工人"],
  layout: "hero-top",
  colorScheme: "amber",
}

const SAMPLE_TEA_MOM: CoverDataV3 = {
  title: "宝妈必看！这杯茶让我气色好了",
  subtitle: "玫瑰+枸杞+桂圆，补气养血，素颜都好看！",
  illustrationUrl: "/ai-illustrations/mom-wellness.png",
  leftBlocks: [
    { title: "补气养血", icon: "🌹", detail: "玫瑰活血，枸杞明目，桂圆补心" },
    { title: "素颜好气色", icon: "✨", detail: "坚持喝1个月，朋友问我护肤品" },
  ],
  rightSection: {
    highlightTitle: "宝妈专属配方",
    layers: [
      { label: "补气血", desc: "玫瑰", emoji: "🌹" },
      { label: "明目养颜", desc: "枸杞", emoji: "🔴" },
      { label: "安神补心", desc: "桂圆", emoji: "🌐" },
    ],
    techPoint: "灵芝玫瑰养颜茶",
    productName: "悦活玫瑰茶",
    productSlogan: "补气|养血|美颜",
  },
  compareTable: [
    { dimension: "气色", before: "面色暗沉", after: "红润透亮" },
    { dimension: "精力", before: "带娃疲惫", after: "活力满满" },
    { dimension: "睡眠", before: "浅睡易醒", after: "深度睡眠" },
  ],
  sourceNote: "数据来源：宝妈群真实反馈",
  tags: ["灵芝水铺", "宝妈养生", "补气血"],
  layout: "magazine",
  colorScheme: "rose",
}

const SAMPLE_TEA_SENIOR: CoverDataV3 = {
  title: "爸妈喝了3个月，体检惊喜了！",
  subtitle: "灵芝+黄芪+红枣，老人养生首选，子女放心送",
  illustrationUrl: "/ai-illustrations/senior-wellness.png",
  leftBlocks: [
    { title: "增强免疫力", icon: "🛡️", detail: "黄芪多糖激活免疫，少生病" },
    { title: "调理三高", icon: "❤️", detail: "灵芝三萜调节血糖血压血脂" },
  ],
  rightSection: {
    highlightTitle: "老人专属养生方",
    layers: [
      { label: "增免疫", desc: "黄芪", emoji: "🌾" },
      { label: "调三高", desc: "灵芝", emoji: "🍄" },
      { label: "补气血", desc: "红枣", emoji: "🍎" },
    ],
    techPoint: "灵芝黄芪养生茶",
    productName: "悦活养生茶",
    productSlogan: "增免疫|调三高|补气血",
  },
  compareTable: [
    { dimension: "免疫", before: "频繁感冒", after: "抵抗力强" },
    { dimension: "血糖", before: "偏高", after: "趋于正常" },
    { dimension: "精神", before: "易疲劳", after: "精神矍铄" },
  ],
  sourceNote: "数据来源：老年用户健康反馈",
  tags: ["灵芝水铺", "老人养生", "孝心礼品"],
  layout: "minimal",
  colorScheme: "forest",
}

const SAMPLES = [
  { label: "🆕 补气焕活草本茶饮", data: SAMPLE_QI_TEA },
  { label: "草本咖啡·职场", data: SAMPLE_COFFEE },
  { label: "草本茶·职场", data: SAMPLE_TEA_WORKPLACE },
  { label: "草本茶·精致妈妈", data: SAMPLE_TEA_MOM },
  { label: "养生茶·银发族", data: SAMPLE_TEA_SENIOR },
]

const LAYOUT_OPTIONS = [
  { value: "minimal", label: "极简大图", desc: "大图铺满，标题叠加，信息精简" },
  { value: "classic", label: "经典布局", desc: "插画居中，下方左右分栏" },
] as const

const COLOR_SCHEMES = [
  { value: "herbal", label: "草本绿", color: "#2D7A4F" },
  { value: "amber", label: "暖橙琥珀", color: "#E07020" },
  { value: "mint", label: "清新薄荷", color: "#00A86B" },
  { value: "rose", label: "玫瑰粉红", color: "#E91E63" },
  { value: "forest", label: "森林深绿", color: "#40916C" },
  { value: "tea", label: "古风茶褐", color: "#795548" },
  { value: "midnight", label: "深夜蓝紫", color: "#7C83FD" },
  { value: "coral", label: "珊瑚红", color: "#EF5350" },
] as const

export default function CoverTestPage() {
  const [selectedSample, setSelectedSample] = useState(0)
  const [layout, setLayout] = useState<CoverDataV3["layout"]>("minimal")
  const [colorScheme, setColorScheme] = useState<CoverDataV3["colorScheme"]>("herbal")
  const [customTitle, setCustomTitle] = useState("")
  const [customSubtitle, setCustomSubtitle] = useState("")
  const [showAllLayouts, setShowAllLayouts] = useState(false)

  const baseData = SAMPLES[selectedSample].data
  const previewData: CoverDataV3 = {
    ...baseData,
    layout,
    colorScheme,
    title: customTitle || baseData.title,
    subtitle: customSubtitle || baseData.subtitle,
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0F1117", color: "#E0E0E0", fontFamily: "system-ui, sans-serif" }}>
      {/* 顶部导航（复用主应用样式） */}
      <div style={{ background: "#1A1D24", borderBottom: "1px solid #2A2D35", padding: "10px 20px", display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 18, fontWeight: 700, color: "#4CAF50" }}>灵芝水铺</span>
        <span style={{ color: "#666", fontSize: 12 }}>图文优化系统</span>
        <span style={{ marginLeft: "auto", fontSize: 12, color: "#888" }}>🎨 封面图测试调试台 V3</span>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 20px" }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#E0E0E0", margin: 0 }}>🎨 小红书封面图测试调试台</h1>
          <p style={{ color: "#888", fontSize: 13, marginTop: 6 }}>AI生成卡通插画 · 4种真实布局 · 8种配色方案 · 实时预览</p>
        </div>

        <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
          {/* 左侧控制面板 */}
          <div style={{ flex: "0 0 240px", display: "flex", flexDirection: "column", gap: 16 }}>
            {/* 示例内容 */}
            <div style={{ background: "#1A1D24", borderRadius: 12, padding: 16, border: "1px solid #2A2D35" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#888", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.5px" }}>示例内容</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {SAMPLES.map((s, i) => (
                  <button key={i} onClick={() => { setSelectedSample(i); setLayout(s.data.layout || "classic"); setColorScheme(s.data.colorScheme || "herbal"); setCustomTitle(""); setCustomSubtitle("") }}
                    style={{ padding: "8px 12px", borderRadius: 8, border: "none", cursor: "pointer", textAlign: "left", fontSize: 12, fontWeight: 600, transition: "all 0.2s",
                      background: selectedSample === i ? "#2D7A4F" : "#252830",
                      color: selectedSample === i ? "#fff" : "#CCC",
                    }}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 布局选择 */}
            <div style={{ background: "#1A1D24", borderRadius: 12, padding: 16, border: "1px solid #2A2D35" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#888", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.5px" }}>布局结构</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {LAYOUT_OPTIONS.map(opt => (
                  <button key={opt.value} onClick={() => setLayout(opt.value)}
                    style={{ padding: "8px 12px", borderRadius: 8, border: "none", cursor: "pointer", textAlign: "left", transition: "all 0.2s",
                      background: layout === opt.value ? "#1E4D2B" : "#252830",
                      borderLeft: layout === opt.value ? "3px solid #4CAF50" : "3px solid transparent",
                    }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: layout === opt.value ? "#4CAF50" : "#CCC" }}>{opt.label}</div>
                    <div style={{ fontSize: 10, color: "#666", marginTop: 2 }}>{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 配色方案 */}
            <div style={{ background: "#1A1D24", borderRadius: 12, padding: 16, border: "1px solid #2A2D35" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#888", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.5px" }}>配色方案</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {COLOR_SCHEMES.map(s => (
                  <button key={s.value} onClick={() => setColorScheme(s.value)}
                    title={s.label}
                    style={{ width: 32, height: 32, borderRadius: 8, border: colorScheme === s.value ? "3px solid #fff" : "3px solid transparent", cursor: "pointer", background: s.color, transition: "all 0.2s", boxShadow: colorScheme === s.value ? `0 0 0 2px ${s.color}` : "none" }} />
                ))}
              </div>
              <div style={{ fontSize: 11, color: "#888", marginTop: 8 }}>
                当前：{COLOR_SCHEMES.find(s => s.value === colorScheme)?.label}
              </div>
            </div>

            {/* 自定义文字 */}
            <div style={{ background: "#1A1D24", borderRadius: 12, padding: 16, border: "1px solid #2A2D35" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#888", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.5px" }}>自定义文字</div>
              <textarea
                placeholder="自定义标题（留空用示例）"
                value={customTitle}
                onChange={e => setCustomTitle(e.target.value)}
                style={{ width: "100%", background: "#252830", border: "1px solid #3A3D45", borderRadius: 8, color: "#E0E0E0", padding: "8px 10px", fontSize: 12, resize: "vertical", minHeight: 60, boxSizing: "border-box", marginBottom: 8 }}
              />
              <textarea
                placeholder="自定义副标题"
                value={customSubtitle}
                onChange={e => setCustomSubtitle(e.target.value)}
                style={{ width: "100%", background: "#252830", border: "1px solid #3A3D45", borderRadius: 8, color: "#E0E0E0", padding: "8px 10px", fontSize: 12, resize: "vertical", minHeight: 50, boxSizing: "border-box" }}
              />
            </div>

            {/* 全览按钮 */}
            <button onClick={() => setShowAllLayouts(!showAllLayouts)}
              style={{ padding: "10px 16px", borderRadius: 10, border: "1px solid #4CAF50", background: showAllLayouts ? "#2D7A4F" : "transparent", color: "#4CAF50", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>
              {showAllLayouts ? "隐藏" : "展示"} 4种布局全览
            </button>
          </div>

          {/* 右侧预览区 */}
          <div style={{ flex: 1 }}>
            {/* 单个预览 */}
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
              <div style={{ position: "relative" }}>
                <div style={{ position: "absolute", top: -28, left: 0, fontSize: 12, color: "#888" }}>
                  当前预览：{LAYOUT_OPTIONS.find(o => o.value === layout)?.label} · {COLOR_SCHEMES.find(s => s.value === colorScheme)?.label}
                </div>
                <XhsCoverCardV3 data={previewData} />
              </div>
            </div>

            {/* 4种布局全览 */}
            {showAllLayouts && (
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#E0E0E0", marginBottom: 16, textAlign: "center" }}>
                  🖼️ 2种布局对比（当前配色：{COLOR_SCHEMES.find(s => s.value === colorScheme)?.label}）
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 24 }}>
                  {(["minimal", "classic"] as const).map(l => (
                    <div key={l} style={{ textAlign: "center", cursor: "pointer" }} onClick={() => setLayout(l)}>
                      <div style={{ marginBottom: 8, fontSize: 11, color: layout === l ? "#4CAF50" : "#888", fontWeight: layout === l ? 700 : 400 }}>
                        {LAYOUT_OPTIONS.find(o => o.value === l)?.label}
                        {layout === l && " ✓"}
                      </div>
                      <div style={{
                        width: 375 * 0.36, height: 600 * 0.36,
                        overflow: "hidden", borderRadius: 10,
                        border: layout === l ? "2px solid #4CAF50" : "2px solid #2A2D35",
                        boxSizing: "border-box",
                        display: "inline-block",
                      }}>
                        <div style={{ transformOrigin: "top left", transform: "scale(0.36)", width: 375, height: 600 }}>
                          <XhsCoverCardV3 data={{ ...previewData, layout: l }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 8种配色全览 */}
            <div style={{ marginTop: 32 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#E0E0E0", marginBottom: 16, textAlign: "center" }}>
                🎨 8种配色全览（当前布局：{LAYOUT_OPTIONS.find(o => o.value === layout)?.label}）
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
                {(["herbal", "amber", "mint", "rose", "forest", "tea", "midnight", "coral"] as const).map(scheme => (
                  <div key={scheme} style={{ textAlign: "center", cursor: "pointer" }} onClick={() => setColorScheme(scheme)}>
                    <div style={{ marginBottom: 8, fontSize: 11, color: colorScheme === scheme ? "#4CAF50" : "#888", fontWeight: colorScheme === scheme ? 700 : 400 }}>
                      {COLOR_SCHEMES.find(s => s.value === scheme)?.label}
                      {colorScheme === scheme && " ✓"}
                    </div>
                    <div style={{
                      width: 375 * 0.36, height: 600 * 0.36,
                      overflow: "hidden", borderRadius: 10,
                      border: colorScheme === scheme ? "2px solid #4CAF50" : "2px solid #2A2D35",
                      boxSizing: "border-box",
                      display: "inline-block",
                    }}>
                      <div style={{ transformOrigin: "top left", transform: "scale(0.36)", width: 375, height: 600 }}>
                        <XhsCoverCardV3 data={{ ...previewData, colorScheme: scheme }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
