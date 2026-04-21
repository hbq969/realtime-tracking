'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { submitSurveyAnswer } from '@/lib/actions/questionnaires'
import type { Questionnaire, Question } from '@/types/questionnaire'

interface SurveyFormProps {
  token: string
  questionnaire: Questionnaire
}

export function SurveyForm({ token, questionnaire }: SurveyFormProps) {
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({})
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSingleChange = (questionId: string, value: string) => {
    setAnswers({ ...answers, [questionId]: value })
    setErrors({ ...errors, [questionId]: '' })
  }

  const handleMultipleChange = (questionId: string, option: string, checked: boolean) => {
    const current = (answers[questionId] as string[]) || []
    if (checked) {
      setAnswers({ ...answers, [questionId]: [...current, option] })
    } else {
      setAnswers({ ...answers, [questionId]: current.filter((o) => o !== option) })
    }
    setErrors({ ...errors, [questionId]: '' })
  }

  const handleTextChange = (questionId: string, value: string) => {
    setAnswers({ ...answers, [questionId]: value })
    setErrors({ ...errors, [questionId]: '' })
  }

  const handleRatingChange = (questionId: string, rating: number) => {
    setAnswers({ ...answers, [questionId]: rating.toString() })
    setErrors({ ...errors, [questionId]: '' })
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}
    let valid = true

    questionnaire.questions.forEach((q) => {
      if (q.required) {
        const answer = answers[q.id]
        if (!answer || (Array.isArray(answer) && answer.length === 0)) {
          newErrors[q.id] = '此题为必填项'
          valid = false
        }
      }
    })

    setErrors(newErrors)
    return valid
  }

  const handleSubmit = async () => {
    if (!validate()) return

    setLoading(true)
    try {
      const result = await submitSurveyAnswer(token, answers)
      if (result.success) {
        setSubmitted(true)
      } else {
        alert(result.error || '提交失败，请稍后重试')
      }
    } catch (error) {
      console.error('提交失败:', error)
      alert('提交失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">✅</div>
        <h2 className="text-xl font-semibold mb-2">提交成功</h2>
        <p className="text-slate-500">感谢您的参与！</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {questionnaire.questions.map((question, index) => (
        <div key={question.id} className="space-y-4">
          <div className="flex items-start gap-2">
            <span className="font-medium text-slate-700">
              {index + 1}.
            </span>
            <div className="flex-1">
              <Label className="text-base">
                {question.title}
                {question.required && (
                  <span className="text-red-500 ml-1">*</span>
                )}
              </Label>

              {question.type === 'single' && (
                <RadioGroup
                  value={(answers[question.id] as string) || ''}
                  onValueChange={(value) => handleSingleChange(question.id, value)}
                  className="mt-3 space-y-2"
                >
                  {question.options?.map((option, i) => (
                    <div key={i} className="flex items-center space-x-2">
                      <RadioGroupItem value={option} id={`${question.id}-${i}`} />
                      <Label htmlFor={`${question.id}-${i}`}>{option}</Label>
                    </div>
                  ))}
                </RadioGroup>
              )}

              {question.type === 'multiple' && (
                <div className="mt-3 space-y-2">
                  {question.options?.map((option, i) => (
                    <div key={i} className="flex items-center space-x-2">
                      <Checkbox
                        id={`${question.id}-${i}`}
                        checked={((answers[question.id] as string[]) || []).includes(option)}
                        onCheckedChange={(checked) =>
                          handleMultipleChange(question.id, option, !!checked)
                        }
                      />
                      <Label htmlFor={`${question.id}-${i}`}>{option}</Label>
                    </div>
                  ))}
                </div>
              )}

              {question.type === 'text' && (
                <Textarea
                  value={(answers[question.id] as string) || ''}
                  onChange={(e) => handleTextChange(question.id, e.target.value)}
                  placeholder={question.placeholder || '请输入您的回答'}
                  className="mt-3"
                  rows={4}
                />
              )}

              {question.type === 'rating' && (
                <div className="mt-3 flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => handleRatingChange(question.id, star)}
                      className={`text-3xl transition-colors ${
                        parseInt(answers[question.id] as string) >= star
                          ? 'text-yellow-400'
                          : 'text-slate-300'
                      } hover:text-yellow-500`}
                    >
                      ★
                    </button>
                  ))}
                  <span className="ml-2 text-sm text-slate-500">
                    {answers[question.id] ? `${answers[question.id]} 分` : '点击评分'}
                  </span>
                </div>
              )}

              {errors[question.id] && (
                <p className="text-sm text-red-500 mt-1">{errors[question.id]}</p>
              )}
            </div>
          </div>
        </div>
      ))}

      <Button onClick={handleSubmit} className="w-full" size="lg" disabled={loading}>
        {loading ? '提交中...' : '提交问卷'}
      </Button>
    </div>
  )
}
