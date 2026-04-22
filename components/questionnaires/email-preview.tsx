'use client'

import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DEFAULT_EMAIL_SUBJECT, DEFAULT_EMAIL_BODY } from '@/types/questionnaire'
import { RotateCcw } from 'lucide-react'

interface EmailPreviewProps {
  questionnaireTitle: string
  questionnaireUrl: string
  employeeName: string
  companyName: string
  initialSubject?: string
  initialBody?: string
  onSubjectChange?: (subject: string) => void
  onBodyChange?: (body: string) => void
  hasQrCode?: boolean
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
  hasQrCode = false,
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

  // 渲染预览内容，处理二维码占位符
  const renderPreviewContent = () => {
    const parts = previewBody.split('[二维码图片]')
    return parts.map((part, index) => (
      <span key={index}>
        {part}
        {index < parts.length - 1 && (
          hasQrCode ? (
            <span className="inline-block my-2 text-center text-xs text-blue-500 border border-blue-300 bg-blue-50 rounded p-2 w-32 align-middle">
              📷 二维码图片
            </span>
          ) : (
            <span className="inline-block my-2 text-center text-xs text-slate-400 border border-dashed border-slate-300 rounded p-2 w-32 align-middle">
              [二维码图片]
            </span>
          )
        )}
      </span>
    ))
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
            <p className="mt-2">特殊占位符：<code className="bg-slate-100 px-1 rounded">[二维码图片]</code>（发送时自动替换为二维码）</p>
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
              {renderPreviewContent()}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
