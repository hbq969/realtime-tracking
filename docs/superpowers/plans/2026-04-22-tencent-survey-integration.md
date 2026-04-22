# 腾讯问卷集成实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将现有本地问卷系统改造为腾讯问卷集成模式，支持邮件发送问卷链接和二维码，支持导入问卷数据。

**Architecture:** 保留现有架构，移除问题编辑功能，添加外部链接支持、二维码生成、邮件预览和数据导入功能。

**Tech Stack:** Next.js 16, React 19, TypeScript, Supabase, qrcode 库

---

## 文件结构

### 新增文件
- `lib/qrcode.ts` - 二维码生成工具函数
- `lib/import/survey-data.ts` - 问卷数据导入解析
- `components/questionnaires/email-preview.tsx` - 邮件预览组件
- `components/questionnaires/survey-data-import.tsx` - 数据导入组件
- `app/(dashboard)/questionnaires/[id]/import/page.tsx` - 导入页面
- `app/api/questionnaires/[id]/qrcode/route.ts` - 二维码 API

### 修改文件
- `types/questionnaire.ts` - 添加新字段类型
- `types/database.ts` - 更新数据库表类型
- `lib/db/questionnaires.ts` - 支持新字段
- `lib/actions/questionnaires.ts` - 支持新字段和二维码
- `lib/email.ts` - 支持附件发送
- `components/questionnaires/questionnaire-form.tsx` - 改为链接输入
- `components/questionnaires/questionnaire-detail.tsx` - 移除问题列表，添加二维码和邮件预览
- `components/questionnaires/questionnaire-list.tsx` - 显示问卷类型标识

### 删除文件
- `components/questionnaires/question-editor.tsx`
- `components/questionnaires/survey-form.tsx`
- `app/survey/[token]/page.tsx`

---

## Task 1: 更新类型定义

**Files:**
- Modify: `types/questionnaire.ts`
- Modify: `types/database.ts`

- [ ] **Step 1: 更新 questionnaire.ts 类型定义**

```typescript
/**
 * 问卷类型定义
 */

export type QuestionType = 'single' | 'multiple' | 'text' | 'rating'

export interface Question {
  id: string
  type: QuestionType
  title: string
  required: boolean
  options?: string[]
  placeholder?: string
}

export type ExternalType = 'tencent' | null

export interface Questionnaire {
  id: string
  title: string
  description: string
  questions: Question[] | null
  status: 'draft' | 'active' | 'archived'
  created_at: string
  external_url: string | null
  external_type: ExternalType
  email_subject: string | null
  email_body: string | null
}

export interface QuestionnaireFormData {
  title: string
  description?: string
  questions?: Question[]
  external_url?: string
  external_type?: ExternalType
  email_subject?: string
  email_body?: string
}

export interface SurveyToken {
  id: string
  token: string
  employee_id: string
  questionnaire_id: string
  used: boolean
  expires_at: string
  created_at: string
}

export interface SurveyResponse {
  id: string
  employee_id: string
  questionnaire_id: string
  answers: Record<string, string | string[]>
  submit_channel: 'survey' | 'manual'
  submitted_at: string
}

// 邮件模板变量
export interface EmailTemplateVariables {
  '员工姓名': string
  '问卷标题': string
  '问卷链接': string
  '公司名称': string
  '日期': string
}

// 默认邮件模板
export const DEFAULT_EMAIL_SUBJECT = '【离职回访】{问卷标题}'
export const DEFAULT_EMAIL_BODY = `尊敬的 {员工姓名}：

您好！感谢您在职期间的辛勤付出。

为了更好地了解您的离职原因和后续发展情况，我们诚挚邀请您填写以下问卷：

问卷标题：{问卷标题}
问卷链接：{问卷链接}

您也可以扫描下方二维码填写：

[二维码图片]

感谢您的配合！

{公司名称}
{日期}`
```

- [ ] **Step 2: 更新 database.ts 中 questionnaires 表类型**

找到 `questionnaires` 表的 Row/Insert/Update 类型定义，添加新字段：

```typescript
// 在 questionnaires 表的 Row 类型中添加
external_url: string | null
external_type: string | null
email_subject: string | null
email_body: string | null

// 在 questionnaires 表的 Insert 类型中添加
external_url?: string | null
external_type?: string | null
email_subject?: string | null
email_body?: string | null

// 在 questionnaires 表的 Update 类型中添加
external_url?: string | null
external_type?: string | null
email_subject?: string | null
email_body?: string | null
```

