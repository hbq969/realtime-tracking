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
import { QuestionEditor } from './question-editor'
import type { Question, Questionnaire } from '@/types/questionnaire'

const formSchema = z.object({
  title: z.string().min(1, '请输入问卷标题'),
  description: z.string().optional(),
  status: z.enum(['draft', 'active', 'archived']),
})

type FormValues = z.infer<typeof formSchema>

interface QuestionnaireFormProps {
  defaultValues?: Partial<Questionnaire>
  onSubmit: (data: {
    title: string
    description?: string
    questions: Question[]
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
  const [questions, setQuestions] = useState<Question[]>(
    defaultValues?.questions || []
  )
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
      ...defaultValues,
    },
  })

  const handleFormSubmit = async (data: FormValues) => {
    if (questions.length === 0) {
      alert('请至少添加一个问题')
      return
    }

    const hasEmptyTitle = questions.some((q) => !q.title.trim())
    if (hasEmptyTitle) {
      alert('请完善所有问题标题')
      return
    }

    setLoading(true)
    try {
      await onSubmit({
        ...data,
        questions,
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

      <div className="space-y-2">
        <Label>问题列表</Label>
        <QuestionEditor questions={questions} onChange={setQuestions} />
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? '保存中...' : isEdit ? '保存修改' : '创建问卷'}
      </Button>
    </form>
  )
}
