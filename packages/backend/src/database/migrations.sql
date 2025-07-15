-- TODOMaster 数据库迁移文件
-- 版本: 1.0.0
-- 创建时间: 2024-01-01

-- 启用扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 创建枚举类型
CREATE TYPE user_role AS ENUM ('user', 'admin');
CREATE TYPE objective_category AS ENUM ('WORK', 'PERSONAL', 'HEALTH', 'LEARNING', 'FINANCE', 'OTHER');
CREATE TYPE objective_status AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD', 'CANCELLED');
CREATE TYPE task_status AS ENUM ('TODO', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
CREATE TYPE task_priority AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');
CREATE TYPE key_result_type AS ENUM ('NUMERIC', 'PERCENTAGE', 'BOOLEAN');
CREATE TYPE key_result_status AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED');

-- 用户表
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    role user_role DEFAULT 'user',
    is_active BOOLEAN DEFAULT true,
    avatar_url TEXT,
    timezone VARCHAR(50) DEFAULT 'UTC',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 目标表
CREATE TABLE objectives (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    category objective_category NOT NULL,
    status objective_status DEFAULT 'NOT_STARTED',
    progress DECIMAL(5,2) DEFAULT 0.00 CHECK (progress >= 0 AND progress <= 100),
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT valid_date_range CHECK (start_date IS NULL OR end_date IS NULL OR start_date <= end_date)
);

-- 关键结果表
CREATE TABLE key_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    objective_id UUID NOT NULL REFERENCES objectives(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    type key_result_type NOT NULL,
    target_value DECIMAL(15,2) NOT NULL,
    current_value DECIMAL(15,2) DEFAULT 0.00,
    unit VARCHAR(50),
    progress DECIMAL(5,2) DEFAULT 0.00 CHECK (progress >= 0 AND progress <= 100),
    status key_result_status DEFAULT 'NOT_STARTED',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 任务表
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    objective_id UUID NOT NULL REFERENCES objectives(id) ON DELETE CASCADE,
    key_result_id UUID REFERENCES key_results(id) ON DELETE SET NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    status task_status DEFAULT 'TODO',
    priority task_priority DEFAULT 'MEDIUM',
    estimated_hours DECIMAL(5,2),
    actual_hours DECIMAL(5,2),
    due_date TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT completed_date_check CHECK (
        (status = 'COMPLETED' AND completed_at IS NOT NULL) OR 
        (status != 'COMPLETED' AND completed_at IS NULL)
    )
);

-- 任务依赖关系表
CREATE TABLE task_dependencies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    depends_on_task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT no_self_dependency CHECK (task_id != depends_on_task_id),
    CONSTRAINT unique_dependency UNIQUE (task_id, depends_on_task_id)
);

-- 任务标签表
CREATE TABLE task_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL,
    color VARCHAR(7) DEFAULT '#gray',
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_tag_per_user UNIQUE (user_id, name)
);

-- 任务标签关联表
CREATE TABLE task_tag_associations (
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES task_tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    PRIMARY KEY (task_id, tag_id)
);

-- 活动日志表
CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    entity_type VARCHAR(50) NOT NULL, -- 'objective', 'key_result', 'task'
    entity_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL, -- 'created', 'updated', 'deleted', 'completed'
    old_values JSONB,
    new_values JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_is_active ON users(is_active);

CREATE INDEX idx_objectives_user_id ON objectives(user_id);
CREATE INDEX idx_objectives_status ON objectives(status);
CREATE INDEX idx_objectives_category ON objectives(category);
CREATE INDEX idx_objectives_end_date ON objectives(end_date);

CREATE INDEX idx_key_results_objective_id ON key_results(objective_id);
CREATE INDEX idx_key_results_status ON key_results(status);

CREATE INDEX idx_tasks_objective_id ON tasks(objective_id);
CREATE INDEX idx_tasks_key_result_id ON tasks(key_result_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_priority ON tasks(priority);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);

CREATE INDEX idx_task_dependencies_task_id ON task_dependencies(task_id);
CREATE INDEX idx_task_dependencies_depends_on ON task_dependencies(depends_on_task_id);

CREATE INDEX idx_task_tags_user_id ON task_tags(user_id);
CREATE INDEX idx_task_tag_associations_task_id ON task_tag_associations(task_id);
CREATE INDEX idx_task_tag_associations_tag_id ON task_tag_associations(tag_id);

CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_entity ON activity_logs(entity_type, entity_id);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at);

-- 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为各表添加更新时间触发器
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_objectives_updated_at 
    BEFORE UPDATE ON objectives 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_key_results_updated_at 
    BEFORE UPDATE ON key_results 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at 
    BEFORE UPDATE ON tasks 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 创建进度自动计算触发器函数
CREATE OR REPLACE FUNCTION calculate_objective_progress()
RETURNS TRIGGER AS $$
DECLARE
    total_key_results INTEGER;
    completed_key_results INTEGER;
    new_progress DECIMAL(5,2);
