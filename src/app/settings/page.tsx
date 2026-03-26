"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Settings, Key, Lock, CheckCircle, AlertCircle, Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/lib/auth-context"
import type { AIModel } from "@/lib/ai-client"

export default function SettingsPage() {
  const { authHeaders } = useAuth()
  const [apiKey, setApiKeyInput] = useState("")
  const [model, setModel] = useState<AIModel>("deepseek")
  const [hasApiKey, setHasApiKey] = useState(false)
  const [savedApiKeyPreview, setSavedApiKeyPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showKey, setShowKey] = useState(false)

  // 管理员密码修改
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showCurrentPwd, setShowCurrentPwd] = useState(false)
  const [showNewPwd, setShowNewPwd] = useState(false)
  const [savingPwd, setSavingPwd] = useState(false)

  // 模型单独保存状态
  const [modelSaved, setModelSaved] = useState(false)

  useEffect(() => {
    fetch("/api/settings")
      .then(res => res.json())
      .then(data => {
        setHasApiKey(data.hasApiKey)
        setSavedApiKeyPreview(data.apiKey || null)
        setModel(data.model || "deepseek")
      })
      .finally(() => setLoading(false))
  }, [])

  // 保存 API Key
  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) {
      toast.error("请输入 API Key")
      return
    }
    setSaving(true)
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ apiKey: apiKey.trim(), model }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "保存失败")
      toast.success("API Key 保存成功！")
      // 保存成功后：清空输入框，更新已保存状态
      setApiKeyInput("")
      setHasApiKey(true)
      setSavedApiKeyPreview(`${apiKey.trim().substring(0, 8)}...`)
    } catch (err: any) {
      toast.error(err.message || "保存失败，请重试")
    } finally {
      setSaving(false)
    }
  }

  // 单独保存模型
  const handleSaveModel = async (newModel: AIModel) => {
    setModel(newModel)
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ model: newModel }),
      })
      if (!res.ok) throw new Error()
      setModelSaved(true)
      setTimeout(() => setModelSaved(false), 2000)
    } catch {
      toast.error("模型保存失败")
    }
  }

  // 修改管理员密码
  const handleChangePassword = async () => {
    if (!currentPassword) { toast.error("请输入当前密码"); return }
    if (!newPassword) { toast.error("请输入新密码"); return }
    if (newPassword.length < 6) { toast.error("新密码至少6位"); return }
    if (newPassword !== confirmPassword) { toast.error("两次密码不一致"); return }

    setSavingPwd(true)
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ adminPassword: currentPassword, newAdminPassword: newPassword }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "修改失败")
      toast.success("管理员密码修改成功！")
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (err: any) {
      toast.error(err.message || "修改失败")
    } finally {
      setSavingPwd(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-[#8B7355]">加载中...</div>
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold text-[#1E4D2B] flex items-center gap-2">
        <Settings className="w-6 h-6" />管理员设置
      </h1>

      {/* AI 配置卡片 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5 text-[#1E4D2B]" />AI 配置
          </CardTitle>
          <CardDescription>配置 API Key 和 AI 模型，保存后持久有效，重启不丢失</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">

          {/* API Key 区域 */}
          <div>
            <label className="text-sm font-semibold block mb-2">API Key</label>

            {/* 已保存状态展示 */}
            {hasApiKey && (
              <div className="flex items-center gap-2 mb-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                <div>
                  <p className="text-sm text-green-700 font-medium">API Key 已保存并生效</p>
                  <p className="text-xs text-green-600 font-mono">{savedApiKeyPreview}</p>
                </div>
              </div>
            )}

            {!hasApiKey && (
              <div className="flex items-center gap-2 mb-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <p className="text-sm text-amber-700">尚未配置 API Key，无法生成内容</p>
              </div>
            )}

            <div className="flex gap-2">
              <Input
                type={showKey ? "text" : "password"}
                value={apiKey}
                onChange={e => setApiKeyInput(e.target.value)}
                placeholder={hasApiKey ? "输入新 Key 可覆盖已保存的 Key" : "sk-xxxx 或 AIzaxxxx"}
                className="font-mono text-sm"
              />
              <Button variant="outline" size="icon" onClick={() => setShowKey(!showKey)} className="flex-shrink-0">
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
            <Button
              onClick={handleSaveApiKey}
              disabled={saving || !apiKey.trim()}
              className="w-full mt-3"
            >
              {saving ? "保存中..." : hasApiKey ? "更新 API Key" : "保存 API Key"}
            </Button>
          </div>

          {/* AI 模型选择 */}
          <div>
            <label className="text-sm font-semibold block mb-2">
              AI 模型
              {modelSaved && <span className="ml-2 text-xs text-green-600 font-normal">✓ 已保存</span>}
            </label>
            <div className="flex gap-2 flex-wrap">
              {[
                { value: "deepseek", label: "DeepSeek", desc: "DeepSeek 官方 API" },
                { value: "kimi", label: "Kimi", desc: "月之暗面 Kimi API" },
                { value: "gemini", label: "Gemini (谷高)", desc: "谷高中转 API" },
              ].map(m => (
                <Button
                  key={m.value}
                  variant={model === m.value ? "default" : "outline"}
                  onClick={() => handleSaveModel(m.value as AIModel)}
                  className="flex-1"
                >
                  {m.label}
                </Button>
              ))}
            </div>
            <p className="text-xs text-[#8B7355] mt-2">
              {model === "gemini" && "使用谷高中转 API：https://api.gdoubolai.com/v1"}
              {model === "deepseek" && "使用 DeepSeek 官方 API：https://api.deepseek.com/v1"}
              {model === "kimi" && "使用月之暗面 Kimi API：https://api.moonshot.cn/v1"}
            </p>
            <p className="text-xs text-[#8B7355] mt-1">点击模型按钮即自动保存选择</p>
          </div>
        </CardContent>
      </Card>

      {/* 管理员密码修改 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-[#1E4D2B]" />修改管理员密码
          </CardTitle>
          <CardDescription>修改后请牢记新密码，忘记密码需联系技术支持重置</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-semibold block mb-1">当前密码</label>
            <div className="flex gap-2">
              <Input
                type={showCurrentPwd ? "text" : "password"}
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                placeholder="输入当前管理员密码"
              />
              <Button variant="outline" size="icon" onClick={() => setShowCurrentPwd(!showCurrentPwd)} className="flex-shrink-0">
                {showCurrentPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
          </div>
          <div>
            <label className="text-sm font-semibold block mb-1">新密码</label>
            <div className="flex gap-2">
              <Input
                type={showNewPwd ? "text" : "password"}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="至少6位"
              />
              <Button variant="outline" size="icon" onClick={() => setShowNewPwd(!showNewPwd)} className="flex-shrink-0">
                {showNewPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
          </div>
          <div>
            <label className="text-sm font-semibold block mb-1">确认新密码</label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="再次输入新密码"
            />
          </div>
          <Button
            onClick={handleChangePassword}
            disabled={savingPwd || !currentPassword || !newPassword || !confirmPassword}
            variant="outline"
            className="w-full border-[#1E4D2B] text-[#1E4D2B] hover:bg-[#1E4D2B] hover:text-white"
          >
            {savingPwd ? "修改中..." : "确认修改密码"}
          </Button>
        </CardContent>
      </Card>

      {/* 使用说明 */}
      <Card>
        <CardHeader><CardTitle className="text-base">使用说明</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm text-[#6B5B4E]">
          <p>1. API Key 保存后存储在数据库中，重启服务器不会丢失</p>
          <p>2. 支持 DeepSeek / Kimi / Gemini（谷高中转）三种模型</p>
          <p>3. 点击模型按钮即自动保存，无需额外操作</p>
          <p>4. 默认管理员密码：<code className="bg-gray-100 px-1 rounded font-mono">changeme</code></p>
          <p>5. 管理员密码用于访问客户管理、素材库、提示词等管理功能</p>
        </CardContent>
      </Card>
    </div>
  )
}
