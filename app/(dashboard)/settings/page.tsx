// app/(dashboard)/settings/page.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">系统设置</h2>

      <div className="grid gap-4 md:grid-cols-2">
        <Link href="/settings/users">
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle>用户管理</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-500">
                管理系统用户和权限设置
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/settings/oauth">
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle>OAuth配置</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-500">
                配置企业微信、钉钉登录
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}