BEGIN
    -- 获取目标的关键结果统计
    SELECT COUNT(*) INTO total_key_results
    FROM key_results 
    WHERE objective_id = COALESCE(NEW.objective_id, OLD.objective_id);
    
    SELECT COUNT(*) INTO completed_key_results
    FROM key_results 
    WHERE objective_id = COALESCE(NEW.objective_id, OLD.objective_id) 
    AND status = 'COMPLETED';
    
    -- 计算进度
    IF total_key_results > 0 THEN
        new_progress = (completed_key_results * 100.0) / total_key_results;
    ELSE
        -- 如果没有关键结果，基于任务完成情况计算
        SELECT 
            CASE 
                WHEN COUNT(*) = 0 THEN 0
                ELSE (COUNT(*) FILTER (WHERE status = 'COMPLETED') * 100.0) / COUNT(*)
            END INTO new_progress
        FROM tasks 
        WHERE objective_id = COALESCE(NEW.objective_id, OLD.objective_id);
    END IF;
    
    -- 更新目标进度
    UPDATE objectives 
    SET progress = COALESCE(new_progress, 0),
        status = CASE 
            WHEN COALESCE(new_progress, 0) = 100 THEN 'COMPLETED'
            WHEN COALESCE(new_progress, 0) > 0 THEN 'IN_PROGRESS'
            ELSE status
        END
    WHERE id = COALESCE(NEW.objective_id, OLD.objective_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- 为关键结果和任务添加进度计算触发器
CREATE TRIGGER calculate_objective_progress_on_key_result
    AFTER INSERT OR UPDATE OR DELETE ON key_results
    FOR EACH ROW EXECUTE FUNCTION calculate_objective_progress();

CREATE TRIGGER calculate_objective_progress_on_task
    AFTER INSERT OR UPDATE OR DELETE ON tasks
    FOR EACH ROW EXECUTE FUNCTION calculate_objective_progress();

-- 创建关键结果进度自动计算函数
CREATE OR REPLACE FUNCTION calculate_key_result_progress()
RETURNS TRIGGER AS $$
BEGIN
    -- 根据类型计算进度
    CASE NEW.type
        WHEN 'NUMERIC' THEN
            NEW.progress = LEAST(100, (NEW.current_value * 100.0) / NEW.target_value);
        WHEN 'PERCENTAGE' THEN
            NEW.progress = LEAST(100, NEW.current_value);
        WHEN 'BOOLEAN' THEN
            NEW.progress = CASE WHEN NEW.current_value >= NEW.target_value THEN 100 ELSE 0 END;
    END CASE;
    
    -- 更新状态
    NEW.status = CASE 
        WHEN NEW.progress >= 100 THEN 'COMPLETED'
        WHEN NEW.progress > 0 THEN 'IN_PROGRESS'
        ELSE 'NOT_STARTED'
    END;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为关键结果添加进度计算触发器
CREATE TRIGGER calculate_key_result_progress_trigger
    BEFORE UPDATE ON key_results
    FOR EACH ROW EXECUTE FUNCTION calculate_key_result_progress();

-- 插入示例数据（可选）
INSERT INTO users (email, password_hash, name, role) VALUES 
('admin@todomaster.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj8xc3jc8Wz2', 'TODOMaster Admin', 'admin'),
('demo@todomaster.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj8xc3jc8Wz2', 'Demo User', 'user');

-- 创建迁移记录表
CREATE TABLE IF NOT EXISTS schema_migrations (
    version VARCHAR(20) PRIMARY KEY,
    description TEXT,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 记录迁移版本
INSERT INTO schema_migrations (version, description) VALUES 
('1.0.0', '初始数据库结构创建');

-- 创建视图：用户统计信息
CREATE VIEW user_stats AS
SELECT 
    u.id,
    u.name,
    u.email,
    COUNT(o.id) as total_objectives,
    COUNT(o.id) FILTER (WHERE o.status = 'COMPLETED') as completed_objectives,
    COUNT(kr.id) as total_key_results,
    COUNT(kr.id) FILTER (WHERE kr.status = 'COMPLETED') as completed_key_results,
    COUNT(t.id) as total_tasks,
    COUNT(t.id) FILTER (WHERE t.status = 'COMPLETED') as completed_tasks,
    COALESCE(AVG(o.progress), 0) as avg_objective_progress
FROM users u
LEFT JOIN objectives o ON u.id = o.user_id
LEFT JOIN key_results kr ON o.id = kr.objective_id
LEFT JOIN tasks t ON o.id = t.objective_id
WHERE u.is_active = true
GROUP BY u.id, u.name, u.email;

COMMENT ON TABLE users IS '用户表';
COMMENT ON TABLE objectives IS '目标表';
COMMENT ON TABLE key_results IS '关键结果表';
COMMENT ON TABLE tasks IS '任务表';
COMMENT ON TABLE task_dependencies IS '任务依赖关系表';
COMMENT ON TABLE task_tags IS '任务标签表';
COMMENT ON TABLE task_tag_associations IS '任务标签关联表';
COMMENT ON TABLE activity_logs IS '活动日志表';
COMMENT ON VIEW user_stats IS '用户统计信息视图'; 