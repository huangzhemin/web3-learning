const { ethers } = require("hardhat");

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  // 1. 部署NFT合约
  const nft = await deploy("NFT", {
    from: deployer,
    args: [],
    log: true,
  });

  // 2. 部署价格预言机
  // 注意：在实际部署中，需要使用真实的Chainlink价格预言机地址
  // Sepolia ETH/USD 价格预言机: 0x694AA1769357215DE4FAC081bf1f309aDC325306
  const ethUsdPriceFeed = "0x694AA1769357215DE4FAC081bf1f309aDC325306";
  const priceFeed = await deploy("PriceFeed", {
    from: deployer,
    args: [ethUsdPriceFeed],
    log: true,
  });

  // 3. 部署NFTAuction实现合约
  const nftAuctionImpl = await deploy("NFTAuction", {
    from: deployer,
    args: [],
    log: true,
  });

  // 4. 部署工厂合约
  const factory = await deploy("NFTAuctionFactory", {
    from: deployer,
    args: [nftAuctionImpl.address, priceFeed.address],
    log: true,
  });

  // 5. 部署CCIP发送器
  // 注意：在实际部署中，需要使用真实的Chainlink CCIP Router地址
  // Sepolia CCIP Router: 0xD0daae2231E9CB96b94C8512223533293C3693Bf
  const ccipRouter = "0xD0daae2231E9CB96b94C8512223533293C3693Bf";
  const ccipSender = await deploy("CCIPBidSender", {
    from: deployer,
    args: [ccipRouter],
    log: true,
  });

  console.log("NFT deployed to:", nft.address);
  console.log("PriceFeed deployed to:", priceFeed.address);
  console.log("NFTAuction implementation deployed to:", nftAuctionImpl.address);
  console.log("NFTAuctionFactory deployed to:", factory.address);
  console.log("CCIPBidSender deployed to:", ccipSender.address);
};

module.exports.tags = ["all", "nftauction"];