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
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { updateQuestionnaire, generateSurveyToken, sendQuestionnaireEmail } from '@/lib/actions/questionnaires'
import { Edit, Users, BarChart3, Link2, Send, Copy, Check, X, Mail, Key } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

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
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([])
  const [expiresInDays, setExpiresInDays] = useState('30')
  const [generatedLink, setGeneratedLink] = useState('')
  const [copied, setCopied] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [sending, setSending] = useState(false)
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false)
  const [smtpPassword, setSmtpPassword] = useState('')

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
    if (selectedEmployeeIds.length === 0) {
      toast.error('请选择至少一名员工')
      return
    }

    try {
      // 为第一个选中的员工生成链接（用于预览）
      const token = await generateSurveyToken(
        selectedEmployeeIds[0],
        questionnaire.id,
        parseInt(expiresInDays)
      )
      const link = `${window.location.origin}/survey/${token}`
      setGeneratedLink(link)
      toast.success('链接生成成功')
    } catch (error) {
      console.error('生成链接失败:', error)
      toast.error('生成链接失败')
    }
  }

  const handleSendEmail = () => {
    if (selectedEmployeeIds.length === 0) {
      toast.error('请选择至少一名员工')
      return
    }
    // 打开授权码输入对话框
    setPasswordDialogOpen(true)
  }

  const confirmSendEmail = async () => {
    if (!smtpPassword.trim()) {
      toast.error('请输入邮箱授权码')
      return
    }

    setSending(true)
    try {
      const result = await sendQuestionnaireEmail(
        selectedEmployeeIds,
        questionnaire.id,
        questionnaire.title,
        parseInt(expiresInDays),
        smtpPassword
      )

      if (result.success > 0) {
        toast.success(`成功发送 ${result.success} 封邮件`)
        setSelectedEmployeeIds([])
        setPasswordDialogOpen(false)
        setSmtpPassword('')
        router.refresh()
      }

      if (result.failed > 0) {
        toast.error(`${result.failed} 封邮件发送失败`)
        if (result.errors.length > 0) {
          console.error('发送失败详情:', result.errors)
        }
      }
    } catch (error) {
      console.error('发送邮件失败:', error)
      toast.error('发送邮件失败')
    } finally {
      setSending(false)
    }
  }

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(generatedLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const toggleEmployee = (employeeId: string) => {
    setSelectedEmployeeIds(prev =>
      prev.includes(employeeId)
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    )
  }

  const toggleAllEmployees = () => {
    if (selectedEmployeeIds.length === employees.length) {
      setSelectedEmployeeIds([])
    } else {
      setSelectedEmployeeIds(employees.map(e => e.id))
    }
  }

  const removeEmployee = (employeeId: string) => {
    setSelectedEmployeeIds(prev => prev.filter(id => id !== employeeId))
  }

  const getEmployeeName = (employeeId: string) => {
    const emp = employees.find(e => e.id === employeeId)
    return emp ? `${emp.name} (${emp.department || '未知部门'})` : employeeId
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
              <CardTitle>发送问卷</CardTitle>
              <CardDescription>
                选择员工发送问卷链接到邮箱，或生成链接手动发送
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 员工选择 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>选择员工</Label>
                  <Button variant="outline" size="sm" onClick={toggleAllEmployees}>
                    {selectedEmployeeIds.length === employees.length ? '取消全选' : '全选'}
                  </Button>
                </div>

                {/* 已选择的员工标签 */}
                {selectedEmployeeIds.length > 0 && (
                  <div className="flex flex-wrap gap-2 p-2 bg-slate-50 rounded-md min-h-[40px]">
                    {selectedEmployeeIds.map(empId => (
                      <Badge key={empId} variant="secondary" className="flex items-center gap-1">
                        {getEmployeeName(empId)}
                        <X
                          className="h-3 w-3 cursor-pointer"
                          onClick={() => removeEmployee(empId)}
                        />
                      </Badge>
                    ))}
                  </div>
                )}

                {/* 员工列表 */}
                <div className="border rounded-md max-h-60 overflow-y-auto">
                  <div className="flex items-center gap-2 p-2 bg-slate-100 border-b font-medium text-sm text-slate-600">
                    <div className="w-5" />
                    <span className="flex-1">姓名</span>
                    <span className="w-24">班组</span>
                    <span className="w-28">离职日期</span>
                    <span className="w-24">部门</span>
                  </div>
                  {employees.map((emp) => (
                    <div
                      key={emp.id}
                      className="flex items-center gap-2 p-2 hover:bg-slate-50 cursor-pointer border-b last:border-b-0"
                      onClick={() => toggleEmployee(emp.id)}
                    >
                      <Checkbox
                        checked={selectedEmployeeIds.includes(emp.id)}
                        onCheckedChange={() => toggleEmployee(emp.id)}
                      />
                      <span className="flex-1 font-medium">{emp.name}</span>
                      <span className="text-sm text-slate-500 w-24">{emp.team || '-'}</span>
                      <span className="text-sm text-slate-500 w-28">{emp.leave_date || '-'}</span>
                      <span className="text-sm text-slate-500 w-24">{emp.department || '-'}</span>
                    </div>
                  ))}
                </div>

                <p className="text-sm text-slate-500">
                  已选择 {selectedEmployeeIds.length} / {employees.length} 名员工
                </p>
              </div>

              {/* 有效期 */}
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

              {/* 操作按钮 */}
              <div className="flex gap-2">
                <Button onClick={handleSendEmail} disabled={sending || selectedEmployeeIds.length === 0} className="flex-1">
                  <Mail className="h-4 w-4 mr-2" />
                  {sending ? '发送中...' : `发送邮件 (${selectedEmployeeIds.length}人)`}
                </Button>
                <Button onClick={handleGenerateLink} variant="outline" disabled={selectedEmployeeIds.length === 0}>
                  <Link2 className="h-4 w-4 mr-2" />
                  生成链接
                </Button>
              </div>

              {/* 生成的链接 */}
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

      {/* 授权码输入对话框 */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              输入邮箱授权码
            </DialogTitle>
            <DialogDescription>
              请输入您的企业邮箱授权码以发送邮件。授权码将用于本次发送，不会被保存。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="smtp-password">授权码</Label>
              <Input
                id="smtp-password"
                type="password"
                placeholder="请输入邮箱授权码"
                value={smtpPassword}
                onChange={(e) => setSmtpPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    confirmSendEmail()
                  }
                }}
              />
              <p className="text-xs text-slate-500">
                发件人将使用当前登录账号的邮箱地址
              </p>
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setPasswordDialogOpen(false)
                  setSmtpPassword('')
                }}
              >
                取消
              </Button>
              <Button onClick={confirmSendEmail} disabled={sending || !smtpPassword.trim()}>
                {sending ? '发送中...' : '确认发送'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
