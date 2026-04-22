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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { MoreVertical, Eye, Edit, Trash2, Copy, Link2, Archive } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { updateQuestionnaire, deleteQuestionnaire } from '@/lib/actions/questionnaires'
import { toast } from 'sonner'

interface QuestionnaireListProps {
  questionnaires: Questionnaire[]
}

const statusLabels = {
  draft: '草稿',
  active: '已发布',
  archived: '已归档',
}

const statusVariants = {
  draft: 'secondary',
  active: 'default',
  archived: 'outline',
} as const

function DeleteButton({ questionnaire, onDelete }: { questionnaire: Questionnaire; onDelete: (id: string) => void }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger render={
        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50">
          <Trash2 className="h-4 w-4" />
        </Button>
      } />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>确认删除</AlertDialogTitle>
          <AlertDialogDescription>
            确定要删除问卷「{questionnaire.title}」吗？此操作不可撤销。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
          <AlertDialogAction
            className="bg-red-500 hover:bg-red-600"
            onClick={() => onDelete(questionnaire.id)}
          >
            删除
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export function QuestionnaireList({ questionnaires }: QuestionnaireListProps) {
  const [list, setList] = useState(questionnaires)

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

  const handleDelete = async (id: string) => {
    try {
      await deleteQuestionnaire(id)
      setList(list.filter(q => q.id !== id))
    } catch (error) {
      console.error('删除失败:', error)
      alert('删除失败')
    }
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
              <div className="flex items-center gap-1">
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
                    {questionnaire.status === 'draft' && (
                      <DropdownMenuItem onClick={() => handleActivate(questionnaire.id)}>
                        <Copy className="h-4 w-4 mr-2" />
                        发布问卷
                      </DropdownMenuItem>
                    )}
                    {questionnaire.status === 'active' && (
                      <>
                        <DropdownMenuItem>
                          <Link href={`/questionnaires/${questionnaire.id}?tab=send`} className="flex items-center">
                            <Link2 className="h-4 w-4 mr-2" />
                            发送问卷
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleArchive(questionnaire.id)}>
                          <Archive className="h-4 w-4 mr-2" />
                          归档
                        </DropdownMenuItem>
                      </>
                    )}
                    {questionnaire.status === 'archived' && (
                      <DropdownMenuItem onClick={() => handleActivate(questionnaire.id)}>
                        <Copy className="h-4 w-4 mr-2" />
                        重新启用
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
                <DeleteButton questionnaire={questionnaire} onDelete={handleDelete} />
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              {questionnaire.external_type === 'tencent' ? (
                <Badge variant="outline" className="text-xs">
                  腾讯问卷
                </Badge>
              ) : (
                <span>{questionnaire.questions?.length || 0} 个问题</span>
              )}
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
