const Web3 = require('web3');
const EventEmitter = require('events');

class BlockchainScanner extends EventEmitter {
  constructor() {
    super();
    
    // 初始化 Web3
    this.web3 = null;
    this.wsWeb3 = null; // 重命名为更清晰的名称
    this.isScanning = false;
    this.scanInterval = null;
    this.lastBlockNumber = 0;
    this.transactionCache = new Map();
    this.addressCache = new Map();
    
    this.initWeb3();
  }
  
  async initWeb3() {
    try {
      // 使用环境变量或默认值
      const rpcUrl = process.env.ETHEREUM_RPC_URL || 'https://mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID';
      const wsUrl = process.env.ETHEREUM_WS_URL || 'wss://mainnet.infura.io/ws/v3/YOUR_INFURA_PROJECT_ID';
      
      // 初始化 HTTP 提供者 (用于 RPC 调用)
      this.web3 = new Web3(new Web3.providers.HttpProvider(rpcUrl));
      
      // 初始化 WebSocket 提供者 (用于实时订阅)
      this.wsWeb3 = new Web3(new Web3.providers.WebsocketProvider(wsUrl));
      
      // 测试 HTTP 连接
      const isListening = await this.web3.eth.net.isListening();
      if (isListening) {
        console.log('✅ 已连接到以太坊网络');
        this.lastBlockNumber = await this.web3.eth.getBlockNumber();
        console.log(`📦 当前区块高度: ${this.lastBlockNumber}`);
      } else {
        throw new Error('无法连接到以太坊网络');
      }
      
      // 测试 WebSocket 连接
      const wsIsListening = await this.wsWeb3.eth.net.isListening();
      if (wsIsListening) {
        console.log('🔗 WebSocket 连接已建立');
      } else {
        console.warn('⚠️  WebSocket 连接失败，将使用轮询模式');
      }
      
      // 监听 WebSocket 连接状态
      if (this.wsWeb3.currentProvider) {
        this.wsWeb3.currentProvider.on('connect', () => {
          console.log('🔗 WebSocket 连接已建立');
        });
        
        this.wsWeb3.currentProvider.on('error', (error) => {
          console.error('❌ WebSocket 错误:', error);
        });
        
        this.wsWeb3.currentProvider.on('end', () => {
          console.log('🔌 WebSocket 连接已断开');
        });
      }
      
    } catch (error) {
      console.error('❌ 初始化 Web3 失败:', error.message);
      // 不抛出错误，让应用继续运行
    }
  }
  
  // 开始实时扫描
  startRealTimeScanning(socket) {
    if (this.isScanning) {
      socket.emit('scanStatus', { status: 'already_scanning' });
      return;
    }
    
    if (!this.web3) {
      socket.emit('scanStatus', { status: 'not_connected', message: 'Web3 未初始化' });
      return;
    }
    
    this.isScanning = true;
    socket.emit('scanStatus', { status: 'started' });
    
    console.log('🚀 开始实时扫描区块链...');
    
    // 使用轮询模式监听新区块（更稳定）
    this.scanInterval = setInterval(async () => {
      try {
        const currentBlock = await this.web3.eth.getBlockNumber();
        if (currentBlock > this.lastBlockNumber) {
          await this.processNewBlock(currentBlock, socket);
          this.lastBlockNumber = currentBlock;
        }
      } catch (error) {
        console.error('轮询新区块时出错:', error);
      }
    }, 1000); // 每秒检查一次
    
    // 如果 WebSocket 可用，也尝试订阅
    if (this.wsWeb3 && this.wsWeb3.currentProvider) {
      try {
        this.wsWeb3.eth.subscribe('newBlockHeaders', (error, result) => {
          if (error) {
            console.error('订阅新区块失败:', error);
          }
        });
      } catch (error) {
        console.log('WebSocket 订阅失败，使用轮询模式:', error.message);
      }
    }
  }
  
