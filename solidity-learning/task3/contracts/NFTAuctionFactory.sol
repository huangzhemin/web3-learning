// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "./NFTAuction.sol";

contract NFTAuctionFactory is Ownable {
    address public implementation;
    address public priceFeed;
    mapping(address => bool) public isAuctionCreatedByFactory;
    address[] public allAuctions;

    event AuctionCreated(address indexed auction, address indexed creator);
    event ImplementationUpdated(address indexed oldImplementation, address indexed newImplementation);

    constructor(address _implementation, address _priceFeed) Ownable(msg.sender) {
        implementation = _implementation;
        priceFeed = _priceFeed;
    }

    function createAuction() external returns (address) {
        // 创建代理合约
        bytes memory initData = abi.encodeWithSelector(NFTAuction.initialize.selector, priceFeed);
        ERC1967Proxy proxy = new ERC1967Proxy(implementation, initData);
        
        // 记录新创建的拍卖合约
        address auctionAddress = address(proxy);
        isAuctionCreatedByFactory[auctionAddress] = true;
        allAuctions.push(auctionAddress);
        
        // 转移拍卖合约的所有权给创建者
        NFTAuction(auctionAddress).transferOwnership(msg.sender);
        
        emit AuctionCreated(auctionAddress, msg.sender);
        return auctionAddress;
    }

    function updateImplementation(address _newImplementation) external onlyOwner {
        address oldImplementation = implementation;
        implementation = _newImplementation;
        emit ImplementationUpdated(oldImplementation, _newImplementation);
    }

    function getAuctionCount() external view returns (uint256) {
        return allAuctions.length;
    }
}