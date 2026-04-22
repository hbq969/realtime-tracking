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
  external_url: z
    .string()
    .min(1, '请输入问卷链接')
    .url('请输入有效的问卷链接'),
})

type FormValues = z.infer<typeof formSchema>

interface QuestionnaireFormProps {
  defaultValues?: Partial<Questionnaire>
  onSubmit: (data: {
    title: string
    description?: string
    external_url: string
    external_type: 'tencent'
    status: 'draft' | 'active' | 'archived'
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
        external_type: 'tencent',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
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
          问卷链接
          <span className="text-red-500 ml-1">*</span>
        </Label>
        <Input
          id="external_url"
          placeholder="请输入腾讯问卷链接，如：https://wj.qq.com/s2/xxxxx"
          {...register('external_url')}
        />
        {errors.external_url && (
          <p className="text-sm text-red-500">{errors.external_url.message}</p>
        )}
        <p className="text-xs text-muted-foreground">
          请在腾讯问卷平台创建问卷后，将问卷链接粘贴到此处
        </p>
      </div>

      <Alert variant="warning">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>重要提示</AlertTitle>
        <AlertDescription className="mt-2">
          <p className="mb-2">
            请确保在腾讯问卷中已添加以下必填题，否则导入数据时无法匹配员工身份：
          </p>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>
              <strong>姓名</strong>（单行文本，必填）
            </li>
            <li>
              <strong>手机号</strong>（单行文本，必填）
            </li>
          </ul>
          <p className="mt-2 text-sm">
            这两个题目用于将问卷回答关联到对应的离职员工。
          </p>
        </AlertDescription>
      </Alert>

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
