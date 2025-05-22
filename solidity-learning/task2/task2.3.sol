// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract BeggingContract {
    address public owner;
    mapping(address => uint256) public donations;
    address[] public donors;
    uint256 public startTime;
    uint256 public endTime;

    event Donation(address indexed donor, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    modifier onlyDuringDonationPeriod() {
        require(block.timestamp >= startTime && block.timestamp <= endTime, "Not in donation period");
        _;
    }

    constructor(uint256 _durationSeconds) {
        owner = msg.sender;
        startTime = block.timestamp;
        endTime = block.timestamp + _durationSeconds;
    }

    function donate() public payable onlyDuringDonationPeriod {
        require(msg.value > 0, "Donation must be greater than 0");
        if (donations[msg.sender] == 0) {
            donors.push(msg.sender);
        }
        donations[msg.sender] += msg.value;
        emit Donation(msg.sender, msg.value);
    }

    function withdraw() public onlyOwner {
        payable(owner).transfer(address(this).balance);
    }

    function getDonation(address _donor) public view returns (uint256) {
        return donations[_donor];
    }

    // 额外挑战：捐赠排行榜（前3名）
    function getTopDonors() public view returns (address[3] memory topDonors, uint256[3] memory topAmounts) {
        uint256[3] memory amounts;
        address[3] memory addrs;
        for (uint256 i = 0; i < donors.length; i++) {
            uint256 amount = donations[donors[i]];
            if (amount > amounts[0]) {
                // 下移
                amounts[2] = amounts[1];
                addrs[2] = addrs[1];
                amounts[1] = amounts[0];
                addrs[1] = addrs[0];
                amounts[0] = amount;
                addrs[0] = donors[i];
            } else if (amount > amounts[1]) {
                amounts[2] = amounts[1];
                addrs[2] = addrs[1];
                amounts[1] = amount;
                addrs[1] = donors[i];
            } else if (amount > amounts[2]) {
                amounts[2] = amount;
                addrs[2] = donors[i];
            }
        }
        return (addrs, amounts);
    }

    // 可选：查看捐赠时间段
    function getDonationPeriod() public view returns (uint256, uint256) {
        return (startTime, endTime);
    }
}