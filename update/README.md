# 可升级合约 Demo

这是一个简单的可升级智能合约演示项目，展示了如何使用 OpenZeppelin 的升级模式来部署和升级智能合约。

## 项目结构

```
update/
├── contracts/           # 智能合约
│   ├── StorageV1.sol   # 第一个版本的存储合约
│   └── StorageV2.sol   # 升级后的存储合约
├── scripts/             # 部署和升级脚本
│   ├── deploy.js        # 部署脚本
│   └── upgrade.js       # 升级脚本
├── test/                # 测试文件
│   └── Storage.test.js  # 合约测试
├── hardhat.config.js    # Hardhat 配置
├── package.json         # 项目依赖
└── README.md           # 项目说明
```

## 功能特性

### StorageV1 (初始版本)
- 存储一个数值和一个名称
- 基本的设置和获取功能
- 权限控制（只有所有者可以修改）
- 事件记录

### StorageV2 (升级版本)
- 继承 StorageV1 的所有功能
- 新增时间戳字段
- 新增批量设置功能
- 保持所有现有数据

## 安装和设置

1. 安装依赖：
```bash
npm install
```

2. 编译合约：
```bash
npm run compile
```

## 使用方法

### 1. 启动本地节点
```bash
npm run node
```

### 2. 部署合约
```bash
npm run deploy
```

### 3. 运行测试
```bash
npm run test
```

### 4. 升级合约
在 `scripts/upgrade.js` 中更新代理合约地址，然后运行：
```bash
npm run upgrade
```

## 合约升级流程

1. **部署初始版本**：使用 `deploy.js` 部署 StorageV1
2. **记录代理地址**：部署完成后会显示代理合约地址
3. **更新升级脚本**：在 `upgrade.js` 中填入代理合约地址
4. **执行升级**：运行升级脚本将合约升级到 StorageV2
5. **验证升级**：检查数据是否保留，新功能是否正常

## 技术要点

### 可升级模式
- 使用 **UUPS (Universal Upgradeable Proxy Standard)** 模式
- 代理合约存储数据，实现合约存储逻辑
- 升级时只更换实现合约，数据保持不变

### 安全考虑
- 使用 `initializer` 修饰符防止重复初始化
- 继承 `OwnableUpgradeable` 进行权限控制
- 构造函数中调用 `_disableInitializers()`

### 数据兼容性
- 升级时保持存储布局兼容
- 新增字段添加到存储末尾
- 不删除或修改现有字段

## 注意事项

1. **存储布局**：升级时不能改变现有变量的存储位置
2. **初始化函数**：只能调用一次，用于设置初始状态
3. **权限管理**：升级权限应该严格控制
4. **测试验证**：升级前后都要进行充分测试

## 常见问题

**Q: 为什么需要代理合约？**
A: 代理合约存储数据，实现合约存储逻辑。升级时只更换实现合约，数据保持不变。

**Q: 如何确保升级安全？**
A: 使用 OpenZeppelin 的升级库，遵循存储布局兼容性原则，进行充分测试。

**Q: 升级后数据会丢失吗？**
A: 不会，所有存储在代理合约中的数据都会保留。

## 扩展阅读

- [OpenZeppelin 升级模式文档](https://docs.openzeppelin.com/upgrades-plugins/1.x/)
- [代理模式详解](https://docs.openzeppelin.com/contracts/4.x/api/proxy)
- [UUPS 升级标准](https://eips.ethereum.org/EIPS/eip-1822) 