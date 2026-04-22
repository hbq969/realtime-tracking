-- 添加外部问卷相关字段
ALTER TABLE questionnaires
ADD COLUMN IF NOT EXISTS external_url TEXT,
ADD COLUMN IF NOT EXISTS external_type TEXT,
ADD COLUMN IF NOT EXISTS email_subject TEXT,
ADD COLUMN IF NOT EXISTS email_body TEXT;

COMMENT ON COLUMN questionnaires.external_url IS '外部问卷链接';
COMMENT ON COLUMN questionnaires.external_type IS '外部问卷类型：tencent 或 null';
COMMENT ON COLUMN questionnaires.email_subject IS '自定义邮件主题';
COMMENT ON COLUMN questionnaires.email_body IS '自定义邮件正文';
