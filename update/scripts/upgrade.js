const { ethers, upgrades } = require("hardhat");

async function main() {
  console.log("开始升级合约...");
  
  // 获取部署账户
  const [deployer] = await ethers.getSigners();
  console.log("升级账户:", deployer.address);
  
  // 这里需要填入之前部署的代理合约地址
  const proxyAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"; // 请替换为实际的代理合约地址
  
  if (proxyAddress === "0x...") {
    console.error("请先部署合约，然后更新此脚本中的代理合约地址");
    return;
  }
  
  console.log("代理合约地址:", proxyAddress);
  
  // 获取当前实现合约地址
  const currentImpl = await upgrades.erc1967.getImplementationAddress(proxyAddress);
  console.log("当前实现合约地址:", currentImpl);
  
  // 部署新的 StorageV2 合约
  console.log("\n部署 StorageV2 合约...");
  const StorageV2 = await ethers.getContractFactory("StorageV2");
  
  // 升级合约
  console.log("升级合约...");
  const upgraded = await upgrades.upgradeProxy(proxyAddress, StorageV2);
  await upgraded.waitForDeployment();
  
  console.log("合约升级完成！");
  
  // 获取新的实现合约地址
  const newImpl = await upgrades.erc1967.getImplementationAddress(proxyAddress);
  console.log("新的实现合约地址:", newImpl);
  
  // 验证升级后的功能
  console.log("\n验证升级后的功能...");
  const storageV2 = StorageV2.attach(proxyAddress);
  
  // 检查版本
  const version = await storageV2.getVersion();
  console.log("新版本:", version);
  
  // 检查现有数据是否保留
  const value = await storageV2.getValue();
  const name = await storageV2.getName();
  console.log("保留的值:", value.toString());
  console.log("保留的名称:", name);
  
  // 测试新功能
  console.log("\n测试新功能...");
  const timestamp = await storageV2.getTimestamp();
  console.log("时间戳:", timestamp.toString());
  
  // 测试批量设置功能
  console.log("测试批量设置功能...");
  const tx = await storageV2.batchSet(100, "Upgraded Contract");
  await tx.wait();
  
  const newValue = await storageV2.getValue();
  const newName = await storageV2.getName();
  const newTimestamp = await storageV2.getTimestamp();
  
  console.log("新值:", newValue.toString());
  console.log("新名称:", newName);
  console.log("新时间戳:", newTimestamp.toString());
  
  console.log("\n升级验证完成！");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 