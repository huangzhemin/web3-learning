const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const BlockchainScanner = require('./src/BlockchainScanner');
const TransactionAnalyzer = require('./src/TransactionAnalyzer');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// 初始化扫链器
const scanner = new BlockchainScanner();
const analyzer = new TransactionAnalyzer();

// WebSocket 连接处理
io.on('connection', (socket) => {
  console.log('客户端已连接:', socket.id);
  
  // 开始实时扫描
  socket.on('startScanning', () => {
    scanner.startRealTimeScanning(socket);
  });
  
  // 停止扫描
  socket.on('stopScanning', () => {
    scanner.stopRealTimeScanning();
  });
  
  // 扫描特定地址
  socket.on('scanAddress', (address) => {
    scanner.scanAddress(address, socket);
  });
  
  // 扫描特定区块
  socket.on('scanBlock', (blockNumber) => {
    scanner.scanBlock(blockNumber, socket);
  });
  
  // 断开连接
  socket.on('disconnect', () => {
    console.log('客户端已断开:', socket.id);
  });
});

// API 路由
app.get('/api/status', (req, res) => {
  res.json({
    status: 'running',
    timestamp: new Date().toISOString(),
    network: scanner.getNetworkInfo()
  });
});

app.get('/api/block/:blockNumber', async (req, res) => {
  try {
    const blockNumber = req.params.blockNumber;
    const blockInfo = await scanner.getBlockInfo(blockNumber);
    res.json(blockInfo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/address/:address', async (req, res) => {
  try {
    const address = req.params.address;
    const addressInfo = await scanner.getAddressInfo(address);
    res.json(addressInfo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/transactions', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const transactions = await scanner.getRecentTransactions(parseInt(page), parseInt(limit));
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 启动服务器
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 扫链服务器已启动，端口: ${PORT}`);
  console.log(`📱 访问 http://localhost:${PORT} 查看 Web 界面`);
  console.log(`🔗 WebSocket 连接: ws://localhost:${PORT}`);
});

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\n🛑 正在关闭服务器...');
  scanner.stopRealTimeScanning();
  server.close(() => {
    console.log('✅ 服务器已关闭');
    process.exit(0);
  });
}); 