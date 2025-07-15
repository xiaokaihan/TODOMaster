-- TODOMaster 数据库模式
-- 创建时间: 2024-01-21
-- 说明: 核心表结构，支持目标驱动的任务管理系统

-- 启用必要的扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 创建枚举类型
CREATE TYPE objective_category AS ENUM (
    'PERSONAL',
    'PROFESSIONAL', 
    'HEALTH',
    'LEARNING',
    'FINANCIAL',
    'RELATIONSHIP',
    'CREATIVE',
    'OTHER'
);

CREATE TYPE priority_level AS ENUM (
    'LOW',
    'MEDIUM',
    'HIGH',
    'CRITICAL'
);

CREATE TYPE objective_status AS ENUM (
    'DRAFT',
    'ACTIVE',
    'ON_HOLD',
    'COMPLETED',
    'CANCELLED'
);

CREATE TYPE key_result_type AS ENUM (
    'NUMERIC',
    'PERCENTAGE',
    'BOOLEAN'
);

CREATE TYPE key_result_status AS ENUM (
    'NOT_STARTED',
    'IN_PROGRESS',
    'COMPLETED',
    'FAILED'
);

CREATE TYPE task_status AS ENUM (
    'TODO',
    'IN_PROGRESS',
    'WAITING',
    'COMPLETED',
    'CANCELLED'
);

-- 用户表
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    avatar TEXT,
    email_verified BOOLEAN DEFAULT FALSE,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- 约束
    CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT name_length CHECK (length(trim(name)) >= 2)
);

-- 目标表
CREATE TABLE objectives (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    category objective_category NOT NULL DEFAULT 'OTHER',
    priority priority_level NOT NULL DEFAULT 'MEDIUM',
    status objective_status NOT NULL DEFAULT 'DRAFT',
    start_date DATE,
    target_date DATE,
    progress INTEGER DEFAULT 0,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- 约束
    CONSTRAINT title_length CHECK (length(trim(title)) >= 3),
    CONSTRAINT progress_range CHECK (progress >= 0 AND progress <= 100),
    CONSTRAINT date_order CHECK (start_date IS NULL OR target_date IS NULL OR start_date <= target_date)
);

-- 关键结果表
CREATE TABLE key_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    target_value DECIMAL(12,3) NOT NULL,
    current_value DECIMAL(12,3) DEFAULT 0,
    unit VARCHAR(50) DEFAULT '',
    type key_result_type NOT NULL DEFAULT 'NUMERIC',
    status key_result_status NOT NULL DEFAULT 'NOT_STARTED',
    due_date DATE,
    completed_at TIMESTAMP WITH TIME ZONE,
    objective_id UUID NOT NULL REFERENCES objectives(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- 约束
    CONSTRAINT title_length CHECK (length(trim(title)) >= 3),
    CONSTRAINT target_positive CHECK (target_value > 0),
    CONSTRAINT current_non_negative CHECK (current_value >= 0),
    CONSTRAINT percentage_range CHECK (
        type != 'PERCENTAGE' OR (target_value <= 100 AND current_value <= 100)
    ),
    CONSTRAINT boolean_range CHECK (
        type != 'BOOLEAN' OR (target_value = 1 AND current_value IN (0, 1))
    )
);

-- 任务表
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    priority priority_level NOT NULL DEFAULT 'MEDIUM',
    status task_status NOT NULL DEFAULT 'TODO',
    due_date TIMESTAMP WITH TIME ZONE,
    estimated_duration INTEGER, -- 分钟
    actual_duration INTEGER, -- 分钟
    tags TEXT[], -- PostgreSQL 数组类型
    completed_at TIMESTAMP WITH TIME ZONE,
    key_result_id UUID NOT NULL REFERENCES key_results(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- 约束
    CONSTRAINT title_length CHECK (length(trim(title)) >= 3),
    CONSTRAINT duration_positive CHECK (
        (estimated_duration IS NULL OR estimated_duration > 0) AND
        (actual_duration IS NULL OR actual_duration > 0)
    ),
    CONSTRAINT completed_consistency CHECK (
        (status = 'COMPLETED' AND completed_at IS NOT NULL) OR
        (status != 'COMPLETED' AND completed_at IS NULL)
    )
);

-- 任务依赖关系表（多对多关系）
CREATE TABLE task_dependencies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    depends_on_task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- 约束
    CONSTRAINT no_self_dependency CHECK (task_id != depends_on_task_id),
    CONSTRAINT unique_dependency UNIQUE (task_id, depends_on_task_id)
);

-- 索引优化
-- 用户表索引
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at);

