const { ethers, upgrades } = require("hardhat");

async function main() {
  console.log("开始升级合约...");
  
  // 获取部署账户
  const [deployer] = await ethers.getSigners();
  console.log("升级账户:", deployer.address);
  
  // 这里需要填入之前部署的代理合约地址
  const proxyAddress = "0xc2b0eA0d7FBEAd555f7b2E0345aCCfE50d2e5875"; // 请替换为实际的代理合约地址
  
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
  
  try {
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
    
    // 检查是否有 getTimestamp 方法
    try {
      const timestamp = await storageV2.getTimestamp();
      console.log("时间戳:", timestamp.toString());
    } catch (error) {
      console.log("⚠️ getTimestamp 方法调用失败，可能升级未完全成功");
      console.log("错误详情:", error.message);
    }
    
    // 测试批量设置功能
    console.log("测试批量设置功能...");
    try {
      const tx = await storageV2.batchSet(100, "Upgraded Contract");
      await tx.wait();
      
      const newValue = await storageV2.getValue();
      const newName = await storageV2.getName();
      console.log("新值:", newValue.toString());
      console.log("新名称:", newName);
      
      // 再次尝试获取时间戳
      try {
        const newTimestamp = await storageV2.getTimestamp();
        console.log("新时间戳:", newTimestamp.toString());
      } catch (error) {
        console.log("⚠️ 升级后仍然无法调用 getTimestamp 方法");
        console.log("建议检查升级是否成功完成");
      }
      
    } catch (error) {
      console.log("⚠️ batchSet 方法调用失败");
      console.log("错误详情:", error.message);
    }
    
    console.log("\n升级验证完成！");
    
  } catch (error) {
    console.error("❌ 升级验证过程中发生错误:");
    console.error("错误详情:", error.message);
    console.log("\n建议:");
    console.log("1. 检查合约是否真正升级成功");
    console.log("2. 确认代理合约地址正确");
    console.log("3. 检查网络连接和 gas 费用");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 