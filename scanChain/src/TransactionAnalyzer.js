const Web3 = require('web3');

class TransactionAnalyzer {
  constructor() {
    this.web3 = null;
    this.suspiciousPatterns = new Map();
    this.whitelistAddresses = new Set();
    this.blacklistAddresses = new Set();
    
    this.initWeb3();
  }
  
  async initWeb3() {
    try {
      const rpcUrl = process.env.ETHEREUM_RPC_URL || 'https://mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID';
      this.web3 = new Web3(new Web3.providers.HttpProvider(rpcUrl));
    } catch (error) {
      console.error('初始化交易分析器失败:', error);
    }
  }
  
  // 分析交易模式
  async analyzeTransactionPattern(tx) {
    const analysis = {
      hash: tx.hash,
      riskLevel: 'low',
      patterns: [],
      warnings: [],
      timestamp: new Date().toISOString()
    };
    
    try {
      // 检查大额转账
      if (this.isLargeTransfer(tx)) {
        analysis.patterns.push('large_transfer');
        analysis.riskLevel = this.calculateRiskLevel(analysis.riskLevel, 'medium');
        analysis.warnings.push('检测到大额转账');
      }
      
      // 检查合约交互
      if (this.isContractInteraction(tx)) {
        analysis.patterns.push('contract_interaction');
        analysis.riskLevel = this.calculateRiskLevel(analysis.riskLevel, 'medium');
        analysis.warnings.push('检测到智能合约交互');
      }
      
      // 检查可疑地址
      if (await this.isSuspiciousAddress(tx.from) || await this.isSuspiciousAddress(tx.to)) {
        analysis.patterns.push('suspicious_address');
        analysis.riskLevel = this.calculateRiskLevel(analysis.riskLevel, 'high');
        analysis.warnings.push('检测到可疑地址');
      }
      
      // 检查异常 Gas 价格
      if (this.isAbnormalGasPrice(tx)) {
        analysis.patterns.push('abnormal_gas_price');
        analysis.riskLevel = this.calculateRiskLevel(analysis.riskLevel, 'medium');
        analysis.warnings.push('检测到异常 Gas 价格');
      }
      
      // 检查频繁交易
      if (await this.isFrequentTransaction(tx.from)) {
        analysis.patterns.push('frequent_transaction');
        analysis.riskLevel = this.calculateRiskLevel(analysis.riskLevel, 'medium');
        analysis.warnings.push('检测到频繁交易');
      }
      
      // 检查洗钱模式
      if (await this.isMoneyLaunderingPattern(tx)) {
        analysis.patterns.push('money_laundering_suspicion');
        analysis.riskLevel = this.calculateRiskLevel(analysis.riskLevel, 'high');
        analysis.warnings.push('检测到疑似洗钱模式');
      }
      
      // 检查 MEV 机器人活动
      if (await this.isMEVBotActivity(tx)) {
        analysis.patterns.push('mev_bot_activity');
        analysis.riskLevel = this.calculateRiskLevel(analysis.riskLevel, 'low');
        analysis.warnings.push('检测到 MEV 机器人活动');
      }
      
      // 检查闪电贷攻击
      if (await this.isFlashLoanAttack(tx)) {
        analysis.patterns.push('flash_loan_attack');
        analysis.riskLevel = this.calculateRiskLevel(analysis.riskLevel, 'high');
        analysis.warnings.push('检测到疑似闪电贷攻击');
      }
      
    } catch (error) {
      console.error('分析交易模式时出错:', error);
      analysis.warnings.push('分析过程中出现错误');
    }
    
    return analysis;
  }
  
  // 检查大额转账
  isLargeTransfer(tx) {
    const valueInEth = parseFloat(this.web3.utils.fromWei(tx.value, 'ether'));
    return valueInEth > 1000; // 大于 1000 ETH
  }
  
  // 检查合约交互
  isContractInteraction(tx) {
    return tx.input && tx.input !== '0x' && tx.input.length > 2;
  }
  
