const fs = require('fs');
const path = require('path');

console.log("🚀 NFT 项目快速设置");
console.log("====================\n");

// 检查是否已存在 .env 文件
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  console.log("✅ .env 文件已存在");
} else {
  console.log("📝 创建 .env 文件...");
  
  const envContent = `# 你的私钥（不要分享给任何人）
PRIVATE_KEY=your_private_key_here

# Infura 项目 ID（替换为你的项目 ID）
SEPOLIA_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID
GOERLI_URL=https://goerli.infura.io/v3/YOUR_PROJECT_ID

# Etherscan API Key（用于验证合约）
ETHERSCAN_API_KEY=your_etherscan_api_key_here
`;
  
  fs.writeFileSync(envPath, envContent);
  console.log("✅ .env 文件已创建");
}

console.log("\n📋 下一步操作:");
console.log("1. 编辑 .env 文件，填入你的私钥和 API 密钥");
console.log("2. 运行 'npm install' 安装依赖");
console.log("3. 运行 'npm run compile' 编译合约");
console.log("4. 运行 'npm run deploy:sepolia' 部署到 Sepolia 测试网");
console.log("\n🔗 有用的链接:");
console.log("- Sepolia Faucet: https://sepoliafaucet.com/");
console.log("- Goerli Faucet: https://goerlifaucet.com/");
console.log("- Etherscan Sepolia: https://sepolia.etherscan.io/");
console.log("- OpenSea Testnets: https://testnets.opensea.io/");
console.log("\n⚠️  重要提醒:");
console.log("- 不要分享你的私钥");
console.log("- 确保 MetaMask 连接到正确的测试网");
console.log("- 保存好合约地址和交易哈希");
console.log("\n🎯 你的 NFT 元数据:");
console.log("- 图片: ipfs://bafybeifcp7bt6e2gnqpi6smeeswk7s2lhfkyupc6g63jdqfuiv4yv5epqm/patrickhuang.png");
console.log("- 元数据: ipfs://bafkreie7hbbfibqquihgttbn3ld7d77gxblzoysfkmlztrspqrk26dhabq/metadata.json"); 