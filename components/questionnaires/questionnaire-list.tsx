'use client'

import type { Questionnaire } from '@/types/questionnaire'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreVertical, Eye, Edit, Trash2, Copy, Link2 } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { updateQuestionnaire, generateSurveyToken, getSurveyResponseRate } from '@/lib/actions/questionnaires'

interface QuestionnaireListProps {
  questionnaires: Questionnaire[]
}

const statusLabels = {
  draft: '草稿',
  active: '启用',
  archived: '归档',
}

const statusVariants = {
  draft: 'secondary',
  active: 'default',
  archived: 'outline',
} as const

export function QuestionnaireList({ questionnaires }: QuestionnaireListProps) {
  const [list, setList] = useState(questionnaires)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const handleArchive = async (id: string) => {
    try {
      await updateQuestionnaire(id, { status: 'archived' })
      setList(list.map(q => q.id === id ? { ...q, status: 'archived' } : q))
    } catch (error) {
      console.error('归档失败:', error)
      alert('归档失败')
    }
  }

  const handleActivate = async (id: string) => {
    try {
      await updateQuestionnaire(id, { status: 'active' })
      setList(list.map(q => q.id === id ? { ...q, status: 'active' } : q))
    } catch (error) {
      console.error('启用失败:', error)
      alert('启用失败')
    }
  }

  const copyLink = async (id: string) => {
    const baseUrl = window.location.origin
    // 这里只是示例，实际应该生成真实令牌
    const link = `${baseUrl}/survey/TOKEN_PLACEHOLDER`
    await navigator.clipboard.writeText(link)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  if (list.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        暂无问卷，点击"创建问卷"开始
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {list.map((questionnaire) => (
        <Card key={questionnaire.id} className="flex flex-col">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="space-y-1 flex-1">
                <CardTitle className="text-lg line-clamp-1">
                  {questionnaire.title}
                </CardTitle>
                <CardDescription className="line-clamp-2">
                  {questionnaire.description || '暂无描述'}
                </CardDescription>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger render={<Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>} />
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <Link href={`/questionnaires/${questionnaire.id}`} className="flex items-center">
                      <Eye className="h-4 w-4 mr-2" />
                      查看详情
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Link href={`/questionnaires/${questionnaire.id}`} className="flex items-center">
                      <Edit className="h-4 w-4 mr-2" />
                      编辑
                    </Link>
                  </DropdownMenuItem>
                  {questionnaire.status === 'active' && (
                    <DropdownMenuItem onClick={() => copyLink(questionnaire.id)}>
                      <Link2 className="h-4 w-4 mr-2" />
                      {copiedId === questionnaire.id ? '已复制!' : '复制链接'}
                    </DropdownMenuItem>
                  )}
                  {questionnaire.status === 'draft' && (
                    <DropdownMenuItem onClick={() => handleActivate(questionnaire.id)}>
                      <Copy className="h-4 w-4 mr-2" />
                      启用问卷
                    </DropdownMenuItem>
                  )}
                  {questionnaire.status === 'active' && (
                    <DropdownMenuItem onClick={() => handleArchive(questionnaire.id)}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      归档
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          <CardContent className="flex-1">
            <div className="text-sm text-slate-500">
              {questionnaire.questions.length} 个问题
            </div>
          </CardContent>
          <CardFooter className="pt-3 border-t">
            <div className="flex items-center justify-between w-full">
              <Badge variant={statusVariants[questionnaire.status]}>
                {statusLabels[questionnaire.status]}
              </Badge>
              <span className="text-xs text-slate-400">
                创建于 {new Date(questionnaire.created_at).toLocaleDateString('zh-CN')}
              </span>
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
