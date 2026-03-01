// 这是一个辅助文件，用于展示导出逻辑的修改

export function generateExportData(currentBatch: any[], platform: string) {
  if (platform === 'pyq') {
    // 朋友圈模式：仅保留编号、客户名称、微信号、文案、配图1、配图2、配图3
    return currentBatch.map((item, i) => ({
      "编号": i + 1,
      "客户名称": item.customerName,
      "微信号": item.customerWechatAccount || '',
      "文案": item.cleanedText,
      "配图1": item.image2Url ? `${window.location.origin}${item.image2Url}` : "",
      "配图2": item.image3Url ? `${window.location.origin}${item.image3Url}` : "",
      "配图3": item.image4Url ? `${window.location.origin}${item.image4Url}` : "",
    }))
  } else {
    // 小红书模式：保留原有格式
    return currentBatch.map((item, i) => ({
      "批次号": item.batchId,
      "序号": i + 1,
      "平台": '小红书',
      "客户姓名": item.customerName,
      "客户城市": item.customerCity,
      "客户分类": item.customerCategory,
      "小红书账号": item.customerXhsAccount,
      "原始文案": item.text,
      "清洗后文案": item.cleanedText,
      "AI味评分": item.aiTotalScore,
      "封面图URL": item.coverUrl || "生成中...",
      "配图2URL": item.image2Url ? `${window.location.origin}${item.image2Url}` : "",
      "配图3URL": item.image3Url ? `${window.location.origin}${item.image3Url}` : "",
      "配图4URL": item.image4Url ? `${window.location.origin}${item.image4Url}` : "",
    }))
  }
}
