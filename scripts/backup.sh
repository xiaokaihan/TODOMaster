#!/bin/bash

# TODOMaster 数据库备份脚本
set -e

# 配置
BACKUP_DIR="/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/todomaster_backup_${TIMESTAMP}.sql"
RETENTION_DAYS=7

# 创建备份目录
mkdir -p ${BACKUP_DIR}

echo "🗄️ 开始数据库备份..."
echo "📅 时间: $(date)"
echo "📁 备份文件: ${BACKUP_FILE}"

# 执行备份
pg_dump -h ${PGHOST} -U ${PGUSER} -d ${PGDATABASE} --verbose --no-password > ${BACKUP_FILE}

# 压缩备份文件
echo "🗜️ 压缩备份文件..."
gzip ${BACKUP_FILE}

# 删除旧备份
echo "🧹 清理旧备份文件..."
find ${BACKUP_DIR} -name "*.sql.gz" -type f -mtime +${RETENTION_DAYS} -delete

echo "✅ 备份完成!"
echo "📊 备份统计:"
ls -lh ${BACKUP_DIR}/*.gz | tail -5