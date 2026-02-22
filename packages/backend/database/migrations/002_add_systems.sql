-- Migration: 002_add_systems
-- Description: 引入"系统"概念，替代固定的目标分类枚举
-- Author: AI Assistant
-- Date: 2026-02-09

BEGIN;

-- 检查是否已经应用此迁移
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM schema_migrations WHERE version = '002') THEN
        RAISE NOTICE '迁移 002 已经应用过了，跳过执行';
        RETURN;
    END IF;
END
$$;

-- 1. 创建系统状态枚举
CREATE TYPE system_status AS ENUM ('ACTIVE', 'PAUSED', 'ARCHIVED');

-- 2. 创建 systems 表
CREATE TABLE systems (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(10),
    color VARCHAR(20),
    status system_status NOT NULL DEFAULT 'ACTIVE',
    sort_order INTEGER DEFAULT 0,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT systems_name_length CHECK (length(trim(name)) >= 2),
    CONSTRAINT unique_system_name_per_user UNIQUE (user_id, name)
);

-- 3. 为每个用户基于现有 objective category 创建对应系统
-- 映射：PERSONAL->个人发展, PROFESSIONAL->职业发展, HEALTH->健康生活, 
--       LEARNING->学习成长, FINANCIAL->财务规划, RELATIONSHIP->人际关系, 
--       CREATIVE->创意项目, OTHER->其他
DO $$
DECLARE
    r RECORD;
    new_system_id UUID;
    category_map JSONB := '{
        "PERSONAL":     {"name": "个人发展",   "icon": "👤", "color": "#6366F1"},
        "PROFESSIONAL": {"name": "职业发展",   "icon": "💼", "color": "#2563EB"},
        "HEALTH":       {"name": "健康生活",   "icon": "💪", "color": "#16A34A"},
        "LEARNING":     {"name": "学习成长",   "icon": "📚", "color": "#D97706"},
        "FINANCIAL":    {"name": "财务规划",   "icon": "💰", "color": "#CA8A04"},
        "RELATIONSHIP": {"name": "人际关系",   "icon": "❤️", "color": "#DC2626"},
        "CREATIVE":     {"name": "创意项目",   "icon": "🎨", "color": "#9333EA"},
        "OTHER":        {"name": "其他",       "icon": "📋", "color": "#6B7280"}
    }'::JSONB;
    cat TEXT;
    cat_info JSONB;
    sort_idx INTEGER;
BEGIN
    -- 遍历每个用户所使用的目标分类
    FOR r IN
        SELECT DISTINCT user_id, category::TEXT as cat
        FROM objectives
        ORDER BY user_id
    LOOP
        cat_info := category_map -> r.cat;
        sort_idx := CASE r.cat
            WHEN 'PERSONAL' THEN 0
            WHEN 'PROFESSIONAL' THEN 1
            WHEN 'HEALTH' THEN 2
            WHEN 'LEARNING' THEN 3
            WHEN 'FINANCIAL' THEN 4
            WHEN 'RELATIONSHIP' THEN 5
            WHEN 'CREATIVE' THEN 6
            WHEN 'OTHER' THEN 7
        END;

        -- 插入系统（如果尚不存在）
        INSERT INTO systems (name, description, icon, color, status, sort_order, user_id)
        VALUES (
            cat_info ->> 'name',
            NULL,
            cat_info ->> 'icon',
            cat_info ->> 'color',
            'ACTIVE',
            sort_idx,
            r.user_id
        )
        ON CONFLICT (user_id, name) DO NOTHING;
    END LOOP;
END
$$;

-- 4. 添加 system_id 列到 objectives（先允许 NULL）
ALTER TABLE objectives ADD COLUMN system_id UUID REFERENCES systems(id) ON DELETE CASCADE;

-- 5. 将现有目标的 category 映射到对应的 system_id
DO $$
DECLARE
    r RECORD;
    target_system_id UUID;
    category_name_map JSONB := '{
        "PERSONAL":     "个人发展",
        "PROFESSIONAL": "职业发展",
        "HEALTH":       "健康生活",
        "LEARNING":     "学习成长",
        "FINANCIAL":    "财务规划",
        "RELATIONSHIP": "人际关系",
        "CREATIVE":     "创意项目",
        "OTHER":        "其他"
    }'::JSONB;
    system_name TEXT;
BEGIN
    FOR r IN SELECT id, user_id, category::TEXT as cat FROM objectives
    LOOP
        system_name := category_name_map ->> r.cat;
        SELECT id INTO target_system_id
        FROM systems
        WHERE systems.user_id = r.user_id AND systems.name = system_name;

        IF target_system_id IS NOT NULL THEN
            UPDATE objectives SET system_id = target_system_id WHERE id = r.id;
        END IF;
    END LOOP;
END
$$;

-- 6. 对于没有被映射到系统的目标（不应该出现，但以防万一），
--    为其所属用户创建"其他"系统并关联
DO $$
DECLARE
    r RECORD;
    fallback_system_id UUID;
BEGIN
    FOR r IN SELECT DISTINCT user_id FROM objectives WHERE system_id IS NULL
    LOOP
        INSERT INTO systems (name, description, icon, color, status, sort_order, user_id)
        VALUES ('其他', NULL, '📋', '#6B7280', 'ACTIVE', 99, r.user_id)
        ON CONFLICT (user_id, name) DO NOTHING
        RETURNING id INTO fallback_system_id;

        IF fallback_system_id IS NULL THEN
            SELECT id INTO fallback_system_id FROM systems
            WHERE systems.user_id = r.user_id AND systems.name = '其他';
        END IF;

        UPDATE objectives SET system_id = fallback_system_id
        WHERE objectives.user_id = r.user_id AND objectives.system_id IS NULL;
    END LOOP;
