// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@chainlink/contracts/src/v0.8/ccip/interfaces/IRouterClient.sol";
import "@chainlink/contracts/src/v0.8/ccip/libraries/Client.sol";

contract MockRouter is IRouterClient {
    uint256 private mockFee = 0.01 ether;
    mapping(bytes32 => bool) public sentMessages;

    event MessageSent(
        bytes32 indexed messageId,
        uint64 indexed destinationChainSelector,
        address receiver,
        bytes data,
        address feeToken,
        uint256 fees
    );

    function ccipSend(uint64 destinationChainSelector, Client.EVM2AnyMessage memory message)
        external
        payable
        override
        returns (bytes32)
    {
        // 简单的模拟实现，生成一个随机的messageId
        bytes32 messageId = keccak256(
            abi.encode(
                destinationChainSelector,
                message.receiver,
                message.data,
                block.timestamp,
                msg.sender
            )
        );

        sentMessages[messageId] = true;

        emit MessageSent(
            messageId,
            destinationChainSelector,
            abi.decode(message.receiver, (address)),
            message.data,
            message.feeToken,
            mockFee
        );

        return messageId;
    }

    function getFee(uint64 destinationChainSelector, Client.EVM2AnyMessage memory message)
        external
        view
        override
        returns (uint256)
    {
        return mockFee;
    }

    function getSupportedTokens(uint64 chainSelector) external view override returns (address[] memory) {
        address[] memory tokens = new address[](1);
        tokens[0] = address(0); // 只支持原生代币
        return tokens;
    }

    function isChainSupported(uint64 chainSelector) external view override returns (bool) {
        return true; // 支持所有链
    }

    // 模拟发送消息到目标合约
    function simulateMessageReceived(
        address targetContract,
        uint64 sourceChainSelector,
        address sender,
        bytes memory data
    ) external {
        // 这个函数在实际的Router中不存在，仅用于测试
        // 它模拟了一个消息从另一个链到达
        bytes memory callData = abi.encodeWithSignature(
            "_ccipReceive((uint64,bytes,bytes,address,uint256,bytes))",
            Client.Any2EVMMessage({
                messageId: bytes32(0),
                sourceChainSelector: sourceChainSelector,
                sender: abi.encode(sender),
                data: data,
                tokenAmounts: new Client.EVMTokenAmount[](0),
                extraArgs: ""
            })
        );

        (bool success, ) = targetContract.call(callData);
        require(success, "Failed to deliver message");
    }
}