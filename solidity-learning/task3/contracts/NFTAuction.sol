// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./interfaces/IPriceFeed.sol";
import "./PriceConverter.sol";

/**
 * @title NFTAuction
 * @dev NFT拍卖合约，支持ETH和ERC20代币出价，可升级
 */
contract NFTAuction is Initializable, OwnableUpgradeable, UUPSUpgradeable {
    using PriceConverter for IPriceFeed;

    // 拍卖状态
    enum AuctionState {
        Pending, // 等待开始
        Active, // 进行中
        Ended, // 已结束
        Cancelled // 已取消
    }

    // 拍卖信息
    struct Auction {
        uint256 auctionId; // 拍卖ID
        address nftContract; // NFT合约地址
        uint256 tokenId; // NFT的ID
        address payable seller; // 卖家地址
        uint256 startingPrice; // 起拍价 (USD)
        uint256 buyoutPrice; // 一口价 (USD)
        uint256 startTime; // 开始时间
        uint256 endTime; // 结束时间
        address highestBidder; // 最高出价者
        uint256 highestBid; // 最高出价 (USD)
        AuctionState state; // 拍卖状态
        address currency; // 支付货币 (address(0) for ETH)
        uint256 minBidIncrement; // 最小加价幅度 (USD)
    }

    // 事件
    event AuctionCreated(
        uint256 indexed auctionId,
        address indexed nftContract,
        uint256 indexed tokenId,
        address seller,
        uint256 startingPrice,
        uint256 buyoutPrice,
        uint256 startTime,
        uint256 endTime,
        address currency,
        uint256 minBidIncrement
    );
    event BidPlaced(
        uint256 indexed auctionId,
        address indexed bidder,
        uint256 amount,
        address currency
    );
    event AuctionEnded(
        uint256 indexed auctionId,
        address indexed winner,
        uint256 winningBid
    );
    event AuctionCancelled(uint256 indexed auctionId);
    event NFTClaimed(uint256 indexed auctionId, address indexed claimer, uint256 tokenId);
    event FundsWithdrawn(address indexed user, uint256 amount, address currency);

    // 状态变量
    uint256 public auctionCounter;
    mapping(uint256 => Auction) public auctions;
    mapping(address => uint256) public ethBalances; // ETH余额
    mapping(address => mapping(address => uint256)) public tokenBalances; // ERC20代币余额
    IPriceFeed public priceFeed;
    address public feeRecipient; // 手续费接收地址
    uint256 public feePercentage; // 手续费百分比 (例如 250 表示 2.5%)

    // 修饰符
    modifier onlySeller(uint256 auctionId) {
        require(msg.sender == auctions[auctionId].seller, "Not the seller");
        _;
    }

    modifier auctionExists(uint256 auctionId) {
        require(auctions[auctionId].seller != address(0), "Auction does not exist");
        _;
    }

    modifier auctionActive(uint256 auctionId) {
        require(auctions[auctionId].state == AuctionState.Active, "Auction not active");
        _;
    }

    /**
     * @dev 初始化合约
     * @param _priceFeed PriceFeed合约地址
     * @param _feeRecipient 手续费接收地址
     * @param _feePercentage 手续费百分比
     */
    function initialize(
        address _priceFeed,
        address _feeRecipient,
        uint256 _feePercentage
    ) public initializer {
        __Ownable_init(msg.sender);
        __UUPSUpgradeable_init();
        priceFeed = IPriceFeed(_priceFeed);
        feeRecipient = _feeRecipient;
        feePercentage = _feePercentage;
    }

    /**
     * @dev 创建新的拍卖
     * @param nftContract NFT合约地址
     * @param tokenId NFT的ID
     * @param startingPrice 起拍价 (USD)
     * @param buyoutPrice 一口价 (USD, 0 if no buyout)
     * @param duration 拍卖持续时间 (秒)
     * @param currency 支付货币 (address(0) for ETH, ERC20 address for token)
     * @param minBidIncrement 最小加价幅度 (USD)
     */
    function createAuction(
        address nftContract,
        uint256 tokenId,
        uint256 startingPrice,
        uint256 buyoutPrice,
        uint256 duration,
        address currency,
        uint256 minBidIncrement
    ) external {
        require(startingPrice > 0, "Starting price must be > 0");
        require(duration > 0, "Duration must be > 0");
        require(minBidIncrement > 0, "Min bid increment must be > 0");
        if (buyoutPrice > 0) {
            require(buyoutPrice > startingPrice, "Buyout price must be > starting price");
        }

        IERC721(nftContract).transferFrom(msg.sender, address(this), tokenId);

        uint256 auctionId = auctionCounter++;
        auctions[auctionId] = Auction({
            auctionId: auctionId,
            nftContract: nftContract,
            tokenId: tokenId,
            seller: payable(msg.sender),
            startingPrice: startingPrice,
            buyoutPrice: buyoutPrice,
            startTime: block.timestamp,
            endTime: block.timestamp + duration,
            highestBidder: address(0),
            highestBid: 0,
            state: AuctionState.Active,
            currency: currency,
            minBidIncrement: minBidIncrement
        });

        emit AuctionCreated(
            auctionId,
            nftContract,
            tokenId,
            msg.sender,
            startingPrice,
            buyoutPrice,
            block.timestamp,
            block.timestamp + duration,
            currency,
            minBidIncrement
        );
    }

    /**
     * @dev 出价
     * @param auctionId 拍卖ID
     * @param amount 出价金额 (USD)
     */
    function bid(uint256 auctionId, uint256 amount) external payable auctionExists(auctionId) auctionActive(auctionId) {
        Auction storage currentAuction = auctions[auctionId];
        require(block.timestamp < currentAuction.endTime, "Auction ended");
        require(amount > currentAuction.highestBid, "Bid not high enough");
        require(amount >= currentAuction.startingPrice, "Bid below starting price");
        if (currentAuction.highestBid > 0) {
            require(amount >= currentAuction.highestBid + currentAuction.minBidIncrement, "Bid increment too small");
        }

        uint256 paymentAmount;
        if (currentAuction.currency == address(0)) { // ETH
            paymentAmount = priceFeed.usdToEth(amount);
            require(msg.value >= paymentAmount, "Incorrect ETH amount sent");
        } else { // ERC20
            paymentAmount = priceFeed.usdToToken(amount, currentAuction.currency);
            IERC20 token = IERC20(currentAuction.currency);
            require(token.allowance(msg.sender, address(this)) >= paymentAmount, "Token allowance too low");
            token.transferFrom(msg.sender, address(this), paymentAmount);
        }

        // 退还之前的最高出价者的出价
        if (currentAuction.highestBidder != address(0)) {
            if (currentAuction.currency == address(0)) {
                ethBalances[currentAuction.highestBidder] += priceFeed.usdToEth(currentAuction.highestBid);
            } else {
                tokenBalances[currentAuction.currency][currentAuction.highestBidder] += priceFeed.usdToToken(currentAuction.highestBid, currentAuction.currency);
            }
        }

        currentAuction.highestBidder = msg.sender;
        currentAuction.highestBid = amount;

        emit BidPlaced(auctionId, msg.sender, amount, currentAuction.currency);

        // 如果达到一口价，则结束拍卖
        if (currentAuction.buyoutPrice > 0 && amount >= currentAuction.buyoutPrice) {
            _endAuction(auctionId);
        }
    }

    /**
     * @dev 结束拍卖
     * @param auctionId 拍卖ID
     */
    function endAuction(uint256 auctionId) external auctionExists(auctionId) {
        Auction storage currentAuction = auctions[auctionId];
        require(block.timestamp >= currentAuction.endTime || currentAuction.state == AuctionState.Active, "Auction not ended or already processed");
        require(currentAuction.state != AuctionState.Ended && currentAuction.state != AuctionState.Cancelled, "Auction already processed");
        _endAuction(auctionId);
    }

    /**
     * @dev 内部结束拍卖逻辑
     * @param auctionId 拍卖ID
     */
    function _endAuction(uint256 auctionId) internal {
        Auction storage currentAuction = auctions[auctionId];
        currentAuction.state = AuctionState.Ended;

        if (currentAuction.highestBidder != address(0)) {
            // 将NFT转移给获胜者
            IERC721(currentAuction.nftContract).transferFrom(address(this), currentAuction.highestBidder, currentAuction.tokenId);
            emit NFTClaimed(auctionId, currentAuction.highestBidder, currentAuction.tokenId);

            // 计算手续费和卖家收益
            uint256 fee = (currentAuction.highestBid * feePercentage) / 10000;
            uint256 sellerProceeds = currentAuction.highestBid - fee;

            // 将手续费和卖家收益存入合约余额
            if (currentAuction.currency == address(0)) {
                ethBalances[feeRecipient] += priceFeed.usdToEth(fee);
                ethBalances[currentAuction.seller] += priceFeed.usdToEth(sellerProceeds);
            } else {
                tokenBalances[currentAuction.currency][feeRecipient] += priceFeed.usdToToken(fee, currentAuction.currency);
                tokenBalances[currentAuction.currency][currentAuction.seller] += priceFeed.usdToToken(sellerProceeds, currentAuction.currency);
            }
            emit AuctionEnded(auctionId, currentAuction.highestBidder, currentAuction.highestBid);
        } else {
            // 如果没有出价，将NFT退还给卖家
            IERC721(currentAuction.nftContract).transferFrom(address(this), currentAuction.seller, currentAuction.tokenId);
            emit AuctionEnded(auctionId, address(0), 0);
        }
    }

    /**
     * @dev 取消拍卖 (仅限卖家，在无人出价时)
     * @param auctionId 拍卖ID
     */
    function cancelAuction(uint256 auctionId) external auctionExists(auctionId) onlySeller(auctionId) {
        Auction storage currentAuction = auctions[auctionId];
        require(currentAuction.state == AuctionState.Active, "Auction not active");
        require(currentAuction.highestBidder == address(0), "Cannot cancel with bids");

        currentAuction.state = AuctionState.Cancelled;
        IERC721(currentAuction.nftContract).transferFrom(address(this), currentAuction.seller, currentAuction.tokenId);
        emit AuctionCancelled(auctionId);
    }

    /**
     * @dev 提取ETH资金
     */
    function withdrawEth() external {
        uint256 amount = ethBalances[msg.sender];
        require(amount > 0, "No ETH to withdraw");
        ethBalances[msg.sender] = 0;
        payable(msg.sender).transfer(amount);
        emit FundsWithdrawn(msg.sender, amount, address(0));
    }

    /**
     * @dev 提取ERC20代币资金
     * @param tokenContract 代币合约地址
     */
    function withdrawToken(address tokenContract) external {
        uint256 amount = tokenBalances[tokenContract][msg.sender];
        require(amount > 0, "No tokens to withdraw");
        tokenBalances[tokenContract][msg.sender] = 0;
        IERC20(tokenContract).transfer(msg.sender, amount);
        emit FundsWithdrawn(msg.sender, amount, tokenContract);
    }

    /**
     * @dev 设置手续费接收地址
     * @param _feeRecipient 新的手续费接收地址
     */
    function setFeeRecipient(address _feeRecipient) external onlyOwner {
        feeRecipient = _feeRecipient;
    }

    /**
     * @dev 设置手续费百分比
     * @param _feePercentage 新的手续费百分比 (例如 250 表示 2.5%)
     */
    function setFeePercentage(uint256 _feePercentage) external onlyOwner {
        feePercentage = _feePercentage;
    }

    /**
     * @dev 设置价格预言机地址
     * @param _priceFeed 新的价格预言机地址
     */
    function setPriceFeed(address _priceFeed) external onlyOwner {
        priceFeed = IPriceFeed(_priceFeed);
    }

    /**
     * @dev UUPS升级授权函数
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}