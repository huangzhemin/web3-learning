#!/bin/bash

echo "🚀 启动区块链扫链演示项目..."

# 检查 Node.js 是否安装
if ! command -v node &> /dev/null; then
    echo "❌ 错误: 未找到 Node.js，请先安装 Node.js 16.0 或更高版本"
    exit 1
fi

# 检查 npm 是否安装
if ! command -v npm &> /dev/null; then
    echo "❌ 错误: 未找到 npm，请先安装 npm"
    exit 1
fi

# 检查 .env 文件是否存在
if [ ! -f .env ]; then
    echo "⚠️  警告: 未找到 .env 文件，将使用默认配置"
    echo "💡 提示: 请复制 env.example 为 .env 并配置您的以太坊节点信息"
    echo ""
fi

# 安装依赖
echo "📦 安装项目依赖..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ 依赖安装失败，请检查网络连接或 npm 配置"
    exit 1
fi

echo "✅ 依赖安装完成"

# 启动应用
echo "🚀 启动应用..."
echo "📱 应用将在 http://localhost:3000 启动"
echo "🔗 WebSocket 连接: ws://localhost:3000"
echo ""
echo "按 Ctrl+C 停止应用"
echo ""

npm start 