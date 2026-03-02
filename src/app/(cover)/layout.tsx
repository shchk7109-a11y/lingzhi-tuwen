/**
 * (cover) 路由组的独立 layout
 *
 * 使用 Route Group 特性，cover-render 页面完全脱离主 layout（无 AuthProvider、无 NavBar、无 Toaster）。
 * 这样 Puppeteer 访问 /cover-render 时，页面极简，React hydration 快速完成，
 * data-ready 标记可以被正确设置。
 */
export default function CoverGroupLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
    </>
  )
}
