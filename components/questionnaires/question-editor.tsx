'use client'

import { useState } from 'react'
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
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Trash2, GripVertical } from 'lucide-react'
import type { Question, QuestionType } from '@/types/questionnaire'

interface QuestionEditorProps {
  questions: Question[]
  onChange: (questions: Question[]) => void
}

const questionTypes: { value: QuestionType; label: string }[] = [
  { value: 'single', label: '单选题' },
  { value: 'multiple', label: '多选题' },
  { value: 'text', label: '填空题' },
  { value: 'rating', label: '评分题' },
]

const getQuestionTypeLabel = (type: QuestionType): string => {
  const found = questionTypes.find(t => t.value === type)
  return found ? found.label : type
}

export function QuestionEditor({ questions, onChange }: QuestionEditorProps) {
  const addQuestion = () => {
    const newQuestion: Question = {
      id: crypto.randomUUID(),
      type: 'single',
      title: '',
      required: true,
      options: ['选项1', '选项2'],
    }
    onChange([...questions, newQuestion])
  }

  const removeQuestion = (id: string) => {
    onChange(questions.filter((q) => q.id !== id))
  }

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    onChange(
      questions.map((q) => (q.id === id ? { ...q, ...updates } : q))
    )
  }

  const addOption = (questionId: string) => {
    const question = questions.find((q) => q.id === questionId)
    if (question && question.options) {
      updateQuestion(questionId, {
        options: [...question.options, `选项${question.options.length + 1}`],
      })
    }
  }

  const removeOption = (questionId: string, optionIndex: number) => {
    const question = questions.find((q) => q.id === questionId)
    if (question && question.options && question.options.length > 2) {
      const newOptions = question.options.filter((_, i) => i !== optionIndex)
      updateQuestion(questionId, { options: newOptions })
    }
  }

  const updateOption = (questionId: string, optionIndex: number, value: string) => {
    const question = questions.find((q) => q.id === questionId)
    if (question && question.options) {
      const newOptions = [...question.options]
      newOptions[optionIndex] = value
      updateQuestion(questionId, { options: newOptions })
    }
  }

  const handleTypeChange = (questionId: string, newType: QuestionType) => {
    const updates: Partial<Question> = { type: newType }

    if (newType === 'single' || newType === 'multiple') {
      updates.options = ['选项1', '选项2']
    } else if (newType === 'text') {
      updates.placeholder = '请输入您的回答'
    } else if (newType === 'rating') {
      updates.options = undefined
    }

    updateQuestion(questionId, updates)
  }

  return (
    <div className="space-y-4">
      {questions.map((question, index) => (
        <Card key={question.id}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GripVertical className="h-4 w-4 text-slate-400 cursor-move" />
                <CardTitle className="text-base">问题 {index + 1}</CardTitle>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeQuestion(question.id)}
                className="text-red-500 hover:text-red-600"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>题目类型</Label>
                <Select
                  value={question.type}
                  onValueChange={(value) =>
                    handleTypeChange(question.id, value as QuestionType)
                  }
                >
                  <SelectTrigger>
                    <SelectValue>{getQuestionTypeLabel(question.type)}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {questionTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end space-x-2 pb-2">
                <Checkbox
                  id={`required-${question.id}`}
                  checked={question.required}
                  onCheckedChange={(checked) =>
                    updateQuestion(question.id, { required: !!checked })
                  }
                />
                <Label htmlFor={`required-${question.id}`}>必填</Label>
              </div>
            </div>

            <div className="space-y-2">
              <Label>题目内容</Label>
              <Input
                value={question.title}
                onChange={(e) =>
                  updateQuestion(question.id, { title: e.target.value })
                }
                placeholder="请输入题目内容"
              />
            </div>

            {(question.type === 'single' || question.type === 'multiple') && (
              <div className="space-y-2">
                <Label>选项</Label>
                {question.options?.map((option, optionIndex) => (
                  <div key={optionIndex} className="flex gap-2">
                    <Input
                      value={option}
                      onChange={(e) =>
                        updateOption(question.id, optionIndex, e.target.value)
                      }
                      placeholder={`选项 ${optionIndex + 1}`}
                    />
                    {question.options && question.options.length > 2 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeOption(question.id, optionIndex)}
                        className="text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addOption(question.id)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  添加选项
                </Button>
              </div>
            )}

            {question.type === 'text' && (
              <div className="space-y-2">
                <Label>占位提示</Label>
                <Input
                  value={question.placeholder || ''}
                  onChange={(e) =>
                    updateQuestion(question.id, { placeholder: e.target.value })
                  }
                  placeholder="请输入占位提示"
                />
              </div>
            )}

            {question.type === 'rating' && (
              <div className="text-sm text-slate-500">
                评分题将显示 1-5 星评分选择
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      <Button variant="outline" onClick={addQuestion} className="w-full">
        <Plus className="h-4 w-4 mr-2" />
        添加问题
      </Button>
    </div>
  )
}
