#!/bin/bash

# TODOMaster 数据库恢复脚本
set -e

# 检查参数
if [ $# -eq 0 ]; then
    echo "❌ 错误: 请提供备份文件路径"
    echo "📖 用法: $0 <backup_file.sql.gz>"
    echo "📁 可用备份文件:"
    ls -la /backups/*.sql.gz 2>/dev/null || echo "   没有找到备份文件"
    exit 1
fi

BACKUP_FILE=$1
BACKUP_DIR="/backups"

# 检查备份文件是否存在
if [ ! -f "${BACKUP_DIR}/${BACKUP_FILE}" ]; then
    echo "❌ 错误: 备份文件不存在: ${BACKUP_DIR}/${BACKUP_FILE}"
    exit 1
fi

echo "🔄 开始数据库恢复..."
echo "📅 时间: $(date)"
echo "📁 备份文件: ${BACKUP_DIR}/${BACKUP_FILE}"

# 确认操作
read -p "⚠️  警告: 这将覆盖现有数据库。是否继续? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    echo "❌ 恢复操作已取消"
    exit 1
fi

# 停止应用连接（可选）
echo "🛑 建议在恢复前停止应用服务..."

# 解压并恢复
echo "📦 解压备份文件..."
gunzip -c "${BACKUP_DIR}/${BACKUP_FILE}" > /tmp/restore.sql

echo "🗄️ 执行数据库恢复..."
psql -h ${PGHOST} -U ${PGUSER} -d ${PGDATABASE} -f /tmp/restore.sql

# 清理临时文件
rm -f /tmp/restore.sql

echo "✅ 数据库恢复完成!"
echo "🔄 请重启应用服务"