-- 目标表索引
CREATE INDEX idx_objectives_user_id ON objectives(user_id);
CREATE INDEX idx_objectives_status ON objectives(status);
CREATE INDEX idx_objectives_category ON objectives(category);
CREATE INDEX idx_objectives_priority ON objectives(priority);
CREATE INDEX idx_objectives_target_date ON objectives(target_date);
CREATE INDEX idx_objectives_created_at ON objectives(created_at);
-- 复合索引
CREATE INDEX idx_objectives_user_status ON objectives(user_id, status);
CREATE INDEX idx_objectives_user_category ON objectives(user_id, category);

-- 关键结果表索引
CREATE INDEX idx_key_results_objective_id ON key_results(objective_id);
CREATE INDEX idx_key_results_status ON key_results(status);
CREATE INDEX idx_key_results_type ON key_results(type);
CREATE INDEX idx_key_results_due_date ON key_results(due_date);
CREATE INDEX idx_key_results_created_at ON key_results(created_at);
-- 复合索引
CREATE INDEX idx_key_results_objective_status ON key_results(objective_id, status);

-- 任务表索引
CREATE INDEX idx_tasks_key_result_id ON tasks(key_result_id);
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_priority ON tasks(priority);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_created_at ON tasks(created_at);
-- 复合索引
CREATE INDEX idx_tasks_user_status ON tasks(user_id, status);
CREATE INDEX idx_tasks_key_result_status ON tasks(key_result_id, status);
-- GIN 索引用于标签搜索
CREATE INDEX idx_tasks_tags ON tasks USING GIN(tags);

-- 任务依赖关系表索引
CREATE INDEX idx_task_dependencies_task_id ON task_dependencies(task_id);
CREATE INDEX idx_task_dependencies_depends_on ON task_dependencies(depends_on_task_id);

-- 全文搜索索引
CREATE INDEX idx_objectives_title_search ON objectives USING GIN(to_tsvector('english', title));
CREATE INDEX idx_key_results_title_search ON key_results USING GIN(to_tsvector('english', title));
CREATE INDEX idx_tasks_title_search ON tasks USING GIN(to_tsvector('english', title));

-- 触发器函数：自动更新 updated_at 字段
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 应用触发器到所有表
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_objectives_updated_at BEFORE UPDATE ON objectives
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_key_results_updated_at BEFORE UPDATE ON key_results
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 触发器函数：自动更新目标进度
CREATE OR REPLACE FUNCTION update_objective_progress()
RETURNS TRIGGER AS $$
DECLARE
    total_key_results INTEGER;
    completed_key_results INTEGER;
    new_progress INTEGER;
