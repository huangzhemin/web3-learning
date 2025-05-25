// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IPriceFeed.sol";

contract PriceFeed is IPriceFeed, Ownable {
    // 代币地址到价格源的映射
    mapping(address => address) public priceFeeds;
    // ETH价格源（ETH/USD）
    address public ethUsdPriceFeed;

    constructor(address _ethUsdPriceFeed) Ownable(msg.sender) {
        ethUsdPriceFeed = _ethUsdPriceFeed;
    }

    // 设置代币价格源
    function setPriceFeed(address token, address priceFeed) external onlyOwner {
        priceFeeds[token] = priceFeed;
    }

    // 设置ETH价格源
    function setEthUsdPriceFeed(address _ethUsdPriceFeed) external onlyOwner {
        ethUsdPriceFeed = _ethUsdPriceFeed;
    }

    // 获取最新价格
    function getLatestPrice(address token) external view override returns (int256) {
        address priceFeedAddress;
        if (token == address(0)) {
            // ETH价格
            priceFeedAddress = ethUsdPriceFeed;
        } else {
            // ERC20代币价格
            priceFeedAddress = priceFeeds[token];
        }
        require(priceFeedAddress != address(0), "Price feed not found");
        
        AggregatorV3Interface priceFeed = AggregatorV3Interface(priceFeedAddress);
        (, int256 price, , , ) = priceFeed.latestRoundData();
        return price;
    }

    // 将代币金额转换为USD
    function convertToUSD(address token, uint256 amount) external view returns (uint256) {
        int256 price = this.getLatestPrice(token);
        require(price > 0, "Invalid price");
        
        // 获取价格源的小数位数
        address priceFeedAddress = token == address(0) ? ethUsdPriceFeed : priceFeeds[token];
        AggregatorV3Interface priceFeed = AggregatorV3Interface(priceFeedAddress);
        uint8 decimals = priceFeed.decimals();
        
        // 计算USD价值
        return (amount * uint256(price)) / (10 ** decimals);
    }
}