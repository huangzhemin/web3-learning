# Cross-Chain Transfer Simulator

一个用 Go 语言编写的跨链转账模拟器，支持多个区块链网络之间的资产转移模拟。

## 功能特性

- 🏗️ **多链支持**: 支持 Ethereum、Polygon、BSC、Avalanche、Arbitrum 等主流区块链网络
- 🔄 **跨链转账**: 模拟真实的跨链资产转移过程
- ⚡ **实时更新**: WebSocket 实时推送网络状态和转账信息
- 🌐 **Web 界面**: 现代化的 Web 界面，支持实时监控和操作
- 📊 **统计信息**: 详细的网络统计和转账历史
- 🔒 **安全模拟**: 模拟真实的区块链交易验证和安全机制

## 技术架构

```
crossChain/
├── main.go                 # 应用程序入口
├── go.mod                  # Go 模块文件
├── internal/
│   ├── blockchain/         # 区块链网络模拟
│   │   ├── network.go      # 网络和账户模型
│   │   └── manager.go      # 网络管理器
│   ├── simulator/          # 跨链模拟器核心
│   │   └── simulator.go    # 跨链转账逻辑
│   └── api/                # HTTP API 服务器
│       └── server.go       # REST API 和 WebSocket
└── web/                    # Web 界面
    ├── index.html          # 主页面
    └── js/
        └── app.js          # 前端 JavaScript
```

## 快速开始

### 1. 安装依赖

```bash
cd crossChain
go mod tidy
```

### 2. 运行模拟器

```bash
go run main.go
```

### 3. 访问 Web 界面

打开浏览器访问: http://localhost:8080

## API 接口

### 网络管理

- `GET /api/v1/networks` - 获取所有网络信息
- `GET /api/v1/networks/{id}` - 获取特定网络信息
- `POST /api/v1/networks/{id}/accounts` - 创建账户
- `GET /api/v1/networks/{id}/accounts/{address}` - 获取账户信息
- `POST /api/v1/networks/{id}/transfer` - 单链转账

### 跨链转账

- `POST /api/v1/transfers` - 发起跨链转账
- `GET /api/v1/transfers` - 获取所有转账记录
- `GET /api/v1/transfers/{id}` - 获取特定转账信息
- `GET /api/v1/transfers/status/{status}` - 按状态筛选转账

### 统计信息

- `GET /api/v1/stats` - 获取系统统计信息
- `WS /api/v1/ws` - WebSocket 实时数据推送

## 使用示例

### 发起跨链转账

```bash
curl -X POST http://localhost:8080/api/v1/transfers \
  -H "Content-Type: application/json" \
  -d '{
    "source_network": "ethereum-mainnet",
    "target_network": "polygon-mainnet",
    "source_address": "0x1234567890123456789012345678901234567890",
    "target_address": "0x0987654321098765432109876543210987654321",
    "amount": "1000000000000000000"
  }'
```

### 获取网络信息

```bash
curl http://localhost:8080/api/v1/networks
```

### 获取转账记录

```bash
curl http://localhost:8080/api/v1/transfers
```

## 支持的区块链网络

| 网络 | 网络 ID | 链 ID | 区块时间 | 默认 Gas 价格 |
|------|---------|-------|----------|---------------|
| Ethereum Mainnet | ethereum-mainnet | 1 | 12s | 25 Gwei |
| Polygon Mainnet | polygon-mainnet | 137 | 2s | 30 Gwei |
| BSC Mainnet | bsc-mainnet | 56 | 3s | 5 Gwei |
| Avalanche C-Chain | avalanche-mainnet | 43114 | 2s | 25 Gwei |
| Arbitrum One | arbitrum-mainnet | 42161 | 1s | 0.1 Gwei |

## 跨链桥费用

每个网络都有相应的跨链桥费用：

- Ethereum: 1 ETH
- Polygon: 0.1 MATIC
- BSC: 0.05 BNB
- Avalanche: 0.1 AVAX
- Arbitrum: 0.5 ETH

## 转账状态

- **pending**: 等待处理
- **processing**: 处理中
- **completed**: 已完成
- **failed**: 失败

## 开发说明

### 项目结构

- `internal/blockchain/`: 区块链网络模拟实现
- `internal/simulator/`: 跨链转账核心逻辑
- `internal/api/`: HTTP API 和 WebSocket 实现
- `web/`: 前端 Web 界面

### 扩展新网络

1. 在 `network.go` 中添加新的 `NetworkType`
2. 在 `manager.go` 的 `InitializeNetworks()` 中初始化新网络
3. 在 `simulator.go` 中设置新网络的桥费用

### 自定义配置

可以通过修改代码中的常量来自定义：
- 区块时间
- Gas 价格
- 桥费用
- 网络参数

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！

## 联系方式

如有问题或建议，请通过 GitHub Issues 联系。 