BEGIN
    -- 获取目标下的关键结果统计
    SELECT 
        COUNT(*),
        COUNT(*) FILTER (WHERE status = 'COMPLETED')
    INTO total_key_results, completed_key_results
    FROM key_results 
    WHERE objective_id = COALESCE(NEW.objective_id, OLD.objective_id);
    
    -- 计算新的进度
    IF total_key_results > 0 THEN
        new_progress := ROUND((completed_key_results::DECIMAL / total_key_results) * 100);
    ELSE
        new_progress := 0;
    END IF;
    
    -- 更新目标的进度
    UPDATE objectives 
    SET progress = new_progress,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = COALESCE(NEW.objective_id, OLD.objective_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- 应用进度更新触发器
CREATE TRIGGER update_objective_progress_on_key_result_change
    AFTER INSERT OR UPDATE OR DELETE ON key_results
    FOR EACH ROW EXECUTE FUNCTION update_objective_progress();

-- 触发器函数：自动更新关键结果状态
CREATE OR REPLACE FUNCTION update_key_result_status()
RETURNS TRIGGER AS $$
BEGIN
    -- 根据当前值自动更新状态
    IF NEW.current_value = 0 THEN
        NEW.status := 'NOT_STARTED';
    ELSIF NEW.current_value >= NEW.target_value THEN
        NEW.status := 'COMPLETED';
        NEW.completed_at := CURRENT_TIMESTAMP;
    ELSE
        NEW.status := 'IN_PROGRESS';
        NEW.completed_at := NULL;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 应用状态更新触发器
CREATE TRIGGER update_key_result_status_on_value_change
    BEFORE UPDATE OF current_value ON key_results
    FOR EACH ROW EXECUTE FUNCTION update_key_result_status();

-- 触发器函数：防止循环依赖
CREATE OR REPLACE FUNCTION check_task_dependency_cycle()
RETURNS TRIGGER AS $$
BEGIN
    -- 使用递归CTE检查是否会形成循环依赖
    WITH RECURSIVE dependency_chain AS (
        -- 初始节点：新添加的依赖关系
        SELECT NEW.task_id as current_task, NEW.depends_on_task_id as depends_on, 1 as depth
        
        UNION ALL
        
        -- 递归部分：查找更深层的依赖
        SELECT dc.current_task, td.depends_on_task_id, dc.depth + 1
        FROM dependency_chain dc
        JOIN task_dependencies td ON dc.depends_on = td.task_id
        WHERE dc.depth < 10 -- 防止无限递归
    )
    SELECT 1 FROM dependency_chain 
    WHERE depends_on = NEW.task_id
    LIMIT 1;
    
    -- 如果找到循环依赖，抛出错误
    IF FOUND THEN
        RAISE EXCEPTION '不能创建循环依赖关系';
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 应用循环依赖检查触发器
CREATE TRIGGER check_task_dependency_cycle_trigger
    BEFORE INSERT ON task_dependencies
    FOR EACH ROW EXECUTE FUNCTION check_task_dependency_cycle();

-- 创建视图：目标完整信息
CREATE VIEW objectives_with_stats AS
SELECT 
    o.*,
    COALESCE(kr_stats.total_key_results, 0) as total_key_results,
    COALESCE(kr_stats.completed_key_results, 0) as completed_key_results,
    COALESCE(task_stats.total_tasks, 0) as total_tasks,
    COALESCE(task_stats.completed_tasks, 0) as completed_tasks,
    u.name as user_name,
    u.email as user_email
FROM objectives o
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

-- 创建视图：关键结果完整信息
CREATE VIEW key_results_with_stats AS
SELECT 
    kr.*,
    o.title as objective_title,
    o.user_id,
    COALESCE(task_stats.total_tasks, 0) as total_tasks,
    COALESCE(task_stats.completed_tasks, 0) as completed_tasks,
    -- 计算完成百分比
    CASE 
        WHEN kr.type = 'BOOLEAN' THEN 
            CASE WHEN kr.current_value > 0 THEN 100 ELSE 0 END
        WHEN kr.type = 'PERCENTAGE' THEN 
            LEAST(kr.current_value, 100)
        ELSE 
            CASE WHEN kr.target_value = 0 THEN 0 
                 ELSE LEAST((kr.current_value / kr.target_value) * 100, 100) 
            END
    END as completion_percentage
FROM key_results kr
LEFT JOIN objectives o ON kr.objective_id = o.id
LEFT JOIN (
    SELECT 
        key_result_id,
        COUNT(*) as total_tasks,
        COUNT(*) FILTER (WHERE status = 'COMPLETED') as completed_tasks
    FROM tasks
    GROUP BY key_result_id
) task_stats ON kr.id = task_stats.key_result_id;

-- 创建视图：任务完整信息
CREATE VIEW tasks_with_details AS
SELECT 
    t.*,
    kr.title as key_result_title,
    kr.objective_id,
    o.title as objective_title,
    o.category as objective_category,
    u.name as user_name,
    u.email as user_email,
    -- 计算是否逾期
    CASE 
        WHEN t.due_date IS NOT NULL 
             AND t.due_date < CURRENT_TIMESTAMP 
             AND t.status != 'COMPLETED' 
        THEN TRUE 
        ELSE FALSE 
    END as is_overdue,
    -- 计算剩余天数
    CASE 
        WHEN t.due_date IS NOT NULL AND t.status != 'COMPLETED'
        THEN EXTRACT(DAYS FROM (t.due_date - CURRENT_TIMESTAMP))::INTEGER
        ELSE NULL
    END as days_remaining
FROM tasks t
LEFT JOIN key_results kr ON t.key_result_id = kr.id
LEFT JOIN objectives o ON kr.objective_id = o.id
LEFT JOIN users u ON t.user_id = u.id;

-- 添加注释
COMMENT ON TABLE users IS '用户表：存储用户认证和基本信息';
COMMENT ON TABLE objectives IS '目标表：存储用户的主要目标';
COMMENT ON TABLE key_results IS '关键结果表：存储目标的可量化结果指标';
COMMENT ON TABLE tasks IS '任务表：存储具体的执行任务';
COMMENT ON TABLE task_dependencies IS '任务依赖关系表：管理任务之间的依赖关系';

COMMENT ON COLUMN objectives.progress IS '目标完成进度(0-100)，由关键结果自动计算';
COMMENT ON COLUMN key_results.target_value IS '目标值：数值型为具体数字，百分比型为0-100，布尔型为1';
COMMENT ON COLUMN key_results.current_value IS '当前值：数值型为当前数字，百分比型为0-100，布尔型为0或1';
COMMENT ON COLUMN tasks.estimated_duration IS '预估时长（分钟）';
COMMENT ON COLUMN tasks.actual_duration IS '实际时长（分钟）';
COMMENT ON COLUMN tasks.tags IS '任务标签数组'; 