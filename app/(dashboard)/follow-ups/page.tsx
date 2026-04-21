import { getFollowUpPlans } from '@/lib/db/follow-ups'
import { FollowUpList } from '@/components/follow-ups/follow-up-list'

export default async function FollowUpsPage() {
  const { data: plans } = await getFollowUpPlans()

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">回访管理</h2>
      <FollowUpList plans={plans} />
    </div>
  )
}
