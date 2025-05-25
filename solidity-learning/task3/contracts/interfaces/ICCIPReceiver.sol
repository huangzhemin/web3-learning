// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface ICCIPReceiver {
    function handleCrossBid(
        uint64 sourceChainSelector,
        address sender,
        uint256 auctionId,
        uint256 bidAmount
    ) external;
}
