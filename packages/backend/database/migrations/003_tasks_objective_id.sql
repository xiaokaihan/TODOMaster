-- Migration: 003_tasks_objective_id
-- Description: 为 tasks 表添加 objective_id 列，支持任务直接关联目标（System -> Objective -> Task）
-- 适用场景：数据库由 001_initial_schema + 002_add_systems 创建

BEGIN;

-- 1. 若存在 estimated_duration 但不存在 estimated_hours，添加并回填
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'tasks' AND column_name = 'estimated_duration')
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'tasks' AND column_name = 'estimated_hours') THEN
        ALTER TABLE tasks ADD COLUMN estimated_hours DECIMAL(5,2);
        ALTER TABLE tasks ADD COLUMN actual_hours DECIMAL(5,2);
        UPDATE tasks SET estimated_hours = estimated_duration::DECIMAL / 60 WHERE estimated_duration IS NOT NULL;
        UPDATE tasks SET actual_hours = actual_duration::DECIMAL / 60 WHERE actual_duration IS NOT NULL;
        RAISE NOTICE '已添加 estimated_hours, actual_hours 并从 estimated_duration/actual_duration 迁移';
    END IF;
END
$$;

-- 2. 添加 objective_id 列（若不存在）
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'tasks' AND column_name = 'objective_id') THEN
        ALTER TABLE tasks ADD COLUMN objective_id UUID REFERENCES objectives(id) ON DELETE CASCADE;
        
        -- 从 key_results 回填 objective_id
        UPDATE tasks t SET objective_id = kr.objective_id
        FROM key_results kr WHERE t.key_result_id = kr.id AND t.objective_id IS NULL;
        
        -- 若仍有 NULL，关联到该用户第一个目标
        UPDATE tasks t SET objective_id = (SELECT o.id FROM objectives o WHERE o.user_id = t.user_id ORDER BY o.created_at ASC LIMIT 1)
        WHERE t.objective_id IS NULL AND t.user_id IS NOT NULL;
        
        IF NOT EXISTS (SELECT 1 FROM tasks WHERE objective_id IS NULL) THEN
            ALTER TABLE tasks ALTER COLUMN objective_id SET NOT NULL;
        END IF;
        
        RAISE NOTICE '已添加 objective_id 并完成回填';
    ELSE
        RAISE NOTICE 'objective_id 已存在，跳过';
    END IF;
END
$$;

-- 3. 将 key_result_id 改为可空（任务可仅关联目标，001 schema 下原为 NOT NULL）
DO $$
BEGIN
    ALTER TABLE tasks ALTER COLUMN key_result_id DROP NOT NULL;
    RAISE NOTICE 'key_result_id 已改为可空';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'key_result_id 已是可空或列不存在: %', SQLERRM;
END
$$;

-- 4. 创建索引
CREATE INDEX IF NOT EXISTS idx_tasks_objective_id ON tasks(objective_id);

-- 5. 若 tasks 有 user_id 列，添加触发器：INSERT 时从 objective 自动填充 user_id
DO $outer$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'tasks' AND column_name = 'user_id') THEN
        CREATE OR REPLACE FUNCTION set_task_user_id_from_objective()
        RETURNS TRIGGER AS $func$
        BEGIN
            IF NEW.user_id IS NULL AND NEW.objective_id IS NOT NULL THEN
                SELECT user_id INTO NEW.user_id FROM objectives WHERE id = NEW.objective_id;
            END IF;
            RETURN NEW;
        END;
        $func$ LANGUAGE plpgsql;
        DROP TRIGGER IF EXISTS trg_set_task_user_id ON tasks;
        CREATE TRIGGER trg_set_task_user_id BEFORE INSERT ON tasks
            FOR EACH ROW EXECUTE PROCEDURE set_task_user_id_from_objective();
        RAISE NOTICE '已添加 user_id 自动填充触发器';
    END IF;
END
$outer$;

COMMIT;
