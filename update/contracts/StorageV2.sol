// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

contract StorageV2 is Initializable, OwnableUpgradeable, UUPSUpgradeable {
    uint256 private _value;
    string private _name;
    uint256 private _timestamp; // 新增字段
    
    event ValueChanged(uint256 newValue);
    event NameChanged(string newName);
    event TimestampUpdated(uint256 newTimestamp);
    
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }
    
    function initialize(address initialOwner) public initializer {
        __Ownable_init(initialOwner);
        _value = 0;
        _name = "StorageV2";
        _timestamp = block.timestamp;
    }
    
    function setValue(uint256 newValue) public {
        _value = newValue;
        _timestamp = block.timestamp;
        emit ValueChanged(newValue);
        emit TimestampUpdated(_timestamp);
    }
    
    function getValue() public view returns (uint256) {
        return _value;
    }
    
    function setName(string memory newName) public {
        _name = newName;
        _timestamp = block.timestamp;
        emit NameChanged(newName);
        emit TimestampUpdated(_timestamp);
    }
    
    function getName() public view returns (string memory) {
        return _name;
    }
    
    function getTimestamp() public view returns (uint256) {
        return _timestamp;
    }
    
    function getVersion() public pure returns (string memory) {
        return "V2";
    }
    
    // 新增功能：批量设置
    function batchSet(uint256 newValue, string memory newName) public {
        _value = newValue;
        _name = newName;
        _timestamp = block.timestamp;
        emit ValueChanged(newValue);
        emit NameChanged(newName);
        emit TimestampUpdated(_timestamp);
    }
    
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
} 