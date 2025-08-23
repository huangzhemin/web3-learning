const { ethers } = require("hardhat");

async function main() {
  console.log("🎨 NFT 项目演示");
  console.log("================\n");

  try {
    // 获取账户
    const [deployer, user1, user2] = await ethers.getSigners();
    console.log("部署账户:", deployer.address);
    console.log("用户1:", user1.address);
    console.log("用户2:", user2.address);

    // 部署合约
    console.log("\n📦 部署 NFT 合约...");
    const MyNFT = await ethers.getContractFactory("MyNFT");
    const nft = await MyNFT.deploy("Patrick Huang NFT Collection", "PHNFT");
    
    await nft.waitForDeployment();
    const contractAddress = await nft.getAddress();
    
    console.log("✅ 合约部署成功!");
    console.log("合约地址:", contractAddress);
    console.log("合约名称:", await nft.name());
    console.log("合约符号:", await nft.symbol());

    // 铸造第一个 NFT
    console.log("\n🎨 铸造第一个 NFT...");
    const tokenURI1 = "ipfs://bafkreie7hbbfibqquihgttbn3ld7d77gxblzoysfkmlztrspqrk26dhabq/metadata.json";
    
    const mintTx1 = await nft.mintNFT(user1.address, tokenURI1);
    await mintTx1.wait();
    
    console.log("✅ 第一个 NFT 铸造成功!");
    console.log("Token ID: 0");
    console.log("所有者:", user1.address);
    console.log("Token URI:", tokenURI1);

    // 铸造第二个 NFT
    console.log("\n🎨 铸造第二个 NFT...");
    const tokenURI2 = "ipfs://bafkreie7hbbfibqquihgttbn3ld7d77gxblzoysfkmlztrspqrk26dhabq/metadata.json";
    
    const mintTx2 = await nft.mintNFT(user2.address, tokenURI2);
    await mintTx2.wait();
    
    console.log("✅ 第二个 NFT 铸造成功!");
    console.log("Token ID: 1");
    console.log("所有者:", user2.address);
    console.log("Token URI:", tokenURI2);

    // 显示合约状态
    console.log("\n📊 合约状态:");
    console.log("总铸造数量:", (await nft.tokenCounter()).toString());
    console.log("Token 0 所有者:", await nft.ownerOf(0));
    console.log("Token 1 所有者:", await nft.ownerOf(1));

    // 演示所有权转移
    console.log("\n🔄 演示所有权转移...");
    console.log("用户1 将 Token 0 转移给用户2");
    
    await nft.connect(user1).transferFrom(user1.address, user2.address, 0);
    
    console.log("✅ 转移成功!");
    console.log("Token 0 新所有者:", await nft.ownerOf(0));

    // 最终状态
    console.log("\n🎯 最终状态:");
    console.log("Token 0 所有者:", await nft.ownerOf(0));
    console.log("Token 1 所有者:", await nft.ownerOf(1));
    console.log("用户2 拥有的 NFT 数量:", (await nft.balanceOf(user2.address)).toString());

    console.log("\n✨ 演示完成!");
    console.log("合约地址:", contractAddress);
    console.log("你可以在 Etherscan 或 OpenSea 上查看这些 NFT");

  } catch (error) {
    console.error("❌ 演示失败:", error.message);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 