#!/usr/bin/env python3
"""
TODOMaster API 测试服务器启动脚本
使用方法: python3 start-test-server.py
"""

import http.server
import socketserver
import webbrowser
import os

PORT = 8080

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=os.getcwd(), **kwargs)

def start_server():
    print(f"🚀 启动测试服务器...")
    print(f"📡 端口: {PORT}")
    
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        server_url = f"http://localhost:{PORT}/test-server.html"
        
        print(f"✅ 服务器启动成功!")
        print(f"🌐 测试页面: {server_url}")
        print(f"📖 使用说明:")
        print(f"   1. 浏览器将自动打开测试页面")
        print(f"   2. 点击各种测试按钮验证API功能")
        print(f"   3. 按 Ctrl+C 停止服务器")
        print("")
        
        # 自动打开浏览器
        try:
            webbrowser.open(server_url)
        except:
            print("⚠️  无法自动打开浏览器，请手动访问上述链接")
        
        print("服务器运行中...")
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n\n👋 服务器已停止")

if __name__ == "__main__":
    start_server() 