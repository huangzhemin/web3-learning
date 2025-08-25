const BlockchainScanner = require('../src/BlockchainScanner');
const TransactionAnalyzer = require('../src/TransactionAnalyzer');

// 模拟测试环境
process.env.ETHEREUM_RPC_URL = 'https://mainnet.infura.io/v3/test';
process.env.ETHEREUM_WS_URL = 'wss://mainnet.infura.io/ws/v3/test';

async function runTests() {
    console.log('🧪 开始运行扫链器测试...\n');
    
    try {
        // 测试区块链扫描器
        console.log('📡 测试区块链扫描器...');
        const scanner = new BlockchainScanner();
        
        // 等待初始化完成
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // 测试网络信息
        const networkInfo = scanner.getNetworkInfo();
        console.log('✅ 网络信息:', networkInfo);
        
        // 测试获取区块信息（使用一个已知的区块）
        try {
            const blockInfo = await scanner.getBlockInfo(18000000);
            console.log('✅ 区块信息获取成功:', {
                number: blockInfo.number,
                hash: blockInfo.hash.substring(0, 20) + '...',
                transactions: blockInfo.transactions
            });
        } catch (error) {
            console.log('⚠️  区块信息获取失败（可能是网络问题）:', error.message);
        }
        
        // 测试获取地址信息（使用一个已知的地址）
        try {
            const addressInfo = await scanner.getAddressInfo('0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6');
            console.log('✅ 地址信息获取成功:', {
                address: addressInfo.address,
                balance: addressInfo.balance + ' ETH',
                nonce: addressInfo.nonce
            });
        } catch (error) {
            console.log('⚠️  地址信息获取失败（可能是网络问题）:', error.message);
        }
        
        // 测试交易分析器
        console.log('\n🔍 测试交易分析器...');
        const analyzer = new TransactionAnalyzer();
        
        // 模拟交易数据
        const mockTransaction = {
            hash: '0x1234567890abcdef1234567890abcdef12345678',
            from: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
            to: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
            value: '1000000000000000000', // 1 ETH
            input: '0x',
            gas: 21000,
            gasPrice: '20000000000', // 20 Gwei
            nonce: 0,
            blockNumber: 18000000
        };
        
        // 分析交易
        const analysis = await analyzer.analyzeTransactionPattern(mockTransaction);
        console.log('✅ 交易分析成功:', {
            hash: analysis.hash.substring(0, 20) + '...',
            riskLevel: analysis.riskLevel,
            patterns: analysis.patterns,
            warnings: analysis.warnings
        });
        
        // 测试统计信息
        const stats = analyzer.getAnalysisStats();
        console.log('✅ 分析统计:', stats);
        
        console.log('\n🎉 所有测试完成！');
        
    } catch (error) {
        console.error('❌ 测试过程中出现错误:', error);
    }
}

// 运行测试
if (require.main === module) {
    runTests().catch(console.error);
}

module.exports = { runTests }; 