const { ethers, upgrades } = require("hardhat");

async function main() {
  console.log("开始部署可升级合约...");
  
  // 获取部署账户
  const [deployer] = await ethers.getSigners();
  console.log("部署账户:", deployer.address);
  console.log("账户余额:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "ETH");
  
  // 部署 StorageV1 合约
  console.log("\n部署 StorageV1 合约...");
  const StorageV1 = await ethers.getContractFactory("StorageV1");
  const storageV1 = await upgrades.deployProxy(StorageV1, [deployer.address], {
    initializer: 'initialize',
    kind: 'uups'
  });
  
  await storageV1.waitForDeployment();
  const storageV1Address = await storageV1.getAddress();
  
  console.log("StorageV1 合约已部署到:", storageV1Address);
  console.log("代理合约地址:", storageV1Address);
  
  // 初始化合约
  console.log("\n初始化合约...");
  const tx = await storageV1.setValue(42);
  await tx.wait();
  
  const tx2 = await storageV1.setName("Hello World");
  await tx2.wait();
  
  // 验证初始状态
  const value = await storageV1.getValue();
  const name = await storageV1.getName();
  const version = await storageV1.getVersion();
  
  console.log("初始值:", value.toString());
  console.log("初始名称:", name);
  console.log("合约版本:", version);
  
  console.log("\n部署完成！");
  console.log("代理合约地址:", storageV1Address);
  console.log("实现合约地址:", await upgrades.erc1967.getImplementationAddress(storageV1Address));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 