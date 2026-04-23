import { QuestionnaireForm } from '@/components/questionnaires/questionnaire-form'
import { createQuestionnaire } from '@/lib/db/questionnaires'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default function CreateQuestionnairePage() {
  async function handleCreate(data: {
    title: string
    description?: string
    external_url?: string
    external_type?: 'tencent' | null
    status: 'draft' | 'active' | 'archived'
  }) {
    'use server'
    const questionnaire = await createQuestionnaire(data)
    redirect(`/questionnaires/${questionnaire.id}`)
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <Link href="/questionnaires">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回问卷列表
          </Button>
        </Link>
      </div>
      <h2 className="text-2xl font-semibold mb-6">创建问卷</h2>
      <QuestionnaireForm onSubmit={handleCreate} />
    </div>
  )
}
