const { ethers } = require("hardhat");

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  // 部署NFT合约
  const nft = await deploy("NFT", {
    from: deployer,
    args: [],
    log: true,
  });

  console.log("NFT deployed to:", nft.address);

  // 部署NFTAuction实现合约
  const nftAuctionImpl = await deploy("NFTAuction", {
    from: deployer,
    args: [],
    log: true,
  });

  console.log("NFTAuction implementation deployed to:", nftAuctionImpl.address);

  // 部署AuctionFactory合约
  // 在Sepolia测试网上，ETH/USD价格源地址
  const ethUsdPriceFeed = "0x694AA1769357215DE4FAC081bf1f309aDC325306";

  const auctionFactory = await deploy("AuctionFactory", {
    from: deployer,
    args: [],
    proxy: {
      proxyContract: "ERC1967Proxy",
      execute: {
        init: {
          methodName: "initialize",
          args: [nftAuctionImpl.address, ethUsdPriceFeed],
        },
      },
    },
    log: true,
  });

  console.log("AuctionFactory deployed to:", auctionFactory.address);

  // 部署CrossChainAuction合约
  // Sepolia测试网上的CCIP Router地址
  const ccipRouter = "0xD0daae2231E9CB96b94C8512223533293C3693Bf";

  const crossChainAuction = await deploy("CrossChainAuction", {
    from: deployer,
    args: [ccipRouter],
    log: true,
  });

  console.log("CrossChainAuction deployed to:", crossChainAuction.address);
};

module.exports.tags = ["all", "nftauction"];