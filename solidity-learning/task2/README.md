# NFT 铸造项目

这是一个完整的 NFT 铸造项目，包含智能合约、部署脚本和元数据。

## 项目结构

```
task2/
├── MyNFT.sol              # NFT 智能合约
├── metadata.json          # NFT 元数据（已上传到 IPFS）
├── hardhat.config.js      # Hardhat 配置
├── package.json           # 项目依赖
├── scripts/
│   └── deploy.js         # 部署脚本
└── README.md             # 项目说明
```

## 准备工作

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

创建 `.env` 文件并配置以下变量：

```bash
# 你的私钥（不要分享给任何人）
# 从 MetaMask 导出：设置 -> 安全和隐私 -> 显示私钥
PRIVATE_KEY=0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef

# Infura 项目 ID（从 https://infura.io/ 获取）
# 注册账户后创建新项目，复制项目 ID
SEPOLIA_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID_HERE
GOERLI_URL=https://goerli.infura.io/v3/YOUR_PROJECT_ID_HERE

# Etherscan API Key（从 https://etherscan.io/ 获取）
# 用于验证合约代码
ETHERSCAN_API_KEY=YOUR_ETHERSCAN_API_KEY_HERE

# 可选：Alchemy API Key（替代 Infura）
# SEPOLIA_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
# GOERLI_URL=https://eth-goerli.g.alchemy.com/v2/YOUR_API_KEY
```

⚠️ **重要安全提醒：**
- 永远不要将 `.env` 文件提交到 Git
- 不要分享你的私钥给任何人
- 使用测试网账户，不要使用主网资金

### 3. 获取测试网 ETH

- **Sepolia**: 使用 [Sepolia Faucet](https://sepoliafaucet.com/)
- **Goerli**: 使用 [Goerli Faucet](https://goerlifaucet.com/)

## 部署步骤

### 1. 编译合约

```bash
npm run compile
```

### 2. 部署到测试网

**部署到 Sepolia:**
```bash
npm run deploy:sepolia
```

**部署到 Goerli:**
```bash
npm run deploy:goerli
```

### 3. 铸造 NFT

部署脚本会自动铸造第一个 NFT，使用以下元数据：

- **名称**: My First NFT
- **描述**: 这是我的第一个图文NFT示例
- **图片**: ipfs://bafybeifcp7bt6e2gnqpi6smeeswk7s2lhfkyupc6g63jdqfuiv4yv5epqm/patrickhuang.png
- **元数据**: ipfs://bafkreie7hbbfibqquihgttbn3ld7d77gxblzoysfkmlztrspqrk26dhabq/metadata.json

## 查看 NFT

### 1. Etherscan
- 访问 [Sepolia Etherscan](https://sepolia.etherscan.io/) 或 [Goerli Etherscan](https://goerli.etherscan.io/)
- 输入你的钱包地址查看 NFT

### 2. OpenSea 测试网
- 访问 [OpenSea Testnets](https://testnets.opensea.io/)
- 连接你的钱包查看 NFT

## 合约功能

- **构造函数**: 设置 NFT 名称和符号
- **mintNFT**: 铸造新的 NFT（仅合约所有者可调用）
- **tokenCounter**: 当前铸造的 NFT 数量
- **owner**: 合约所有者地址

## 注意事项

1. 确保你的 MetaMask 连接到正确的测试网
2. 保存好合约地址和交易哈希
3. 不要分享你的私钥
4. 测试网上的交易可能需要几分钟确认

## 故障排除

如果遇到问题，请检查：
- 环境变量是否正确配置
- 钱包是否有足够的测试网 ETH
- 网络连接是否正常
- 私钥格式是否正确 