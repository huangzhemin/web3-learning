const fs = require('fs');
const path = require('path');

console.log("🔒 NFT 项目安全检查");
console.log("==================\n");

// 检查 .env 文件
const envPath = path.join(__dirname, '..', '.env');
const gitignorePath = path.join(__dirname, '..', '.gitignore');

console.log("1. 检查环境变量文件...");
if (fs.existsSync(envPath)) {
  console.log("✅ .env 文件存在");
  
  // 检查 .env 内容
  const envContent = fs.readFileSync(envPath, 'utf8');
  if (envContent.includes('your_private_key_here') || envContent.includes('YOUR_PROJECT_ID')) {
    console.log("⚠️  警告: .env 文件包含示例值，请更新为真实值");
  } else {
    console.log("✅ .env 文件已配置");
  }
} else {
  console.log("❌ .env 文件不存在，请运行 'npm run setup' 创建");
}

console.log("\n2. 检查 .gitignore 文件...");
if (fs.existsSync(gitignorePath)) {
  console.log("✅ .gitignore 文件存在");
  
  const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
  const requiredEntries = ['.env', 'node_modules/', 'artifacts/', 'cache/'];
  const missingEntries = requiredEntries.filter(entry => !gitignoreContent.includes(entry));
  
  if (missingEntries.length === 0) {
    console.log("✅ 所有重要文件都已被忽略");
  } else {
    console.log("⚠️  警告: 以下文件类型未被忽略:", missingEntries.join(', '));
  }
} else {
  console.log("❌ .gitignore 文件不存在");
}

console.log("\n3. 检查 Git 状态...");
const { execSync } = require('child_process');
try {
  const gitStatus = execSync('git status --porcelain', { encoding: 'utf8' });
  const lines = gitStatus.split('\n').filter(line => line.trim());
  
  const envInGit = lines.some(line => line.includes('.env') && !line.includes('.env.example'));
  const nodeModulesInGit = lines.some(line => line.includes('node_modules/'));
  const artifactsInGit = lines.some(line => line.includes('artifacts/'));
  
  if (envInGit) {
    console.log("❌ 危险: .env 文件在 Git 中，请立即移除！");
  }
  if (nodeModulesInGit) {
    console.log("⚠️  警告: node_modules/ 在 Git 中");
  }
  if (artifactsInGit) {
    console.log("⚠️  警告: artifacts/ 在 Git 中");
  }
  
  if (!envInGit && !nodeModulesInGit && !artifactsInGit) {
    console.log("✅ 没有敏感文件在 Git 跟踪中");
  }
} catch (error) {
  console.log("⚠️  无法检查 Git 状态:", error.message);
}

console.log("\n4. 安全建议:");
console.log("- 🔑 永远不要分享你的私钥");
console.log("- 🔒 使用测试网账户进行开发");
console.log("- 📝 定期检查 .env 文件是否被忽略");
console.log("- 🚫 不要在代码中硬编码私钥或 API 密钥");
console.log("- 🔄 定期轮换 API 密钥");

console.log("\n✨ 安全检查完成!"); 