  // 停止实时扫描
  stopRealTimeScanning() {
    this.isScanning = false;
    if (this.scanInterval) {
      clearInterval(this.scanInterval);
      this.scanInterval = null;
    }
    console.log('🛑 已停止实时扫描');
  }
  
  // 处理新区块
  async processNewBlock(blockNumber, socket) {
    try {
      console.log(`📦 发现新区块: ${blockNumber}`);
      
      const block = await this.web3.eth.getBlock(blockNumber, true);
      if (!block) return;
      
      const blockInfo = {
        number: block.number,
        hash: block.hash,
        timestamp: new Date(block.timestamp * 1000).toISOString(),
        transactions: block.transactions.length,
        gasUsed: block.gasUsed,
        gasLimit: block.gasLimit,
        miner: block.miner,
        difficulty: block.difficulty,
        totalDifficulty: block.totalDifficulty
      };
      
      // 发送区块信息到客户端
      socket.emit('newBlock', blockInfo);
      
      // 处理区块中的交易
      if (block.transactions.length > 0) {
        await this.processBlockTransactions(block.transactions, socket);
      }
      
    } catch (error) {
      console.error(`处理区块 ${blockNumber} 时出错:`, error);
    }
  }
  
  // 处理区块交易
  async processBlockTransactions(transactions, socket) {
    for (const tx of transactions) {
      try {
        const txInfo = {
          hash: tx.hash,
          from: tx.from,
          to: tx.to,
          value: this.web3.utils.fromWei(tx.value, 'ether'),
          gas: tx.gas,
          gasPrice: this.web3.utils.fromWei(tx.gasPrice, 'gwei'),
          nonce: tx.nonce,
          blockNumber: tx.blockNumber,
          timestamp: new Date().toISOString()
        };
        
        // 缓存交易信息
        this.transactionCache.set(tx.hash, txInfo);
        
        // 发送交易信息到客户端
        socket.emit('newTransaction', txInfo);
        
        // 分析交易
        await this.analyzeTransaction(tx, socket);
        
      } catch (error) {
        console.error('处理交易时出错:', error);
      }
    }
  }
  
  // 分析交易
  async analyzeTransaction(tx, socket) {
    try {
      // 检查是否为合约调用
      if (tx.to && tx.input && tx.input !== '0x') {
        const contractInfo = {
          hash: tx.hash,
          type: 'contract_interaction',
          methodSignature: tx.input.substring(0, 10),
          inputData: tx.input,
          timestamp: new Date().toISOString()
        };
        
        socket.emit('contractInteraction', contractInfo);
      }
      
      // 检查大额转账
      const valueInEth = parseFloat(this.web3.utils.fromWei(tx.value, 'ether'));
      if (valueInEth > 100) { // 大于 100 ETH
        const largeTransfer = {
          hash: tx.hash,
          type: 'large_transfer',
          value: valueInEth,
          from: tx.from,
          to: tx.to,
          timestamp: new Date().toISOString()
        };
        
        socket.emit('largeTransfer', largeTransfer);
      }
      
    } catch (error) {
      console.error('分析交易时出错:', error);
    }
  }
  
  // 扫描特定地址
  async scanAddress(address, socket) {
    try {
      console.log(`🔍 扫描地址: ${address}`);
      
      // 获取地址余额
      const balance = await this.web3.eth.getBalance(address);
      const balanceInEth = this.web3.utils.fromWei(balance, 'ether');
      
      // 获取交易计数
      const nonce = await this.web3.eth.getTransactionCount(address);
      
      // 获取最近的交易
      const transactions = await this.getAddressTransactions(address, 10);
      
      const addressInfo = {
        address: address,
        balance: balanceInEth,
        nonce: nonce,
        transactions: transactions,
        timestamp: new Date().toISOString()
      };
      
      // 缓存地址信息
      this.addressCache.set(address, addressInfo);
      
      socket.emit('addressScanned', addressInfo);
      
    } catch (error) {
      console.error('扫描地址时出错:', error);
      socket.emit('error', { message: error.message });
    }
  }
  
