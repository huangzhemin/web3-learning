# NFT拍卖市场

这是一个基于Hardhat框架开发的NFT拍卖市场智能合约项目，支持使用ETH或ERC20代币参与拍卖，并实现了跨链拍卖功能。

## 功能特点

- **NFT拍卖**：支持创建、出价和结束拍卖
- **多币种支持**：支持使用ETH或任何ERC20代币参与拍卖
- **价格转换**：使用Chainlink预言机将不同代币价格转换为美元，方便比较
- **跨链拍卖**：使用Chainlink CCIP实现跨链拍卖功能
- **合约升级**：使用UUPS代理模式实现合约安全升级
- **工厂模式**：类似Uniswap V2的工厂模式管理拍卖实例
- **动态手续费**：根据拍卖金额动态调整手续费

## 项目结构

```
├── contracts/
│   ├── NFT.sol                 # ERC721 NFT合约
│   ├── NFTAuction.sol          # 拍卖合约
│   ├── AuctionFactory.sol      # 工厂合约
│   ├── PriceFeed.sol           # 价格预言机
│   ├── PriceConverter.sol      # 价格转换库
│   ├── CrossChainAuction.sol   # 跨链拍卖合约
│   ├── CCIPBidSender.sol       # CCIP出价发送者
│   └── interfaces/             # 接口定义
├── deploy/                     # 部署脚本
└── test/                       # 测试文件
```

## 技术栈

- Solidity 0.8.28
- Hardhat
- OpenZeppelin Contracts
- Chainlink Contracts (预言机和CCIP)

## 安装与设置

1. 克隆仓库

```bash
git clone <repository-url>
cd nft-auction-marketplace
```

2. 安装依赖

```bash
npm install
```

3. 编译合约

```bash
npx hardhat compile
```

4. 运行测试

```bash
npx hardhat test
```

## 部署到测试网

1. 创建`.env`文件并设置以下环境变量：

```
PRIVATE_KEY=your_private_key
SEPOLIA_RPC_URL=your_sepolia_rpc_url
```

2. 部署合约

```bash
npx hardhat deploy --network sepolia --tags all
```

## 合约说明

### NFT合约 (NFT.sol)

基于ERC721标准的NFT合约，支持铸造和转移NFT。

### 拍卖合约 (NFTAuction.sol)

核心拍卖功能实现，包括：
- 创建拍卖
- 出价（支持ETH和ERC20代币）
- 结束拍卖
- 跨链出价处理
- 动态手续费计算

### 工厂合约 (AuctionFactory.sol)

管理拍卖合约实例的工厂合约，使用UUPS代理模式实现可升级性。

### 价格预言机 (PriceFeed.sol)

使用Chainlink预言机获取ETH和ERC20代币的美元价格。

### 跨链拍卖 (CrossChainAuction.sol)

使用Chainlink CCIP实现跨链拍卖功能，允许用户在不同链上参与拍卖。

## 测试网部署地址

- NFT合约: `0x...`
- 拍卖工厂合约: `0x...`
- 价格预言机: `0x...`
- 跨链拍卖合约: `0x...`

## 许可证

## NFT拍卖市场项目分析
这是一个功能完整的基于Solidity的NFT拍卖市场智能合约项目，实现了多项先进的区块链技术特性。

## 🎯 核心功能实现
### 1. NFT拍卖系统
- 多币种支持 ：支持ETH和任意ERC20代币参与拍卖
- 灵活拍卖机制 ：包含起拍价、一口价、最小加价幅度等配置
- 拍卖状态管理 ：完整的拍卖生命周期（等待开始、进行中、已结束、已取消）
- 资金托管 ：安全的资金托管和提取机制
### 2. 价格预言机集成
- Chainlink价格源 ：使用Chainlink预言机获取实时价格数据
- 多币种价格转换 ：将不同代币价格统一转换为USD进行比较
- 动态汇率支持 ：支持ETH和ERC20代币的实时汇率转换
### 3. 跨链拍卖功能
- CCIP集成 ：使用Chainlink CCIP实现跨链通信
- 跨链出价 ：支持从其他链发起拍卖出价
- 消息路由 ：完整的跨链消息发送和接收机制
### 4. 合约升级架构
- UUPS代理模式 ：使用OpenZeppelin的UUPS代理实现安全升级
- 工厂模式 ：类似Uniswap V2的工厂模式管理拍卖实例
- 批量升级 ：支持一键升级所有拍卖合约实例
### 5. 手续费系统
- 动态手续费 ：根据拍卖金额动态调整手续费
- 手续费配置 ：可配置的手续费比例和接收地址
## 📁 项目结构
### 智能合约 (contracts/)
- `NFTAuction.sol` ：核心拍卖合约，支持可升级
- `AuctionFactory.sol` ：工厂合约，管理拍卖实例创建和升级
- `CrossChainAuction.sol` ：跨链拍卖功能
- `NFT.sol` ：ERC721 NFT合约
- `PriceConverter.sol` ：价格转换库
- CCIPBidSender.sol ：CCIP出价发送者
- PriceFeed.sol ：价格预言机合约
### 接口定义 (contracts/interfaces/)
- ICCIPReceiver.sol ：CCIP接收者接口
- IPriceFeed.sol ：价格预言机接口
### 测试合约 (contracts/mocks/)
- MockERC20.sol ：测试用ERC20代币
- MockRouter.sol ：测试用路由器
### 部署脚本 (deploy/)
- `01_deploy_nft_auction.js` ：主要合约部署脚本
- 02_upgrade_nft_auction.js ：合约升级脚本
### 测试文件 (test/)
- `NFTAuction.test.js` ：完整的拍卖合约测试套件
## 🛠 技术栈
- Solidity 0.8.28 ：智能合约开发语言
- Hardhat ：开发框架和测试环境
- OpenZeppelin Contracts ：安全的合约库
- Chainlink Contracts ：预言机和CCIP跨链功能
- UUPS代理模式 ：合约升级机制
## 🌐 网络支持
项目配置支持多个网络：

- 本地网络 ：Hardhat本地测试网络
- Sepolia测试网 ：以太坊测试网络
- Mumbai测试网 ：Polygon测试网络
## ✨ 项目亮点
1. 完整的拍卖生态系统 ：从NFT铸造到拍卖结束的完整流程
2. 先进的跨链技术 ：使用Chainlink CCIP实现真正的跨链拍卖
3. 灵活的升级机制 ：UUPS代理模式确保合约可安全升级
4. 多币种价格统一 ：通过预言机实现不同代币的价格比较
5. 工厂模式设计 ：高效的合约实例管理
6. 完善的测试覆盖 ：详细的单元测试和集成测试
7. 生产就绪 ：包含完整的部署脚本和网络配置
这个项目展示了现代DeFi应用的核心技术栈，是一个学习和参考区块链开发的优秀案例。

MIT
