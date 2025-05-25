// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "./NFTAuction.sol";
import "./interfaces/IPriceFeed.sol";

/**
 * @title AuctionFactory
 * @dev 拍卖工厂合约，用于创建和升级NFTAuction合约实例
 */
contract AuctionFactory is Initializable, UUPSUpgradeable, OwnableUpgradeable {
    address public implementation;
    address public priceFeed;
    address public feeRecipient;
    uint256 public feePercentage;

    address[] public allAuctions;

    event AuctionProxyCreated(address indexed proxyAddress, address indexed implementationAddress);
    event ImplementationUpgraded(address indexed oldImplementation, address indexed newImplementation);
    event AllAuctionsUpgraded(address indexed newImplementation);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @dev 初始化工厂合约
     * @param _implementation NFTAuction实现合约地址
     * @param _priceFeed PriceFeed合约地址
     * @param _feeRecipient 手续费接收地址
     * @param _feePercentage 手续费百分比
     */
    function initialize(
        address _implementation,
        address _priceFeed,
        address _feeRecipient,
        uint256 _feePercentage
    ) public initializer {
        __Ownable_init(msg.sender);
        __UUPSUpgradeable_init();
        implementation = _implementation;
        priceFeed = _priceFeed;
        feeRecipient = _feeRecipient;
        feePercentage = _feePercentage;
    }

    /**
     * @dev 创建新的拍卖合约代理实例
     * @return proxyAddress 新创建的拍卖合约代理地址
     */
    function createAuction() external returns (address proxyAddress) {
        bytes memory initData = abi.encodeWithSelector(
            NFTAuction.initialize.selector,
            priceFeed,
            feeRecipient,
            feePercentage
        );
        ERC1967Proxy proxy = new ERC1967Proxy(implementation, initData);
        proxyAddress = address(proxy);
        allAuctions.push(proxyAddress);
        emit AuctionProxyCreated(proxyAddress, implementation);
        return proxyAddress;
    }

    /**
     * @dev 升级所有拍卖合约实例到新的实现
     * @param newImplementation 新的NFTAuction实现合约地址
     */
    function upgradeAllAuctions(address newImplementation) external onlyOwner {
        require(newImplementation != address(0), "Invalid new implementation");
        address oldImplementation = implementation;
        implementation = newImplementation;
        for (uint i = 0; i < allAuctions.length; i++) {
            address proxyAddress = allAuctions[i];
            // 确保代理合约存在且是ERC1967Proxy类型
            // (在实际生产中可能需要更健壮的检查)
            try ERC1967Proxy(proxyAddress).upgradeToAndCall(newImplementation, "") {}
            catch {
                // 处理升级失败的情况，例如跳过或记录错误
            }
        }
        emit AllAuctionsUpgraded(newImplementation);
        emit ImplementationUpgraded(oldImplementation, newImplementation); // 也触发单个实现升级事件
    }

    /**
     * @dev 获取已创建的拍卖合约数量
     * @return 拍卖合约数量
     */
    function getAuctionCount() external view returns (uint256) {
        return allAuctions.length;
    }

    /**
     * @dev 获取指定索引的拍卖合约地址
     * @param index 索引
     * @return 拍卖合约地址
     */
    function getAuctionAtIndex(uint256 index) external view returns (address) {
        require(index < allAuctions.length, "Index out of bounds");
        return allAuctions[index];
    }

    /**
     * @dev UUPS升级授权函数 (工厂合约自身的升级)
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}