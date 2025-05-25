// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

library PriceConverter {
    // ETH/USD Sepolia价格源
    function getEthUsdPrice(address priceFeed) internal view returns (uint256) {
        AggregatorV3Interface feed = AggregatorV3Interface(priceFeed);
        (, int256 price, , , ) = feed.latestRoundData();
        // 将价格转换为18位小数
        return uint256(price) * 10**10;
    }

    // ERC20/USD价格源
    function getTokenUsdPrice(address token, address priceFeed) internal view returns (uint256) {
        AggregatorV3Interface feed = AggregatorV3Interface(priceFeed);
        (, int256 price, , , ) = feed.latestRoundData();
        // 获取代币小数位数
        uint8 decimals = IERC20(token).decimals();
        // 将价格转换为与代币相同的小数位数
        return uint256(price) * 10**(18 - uint256(decimals));
    }

    // 将ETH金额转换为USD
    function ethToUsd(uint256 ethAmount, address priceFeed) internal view returns (uint256) {
        uint256 ethPrice = getEthUsdPrice(priceFeed);
        return (ethAmount * ethPrice) / 1e18;
    }

    // 将ERC20代币金额转换为USD
    function tokenToUsd(uint256 tokenAmount, address token, address priceFeed) internal view returns (uint256) {
        uint256 tokenPrice = getTokenUsdPrice(token, priceFeed);
        return (tokenAmount * tokenPrice) / 1e18;
    }
}