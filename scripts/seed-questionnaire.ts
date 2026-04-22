/**
 * 生成示例问卷数据
 * 运行方式: npx tsx scripts/seed-questionnaire.ts
 */

import { config } from 'dotenv'
config({ path: '.env.local' })

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function main() {
  const questionnaire = {
    title: '离职员工回访问卷',
    description: '感谢您抽出宝贵时间参与我们的回访调查。您的反馈对我们改进员工体验非常重要。本问卷约需5分钟完成，所有信息将严格保密。',
    questions: [
      {
        id: 'q1',
        type: 'single',
        title: '您目前的工作状态是？',
        required: true,
        options: ['已找到新工作', '正在求职中', '自主创业', '进修学习', '暂时休息']
      },
      {
        id: 'q2',
        type: 'single',
        title: '您离职后的薪资变化情况？',
        required: true,
        options: ['薪资上涨20%以上', '薪资上涨10%-20%', '薪资基本持平', '薪资下降10%以内', '薪资下降10%以上']
      },
      {
        id: 'q3',
        type: 'single',
        title: '您对目前的工作环境满意吗？',
        required: true,
        options: ['非常满意', '比较满意', '一般', '不太满意', '非常不满意']
      },
      {
        id: 'q4',
        type: 'multiple',
        title: '您选择离开公司的主要原因有哪些？',
        required: true,
        options: ['薪资待遇', '职业发展空间', '工作压力', '团队氛围', '公司文化', '通勤距离', '家庭原因', '其他']
      },
      {
        id: 'q5',
        type: 'rating',
        title: '您对原公司的整体满意度评分（1-5分）',
        required: true
      },
      {
        id: 'q6',
        type: 'single',
        title: '您是否愿意推荐他人加入原公司？',
        required: true,
        options: ['非常愿意', '愿意', '不确定', '不愿意', '非常不愿意']
      },
      {
        id: 'q7',
        type: 'text',
        title: '您对原公司有哪些改进建议？',
        required: false,
        placeholder: '请输入您的建议...'
      },
      {
        id: 'q8',
        type: 'text',
        title: '如果有机会，您是否愿意重新加入原公司？请说明原因。',
        required: false,
        placeholder: '请输入您的想法...'
      }
    ],
    status: 'active'
  }

  const { data, error } = await supabase
    .from('questionnaires')
    .insert(questionnaire)
    .select()
    .single()

  if (error) {
    console.error('创建问卷失败:', error)
    process.exit(1)
  }

  console.log('问卷创建成功:', data)
}

main()
