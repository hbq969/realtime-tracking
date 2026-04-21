'use client'

import { useState } from 'react'
import type { Questionnaire, Question } from '@/types/questionnaire'
import type { Employee } from '@/types/database'
import { QuestionnaireForm } from './questionnaire-form'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { updateQuestionnaire, generateSurveyToken } from '@/lib/actions/questionnaires'
import { Edit, Users, BarChart3, Link2, Send, Copy, Check } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface QuestionnaireDetailProps {
  questionnaire: Questionnaire
  employees: Employee[]
  responseRate: {
    totalSent: number
    totalResponded: number
    responseRate: number
  }
}

const statusLabels = {
  draft: '草稿',
  active: '启用',
  archived: '归档',
}

const statusVariants = {
  draft: 'secondary',
  active: 'default',
  archived: 'outline',
} as const

export function QuestionnaireDetail({
  questionnaire: initialQuestionnaire,
  employees,
  responseRate: initialResponseRate,
}: QuestionnaireDetailProps) {
  const router = useRouter()
  const [questionnaire, setQuestionnaire] = useState(initialQuestionnaire)
  const [responseRate, setResponseRate] = useState(initialResponseRate)
  const [isEditing, setIsEditing] = useState(false)
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('')
  const [expiresInDays, setExpiresInDays] = useState('30')
  const [generatedLink, setGeneratedLink] = useState('')
  const [copied, setCopied] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)

  const handleUpdate = async (data: {
    title: string
    description?: string
    questions: Question[]
    status: 'draft' | 'active' | 'archived'
  }) => {
    const updated = await updateQuestionnaire(questionnaire.id, data)
    setQuestionnaire(updated)
    setIsEditing(false)
    router.refresh()
  }

  const handleGenerateLink = async () => {
    if (!selectedEmployeeId) {
      alert('请选择员工')
      return
    }

    try {
      const token = await generateSurveyToken(
        selectedEmployeeId,
        questionnaire.id,
        parseInt(expiresInDays)
      )
      const link = `${window.location.origin}/survey/${token}`
      setGeneratedLink(link)
    } catch (error) {
      console.error('生成链接失败:', error)
      alert('生成链接失败')
    }
  }

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(generatedLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (isEditing) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold">编辑问卷</h2>
          <Button variant="outline" onClick={() => setIsEditing(false)}>
            取消
          </Button>
        </div>
        <QuestionnaireForm
          defaultValues={questionnaire}
          onSubmit={handleUpdate}
          isEdit
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 头部信息 */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-semibold">{questionnaire.title}</h2>
          {questionnaire.description && (
            <p className="text-slate-500 mt-1">{questionnaire.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={statusVariants[questionnaire.status]}>
            {statusLabels[questionnaire.status]}
          </Badge>
          <Button onClick={() => setIsEditing(true)}>
            <Edit className="h-4 w-4 mr-2" />
            编辑
          </Button>
        </div>
      </div>

      {/* 标签页 */}
      <Tabs defaultValue="questions">
        <TabsList>
          <TabsTrigger value="questions">
            <BarChart3 className="h-4 w-4 mr-2" />
            问题列表
          </TabsTrigger>
          <TabsTrigger value="send">
            <Send className="h-4 w-4 mr-2" />
            发送问卷
          </TabsTrigger>
          <TabsTrigger value="stats">
            <Users className="h-4 w-4 mr-2" />
            统计数据
          </TabsTrigger>
        </TabsList>

        <TabsContent value="questions" className="mt-4">
          <div className="space-y-4">
            {questionnaire.questions.map((question, index) => (
              <Card key={question.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">问题 {index + 1}</Badge>
                    {question.required && <Badge variant="secondary">必填</Badge>}
                  </div>
                  <CardTitle className="text-base mt-2">{question.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  {question.type === 'single' && (
                    <div className="space-y-2">
                      {question.options?.map((option, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <div className="h-4 w-4 rounded-full border border-slate-300" />
                          <span>{option}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {question.type === 'multiple' && (
                    <div className="space-y-2">
                      {question.options?.map((option, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <div className="h-4 w-4 rounded border border-slate-300" />
                          <span>{option}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {question.type === 'text' && (
                    <div className="h-20 border rounded-md p-2 text-slate-400">
                      {question.placeholder || '请输入您的回答'}
                    </div>
                  )}
                  {question.type === 'rating' && (
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <div key={star} className="h-6 w-6 text-slate-300">
                          ★
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="send" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>生成问卷链接</CardTitle>
              <CardDescription>
                选择员工并生成专属问卷链接，链接可设置有效期
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>选择员工</Label>
                  <Select
                    value={selectedEmployeeId}
                    onValueChange={(value) => setSelectedEmployeeId(value || '')}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="请选择员工" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((emp) => (
                        <SelectItem key={emp.id} value={emp.id}>
                          {emp.name} - {emp.department || '未知部门'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>有效期（天）</Label>
                  <Select value={expiresInDays} onValueChange={(value) => setExpiresInDays(value || '30')}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">7 天</SelectItem>
                      <SelectItem value="14">14 天</SelectItem>
                      <SelectItem value="30">30 天</SelectItem>
                      <SelectItem value="60">60 天</SelectItem>
                      <SelectItem value="90">90 天</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button onClick={handleGenerateLink} className="w-full">
                <Link2 className="h-4 w-4 mr-2" />
                生成链接
              </Button>

              {generatedLink && (
                <div className="space-y-2">
                  <Label>问卷链接</Label>
                  <div className="flex gap-2">
                    <Input value={generatedLink} readOnly className="flex-1" />
                    <Button onClick={copyToClipboard} variant="outline">
                      {copied ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-slate-500">
                    请将此链接发送给员工，链接将在指定天数后过期
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats" className="mt-4">
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>发送数量</CardDescription>
                <CardTitle className="text-3xl">{responseRate.totalSent}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>回答数量</CardDescription>
                <CardTitle className="text-3xl">{responseRate.totalResponded}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>回答率</CardDescription>
                <CardTitle className="text-3xl">
                  {responseRate.responseRate.toFixed(1)}%
                </CardTitle>
              </CardHeader>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
