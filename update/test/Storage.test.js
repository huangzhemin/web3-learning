const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("Storage 可升级合约测试", function () {
  let storageV1, storageV2, owner, user1, user2;
  
  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    
    // 部署 StorageV1
    const StorageV1 = await ethers.getContractFactory("StorageV1");
    storageV1 = await upgrades.deployProxy(StorageV1, [owner.address], {
      initializer: 'initialize',
      kind: 'uups'
    });
    await storageV1.deployed();
  });
  
  describe("StorageV1 基础功能", function () {
    it("应该正确初始化", async function () {
      expect(await storageV1.getValue()).to.equal(0);
      expect(await storageV1.getName()).to.equal("StorageV1");
      expect(await storageV1.getVersion()).to.equal("V1");
      expect(await storageV1.owner()).to.equal(owner.address);
    });
    
    it("应该允许设置和获取值", async function () {
      await storageV1.setValue(123);
      expect(await storageV1.getValue()).to.equal(123);
    });
    
    it("应该允许设置和获取名称", async function () {
      await storageV1.setName("Test Name");
      expect(await storageV1.getName()).to.equal("Test Name");
    });
    
    it("应该发出正确的事件", async function () {
      const tx1 = await storageV1.setValue(456);
      const receipt1 = await tx1.wait();
      expect(receipt1.events).to.satisfy((events) => {
        return events.some(event => 
          event.event === 'ValueChanged' && 
          event.args[0].toString() === '456'
        );
      });
        
      const tx2 = await storageV1.setName("New Name");
      const receipt2 = await tx2.wait();
      expect(receipt2.events).to.satisfy((events) => {
        return events.some(event => 
          event.event === 'NameChanged' && 
          event.args[0] === 'New Name'
        );
      });
    });
  });
  
  describe("合约升级", function () {
    it("应该能够升级到 StorageV2", async function () {
      // 先设置一些数据
      await storageV1.setValue(789);
      await storageV1.setName("Before Upgrade");
      
      // 部署 StorageV2
      const StorageV2 = await ethers.getContractFactory("StorageV2");
      
      // 升级合约
      const upgraded = await upgrades.upgradeProxy(storageV1.address, StorageV2);
      await upgraded.deployed();
      
      // 验证数据保留
      expect(await upgraded.getValue()).to.equal(789);
      expect(await upgraded.getName()).to.equal("Before Upgrade");
      
      // 验证新功能
      expect(await upgraded.getVersion()).to.equal("V2");
      expect(await upgraded.getTimestamp()).to.be.gt(0);
    });
    
    it("升级后应该保留所有现有数据", async function () {
      const originalValue = 999;
      const originalName = "Original Data";
      
      await storageV1.setValue(originalValue);
      await storageV1.setName(originalName);
      
      // 升级合约
      const StorageV2 = await ethers.getContractFactory("StorageV2");
      const upgraded = await upgrades.upgradeProxy(storageV1.address, StorageV2);
      
      // 验证数据完全保留
      expect(await upgraded.getValue()).to.equal(originalValue);
      expect(await upgraded.getName()).to.equal(originalName);
    });
  });
  
  describe("StorageV2 新功能", function () {
    let storageV2;
    
    beforeEach(async function () {
      // 升级到 V2
      const StorageV2 = await ethers.getContractFactory("StorageV2");
      const upgraded = await upgrades.upgradeProxy(storageV1.address, StorageV2);
      storageV2 = StorageV2.attach(storageV1.address);
    });
    
    it("应该支持时间戳功能", async function () {
      const timestamp = await storageV2.getTimestamp();
      expect(timestamp).to.be.gt(0);
    });
    
    it("应该支持批量设置功能", async function () {
      const newValue = 555;
      const newName = "Batch Set Name";
      
      await storageV2.batchSet(newValue, newName);
      
      expect(await storageV2.getValue()).to.equal(newValue);
      expect(await storageV2.getName()).to.equal(newName);
      
      // 验证时间戳已更新
      const timestamp = await storageV2.getTimestamp();
      expect(timestamp).to.be.gt(0);
    });
    
    it("批量设置应该发出正确的事件", async function () {
      const tx = await storageV2.batchSet(777, "Event Test");
      const receipt = await tx.wait();
      
      // 检查是否包含所有预期事件
      const events = receipt.events;
      expect(events).to.satisfy((events) => {
        const hasValueChanged = events.some(event => 
          event.event === 'ValueChanged' && 
          event.args[0].toString() === '777'
        );
        const hasNameChanged = events.some(event => 
          event.event === 'NameChanged' && 
          event.args[0] === 'Event Test'
        );
        const hasTimestampUpdated = events.some(event => 
          event.event === 'TimestampUpdated'
        );
        return hasValueChanged && hasNameChanged && hasTimestampUpdated;
      });
    });
  });
  
  describe("权限控制", function () {
    it("只有所有者可以调用设置函数", async function () {
      // 测试非所有者无法设置值
      await expect(
        storageV1.connect(user1).setValue(123)
      ).to.be.reverted;
      
      // 测试非所有者无法设置名称
      await expect(
        storageV1.connect(user1).setName("Unauthorized")
      ).to.be.reverted;
    });
    
    it("任何人都可以调用查看函数", async function () {
      // 非所有者应该能够读取数据
      const value = await storageV1.connect(user1).getValue();
      const name = await storageV1.connect(user1).getName();
      const version = await storageV1.connect(user1).getVersion();
      
      expect(value).to.be.a('object'); // BigNumber
      expect(name).to.be.a('string');
      expect(version).to.be.a('string');
    });
  });
}); 