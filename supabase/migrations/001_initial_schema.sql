-- 启用 UUID 扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 离职员工表
CREATE TABLE IF NOT EXISTS public.employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  department TEXT NOT NULL,
  team TEXT,
  position TEXT NOT NULL,
  leave_date DATE NOT NULL,
  leave_reason TEXT NOT NULL,
  employment_duration INTEGER NOT NULL,
  reporter_id UUID REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'followed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 问卷表
CREATE TABLE IF NOT EXISTS public.questionnaires (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  questions JSONB NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 问卷令牌表（用于生成一次性问卷链接）
CREATE TABLE IF NOT EXISTS public.survey_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token TEXT NOT NULL UNIQUE,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  questionnaire_id UUID NOT NULL REFERENCES public.questionnaires(id) ON DELETE CASCADE,
  used BOOLEAN NOT NULL DEFAULT FALSE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 问卷回答表
CREATE TABLE IF NOT EXISTS public.survey_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  questionnaire_id UUID NOT NULL REFERENCES public.questionnaires(id) ON DELETE CASCADE,
  answers JSONB NOT NULL DEFAULT '[]',
  submit_channel TEXT NOT NULL CHECK (submit_channel IN ('survey', 'manual')),
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 回访计划表
CREATE TABLE IF NOT EXISTS public.follow_up_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  plan_date DATE NOT NULL,
  follow_up_type TEXT NOT NULL CHECK (follow_up_type IN ('1m', '3m', '6m', 'custom')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'overdue')),
  reminder_sent BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 回访记录表
CREATE TABLE IF NOT EXISTS public.follow_up_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_id UUID NOT NULL REFERENCES public.follow_up_plans(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  contact_method TEXT NOT NULL CHECK (contact_method IN ('phone', 'wechat', 'email')),
  contact_result TEXT NOT NULL CHECK (contact_result IN ('connected', 'no_answer', 'refused')),
  new_company TEXT,
  new_position TEXT,
  salary_change TEXT CHECK (salary_change IN ('increase', 'decrease', 'same')),
  personal_feeling TEXT,
  suggestions TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 报告表
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  filters JSONB NOT NULL DEFAULT '{}',
  content JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_employees_status ON public.employees(status);
CREATE INDEX idx_employees_leave_date ON public.employees(leave_date);
CREATE INDEX idx_employees_department ON public.employees(department);
CREATE INDEX idx_follow_up_plans_status ON public.follow_up_plans(status);
CREATE INDEX idx_follow_up_plans_plan_date ON public.follow_up_plans(plan_date);
CREATE INDEX idx_survey_tokens_token ON public.survey_tokens(token);

-- 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为 employees 表添加更新时间触发器
CREATE TRIGGER update_employees_updated_at
  BEFORE UPDATE ON public.employees
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 设置 RLS (Row Level Security)
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questionnaires ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follow_up_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follow_up_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- RLS 策略：允许认证用户访问所有数据
CREATE POLICY "Allow authenticated users to access employees"
  ON public.employees FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to access questionnaires"
  ON public.questionnaires FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to access survey_responses"
  ON public.survey_responses FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to access follow_up_plans"
  ON public.follow_up_plans FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to access follow_up_records"
  ON public.follow_up_records FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to access reports"
  ON public.reports FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 问卷令牌：匿名用户可以查看和更新（用于填写问卷）
CREATE POLICY "Allow anonymous to select survey_tokens"
  ON public.survey_tokens FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anonymous to update survey_tokens"
  ON public.survey_tokens FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- 允许匿名用户插入问卷回答
CREATE POLICY "Allow anonymous to insert survey_responses"
  ON public.survey_responses FOR INSERT
  TO anon
  WITH CHECK (true);
