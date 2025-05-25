// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@chainlink/contracts/src/v0.8/ccip/interfaces/IRouterClient.sol";
import "@chainlink/contracts/src/v0.8/ccip/libraries/Client.sol";
import "./interfaces/ICCIPReceiver.sol"; // 用于获取handleCrossBid的函数选择器

/**
 * @title CCIPBidSender
 * @dev 合约用于通过CCIP发送跨链出价
 */
contract CCIPBidSender is Ownable {
    IRouterClient private s_router;

    event MessageSent(
        bytes32 indexed messageId, // The unique ID of the message.
        uint64 indexed destinationChainSelector, // The chain selector of the destination chain.
        address receiver, // The address of the receiver on the destination chain.
        uint256 auctionId,
        uint256 bidAmount,
        address feeToken, // the token address for paying CCIP fees.
        uint256 fees // The fees paid for the message.
    );

    /**
     * @dev 构造函数
     * @param _router CCIP Router地址
     */
    constructor(address _router) Ownable(msg.sender) {
        s_router = IRouterClient(_router);
    }

    /**
     * @dev 发送跨链出价
     * @param destinationChainSelector 目标链选择器
     * @param receiver 目标链上的CrossChainAuction合约地址
     * @param auctionId 拍卖ID
     * @param bidAmount 出价金额 (以目标链的计价单位)
     * @param feeToken 支付CCIP费用的代币地址 (address(0) 表示使用原生代币)
     */
    function sendBid(
        uint64 destinationChainSelector,
        address receiver,
        uint256 auctionId,
        uint256 bidAmount,
        address feeToken
    ) external payable returns (bytes32 messageId) {
        // 构建发送给ICCIPReceiver.handleCrossBid的数据
        // function handleCrossBid(uint64 sourceChainSelector, address sender, uint256 auctionId, uint256 bidAmount)
        // 在目标链，sourceChainSelector 会是本链的selector, sender 会是本合约在目标链的对应地址 (或原始调用者，取决于CCIP配置)
        bytes memory data = abi.encodeWithSelector(
            ICCIPReceiver.handleCrossBid.selector,
            0, // sourceChainSelector - CCIP Router会填充这个
            msg.sender, // sender - CCIP Router会填充这个，通常是此合约在源链的地址，或原始msg.sender
            auctionId,
            bidAmount
        );

        Client.EVM2AnyMessage memory message = Client.EVM2AnyMessage({
            receiver: abi.encode(receiver), // abi-encoded receiver address
            data: data, // abi-encoded data for handleCrossBid
            tokenAmounts: new Client.EVMTokenAmount[](0), // 我们不通过CCIP消息本身发送代币，出价的代币处理在目标链的NFTAuction合约中
            extraArgs: Client.encodeEVMExtraArgs(Client.EVMExtraArgsV1({gasLimit: 0})), // default extraArgs, gasLimit: 0 often means router default
            feeToken: feeToken // If feeToken is address(0), fees are paid in native gas
        });

        uint256 fees = s_router.getFee(destinationChainSelector, message);

        if (feeToken == address(0)) {
            require(msg.value >= fees, "CCIPBidSender: Not enough native token for fees");
            // 发送消息并支付原生代币费用
            messageId = s_router.ccipSend{value: fees}(destinationChainSelector, message);
        } else {
            // 如果使用ERC20支付费用，需要确保此合约已批准Router花费这些代币
            // 通常，用户会先将ERC20费用代币转给此合约，然后此合约批准Router
            // 为简化，这里假设调用者已确保此合约有足够余额并已批准Router
            // 在实际应用中，可能需要一个额外的步骤来处理ERC20费用的充值和批准
            require(IERC20(feeToken).balanceOf(address(this)) >= fees, "CCIPBidSender: Insufficient fee token balance in sender contract");
            require(IERC20(feeToken).allowance(address(this), address(s_router)) >= fees, "CCIPBidSender: Router not approved for fee token by sender contract");
            messageId = s_router.ccipSend(destinationChainSelector, message);
        }

        emit MessageSent(messageId, destinationChainSelector, receiver, auctionId, bidAmount, feeToken, fees);
        return messageId;
    }

    /**
     * @dev 设置CCIP Router地址 (仅限Owner)
     * @param _router 新的CCIP Router地址
     */
    function setRouter(address _router) external onlyOwner {
        s_router = IRouterClient(_router);
    }

    /**
     * @dev 允许Owner批准Router花费ERC20代币作为CCIP费用 (仅限Owner)
     * @param feeToken 要批准的ERC20代币地址
     * @param amount 要批准的数量
     */
    function approveRouter(address feeToken, uint256 amount) external onlyOwner {
        require(feeToken != address(0), "CCIPBidSender: Cannot approve zero address");
        IERC20(feeToken).approve(address(s_router), amount);
    }

    /**
     * @dev 允许Owner提取合约中的ERC20代币 (用于手续费代币的回收等)
     * @param tokenAddress 要提取的ERC20代币地址
     * @param amount 要提取的数量
     */
    function withdrawTokens(address tokenAddress, uint256 amount) external onlyOwner {
        IERC20(tokenAddress).transfer(owner(), amount);
    }

    /**
     * @dev 允许Owner提取合约中的ETH (用于原生代币手续费的回收等)
     */
    function withdrawNative() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }

    // Fallback function to receive ETH (e.g., for paying native fees)
    receive() external payable {}
}