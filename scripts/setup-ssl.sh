#!/bin/bash

# SSL证书配置脚本 - 支持Let's Encrypt和自签名证书
set -e

# 配置变量
DOMAIN=${1:-"your-domain.com"}
SSL_DIR="./docker/ssl"
EMAIL=${2:-"admin@${DOMAIN}"}

echo "🔐 SSL证书配置脚本"
echo "📋 域名: $DOMAIN"
echo "📧 邮箱: $EMAIL"

# 创建SSL目录
mkdir -p $SSL_DIR

echo "请选择SSL证书类型:"
echo "1) Let's Encrypt (推荐用于生产环境)"
echo "2) 自签名证书 (仅用于测试)"
read -p "请输入选择 (1 或 2): " ssl_choice

case $ssl_choice in
    1)
        echo "🌐 配置Let's Encrypt证书..."
        
        # 检查certbot是否安装
        if ! command -v certbot &> /dev/null; then
            echo "📦 安装certbot..."
            if command -v apt-get &> /dev/null; then
                sudo apt-get update
                sudo apt-get install -y certbot
            elif command -v yum &> /dev/null; then
                sudo yum install -y certbot
            else
                echo "❌ 请手动安装certbot"
                exit 1
            fi
        fi
        
        # 获取证书
        echo "🔑 获取Let's Encrypt证书..."
        sudo certbot certonly --standalone \
            --email $EMAIL \
            --agree-tos \
            --no-eff-email \
            -d $DOMAIN \
            -d www.$DOMAIN
        
        # 复制证书到项目目录
        sudo cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem $SSL_DIR/
        sudo cp /etc/letsencrypt/live/$DOMAIN/privkey.pem $SSL_DIR/
        sudo chown $(whoami):$(whoami) $SSL_DIR/*.pem
        
        echo "✅ Let's Encrypt证书配置完成"
        echo "📋 证书自动续期命令: certbot renew"
        ;;
        
    2)
        echo "🔒 生成自签名证书..."
        
        # 生成私钥
        openssl genrsa -out $SSL_DIR/privkey.pem 2048
        
        # 生成证书
        openssl req -new -x509 -key $SSL_DIR/privkey.pem -out $SSL_DIR/fullchain.pem -days 365 \
            -subj "/C=CN/ST=State/L=City/O=Organization/OU=OrgUnit/CN=$DOMAIN"
        
        echo "✅ 自签名证书生成完成"
        echo "⚠️  注意: 浏览器会显示安全警告，仅用于测试"
        ;;
        
    *)
        echo "❌ 无效选择"
        exit 1
        ;;
esac

# 设置证书权限
chmod 600 $SSL_DIR/privkey.pem
chmod 644 $SSL_DIR/fullchain.pem

echo "📁 证书文件位置:"
ls -la $SSL_DIR/

echo "🔄 请更新nginx配置中的域名: $DOMAIN"
echo "📝 配置文件: nginx.prod.conf"