  // 检查可疑地址
  async isSuspiciousAddress(address) {
    // 这里可以集成各种黑名单服务
    // 例如：已知的诈骗地址、黑客地址等
    
    if (this.blacklistAddresses.has(address.toLowerCase())) {
      return true;
    }
    
    // 检查地址是否为新创建的（低 nonce）
    try {
      const nonce = await this.web3.eth.getTransactionCount(address);
      if (nonce < 5) {
        return true; // 新地址，可能可疑
      }
    } catch (error) {
      console.error('检查地址 nonce 失败:', error);
    }
    
    return false;
  }
  
  // 检查异常 Gas 价格
  isAbnormalGasPrice(tx) {
    const gasPriceInGwei = parseFloat(this.web3.utils.fromWei(tx.gasPrice, 'gwei'));
    
    // Gas 价格过高或过低都可能异常
    return gasPriceInGwei > 500 || gasPriceInGwei < 1;
  }
  
  // 检查频繁交易
  async isFrequentTransaction(address) {
    // 这里可以检查地址在短时间内是否进行了大量交易
    // 为了演示，我们返回 false
    return false;
  }
  
  // 检查洗钱模式
  async isMoneyLaunderingPattern(tx) {
    // 检查是否涉及已知的洗钱服务
    // 例如：Tornado Cash、Mixers 等
    
    const knownMixers = [
      '0x722122df12d4e14e13ac3b6895a86e84145b6967', // Tornado Cash
      '0xdd4c48c0b24039969fc16d1cdf626eab821d3384', // Tornado Cash
      '0xd90e2f925da726b50c4ed8d0fb90ad053324f31b'  // Tornado Cash
    ];
    
    return knownMixers.includes(tx.to?.toLowerCase());
  }
  
  // 检查 MEV 机器人活动
  async isMEVBotActivity(tx) {
    // MEV 机器人通常具有以下特征：
    // 1. 高 Gas 价格
    // 2. 复杂的合约交互
    // 3. 在区块末尾执行
    
    const gasPriceInGwei = parseFloat(this.web3.utils.fromWei(tx.gasPrice, 'gwei'));
    const isComplexInteraction = tx.input && tx.input.length > 100;
    
    return gasPriceInGwei > 100 && isComplexInteraction;
  }
  
  // 检查闪电贷攻击
  async isFlashLoanAttack(tx) {
    // 闪电贷攻击通常涉及：
    // 1. 从多个协议借入大量资金
    // 2. 进行套利或攻击
    // 3. 在同一区块内归还资金
    
    // 这里需要更复杂的逻辑来检测
    // 为了演示，我们返回 false
    return false;
  }
  
  // 计算风险等级
  calculateRiskLevel(currentLevel, newLevel) {
    const levels = ['low', 'medium', 'high', 'critical'];
    const currentIndex = levels.indexOf(currentLevel);
    const newIndex = levels.indexOf(newLevel);
    
    return levels[Math.max(currentIndex, newIndex)];
  }
  
  // 添加黑名单地址
  addBlacklistAddress(address) {
    this.blacklistAddresses.add(address.toLowerCase());
  }
  
  // 移除黑名单地址
  removeBlacklistAddress(address) {
    this.blacklistAddresses.delete(address.toLowerCase());
  }
  
  // 添加白名单地址
  addWhitelistAddress(address) {
    this.whitelistAddresses.add(address.toLowerCase());
  }
  
  // 移除白名单地址
  removeWhitelistAddress(address) {
    this.whitelistAddresses.delete(address.toLowerCase());
  }
  
  // 获取分析统计
  getAnalysisStats() {
    return {
      totalAnalyzed: this.suspiciousPatterns.size,
      blacklistCount: this.blacklistAddresses.size,
      whitelistCount: this.whitelistAddresses.size,
      timestamp: new Date().toISOString()
    };
  }
  
  // 清理旧的分析数据
  cleanupOldAnalysis(maxAge = 24 * 60 * 60 * 1000) { // 默认 24 小时
    const now = Date.now();
    const cutoff = now - maxAge;
    
    for (const [hash, analysis] of this.suspiciousPatterns.entries()) {
      const analysisTime = new Date(analysis.timestamp).getTime();
      if (analysisTime < cutoff) {
        this.suspiciousPatterns.delete(hash);
      }
    }
    
    console.log('🧹 已清理旧的分析数据');
  }
}

module.exports = TransactionAnalyzer; 