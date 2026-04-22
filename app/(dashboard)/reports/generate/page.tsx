'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowLeft, FileBarChart } from 'lucide-react'
import Link from 'next/link'
import { REPORT_TYPES } from '@/types/report'
import { toast } from 'sonner'

export default function GenerateReportPage() {
  const router = useRouter()
  const [isGenerating, setIsGenerating] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    type: 'summary',
    date_from: '',
    date_to: '',
  })

  const handleGenerate = async () => {
    if (!formData.title.trim()) {
      toast.error('请输入报告名称')
      return
    }

    setIsGenerating(true)
    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title,
          type: formData.type,
          filters: {
            date_from: formData.date_from || undefined,
            date_to: formData.date_to || undefined,
          },
        }),
      })

      if (!response.ok) {
        throw new Error('生成报告失败')
      }

      const data = await response.json()
      toast.success('报告生成成功')
      router.push(`/reports/${data.id}`)
    } catch (error) {
      console.error('生成报告失败:', error)
      toast.error('生成报告失败')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/reports">
          <Button variant="outline" size="icon-xs">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h2 className="text-2xl font-semibold">生成报告</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileBarChart className="h-5 w-5" />
            报告配置
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* 报告名称 */}
            <div className="space-y-2">
              <Label htmlFor="title">报告名称 *</Label>
              <Input
                id="title"
                placeholder="请输入报告名称"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
              />
            </div>

            {/* 报告类型 */}
            <div className="space-y-2">
              <Label htmlFor="type">报告类型</Label>
              <Select
                value={formData.type}
                onValueChange={(value) =>
                  setFormData({ ...formData, type: value || 'summary' })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {REPORT_TYPES.find((t) => t.value === formData.type)?.label || '选择报告类型'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {REPORT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 筛选条件 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date_from">开始日期</Label>
                <Input
                  id="date_from"
                  type="date"
                  value={formData.date_from}
                  onChange={(e) =>
                    setFormData({ ...formData, date_from: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date_to">结束日期</Label>
                <Input
                  id="date_to"
                  type="date"
                  value={formData.date_to}
                  onChange={(e) =>
                    setFormData({ ...formData, date_to: e.target.value })
                  }
                />
              </div>
            </div>

            {/* 报告类型说明 */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <h4 className="font-medium">报告类型说明</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>
                  <strong>综合报告</strong>：包含离职员工概览、离职原因分析、
                  薪资变化统计等综合信息
                </li>
                <li>
                  <strong>离职原因分析</strong>：重点分析离职原因分布和趋势
                </li>
                <li>
                  <strong>回访情况报告</strong>：展示回访完成率、联系方式分布等
                </li>
                <li>
                  <strong>员工保有建议</strong>：基于数据生成员工保有建议
                </li>
              </ul>
            </div>

            {/* 操作按钮 */}
            <div className="flex items-center gap-4 pt-4">
              <Button onClick={handleGenerate} disabled={isGenerating}>
                {isGenerating ? '生成中...' : '生成报告'}
              </Button>
              <Link href="/reports">
                <Button variant="outline">取消</Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
