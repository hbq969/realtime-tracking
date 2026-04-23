import { notFound } from 'next/navigation'
import { getQuestionnaireById, getSurveyResponseRate } from '@/lib/db/questionnaires'
import { getEmployees } from '@/lib/db/employees'
import { QuestionnaireDetail } from '@/components/questionnaires/questionnaire-detail'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface PageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tab?: string }>
}

export const dynamic = 'force-dynamic'

export default async function QuestionnaireDetailPage({ params, searchParams }: PageProps) {
  const { id } = await params
  const { tab } = await searchParams
  const questionnaire = await getQuestionnaireById(id)

  if (!questionnaire) {
    notFound()
  }

  const { data: employees } = await getEmployees()
  const responseRate = await getSurveyResponseRate(id)
  const companyName = process.env.NEXT_PUBLIC_COMPANY_NAME || '公司'

  return (
    <div className="space-y-6">
      <div>
        <Link href="/questionnaires">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回问卷列表
          </Button>
        </Link>
      </div>
      <QuestionnaireDetail
        questionnaire={questionnaire}
        employees={employees}
        responseRate={responseRate}
        defaultTab={tab || 'send'}
        companyName={companyName}
      />
    </div>
  )
}