- [ ] **Step 3: 提交类型定义变更**

```bash
git add types/questionnaire.ts types/database.ts
git commit -m "feat: 添加腾讯问卷集成相关类型定义"
```

---

## Task 2: 更新数据库操作函数

**Files:**
- Modify: `lib/db/questionnaires.ts`

- [ ] **Step 1: 更新 createQuestionnaire 函数支持新字段**

```typescript
/**
 * 创建问卷（服务端）
 */
export async function createQuestionnaire(
  questionnaireData: {
    title: string
    description?: string
    questions?: Question[]
    status?: 'draft' | 'active' | 'archived'
    external_url?: string
    external_type?: 'tencent' | null
    email_subject?: string
    email_body?: string
  }
): Promise<Questionnaire> {
  const supabase = await createSupabaseServerClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('questionnaires')
    .insert({
      title: questionnaireData.title,
      description: questionnaireData.description || null,
      questions: questionnaireData.questions || null,
      status: questionnaireData.status || 'draft',
      external_url: questionnaireData.external_url || null,
      external_type: questionnaireData.external_type || null,
      email_subject: questionnaireData.email_subject || null,
      email_body: questionnaireData.email_body || null,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`创建问卷失败: ${error.message}`)
  }

  return data as Questionnaire
}
```

- [ ] **Step 2: 更新 updateQuestionnaire 函数支持新字段**

```typescript
/**
 * 更新问卷（服务端）
 */
export async function updateQuestionnaire(
  id: string,
  questionnaireData: Partial<{
    title: string
    description: string
    questions: Question[]
    status: 'draft' | 'active' | 'archived'
    external_url: string
    external_type: 'tencent' | null
    email_subject: string
    email_body: string
  }>
): Promise<Questionnaire> {
  const supabase = await createSupabaseServerClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('questionnaires')
    .update(questionnaireData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw new Error(`更新问卷失败: ${error.message}`)
  }

  return data as Questionnaire
}
```

- [ ] **Step 3: 提交数据库操作函数变更**

```bash
git add lib/db/questionnaires.ts
git commit -m "feat: 更新问卷数据库操作支持外部问卷字段"
```

---

## Task 3: 安装二维码依赖并创建工具函数

**Files:**
- Create: `lib/qrcode.ts`

- [ ] **Step 1: 安装 qrcode 依赖**

```bash
npm install qrcode
npm install -D @types/qrcode
```

- [ ] **Step 2: 创建二维码生成工具函数**

```typescript
/**
 * 二维码生成工具
 */
import QRCode from 'qrcode'

/**
 * 生成二维码图片 Buffer
 */
export async function generateQRCodeBuffer(url: string): Promise<Buffer> {
  return await QRCode.toBuffer(url, {
    type: 'png',
    width: 300,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#ffffff',
    },
  })
}

/**
 * 生成二维码 Base64 字符串
 */
export async function generateQRCodeBase64(url: string): Promise<string> {
  const buffer = await generateQRCodeBuffer(url)
  return `data:image/png;base64,${buffer.toString('base64')}`
}

/**
 * 生成二维码 Data URL（用于前端显示）
 */
export async function generateQRCodeDataUrl(url: string): Promise<string> {
  return await QRCode.toDataURL(url, {
    width: 300,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#ffffff',
    },
  })
}
```

- [ ] **Step 3: 提交二维码工具函数**

```bash
git add lib/qrcode.ts package.json package-lock.json
git commit -m "feat: 添加二维码生成工具函数"
```

---

## Task 4: 创建二维码 API 路由

**Files:**
- Create: `app/api/questionnaires/[id]/qrcode/route.ts`

- [ ] **Step 1: 创建二维码 API 路由**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getQuestionnaireById } from '@/lib/db/questionnaires'
import { generateQRCodeBuffer } from '@/lib/qrcode'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const questionnaire = await getQuestionnaireById(id)

    if (!questionnaire) {
      return NextResponse.json({ error: '问卷不存在' }, { status: 404 })
    }

    if (!questionnaire.external_url) {
      return NextResponse.json({ error: '问卷链接不存在' }, { status: 400 })
    }

    const qrBuffer = await generateQRCodeBuffer(questionnaire.external_url)

    return new NextResponse(qrBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=86400',
      },
    })
  } catch (error) {
    console.error('生成二维码失败:', error)
    return NextResponse.json({ error: '生成二维码失败' }, { status: 500 })
  }
}
```

- [ ] **Step 2: 提交二维码 API**

```bash
git add app/api/questionnaires
git commit -m "feat: 添加问卷二维码 API 路由"
```

---

## Task 5: 改造 QuestionnaireForm 组件

**Files:**
- Modify: `components/questionnaires/questionnaire-form.tsx`

- [ ] **Step 1: 重写 QuestionnaireForm 组件**

```typescript
'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertTriangle, ExternalLink } from 'lucide-react'
import type { Questionnaire } from '@/types/questionnaire'