  // 扫描特定区块
  async scanBlock(blockNumber, socket) {
    try {
      console.log(`🔍 扫描区块: ${blockNumber}`);
      
      const block = await this.web3.eth.getBlock(blockNumber, true);
      if (!block) {
        throw new Error('区块不存在');
      }
      
      const blockInfo = {
        number: block.number,
        hash: block.hash,
        timestamp: new Date(block.timestamp * 1000).toISOString(),
        transactions: block.transactions.length,
        gasUsed: block.gasUsed,
        gasLimit: block.gasLimit,
        miner: block.miner,
        difficulty: block.difficulty,
        totalDifficulty: block.totalDifficulty,
        transactions: block.transactions.map(tx => ({
          hash: tx.hash,
          from: tx.from,
          to: tx.to,
          value: this.web3.utils.fromWei(tx.value, 'ether'),
          gas: tx.gas,
          gasPrice: this.web3.utils.fromWei(tx.gasPrice, 'gwei')
        }))
      };
      
      socket.emit('blockScanned', blockInfo);
      
    } catch (error) {
      console.error('扫描区块时出错:', error);
      socket.emit('error', { message: error.message });
    }
  }
  
  // 获取地址交易历史
  async getAddressTransactions(address, limit = 10) {
    // 这里可以集成 Etherscan API 或其他服务来获取历史交易
    // 为了演示，我们返回空数组
    return [];
  }
  
  // 获取区块信息
  async getBlockInfo(blockNumber) {
    try {
      const block = await this.web3.eth.getBlock(blockNumber, true);
      if (!block) {
        throw new Error('区块不存在');
      }
      
      return {
        number: block.number,
        hash: block.hash,
        timestamp: new Date(block.timestamp * 1000).toISOString(),
        transactions: block.transactions.length,
        gasUsed: block.gasUsed,
        gasLimit: block.gasLimit,
        miner: block.miner,
        difficulty: block.difficulty,
        totalDifficulty: block.totalDifficulty
      };
    } catch (error) {
      throw error;
    }
  }
  
  // 获取地址信息
  async getAddressInfo(address) {
    try {
      const balance = await this.web3.eth.getBalance(address);
      const nonce = await this.web3.eth.getTransactionCount(address);
      
      return {
        address: address,
        balance: this.web3.utils.fromWei(balance, 'ether'),
        nonce: nonce,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw error;
    }
  }
  
  // 获取最近交易
  async getRecentTransactions(page = 1, limit = 20) {
    try {
      const currentBlock = await this.web3.eth.getBlockNumber();
      const transactions = [];
      
      // 从最近的区块开始扫描
      for (let i = 0; i < limit; i++) {
        const blockNumber = currentBlock - i;
        if (blockNumber < 0) break;
        
        const block = await this.web3.eth.getBlock(blockNumber, true);
        if (block && block.transactions.length > 0) {
          const blockTxs = block.transactions.slice(0, 5).map(tx => ({
            hash: tx.hash,
            from: tx.from,
            to: tx.to,
            value: this.web3.utils.fromWei(tx.value, 'ether'),
            blockNumber: tx.blockNumber,
            timestamp: new Date(block.timestamp * 1000).toISOString()
          }));
          
          transactions.push(...blockTxs);
        }
      }
      
      return transactions.slice(0, limit);
    } catch (error) {
      throw error;
    }
  }
  
  // 获取网络信息
  getNetworkInfo() {
    return {
      isConnected: this.web3 ? true : false,
      lastBlockNumber: this.lastBlockNumber,
      isScanning: this.isScanning
    };
  }
  
  // 清理缓存
  clearCache() {
    this.transactionCache.clear();
    this.addressCache.clear();
    console.log('🧹 缓存已清理');
  }
}

module.exports = BlockchainScanner; 