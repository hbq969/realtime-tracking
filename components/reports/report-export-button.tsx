'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { FileDown, FileText } from 'lucide-react'
import { toast } from 'sonner'

interface ReportExportButtonProps {
  reportId: string
  type: 'pdf' | 'word'
}

export function ReportExportButton({ reportId, type }: ReportExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const response = await fetch(`/api/reports/${reportId}/export?type=${type}`)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: '导出失败' }))
        throw new Error(errorData.error || '导出失败')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `report-${reportId}.${type === 'pdf' ? 'pdf' : 'docx'}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success(`${type === 'pdf' ? 'PDF' : 'Word'} 导出成功`)
    } catch (error) {
      console.error('导出失败:', error)
      toast.error((error as Error).message || '导出失败')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Button
      variant="outline"
      onClick={handleExport}
      disabled={isExporting}
    >
      {type === 'pdf' ? (
        <FileDown className="h-4 w-4 mr-2" />
      ) : (
        <FileText className="h-4 w-4 mr-2" />
      )}
      {isExporting
        ? '导出中...'
        : type === 'pdf'
        ? '导出PDF'
        : '导出Word'}
    </Button>
  )
}
