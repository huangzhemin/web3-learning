const { ethers, upgrades, network } = require("hardhat");
const hre = require("hardhat");
const { verify } = require("./utils/verify");

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);
    console.log("Account balance:", (await deployer.getBalance()).toString());

    const chainId = network.config.chainId;
    const isDevelopmentChain = chainId === 31337 || chainId === 1337;

    // Deploy PriceFeed (if needed, or use existing)
    // For actual testnets/mainnet, you'd use Chainlink's existing price feeds.
    // For local development, you might deploy a mock.
    let priceFeedAddress;
    if (isDevelopmentChain) {
        const PriceFeed = await ethers.getContractFactory("PriceFeed");
        // Deploy a mock price feed for local testing if you don't have one
        // For simplicity, let's assume you have a mock or will use a fixed address
        // const priceFeed = await PriceFeed.deploy();
        // await priceFeed.deployed();
        // priceFeedAddress = priceFeed.address;
        // console.log("Mock PriceFeed deployed to:", priceFeedAddress);
        // For this example, let's hardcode a mock address for local dev or use a pre-deployed one
        // You should replace this with actual deployment or a valid mock address
        console.log("Using a placeholder PriceFeed address for local development.");
        // priceFeedAddress = "0x0000000000000000000000000000000000000000"; // Replace if needed
    } else if (chainId === 11155111) { // Sepolia
        priceFeedAddress = process.env.SEPOLIA_PRICE_FEED_ADDRESS; // e.g., ETH/USD
    } else if (chainId === 80001) { // Mumbai
        priceFeedAddress = process.env.MUMBAI_PRICE_FEED_ADDRESS; // e.g., MATIC/USD
    }
    if (!priceFeedAddress) {
        console.warn("Price feed address is not set for this network. NFTAuction might not work correctly with price conversions.");
    }
    console.log(`Using PriceFeed address: ${priceFeedAddress} for network ${network.name}`);

    // Deploy NFT contract
    const NFT = await ethers.getContractFactory("NFT");
    const nftName = "MyCollectible";
    const nftSymbol = "MCT";
    const baseTokenURI = "ipfs://your_nft_cid_path/"; // Replace with your actual base URI
    const nft = await NFT.deploy(nftName, nftSymbol, baseTokenURI);
    await nft.deployed();
    console.log("NFT contract deployed to:", nft.address);

    // Deploy NFTAuction implementation contract
    const NFTAuction = await ethers.getContractFactory("NFTAuction");
    const auctionImplementation = await NFTAuction.deploy();
    await auctionImplementation.deployed();
    console.log("NFTAuction implementation deployed to:", auctionImplementation.address);

    // Deploy AuctionFactory (which deploys proxies for NFTAuction)
    const AuctionFactory = await ethers.getContractFactory("AuctionFactory");
    const auctionFactory = await upgrades.deployProxy(AuctionFactory, [auctionImplementation.address, priceFeedAddress], {
        initializer: "initialize",
        kind: "uups",
    });
    await auctionFactory.deployed();
    console.log("AuctionFactory (proxy) deployed to:", auctionFactory.address);
    console.log("AuctionFactory implementation address (logic):", await upgrades.erc1967.getImplementationAddress(auctionFactory.address));


    // --- CCIP Related Deployments ---
    let ccipRouterAddress;
    if (isDevelopmentChain) {
        // For local development, you might deploy a mock CCIP router or use a placeholder
        console.log("Using a placeholder CCIP Router address for local development.");
        // ccipRouterAddress = "0x0000000000000000000000000000000000000000"; // Replace if needed
    } else if (chainId === 11155111) { // Sepolia
        ccipRouterAddress = process.env.SEPOLIA_CCIP_ROUTER_ADDRESS;
    } else if (chainId === 80001) { // Mumbai
        ccipRouterAddress = process.env.MUMBAI_CCIP_ROUTER_ADDRESS;
    }
    if (!ccipRouterAddress) {
        console.warn("CCIP Router address is not set for this network. Cross-chain features will not work.");
    }
    console.log(`Using CCIP Router address: ${ccipRouterAddress} for network ${network.name}`);

    // Deploy CrossChainAuction contract
    const CrossChainAuction = await ethers.getContractFactory("CrossChainAuction");
    // The CrossChainAuction contract will interact with an NFTAuction instance.
    // For now, let's assume it will be configured post-deployment or interact with auctions created by the factory.
    // We'll pass a placeholder or the factory address for now, depending on design.
    // If CrossChainAuction needs to interact with a *specific* auction, that auction's address would be passed.
    // If it's more general, perhaps it doesn't need an NFTAuction address at construction.
    // Based on CrossChainAuction.sol, it takes an nftAuctionContract address.
    // For a generic setup, we might not have a single NFTAuction instance yet, or it might be the factory itself if it exposes such an interface.
    // Let's assume for now it's meant to be configured later or with a specific auction proxy.
    // We'll deploy it and it can be configured via setNftAuctionContract().
    // For initial deployment, we can pass address(0) or a deployed auction proxy if one is immediately created.
    const crossChainAuction = await CrossChainAuction.deploy(ccipRouterAddress, ethers.constants.AddressZero /* placeholder nftAuctionContract */);
    await crossChainAuction.deployed();
    console.log("CrossChainAuction contract deployed to:", crossChainAuction.address);

    // Deploy CCIPBidSender contract
    const CCIPBidSender = await ethers.getContractFactory("CCIPBidSender");
    const ccipBidSender = await CCIPBidSender.deploy(ccipRouterAddress);
    await ccipBidSender.deployed();
    console.log("CCIPBidSender contract deployed to:", ccipBidSender.address);

    // Verification
    if (!isDevelopmentChain && process.env.ETHERSCAN_API_KEY) {
        console.log("Verifying contracts on Etherscan...");
        await verify(nft.address, [nftName, nftSymbol, baseTokenURI]);
        await verify(auctionImplementation.address, []); // Implementation contract
        // Proxy verification is a bit different, usually verify the implementation
        // and Etherscan can often link the proxy if done correctly.
        // For UUPS proxies, you verify the implementation, and the proxy points to it.
        // The proxy itself (AuctionFactory) doesn't take constructor args in the same way for verification.
        // We verify the implementation that the proxy points to.
        const factoryImplAddress = await upgrades.erc1967.getImplementationAddress(auctionFactory.address);
        await verify(factoryImplAddress, []); // AuctionFactory implementation

        await verify(crossChainAuction.address, [ccipRouterAddress, ethers.constants.AddressZero]);
        await verify(ccipBidSender.address, [ccipRouterAddress]);
    }

    console.log("\n--- Deployment Summary ---");
    console.log(`NFT (${nftSymbol}): ${nft.address}`);
    console.log(`NFTAuction Implementation: ${auctionImplementation.address}`);
    console.log(`AuctionFactory (Proxy): ${auctionFactory.address}`);
    console.log(`   ↳ AuctionFactory Implementation: ${await upgrades.erc1967.getImplementationAddress(auctionFactory.address)}`);
    if (priceFeedAddress) console.log(`   ↳ Using PriceFeed: ${priceFeedAddress}`);
    console.log(`CrossChainAuction: ${crossChainAuction.address}`);
    console.log(`CCIPBidSender: ${ccipBidSender.address}`);
    if (ccipRouterAddress) console.log(`   ↳ Using CCIP Router: ${ccipRouterAddress}`);
    console.log("Deployment complete!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });