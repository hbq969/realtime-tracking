'use client'

import { useRouter } from 'next/navigation'
import { useState, use } from 'react'
import { createFollowUpRecord, getFollowUpPlanById } from '@/lib/db/follow-ups'
import { FollowUpForm } from '@/components/follow-ups/follow-up-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

export default function FollowUpDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const router = useRouter()
  const { id } = use(params)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (data: {
    contact_method: string
    contact_result: string
    new_company: string
    new_position: string
    salary_change: string
    personal_feeling: string
    suggestions: string
  }) => {
    setIsLoading(true)
    try {
      // 获取计划信息
      const plan = await getFollowUpPlanById(id)
      if (!plan) {
        toast.error('回访计划不存在')
        return
      }

      await createFollowUpRecord(id, plan.employee_id, {
        contact_method: data.contact_method as 'phone' | 'wechat' | 'email',
        contact_result: data.contact_result as 'connected' | 'no_answer' | 'refused',
        new_company: data.new_company,
        new_position: data.new_position,
        salary_change: data.salary_change as 'increase' | 'decrease' | 'same',
        personal_feeling: data.personal_feeling,
        suggestions: data.suggestions,
      })
      toast.success('回访记录已提交')
      router.push('/follow-ups')
    } catch (error) {
      console.error('提交回访记录失败:', error)
      toast.error('提交失败，请重试')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            录入回访记录
            <Badge variant="secondary">回访管理</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <FollowUpForm onSubmit={handleSubmit} isLoading={isLoading} />
        </CardContent>
      </Card>
    </div>
  )
}
