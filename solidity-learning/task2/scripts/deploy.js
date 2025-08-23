const { ethers } = require("hardhat");

async function main() {
  console.log("开始部署 NFT 合约...");

  try {
    // 获取部署账户
    const signers = await ethers.getSigners();
    if (!signers || signers.length === 0) {
      throw new Error("无法获取签名者账户");
    }
    
    const deployer = signers[0];
    console.log("部署账户:", deployer.address);
    
    // 获取账户余额
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("账户余额:", ethers.formatEther(balance), "ETH");

    // 部署 NFT 合约
    const MyNFT = await ethers.getContractFactory("MyNFT");
    const nft = await MyNFT.deploy("Patrick Huang NFT", "PHNFT");
    
    await nft.waitForDeployment();
    const contractAddress = await nft.getAddress();
    
    console.log("NFT 合约部署成功!");
    console.log("合约地址:", contractAddress);
    console.log("NFT 名称:", await nft.name());
    console.log("NFT 符号:", await nft.symbol());
    console.log("当前 Token 计数器:", await nft.tokenCounter());

    // 铸造第一个 NFT
    console.log("\n开始铸造第一个 NFT...");
    
    // 使用你的元数据 IPFS 链接
    const tokenURI = "ipfs://bafkreie7hbbfibqquihgttbn3ld7d77gxblzoysfkmlztrspqrk26dhabq/metadata.json";
    
    const mintTx = await nft.mintNFT(deployer.address, tokenURI);
    console.log("铸造交易已提交，等待确认...");
    await mintTx.wait();
    
    console.log("NFT 铸造成功!");
    console.log("Token ID: 0");
    console.log("Token URI:", tokenURI);
    console.log("所有者:", deployer.address);

    console.log("\n部署完成! 请记录以下信息:");
    console.log("合约地址:", contractAddress);
    console.log("部署账户:", deployer.address);
    console.log("Token URI:", tokenURI);
    console.log("交易哈希:", mintTx.hash);

  } catch (error) {
    console.error("部署失败:", error.message);
    if (error.message.includes("insufficient funds")) {
      console.log("错误: 账户余额不足，请从测试网水龙头获取 ETH");
    } else if (error.message.includes("network")) {
      console.log("错误: 网络连接问题，请检查网络配置");
    }
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 