const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 启动本地测试网络...");
  
  // 获取账户
  const [deployer] = await ethers.getSigners();
  console.log("部署账户:", deployer.address);
  console.log("账户余额:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "ETH");

  // 部署合约
  console.log("\n📦 部署 NFT 合约...");
  const MyNFT = await ethers.getContractFactory("MyNFT");
  const nft = await MyNFT.deploy("Local Test NFT", "LTNFT");
  
  await nft.waitForDeployment();
  const contractAddress = await nft.getAddress();
  
  console.log("✅ 合约部署成功!");
  console.log("合约地址:", contractAddress);
  console.log("合约名称:", await nft.name());
  console.log("合约符号:", await nft.symbol());

  // 铸造测试 NFT
  console.log("\n🎨 铸造测试 NFT...");
  const tokenURI = "ipfs://bafkreie7hbbfibqquihgttbn3ld7d77gxblzoysfkmlztrspqrk26dhabq/metadata.json";
  
  const mintTx = await nft.mintNFT(deployer.address, tokenURI);
  await mintTx.wait();
  
  console.log("✅ NFT 铸造成功!");
  console.log("Token ID: 0");
  console.log("Token URI:", tokenURI);
  console.log("所有者:", deployer.address);

  console.log("\n🎯 本地测试网络已准备就绪!");
  console.log("合约地址:", contractAddress);
  console.log("部署账户:", deployer.address);
  console.log("\n💡 你可以:");
  console.log("1. 在另一个终端运行 'npm run mint' 来铸造更多 NFT");
  console.log("2. 使用 Remix IDE 连接到 localhost:8545");
  console.log("3. 在 MetaMask 中添加 localhost:8545 网络");
  console.log("\n🔗 MetaMask 网络配置:");
  console.log("网络名称: Localhost 8545");
  console.log("RPC URL: http://127.0.0.1:8545");
  console.log("链 ID: 31337");
  console.log("货币符号: ETH");
}

main()
  .then(() => {
    console.log("\n✨ 本地网络启动完成! 按 Ctrl+C 停止网络");
  })
  .catch((error) => {
    console.error("❌ 启动失败:", error);
    process.exit(1);
  }); 