// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

contract StorageV1 is Initializable, OwnableUpgradeable, UUPSUpgradeable {
    uint256 private _value;
    string private _name;
    
    event ValueChanged(uint256 newValue);
    event NameChanged(string newName);
    
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }
    
    function initialize(address initialOwner) public initializer {
        __Ownable_init(initialOwner);
        _value = 0;
        _name = "StorageV1";
    }
    
    function setValue(uint256 newValue) public {
        _value = newValue;
        emit ValueChanged(newValue);
    }
    
    function getValue() public view returns (uint256) {
        return _value;
    }
    
    function setName(string memory newName) public {
        _name = newName;
        emit NameChanged(newName);
    }
    
    function getName() public view returns (string memory) {
        return _name;
    }
    
    function getVersion() public pure returns (string memory) {
        return "V1";
    }
    
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
} 