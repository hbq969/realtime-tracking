// app/(dashboard)/settings/oauth/page.tsx
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useState } from 'react'
import { toast } from 'sonner'

export default function OAuthPage() {
  const [wechatConfig, setWechatConfig] = useState({
    corpId: '',
    agentId: '',
    secret: ''
  })

  const [dingtalkConfig, setDingtalkConfig] = useState({
    appKey: '',
    appSecret: ''
  })

  const handleWechatSave = () => {
    // TODO: 保存企业微信配置到数据库
    toast.success('企业微信配置已保存')
  }

  const handleDingtalkSave = () => {
    // TODO: 保存钉钉配置到数据库
    toast.success('钉钉配置已保存')
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>企业微信配置</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="wechat-corp-id">Corp ID</Label>
            <Input
              id="wechat-corp-id"
              placeholder="请输入企业ID"
              value={wechatConfig.corpId}
              onChange={(e) => setWechatConfig({ ...wechatConfig, corpId: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="wechat-agent-id">Agent ID</Label>
            <Input
              id="wechat-agent-id"
              placeholder="请输入应用ID"
              value={wechatConfig.agentId}
              onChange={(e) => setWechatConfig({ ...wechatConfig, agentId: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="wechat-secret">Secret</Label>
            <Input
              id="wechat-secret"
              type="password"
              placeholder="请输入应用Secret"
              value={wechatConfig.secret}
              onChange={(e) => setWechatConfig({ ...wechatConfig, secret: e.target.value })}
            />
          </div>
          <Button onClick={handleWechatSave}>保存配置</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>钉钉配置</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="dingtalk-app-key">App Key</Label>
            <Input
              id="dingtalk-app-key"
              placeholder="请输入AppKey"
              value={dingtalkConfig.appKey}
              onChange={(e) => setDingtalkConfig({ ...dingtalkConfig, appKey: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dingtalk-app-secret">App Secret</Label>
            <Input
              id="dingtalk-app-secret"
              type="password"
              placeholder="请输入AppSecret"
              value={dingtalkConfig.appSecret}
              onChange={(e) => setDingtalkConfig({ ...dingtalkConfig, appSecret: e.target.value })}
            />
          </div>
          <Button onClick={handleDingtalkSave}>保存配置</Button>
        </CardContent>
      </Card>
    </div>
  )
}
