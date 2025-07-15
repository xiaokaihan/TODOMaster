-- TODOMaster 生产环境数据库初始化脚本
-- 该脚本在容器启动时自动执行

-- 创建专用用户（如果不存在）
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'todomaster_user') THEN
        CREATE ROLE todomaster_user WITH LOGIN PASSWORD 'your_secure_db_password_here';
    END IF;
END
$$;

-- 授权
GRANT ALL PRIVILEGES ON DATABASE todomaster_prod TO todomaster_user;

-- 设置数据库参数优化
ALTER DATABASE todomaster_prod SET shared_preload_libraries = 'pg_stat_statements';
ALTER DATABASE todomaster_prod SET log_statement = 'mod';
ALTER DATABASE todomaster_prod SET log_min_duration_statement = 1000;
ALTER DATABASE todomaster_prod SET log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h ';

-- 创建监控用户（用于健康检查）
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'monitor') THEN
        CREATE ROLE monitor WITH LOGIN PASSWORD 'monitor_password_here';
    END IF;
END
$$;

GRANT CONNECT ON DATABASE todomaster_prod TO monitor;
GRANT USAGE ON SCHEMA public TO monitor;