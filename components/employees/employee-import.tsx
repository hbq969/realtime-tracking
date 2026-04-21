'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Upload, FileSpreadsheet } from 'lucide-react'

interface EmployeeImportProps {
  onImport: (data: Record<string, string>[]) => Promise<void>
}

export function EmployeeImport({ onImport }: EmployeeImportProps) {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState<Record<string, string>[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    setFile(selectedFile)

    // 简单的CSV解析预览
    const text = await selectedFile.text()
    const lines = text.split('\n').slice(0, 6) // 预览前5行
    const headers = lines[0].split(',')
    const rows = lines.slice(1).map(line => {
      const values = line.split(',')
      return headers.reduce((obj, header, i) => {
        obj[header.trim()] = values[i]?.trim()
        return obj
      }, {} as Record<string, string>)
    })
    setPreview(rows)
  }

  const handleImport = async () => {
    if (!file) return
    setLoading(true)
    try {
      const text = await file.text()
      const lines = text.split('\n')
      const headers = lines[0].split(',')
      const data = lines.slice(1).map(line => {
        const values = line.split(',')
        return headers.reduce((obj, header, i) => {
          obj[header.trim()] = values[i]?.trim()
          return obj
        }, {} as Record<string, string>)
      }).filter(row => Object.values(row).some(v => v))

      await onImport(data)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>批量导入员工</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".csv,.xlsx"
            className="hidden"
            onChange={handleFileChange}
          />
          {file ? (
            <div className="flex items-center justify-center gap-2">
              <FileSpreadsheet className="h-8 w-8 text-primary" />
              <span className="font-medium">{file.name}</span>
            </div>
          ) : (
            <>
              <Upload className="h-8 w-8 mx-auto mb-2 text-slate-400" />
              <p className="text-slate-600">点击或拖拽上传 CSV 文件</p>
              <p className="text-sm text-slate-400 mt-1">
                格式: 姓名,手机号,邮箱,部门,职位,离职日期,离职原因,在职时长
              </p>
            </>
          )}
        </div>

        {preview.length > 0 && (
          <div className="border rounded-lg p-4">
            <p className="text-sm font-medium mb-2">数据预览 (前5行)</p>
            <pre className="text-xs bg-slate-50 p-2 rounded overflow-auto">
              {JSON.stringify(preview, null, 2)}
            </pre>
          </div>
        )}

        <Button
          className="w-full"
          disabled={!file || loading}
          onClick={handleImport}
        >
          {loading ? '导入中...' : '确认导入'}
        </Button>
      </CardContent>
    </Card>
  )
}
