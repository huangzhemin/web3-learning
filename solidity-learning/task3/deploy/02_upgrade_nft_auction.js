const { ethers } = require("hardhat");

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  // 获取AuctionFactory合约地址
  const auctionFactory = await ethers.getContract("AuctionFactory", deployer);

  // 部署新版本的NFTAuction实现合约
  const nftAuctionImplV2 = await deploy("NFTAuctionV2", {
    from: deployer,
    args: [],
    log: true,
  });

  console.log("NFTAuctionV2 implementation deployed to:", nftAuctionImplV2.address);

  // 升级所有拍卖合约
  const tx = await auctionFactory.upgradeAllAuctions(nftAuctionImplV2.address);
  await tx.wait();

  console.log("All auctions upgraded to new implementation");
};

module.exports.tags = ["upgrade"];