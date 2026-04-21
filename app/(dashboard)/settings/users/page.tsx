// app/(dashboard)/settings/users/page.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function UsersPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>用户管理</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-500">
            在 Supabase 控制台中管理用户账户和权限。
          </p>
          <Button asChild>
            <a
              href="https://supabase.com/dashboard"
              target="_blank"
              rel="noopener noreferrer"
            >
              打开 Supabase 控制台
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
