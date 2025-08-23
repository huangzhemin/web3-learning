const { ethers } = require("hardhat");

async function main() {
  // 检查命令行参数
  if (process.argv.length < 4) {
    console.log("用法: node scripts/mint.js <合约地址> <接收者地址> [tokenURI]");
    console.log("示例: node scripts/mint.js 0x1234... 0x5678... ipfs://metadata.json");
    process.exit(1);
  }

  const contractAddress = process.argv[2];
  const recipient = process.argv[3];
  const tokenURI = process.argv[4] || "ipfs://bafkreie7hbbfibqquihgttbn3ld7d77gxblzoysfkmlztrspqrk26dhabq/metadata.json";

  console.log("开始铸造 NFT...");
  console.log("合约地址:", contractAddress);
  console.log("接收者:", recipient);
  console.log("Token URI:", tokenURI);

  try {
    // 获取合约实例
    const MyNFT = await ethers.getContractFactory("MyNFT");
    const nft = MyNFT.attach(contractAddress);

    // 检查合约连接
    const name = await nft.name();
    const symbol = await nft.symbol();
    console.log("合约名称:", name);
    console.log("合约符号:", symbol);

    // 获取当前 token 计数器
    const currentCounter = await nft.tokenCounter();
    console.log("当前 Token 计数器:", currentCounter.toString());

    // 铸造 NFT
    console.log("\n正在铸造 NFT...");
    const mintTx = await nft.mintNFT(recipient, tokenURI);
    
    console.log("交易哈希:", mintTx.hash);
    console.log("等待交易确认...");
    
    const receipt = await mintTx.wait();
    console.log("交易确认! 区块号:", receipt.blockNumber);

    // 获取新铸造的 NFT 信息
    const newTokenId = currentCounter;
    const owner = await nft.ownerOf(newTokenId);
    const uri = await nft.tokenURI(newTokenId);

    console.log("\nNFT 铸造成功!");
    console.log("Token ID:", newTokenId.toString());
    console.log("所有者:", owner);
    console.log("Token URI:", uri);
    console.log("新的 Token 计数器:", (await nft.tokenCounter()).toString());

  } catch (error) {
    console.error("铸造失败:", error.message);
    
    if (error.message.includes("OwnableUnauthorizedAccount")) {
      console.log("错误: 只有合约所有者才能铸造 NFT");
    } else if (error.message.includes("nonce")) {
      console.log("错误: 网络问题，请检查网络连接");
    } else {
      console.log("错误: 请检查合约地址和参数是否正确");
    }
    
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 