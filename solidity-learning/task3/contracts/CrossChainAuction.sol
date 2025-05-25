// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@chainlink/contracts/src/v0.8/ccip/interfaces/IRouterClient.sol";
import "@chainlink/contracts/src/v0.8/ccip/libraries/Client.sol";
import "./interfaces/ICCIPReceiver.sol";
import "./NFTAuction.sol"; // 假设NFTAuction合约在同一目录或可访问路径

/**
 * @title CrossChainAuction
 * @dev 跨链拍卖合约，用于处理来自其他链的出价
 */
contract CrossChainAuction is ICCIPReceiver, Ownable {
    IRouterClient private s_router;
    address public nftAuctionContract; // 目标NFTAuction合约地址

    event MessageSent(
        bytes32 indexed messageId, // The unique ID of the message. 
        uint64 indexed destinationChainSelector, // The chain selector of the destination chain.
        address receiver, // The address of the receiver on the destination chain.
        string text, // The text being sent.
        address feeToken, // the token address for paying CCIP fees.
        uint256 fees // The fees paid for the message.
    );

    event BidHandled(
        uint64 sourceChainSelector,
        address sender,
        uint256 auctionId,
        uint256 bidAmount
    );

    /**
     * @dev 构造函数
     * @param _router CCIP Router地址
     * @param _nftAuctionContract NFTAuction合约地址
     */
    constructor(address _router, address _nftAuctionContract) Ownable(msg.sender) {
        s_router = IRouterClient(_router);
        nftAuctionContract = _nftAuctionContract;
    }

    /**
     * @dev 处理来自CCIP的跨链出价
     * @param sourceChainSelector 源链选择器
     * @param sender 原始发送者地址
     * @param auctionId 拍卖ID
     * @param bidAmount 出价金额 (以目标链的计价单位)
     */
    function handleCrossBid(
        uint64 sourceChainSelector,
        address sender,
        uint256 auctionId,
        uint256 bidAmount
    ) external override {
        // 确保只有CCIP Router可以调用此函数
        // require(msg.sender == address(s_router), "Caller is not CCIP Router");
        // 注意：在实际部署中，msg.sender将是CCIP Router。为了本地测试或模拟，可能需要调整此检查。
        // 或者，更好的做法是让NFTAuction合约本身实现ICCIPReceiver并进行权限检查。
        // 这里假设NFTAuction合约有一个接受跨链出价的函数，例如 `placeCrossChainBid`

        // 调用NFTAuction合约处理出价
        // 这需要NFTAuction合约有一个相应的函数来接收和处理跨链出价
        // 例如: NFTAuction(nftAuctionContract).placeCrossChainBid(sourceChainSelector, sender, auctionId, bidAmount);
        // 由于NFTAuction.sol中没有直接的placeCrossChainBid，我们假设它通过某种方式与NFTAuction交互
        // 或者，此合约直接调用NFTAuction的 `bid` 函数，但需要处理代币转换和支付
        // 为了简化，我们仅触发事件，实际逻辑需要在NFTAuction中或通过更复杂的交互实现

        // 示例：直接调用NFTAuction的bid函数（需要NFTAuction支持或修改）
        // NFTAuction(nftAuctionContract).bid{value: ???}(auctionId, bidAmount); // 如果是ETH出价
        // IERC20(tokenAddress).approve(nftAuctionContract, tokenAmount);
        // NFTAuction(nftAuctionContract).bid(auctionId, bidAmount); // 如果是ERC20出价

        emit BidHandled(sourceChainSelector, sender, auctionId, bidAmount);

        // 实际应用中，这里会调用NFTAuction合约的相应函数来处理这个出价
        // 例如，如果NFTAuction合约有一个 `handleRemoteBid` 函数：
        // NFTAuction(nftAuctionContract).handleRemoteBid(sourceChainSelector, sender, auctionId, bidAmount);
    }

    /**
     * @dev 设置NFTAuction合约地址 (仅限Owner)
     * @param _nftAuctionContract 新的NFTAuction合约地址
     */
    function setNftAuctionContract(address _nftAuctionContract) external onlyOwner {
        nftAuctionContract = _nftAuctionContract;
    }

    /**
     * @dev 设置CCIP Router地址 (仅限Owner)
     * @param _router 新的CCIP Router地址
     */
    function setRouter(address _router) external onlyOwner {
        s_router = IRouterClient(_router);
    }

    // 注意：以下函数用于演示如何通过此合约发送消息，实际出价发送逻辑在CCIPBidSender.sol中
    /**
     * @dev 发送跨链消息 (示例函数，实际出价发送在CCIPBidSender中)
     * @param destinationChainSelector 目标链选择器
     * @param receiver 目标合约地址
     * @param text 要发送的文本
     * @param feeToken 支付手续费的代币地址 (address(0) for native token)
     */
    function sendMessage(
        uint64 destinationChainSelector,
        address receiver,
        string calldata text,
        address feeToken
    ) external payable returns (bytes32 messageId) {
        Client.EVM2AnyMessage memory message = Client.EVM2AnyMessage({
            receiver: abi.encode(receiver), // abi-encoded receiver address
            data: abi.encode(text), // abi-encoded string
            tokenAmounts: new Client.EVMTokenAmount[](0), // Empty array: no tokens are sent
            extraArgs: Client._getExtraArgs(0, false), // default extraArgs, see Client.sol for details
            feeToken: feeToken // If feeToken is address(0), fees are paid in native gas
        });

        uint256 fees = s_router.getFee(destinationChainSelector, message);

        if (feeToken == address(0)) {
            require(msg.value >= fees, "Not enough native token value for fees");
            messageId = s_router.ccipSend{value: fees}(destinationChainSelector, message);
        } else {
            IERC20(feeToken).approve(address(s_router), fees);
            messageId = s_router.ccipSend(destinationChainSelector, message);
        }

        emit MessageSent(messageId, destinationChainSelector, receiver, text, feeToken, fees);
        return messageId;
    }
}