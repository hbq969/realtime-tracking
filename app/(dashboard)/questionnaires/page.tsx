import { getQuestionnaires } from '@/lib/db/questionnaires'
import { QuestionnaireList } from '@/components/questionnaires/questionnaire-list'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function QuestionnairesPage() {
  const { data: questionnaires } = await getQuestionnaires()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">问卷管理</h2>
        <Link href="/questionnaires/create">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            创建问卷
          </Button>
        </Link>
      </div>

      <QuestionnaireList questionnaires={questionnaires} />
    </div>
  )
}