const formSchema = z.object({
  title: z.string().min(1, '请输入问卷标题'),
  description: z.string().optional(),
  status: z.enum(['draft', 'active', 'archived']),
  external_url: z.string().url('请输入有效的问卷链接').optional().or(z.literal('')),
})

type FormValues = z.infer<typeof formSchema>

interface QuestionnaireFormProps {
  defaultValues?: Partial<Questionnaire>
  onSubmit: (data: {
    title: string
    description?: string
    status: 'draft' | 'active' | 'archived'
    external_url?: string
    external_type?: 'tencent' | null
  }) => Promise<void>
  isEdit?: boolean
}

export function QuestionnaireForm({
  defaultValues,
  onSubmit,
  isEdit,
}: QuestionnaireFormProps) {
  const [loading, setLoading] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<'draft' | 'active' | 'archived'>(
    defaultValues?.status || 'draft'
  )

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      status: 'draft',
      external_url: '',
      ...defaultValues,
    },
  })

  const handleFormSubmit = async (data: FormValues) => {
    setLoading(true)
    try {
      await onSubmit({
        ...data,
        external_url: data.external_url || undefined,
        external_type: data.external_url ? 'tencent' : null,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* 重要提示 */}
      <Alert className="border-amber-200 bg-amber-50">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <AlertTitle className="text-amber-800">重要提示</AlertTitle>
        <AlertDescription className="text-amber-700">
          <p className="mb-2">请确保在腾讯问卷中已添加以下<strong>必填题</strong>，否则导入数据时无法匹配员工身份：</p>
          <ul className="list-disc list-inside space-y-1">
            <li><strong>姓名</strong>（单行文本，必填）</li>
            <li><strong>手机号</strong>（单行文本，必填）</li>
          </ul>
          <p className="mt-2 text-sm">这两个题目用于将问卷回答关联到对应的离职员工。</p>
        </AlertDescription>
      </Alert>

      <div className="space-y-2">
        <Label htmlFor="title">问卷标题</Label>
        <Input
          id="title"
          placeholder="请输入问卷标题"
          {...register('title')}
        />
        {errors.title && (
          <p className="text-sm text-red-500">{errors.title.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">问卷描述</Label>
        <Textarea
          id="description"
          placeholder="请输入问卷描述（可选）"
          rows={3}
          {...register('description')}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="external_url">
          <span className="flex items-center gap-1">
            腾讯问卷链接
            <ExternalLink className="h-3 w-3" />
          </span>
        </Label>
        <Input
          id="external_url"
          placeholder="https://wj.qq.com/s2/xxxxx/xxxxx"
          {...register('external_url')}
        />
        {errors.external_url && (
          <p className="text-sm text-red-500">{errors.external_url.message}</p>
        )}
        <p className="text-xs text-slate-500">
          请在腾讯问卷创建问卷后，复制问卷链接粘贴到此处
        </p>
      </div>

      {isEdit && (
        <div className="space-y-2">
          <Label htmlFor="status">问卷状态</Label>
          <Select
            value={selectedStatus}
            onValueChange={(value) => {
              const status = value as 'draft' | 'active' | 'archived'
              setSelectedStatus(status)
              setValue('status', status)
            }}
          >
            <SelectTrigger>
              <SelectValue>
                {selectedStatus === 'draft' ? '草稿' : selectedStatus === 'active' ? '启用' : '归档'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">草稿</SelectItem>
              <SelectItem value="active">启用</SelectItem>
              <SelectItem value="archived">归档</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? '保存中...' : isEdit ? '保存修改' : '创建问卷'}
      </Button>
    </form>
  )
}
```

- [ ] **Step 2: 提交 QuestionnaireForm 组件变更**

```bash
git add components/questionnaires/questionnaire-form.tsx
git commit -m "feat: 改造问卷表单组件支持腾讯问卷链接"
```

---

## Task 6: 创建邮件预览组件

**Files:**
- Create: `components/questionnaires/email-preview.tsx`

- [ ] **Step 1: 创建邮件预览组件**

```typescript
'use client'

import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DEFAULT_EMAIL_SUBJECT, DEFAULT_EMAIL_BODY } from '@/types/questionnaire'
import { RotateCcw, Save } from 'lucide-react'

interface EmailPreviewProps {
  questionnaireTitle: string
  questionnaireUrl: string
  employeeName: string
  companyName: string
  initialSubject?: string
  initialBody?: string
  onSubjectChange?: (subject: string) => void
  onBodyChange?: (body: string) => void
}

export function EmailPreview({
  questionnaireTitle,
  questionnaireUrl,
  employeeName,
  companyName,
  initialSubject,
  initialBody,
  onSubjectChange,
  onBodyChange,
}: EmailPreviewProps) {
  const [subject, setSubject] = useState(initialSubject || DEFAULT_EMAIL_SUBJECT)
  const [body, setBody] = useState(initialBody || DEFAULT_EMAIL_BODY)

  useEffect(() => {
    if (initialSubject) setSubject(initialSubject)
  }, [initialSubject])

  useEffect(() => {
    if (initialBody) setBody(initialBody)
  }, [initialBody])

  const currentDate = useMemo(() => {
    const now = new Date()
    return `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`
  }, [])

  const replaceVariables = (text: string) => {
    return text
      .replace(/{员工姓名}/g, employeeName || '员工')
      .replace(/{问卷标题}/g, questionnaireTitle)
      .replace(/{问卷链接}/g, questionnaireUrl)
      .replace(/{公司名称}/g, companyName || '公司')
      .replace(/{日期}/g, currentDate)
  }

  const previewSubject = useMemo(() => replaceVariables(subject), [subject, employeeName, questionnaireTitle, questionnaireUrl, companyName, currentDate])
  const previewBody = useMemo(() => replaceVariables(body), [body, employeeName, questionnaireTitle, questionnaireUrl, companyName, currentDate])

  const handleSubjectChange = (value: string) => {
    setSubject(value)
    onSubjectChange?.(value)
  }

  const handleBodyChange = (value: string) => {
    setBody(value)
    onBodyChange?.(value)
  }

  const handleReset = () => {
    setSubject(DEFAULT_EMAIL_SUBJECT)
    setBody(DEFAULT_EMAIL_BODY)
    onSubjectChange?.(DEFAULT_EMAIL_SUBJECT)
    onBodyChange?.(DEFAULT_EMAIL_BODY)
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* 编辑区 */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">编辑邮件模板</CardTitle>
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw className="h-3 w-3 mr-1" />
              重置
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>邮件主题</Label>
            <Input
              value={subject}
              onChange={(e) => handleSubjectChange(e.target.value)}
              placeholder="请输入邮件主题"
            />
          </div>
          <div className="space-y-2">
            <Label>邮件正文</Label>
            <Textarea
              value={body}
              onChange={(e) => handleBodyChange(e.target.value)}
              placeholder="请输入邮件正文"
              rows={12}
              className="font-mono text-sm"
            />
          </div>
          <div className="text-xs text-slate-500">
            <p className="font-medium mb-1">可用变量：</p>
            <div className="flex flex-wrap gap-1">
              {['{员工姓名}', '{问卷标题}', '{问卷链接}', '{公司名称}', '{日期}'].map((v) => (
                <code key={v} className="bg-slate-100 px-1 rounded">{v}</code>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 预览区 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">邮件预览</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg p-4 bg-white">
            <div className="border-b pb-3 mb-3">
              <p className="text-xs text-slate-500 mb-1">主题</p>
              <p className="font-medium">{previewSubject}</p>
            </div>
            <div className="text-sm whitespace-pre-wrap leading-relaxed">
              {previewBody.split('[二维码图片]').map((part, index, arr) => (
                <span key={index}>
                  {part}
                  {index < arr.length - 1 && (
                    <span className="inline-block my-2 text-center text-xs text-slate-400 border border-dashed border-slate-300 rounded p-2 w-32 align-middle">
                      [二维码图片]
                    </span>
                  )}
                </span>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
```

- [ ] **Step 2: 提交邮件预览组件**

```bash
git add components/questionnaires/email-preview.tsx
git commit -m "feat: 添加邮件预览组件"
```

---

## Task 7: 改造 QuestionnaireDetail 组件

**Files:**
- Modify: `components/questionnaires/questionnaire-detail.tsx`

- [ ] **Step 1: 重写 QuestionnaireDetail 组件**

由于组件较长，主要改动点：

1. 移除 `QuestionEditor` 和问题列表相关代码
2. 移除"问题列表"标签页
3. 添加问卷链接展示和二维码预览
4. 集成邮件预览组件
5. 发送邮件时生成二维码附件

关键代码片段：

```typescript
// 导入邮件预览组件
import { EmailPreview } from './email-preview'

// 在发送邮件对话框中添加邮件预览
<Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
    <DialogHeader>
      <DialogTitle>发送问卷邮件</DialogTitle>
      <DialogDescription>
        预览并调整邮件内容后发送给选中的员工
      </DialogDescription>
    </DialogHeader>
    <div className="space-y-4">
      <EmailPreview
        questionnaireTitle={questionnaire.title}
        questionnaireUrl={questionnaire.external_url || ''}
        employeeName={selectedEmployeeIds.length === 1 ? getEmployeeName(selectedEmployeeIds[0]) : '员工'}
        companyName={companyName}
        initialSubject={questionnaire.email_subject || undefined}
        initialBody={questionnaire.email_body || undefined}
        onSubjectChange={setEmailSubject}
        onBodyChange={setEmailBody}
      />
      {/* 二维码预览 */}
      {questionnaire.external_url && (
        <div className="flex justify-center">
          <div className="text-center">
            <img
              src={`/api/questionnaires/${questionnaire.id}/qrcode`}
              alt="问卷二维码"
              className="w-32 h-32 mx-auto border rounded"
            />
            <p className="text-xs text-slate-500 mt-1">扫码填写问卷</p>
          </div>
        </div>
      )}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => setEmailDialogOpen(false)}>
          取消
        </Button>
        <Button onClick={confirmSendEmail} disabled={sending}>
          {sending ? '发送中...' : `发送邮件 (${selectedEmployeeIds.length}人)`}
        </Button>
      </div>
    </div>
  </DialogContent>
</Dialog>
```

- [ ] **Step 2: 提交 QuestionnaireDetail 组件变更**

```bash
git add components/questionnaires/questionnaire-detail.tsx
git commit -m "feat: 改造问卷详情组件，添加邮件预览和二维码功能"
```

---

## Task 8: 更新邮件发送支持附件

**Files:**
- Modify: `lib/email.ts`
- Modify: `lib/actions/questionnaires.ts`

- [ ] **Step 1: 更新邮件发送函数支持附件**

在 `lib/email.ts` 中添加带附件的邮件发送函数：

```typescript
/**
 * 发送带附件的邮件
 */
export async function sendEmailWithAttachment(options: {
  to: string
  subject: string
  text: string
  html?: string
  attachments?: Array<{
    filename: string
    content: Buffer
    contentType: string
  }>
  smtpPassword: string
}): Promise<void> {
  const transporter = createTransporter(options.smtpPassword)

  await transporter.sendMail({
    from: process.env.SMTP_USER,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
    attachments: options.attachments?.map(att => ({
      filename: att.filename,
      content: att.content,
      contentType: att.contentType,
    })),
  })
}
```

- [ ] **Step 2: 更新 sendQuestionnaireEmail action**

在 `lib/actions/questionnaires.ts` 中更新发送问卷邮件函数，生成二维码附件：

```typescript
import { generateQRCodeBuffer } from '@/lib/qrcode'
import { sendEmailWithAttachment } from '@/lib/email'

export async function sendQuestionnaireEmail(
  employeeIds: string[],
  questionnaireId: string,
  questionnaireTitle: string,
  expiresInDays: number,
  smtpPassword: string,
  emailSubject?: string,
  emailBody?: string
): Promise<{ success: number; failed: number; errors: string[] }> {
  // ... 获取员工信息 ...

  // 生成二维码
  const questionnaire = await getQuestionnaireById(questionnaireId)
  let qrBuffer: Buffer | null = null
  if (questionnaire?.external_url) {
    qrBuffer = await generateQRCodeBuffer(questionnaire.external_url)
  }

  // 发送邮件
  for (const employee of employees) {
    try {
      const subject = replaceVariables(emailSubject || DEFAULT_EMAIL_SUBJECT, variables)
      const text = replaceVariables(emailBody || DEFAULT_EMAIL_BODY, variables)

      await sendEmailWithAttachment({
        to: employee.email,
        subject,
        text,
        attachments: qrBuffer ? [{
          filename: '问卷二维码.png',
          content: qrBuffer,
          contentType: 'image/png',
        }] : undefined,
        smtpPassword,
      })
      success++
    } catch (error) {
      failed++
      errors.push(`${employee.name}: ${error instanceof Error ? error.message : '发送失败'}`)
    }
  }

  return { success, failed, errors }
}
```

- [ ] **Step 3: 提交邮件发送变更**

```bash
git add lib/email.ts lib/actions/questionnaires.ts
git commit -m "feat: 邮件发送支持二维码附件"
```

---

## Task 9: 创建问卷数据导入解析工具

**Files:**
- Create: `lib/import/survey-data.ts`

- [ ] **Step 1: 创建导入解析工具**

```typescript
/**
 * 问卷数据导入解析工具
 */
import { createSupabaseServerClient } from '@/lib/supabase/server'

// 导入行数据类型
export interface ImportRow {
  [key: string]: string
}

// 解析结果
export interface ParsedRow {
  employeeId: string | null
  employeeName: string
  employeePhone: string
  submittedAt: string
  answers: Record<string, string>
  matchStatus: 'matched' | 'not_found' | 'multiple_match'
  matchError?: string
}

// 跳过的系统列
const SKIP_COLUMNS = [
  '编号',
  '开始答题时间',
  '结束答题时间',
  '答题时长',
  '语言',
  '清洗数据',
  '地理位置',
  'IP',
  'UA',
  'Referrer',
  '自定义字段',
]

/**
 * 解析腾讯问卷导出的 CSV 行数据
 */
export function parseTencentSurveyRow(row: ImportRow): {
  name: string | null
  phone: string | null
  submittedAt: string
  answers: Record<string, string>
} {
  // 获取姓名
  const nameColumn = Object.keys(row).find(key => key.includes('您的姓名'))
  const name = nameColumn ? row[nameColumn]?.trim() : null

  // 获取手机号（清洗制表符）
  const phoneColumn = Object.keys(row).find(key => key.includes('您的手机号码'))
  const phone = phoneColumn ? row[phoneColumn]?.trim().replace(/\t/g, '') : null

  // 获取提交时间
  const submittedAt = row['开始答题时间'] || new Date().toISOString()

  // 解析答案
  const answers: Record<string, string> = {}
  for (const [key, value] of Object.entries(row)) {
    // 跳过系统列和身份识别列
    if (SKIP_COLUMNS.some(skip => key.includes(skip))) continue
    if (key.includes('您的姓名') || key.includes('您的手机号码')) continue

    // 提取题目标题（去掉编号前缀）
    const questionTitle = key.replace(/^\d+\./, '').trim()

    // 提取答案内容（去掉选项字母前缀）
    const answerValue = value?.replace(/^[A-Z]\./, '').trim() || ''

    answers[questionTitle] = answerValue
  }

  return { name, phone, submittedAt, answers }
}

/**
 * 匹配员工
 */
export async function matchEmployee(
  name: string | null,
  phone: string | null
): Promise<{ id: string; status: 'matched' | 'not_found' | 'multiple_match'; error?: string }> {
  const supabase = await createSupabaseServerClient()

  // 优先通过姓名匹配
  if (name) {
    const { data: byName, error } = await supabase
      .from('employees')
      .select('id')
      .eq('name', name)
      .limit(2)

    if (!error && byName && byName.length === 1) {
      return { id: byName[0].id, status: 'matched' }
    }
    if (byName && byName.length > 1) {
      return { id: '', status: 'multiple_match', error: '存在多个同名员工' }
    }
  }

  // 通过手机号匹配
  if (phone) {
    const { data: byPhone, error } = await supabase
      .from('employees')
      .select('id')
      .eq('phone', phone)
      .limit(1)

    if (!error && byPhone && byPhone.length === 1) {
      return { id: byPhone[0].id, status: 'matched' }
    }
  }

  return { id: '', status: 'not_found', error: '未找到匹配员工' }
}

/**
 * 批量解析导入数据
 */
export async function parseImportData(rows: ImportRow[]): Promise<ParsedRow[]> {
  const results: ParsedRow[] = []

  for (const row of rows) {
    const { name, phone, submittedAt, answers } = parseTencentSurveyRow(row)

    const matchResult = await matchEmployee(name, phone)

    results.push({
      employeeId: matchResult.status === 'matched' ? matchResult.id : null,
      employeeName: name || '',
      employeePhone: phone || '',
      submittedAt,
      answers,
      matchStatus: matchResult.status,
      matchError: matchResult.error,
    })
  }

  return results
}
```

- [ ] **Step 2: 提交导入解析工具**

```bash
git add lib/import/survey-data.ts
git commit -m "feat: 添加问卷数据导入解析工具"
```

---

## Task 10: 创建数据导入组件

**Files:**
- Create: `components/questionnaires/survey-data-import.tsx`

- [ ] **Step 1: 创建数据导入组件**

```typescript
'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Upload, FileSpreadsheet, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import { parseImportData, type ImportRow, type ParsedRow } from '@/lib/import/survey-data'
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
      const rows = parseCSV(text)

      // 解析数据
      const results = await parseImportData(rows)
      setParsedData(results)

      const matched = results.filter(r => r.matchStatus === 'matched').length
      toast.success(`解析完成，${matched}/${results.length} 条数据匹配成功`)
    } catch (error) {
      console.error('解析文件失败:', error)
      toast.error('解析文件失败')
    } finally {
      setParsing(false)
    }
  }, [])

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
            请上传从腾讯问卷导出的 CSV 或 Excel 文件
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed rounded-lg p-8 text-center">
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <Upload className="h-12 w-12 mx-auto text-slate-400 mb-4" />
              <p className="text-slate-600 mb-2">
                {file ? file.name : '点击上传或拖拽文件到此处'}
              </p>
              <p className="text-xs text-slate-400">支持 CSV、Excel 格式</p>
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

// CSV 解析函数
function parseCSV(text: string): ImportRow[] {
  const lines = text.split('\n').filter(line => line.trim())
  if (lines.length < 2) return []

  const headers = parseCSVLine(lines[0])
  const rows: ImportRow[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i])
    const row: ImportRow = {}
    headers.forEach((header, index) => {
      row[header] = values[index] || ''
    })
    rows.push(row)
  }

  return rows
}

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  result.push(current.trim())

  return result
}
```

- [ ] **Step 2: 提交数据导入组件**

```bash
git add components/questionnaires/survey-data-import.tsx
git commit -m "feat: 添加问卷数据导入组件"
```

---

## Task 11: 创建导入 API 路由

**Files:**
- Create: `app/api/questionnaires/[id]/import/route.ts`

- [ ] **Step 1: 创建导入 API 路由**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getQuestionnaireById } from '@/lib/db/questionnaires'

interface ImportData {
  employeeId: string
  submittedAt: string
  answers: Record<string, string>
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { data } = await request.json() as { data: ImportData[] }

    if (!data || !Array.isArray(data) || data.length === 0) {
      return NextResponse.json({ error: '无效的导入数据' }, { status: 400 })
    }

    // 验证问卷存在
    const questionnaire = await getQuestionnaireById(id)
    if (!questionnaire) {
      return NextResponse.json({ error: '问卷不存在' }, { status: 404 })
    }

    const supabase = await createSupabaseServerClient()

    // 插入数据
    const insertData = data.map(row => ({
      employee_id: row.employeeId,
      questionnaire_id: id,
      answers: row.answers,
      submit_channel: 'manual',
      submitted_at: row.submittedAt,
    }))

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('survey_responses')
      .insert(insertData)

    if (error) {
      throw new Error(`导入失败: ${error.message}`)
    }

    return NextResponse.json({
      success: true,
      imported: data.length,
    })
  } catch (error) {
    console.error('导入问卷数据失败:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '导入失败' },
      { status: 500 }
    )
  }
}
```

- [ ] **Step 2: 提交导入 API**

```bash
git add app/api/questionnaires
git commit -m "feat: 添加问卷数据导入 API"
```

---

## Task 12: 创建导入页面

**Files:**
- Create: `app/(dashboard)/questionnaires/[id]/import/page.tsx`

- [ ] **Step 1: 创建导入页面**

```typescript
import { getQuestionnaireById } from '@/lib/db/questionnaires'
import { SurveyDataImport } from '@/components/questionnaires/survey-data-import'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

interface ImportPageProps {
  params: Promise<{ id: string }>
}

export default async function ImportPage({ params }: ImportPageProps) {
  const { id } = await params
  const questionnaire = await getQuestionnaireById(id)

  if (!questionnaire) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/questionnaires/${id}`}>
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold">导入问卷数据</h1>
          <p className="text-slate-500">{questionnaire.title}</p>
        </div>
      </div>

      <SurveyDataImport questionnaireId={id} />
    </div>
  )
}
```

- [ ] **Step 2: 提交导入页面**

```bash
git add app/\(dashboard\)/questionnaires
git commit -m "feat: 添加问卷数据导入页面"
```

---

## Task 13: 更新问卷详情页添加导入入口

**Files:**
- Modify: `app/(dashboard)/questionnaires/[id]/page.tsx`

- [ ] **Step 1: 在问卷详情页添加导入入口**

在标签页列表中添加"数据导入"标签：

```typescript
import { Upload } from 'lucide-react'
import { SurveyDataImport } from '@/components/questionnaires/survey-data-import'

// 在 TabsList 中添加
<TabsTrigger value="import">
  <Upload className="h-4 w-4 mr-2" />
  数据导入
</TabsTrigger>

// 在 TabsContent 中添加
<TabsContent value="import" className="mt-4">
  <SurveyDataImport questionnaireId={questionnaire.id} />
</TabsContent>
```

- [ ] **Step 2: 提交问卷详情页变更**

```bash
git add app/\(dashboard\)/questionnaires/\[id\]/page.tsx
git commit -m "feat: 在问卷详情页添加数据导入入口"
```

---

## Task 14: 删除不需要的组件和页面

**Files:**
- Delete: `components/questionnaires/question-editor.tsx`
- Delete: `components/questionnaires/survey-form.tsx`
- Delete: `app/survey/[token]/page.tsx`

- [ ] **Step 1: 删除 QuestionEditor 组件**

```bash
rm components/questionnaires/question-editor.tsx
```

- [ ] **Step 2: 删除 SurveyForm 组件**

```bash
rm components/questionnaires/survey-form.tsx
```

- [ ] **Step 3: 删除员工填写页面**

```bash
rm -rf app/survey
```

- [ ] **Step 4: 提交删除变更**

```bash
git add -A
git commit -m "refactor: 删除本地问卷编辑和填写相关组件"
```

---

## Task 15: 更新问卷列表组件显示问卷类型

**Files:**
- Modify: `components/questionnaires/questionnaire-list.tsx`

- [ ] **Step 1: 在问卷列表中显示问卷类型标识**

```typescript
// 在问卷卡片中添加类型标识
{questionnaire.external_type === 'tencent' && (
  <Badge variant="outline" className="text-xs">
    腾讯问卷
  </Badge>
)}
```

- [ ] **Step 2: 提交问卷列表变更**

```bash
git add components/questionnaires/questionnaire-list.tsx
git commit -m "feat: 问卷列表显示问卷类型标识"
```

---

## Task 16: 数据库迁移

**Files:**
- Create: `supabase/migrations/20260422_add_external_survey_fields.sql`

- [ ] **Step 1: 创建数据库迁移文件**

```sql
-- 添加外部问卷相关字段
ALTER TABLE questionnaires
ADD COLUMN IF NOT EXISTS external_url TEXT,
ADD COLUMN IF NOT EXISTS external_type TEXT,
ADD COLUMN IF NOT EXISTS email_subject TEXT,
ADD COLUMN IF NOT EXISTS email_body TEXT;

COMMENT ON COLUMN questionnaires.external_url IS '外部问卷链接';
COMMENT ON COLUMN questionnaires.external_type IS '外部问卷类型：tencent 或 null';
COMMENT ON COLUMN questionnaires.email_subject IS '自定义邮件主题';
COMMENT ON COLUMN questionnaires.email_body IS '自定义邮件正文';
```

- [ ] **Step 2: 提交数据库迁移文件**

```bash
git add supabase/migrations
git commit -m "feat: 添加外部问卷字段数据库迁移"
```

---

## Task 17: 最终测试与验证

- [ ] **Step 1: 运行开发服务器**

```bash
npm run dev
```

- [ ] **Step 2: 测试问卷创建流程**
- 创建新问卷，输入腾讯问卷链接
- 验证提示信息正确显示

- [ ] **Step 3: 测试二维码生成**
- 访问 `/api/questionnaires/[id]/qrcode`
- 验证二维码图片正确生成

- [ ] **Step 4: 测试邮件发送**
- 选择员工发送邮件
- 验证邮件预览功能
- 验证二维码附件

- [ ] **Step 5: 测试数据导入**
- 上传腾讯问卷导出的 CSV 文件
- 验证解析和匹配功能
- 验证数据导入成功

- [ ] **Step 6: 提交最终变更**

```bash
git add -A
git commit -m "feat: 完成腾讯问卷集成"
```

---

## 自检清单

- [ ] 所有类型定义完整且一致
- [ ] 所有 API 路由正确处理错误
- [ ] 邮件模板变量替换正确
- [ ] 二维码生成尺寸合适
- [ ] 导入解析正确处理腾讯问卷格式
- [ ] 删除了所有不需要的文件
- [ ] 无 TypeScript 编译错误
