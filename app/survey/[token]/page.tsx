import { notFound } from 'next/navigation'
import { validateSurveyToken, getQuestionnaireById } from '@/lib/db/questionnaires'
import { getEmployeeById } from '@/lib/db/employees'
import { SurveyForm } from '@/components/questionnaires/survey-form'

interface PageProps {
  params: Promise<{ token: string }>
}

export default async function SurveyPage({ params }: PageProps) {
  const { token } = await params

  // 验证令牌
  const validation = await validateSurveyToken(token)

  if (!validation.valid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-sm max-w-md">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-xl font-semibold mb-2">问卷链接无效</h1>
          <p className="text-slate-500">{validation.error}</p>
        </div>
      </div>
    )
  }

  // 获取问卷信息
  const questionnaire = await getQuestionnaireById(validation.questionnaireId!)

  if (!questionnaire) {
    notFound()
  }

  // 获取员工信息
  let employeeName = '员工'
  if (validation.employeeId) {
    const employee = await getEmployeeById(validation.employeeId)
    if (employee) {
      employeeName = employee.name
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold">{questionnaire.title}</h1>
            {questionnaire.description && (
              <p className="text-slate-500 mt-2">{questionnaire.description}</p>
            )}
            <p className="text-slate-400 text-sm mt-4">
              您好，{employeeName}！感谢您参与本次调研
            </p>
          </div>

          <SurveyForm token={token} questionnaire={questionnaire} />
        </div>
      </div>
    </div>
  )
}
