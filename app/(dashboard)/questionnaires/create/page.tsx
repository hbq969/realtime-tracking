import { QuestionnaireForm } from '@/components/questionnaires/questionnaire-form'
import { createQuestionnaire } from '@/lib/db/questionnaires'
import { redirect } from 'next/navigation'

export default function CreateQuestionnairePage() {
  async function handleCreate(data: {
    title: string
    description?: string
    questions: any[]
    status: 'draft' | 'active' | 'archived'
  }) {
    'use server'
    const questionnaire = await createQuestionnaire(data)
    redirect(`/questionnaires/${questionnaire.id}`)
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-2xl font-semibold mb-6">创建问卷</h2>
      <QuestionnaireForm onSubmit={handleCreate} />
    </div>
  )
}
