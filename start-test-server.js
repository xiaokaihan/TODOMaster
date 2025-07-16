#!/usr/bin/env node
/**
 * TODOMaster API 测试服务器启动脚本
 * 使用方法: node start-test-server.js
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const PORT = 8080;

// MIME 类型映射
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.wav': 'audio/wav',
  '.mp4': 'video/mp4',
  '.woff': 'application/font-woff',
  '.ttf': 'application/font-ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.otf': 'application/font-otf',
  '.wasm': 'application/wasm'
};

function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return mimeTypes[ext] || 'application/octet-stream';
}

const server = http.createServer((req, res) => {
  // 解析URL
  let filePath = req.url === '/' ? '/test-server.html' : req.url;
  filePath = path.join(__dirname, filePath);

  // 安全检查，防止目录遍历攻击
  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  // 检查文件是否存在
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      res.writeHead(404);
      res.end('File not found');
      return;
    }

    // 读取并返回文件
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(500);
        res.end('Internal server error');
        return;
      }

      const contentType = getContentType(filePath);
      res.writeHead(200, { 
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      });
      res.end(data);
    });
  });
});

function openBrowser(url) {
  const start = (process.platform === 'darwin' ? 'open' :
                 process.platform === 'win32' ? 'start' : 'xdg-open');
  
  exec(`${start} ${url}`, (error) => {
    if (error) {
      console.log('⚠️  无法自动打开浏览器，请手动访问测试页面');
    }
  });
}

server.listen(PORT, () => {
  const serverUrl = `http://localhost:${PORT}`;
  
  console.log('🚀 启动测试服务器...');
  console.log(`📡 端口: ${PORT}`);
  console.log('✅ 服务器启动成功!');
  console.log(`🌐 测试页面: ${serverUrl}`);
  console.log('📖 使用说明:');
  console.log('   1. 浏览器将自动打开测试页面');
  console.log('   2. 点击各种测试按钮验证API功能');
  console.log('   3. 按 Ctrl+C 停止服务器');
  console.log('');
  
  // 自动打开浏览器
  setTimeout(() => {
    openBrowser(serverUrl);
  }, 1000);
  
  console.log('服务器运行中...');
});

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\n\n👋 服务器已停止');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\n👋 服务器已停止');
  process.exit(0);
}); 