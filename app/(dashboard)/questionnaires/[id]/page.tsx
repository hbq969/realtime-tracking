import { notFound } from 'next/navigation'
import { getQuestionnaireById, getSurveyResponseRate } from '@/lib/db/questionnaires'
import { getEmployees } from '@/lib/db/employees'
import { QuestionnaireDetail } from '@/components/questionnaires/questionnaire-detail'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function QuestionnaireDetailPage({ params }: PageProps) {
  const { id } = await params
  const questionnaire = await getQuestionnaireById(id)

  if (!questionnaire) {
    notFound()
  }

  const { data: employees } = await getEmployees()
  const responseRate = await getSurveyResponseRate(id)

  return (
    <QuestionnaireDetail
      questionnaire={questionnaire}
      employees={employees}
      responseRate={responseRate}
    />
  )
}
