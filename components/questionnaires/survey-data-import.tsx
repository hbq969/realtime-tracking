'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Upload, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import { parseCSVText, parseImportData, type ParsedRow } from '@/lib/import/survey-data'
import { toast } from 'sonner'

interface SurveyDataImportProps {
  questionnaireId: string
  onSuccess?: () => void
}

export function SurveyDataImport({ questionnaireId, onSuccess }: SurveyDataImportProps) {
  const [file, setFile] = useState<File | null>(null)
  const [parsing, setParsing] = useState(false)
  const [parsedData, setParsedData] = useState<ParsedRow[]>([])
  const [importing, setImporting] = useState(false)

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    setFile(selectedFile)
    setParsing(true)
    setParsedData([])

    try {
      // 读取文件
      const text = await selectedFile.text()

      // 解析 CSV
      const rows = parseCSVText(text)

      if (rows.length === 0) {
        toast.error('文件内容为空或格式不正确')
        setParsing(false)
        return
      }

      // 解析数据（在服务端执行匹配）
      const response = await fetch(`/api/questionnaires/${questionnaireId}/parse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows }),
      })

      if (!response.ok) {
        throw new Error('解析失败')
      }

      const { data } = await response.json()
      setParsedData(data)

      const matched = data.filter((r: ParsedRow) => r.matchStatus === 'matched').length
      toast.success(`解析完成，${matched}/${data.length} 条数据匹配成功`)
    } catch (error) {
      console.error('解析文件失败:', error)
      toast.error('解析文件失败')
    } finally {
      setParsing(false)
    }
  }, [questionnaireId])

  const handleImport = async () => {
    const matchedData = parsedData.filter(r => r.matchStatus === 'matched')
    if (matchedData.length === 0) {
      toast.error('没有可导入的数据')
      return
    }

    setImporting(true)
    try {
      const response = await fetch(`/api/questionnaires/${questionnaireId}/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: matchedData }),
      })

      if (!response.ok) throw new Error('导入失败')

      toast.success(`成功导入 ${matchedData.length} 条数据`)
      setParsedData([])
      setFile(null)
      onSuccess?.()
    } catch (error) {
      console.error('导入失败:', error)
      toast.error('导入失败')
    } finally {
      setImporting(false)
    }
  }

  const matchedCount = parsedData.filter(r => r.matchStatus === 'matched').length
  const notFoundCount = parsedData.filter(r => r.matchStatus === 'not_found').length
  const multipleCount = parsedData.filter(r => r.matchStatus === 'multiple_match').length

  return (
    <div className="space-y-6">
      {/* 上传区域 */}
      <Card>
        <CardHeader>
          <CardTitle>上传问卷数据</CardTitle>
          <CardDescription>
            请上传从腾讯问卷导出的 CSV 文件
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed rounded-lg p-8 text-center">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
              disabled={parsing}
            />
            <label htmlFor="file-upload" className={`cursor-pointer ${parsing ? 'opacity-50' : ''}`}>
              <Upload className="h-12 w-12 mx-auto text-slate-400 mb-4" />
              <p className="text-slate-600 mb-2">
                {parsing ? '解析中...' : file ? file.name : '点击上传或拖拽文件到此处'}
              </p>
              <p className="text-xs text-slate-400">支持 CSV 格式</p>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* 解析结果 */}
      {parsedData.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>解析结果</CardTitle>
              <div className="flex gap-2">
                <Badge variant="default">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  匹配成功 {matchedCount}
                </Badge>
                {notFoundCount > 0 && (
                  <Badge variant="secondary">
                    <XCircle className="h-3 w-3 mr-1" />
                    未匹配 {notFoundCount}
                  </Badge>
                )}
                {multipleCount > 0 && (
                  <Badge variant="destructive">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    多个匹配 {multipleCount}
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="max-h-60 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-100 sticky top-0">
                  <tr>
                    <th className="text-left p-2">姓名</th>
                    <th className="text-left p-2">手机号</th>
                    <th className="text-left p-2">状态</th>
                    <th className="text-left p-2">备注</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedData.map((row, index) => (
                    <tr key={index} className="border-b">
                      <td className="p-2">{row.employeeName}</td>
                      <td className="p-2">{row.employeePhone}</td>
                      <td className="p-2">
                        {row.matchStatus === 'matched' && (
                          <Badge variant="default" className="text-xs">匹配成功</Badge>
                        )}
                        {row.matchStatus === 'not_found' && (
                          <Badge variant="secondary" className="text-xs">未匹配</Badge>
                        )}
                        {row.matchStatus === 'multiple_match' && (
                          <Badge variant="destructive" className="text-xs">多个匹配</Badge>
                        )}
                      </td>
                      <td className="p-2 text-slate-500">{row.matchError}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setParsedData([])}>
                取消
              </Button>
              <Button
                onClick={handleImport}
                disabled={importing || matchedCount === 0}
              >
                {importing ? '导入中...' : `导入 ${matchedCount} 条数据`}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