END
$$;

-- 7. 设置 system_id 为 NOT NULL（数据已全部迁移完毕）
-- 注意：如果数据库中 objectives 表为空，则直接设置 NOT NULL 即可
ALTER TABLE objectives ALTER COLUMN system_id SET NOT NULL;

-- 8. 移除旧的 category 列及相关索引
DROP INDEX IF EXISTS idx_objectives_category;
DROP INDEX IF EXISTS idx_objectives_user_category;
ALTER TABLE objectives DROP COLUMN IF EXISTS category;

-- 9. 创建新索引
CREATE INDEX idx_systems_user_id ON systems(user_id);
CREATE INDEX idx_systems_status ON systems(status);
CREATE INDEX idx_systems_user_status ON systems(user_id, status);
CREATE INDEX idx_systems_sort_order ON systems(user_id, sort_order);

CREATE INDEX idx_objectives_system_id ON objectives(system_id);
CREATE INDEX idx_objectives_user_system ON objectives(user_id, system_id);

-- 10. 为 systems 表添加 updated_at 触发器
CREATE TRIGGER update_systems_updated_at BEFORE UPDATE ON systems
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 11. 更新视图：将 category 替换为 system 信息
DROP VIEW IF EXISTS tasks_with_details;
CREATE VIEW tasks_with_details AS
SELECT 
    t.*,
    kr.title as key_result_title,
    kr.objective_id,
    o.title as objective_title,
    s.name as system_name,
    s.icon as system_icon,
    u.name as user_name,
    u.email as user_email,
    CASE 
        WHEN t.due_date IS NOT NULL 
             AND t.due_date < CURRENT_TIMESTAMP 
             AND t.status != 'COMPLETED' 
        THEN TRUE 
        ELSE FALSE 
    END as is_overdue,
    CASE 
        WHEN t.due_date IS NOT NULL AND t.status != 'COMPLETED'
        THEN EXTRACT(DAYS FROM (t.due_date - CURRENT_TIMESTAMP))::INTEGER
        ELSE NULL
    END as days_remaining
FROM tasks t
LEFT JOIN key_results kr ON t.key_result_id = kr.id
LEFT JOIN objectives o ON kr.objective_id = o.id
LEFT JOIN systems s ON o.system_id = s.id
LEFT JOIN users u ON t.user_id = u.id;

-- 12. 更新 objectives_with_stats 视图加入系统信息
DROP VIEW IF EXISTS objectives_with_stats;
CREATE VIEW objectives_with_stats AS
SELECT 
    o.*,
    s.name as system_name,
    s.icon as system_icon,
    s.color as system_color,
    COALESCE(kr_stats.total_key_results, 0) as total_key_results,
    COALESCE(kr_stats.completed_key_results, 0) as completed_key_results,
    COALESCE(task_stats.total_tasks, 0) as total_tasks,
    COALESCE(task_stats.completed_tasks, 0) as completed_tasks,
    u.name as user_name,
    u.email as user_email
FROM objectives o
LEFT JOIN systems s ON o.system_id = s.id
LEFT JOIN users u ON o.user_id = u.id
LEFT JOIN (
    SELECT 
        objective_id,
        COUNT(*) as total_key_results,
        COUNT(*) FILTER (WHERE status = 'COMPLETED') as completed_key_results
    FROM key_results
    GROUP BY objective_id
) kr_stats ON o.id = kr_stats.objective_id
LEFT JOIN (
    SELECT 
        kr.objective_id,
        COUNT(t.*) as total_tasks,
        COUNT(t.*) FILTER (WHERE t.status = 'COMPLETED') as completed_tasks
    FROM key_results kr
    LEFT JOIN tasks t ON kr.id = t.key_result_id
    GROUP BY kr.objective_id
) task_stats ON o.id = task_stats.objective_id;

-- 13. 创建系统统计视图
CREATE VIEW systems_with_stats AS
SELECT 
    s.*,
    COALESCE(obj_stats.total_objectives, 0) as total_objectives,
    COALESCE(obj_stats.active_objectives, 0) as active_objectives,
    COALESCE(obj_stats.completed_objectives, 0) as completed_objectives,
    COALESCE(obj_stats.avg_progress, 0) as avg_progress
FROM systems s
LEFT JOIN (
    SELECT 
        system_id,
        COUNT(*) as total_objectives,
        COUNT(*) FILTER (WHERE status = 'ACTIVE') as active_objectives,
        COUNT(*) FILTER (WHERE status = 'COMPLETED') as completed_objectives,
        ROUND(AVG(progress)) as avg_progress
    FROM objectives
    GROUP BY system_id
) obj_stats ON s.id = obj_stats.system_id;

-- 14. 移除旧的枚举类型（不再需要）
DROP TYPE IF EXISTS objective_category;

-- 添加表注释
COMMENT ON TABLE systems IS '系统表：用户自定义的持续性生活领域/体系';

-- 记录迁移完成
INSERT INTO schema_migrations (version, description) 
VALUES ('002', '引入系统概念，替代固定的目标分类枚举');

COMMIT;
