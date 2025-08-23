const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MyNFT", function () {
  let MyNFT, nft, owner, addr1, addr2;

  beforeEach(async function () {
    // 获取合约工厂和账户
    MyNFT = await ethers.getContractFactory("MyNFT");
    [owner, addr1, addr2] = await ethers.getSigners();

    // 部署合约
    nft = await MyNFT.deploy("Test NFT", "TNFT");
  });

  describe("部署", function () {
    it("应该正确设置名称和符号", async function () {
      expect(await nft.name()).to.equal("Test NFT");
      expect(await nft.symbol()).to.equal("TNFT");
    });

    it("应该将部署者设置为所有者", async function () {
      expect(await nft.owner()).to.equal(owner.address);
    });

    it("应该初始化 tokenCounter 为 0", async function () {
      expect(await nft.tokenCounter()).to.equal(0);
    });
  });

  describe("铸造", function () {
    const tokenURI = "ipfs://test-metadata.json";

    it("所有者应该能够铸造 NFT", async function () {
      await expect(nft.mintNFT(addr1.address, tokenURI))
        .to.emit(nft, "Transfer")
        .withArgs(ethers.ZeroAddress, addr1.address, 0);

      expect(await nft.ownerOf(0)).to.equal(addr1.address);
      expect(await nft.tokenURI(0)).to.equal(tokenURI);
      expect(await nft.tokenCounter()).to.equal(1);
    });

    it("非所有者不应该能够铸造 NFT", async function () {
      await expect(
        nft.connect(addr1).mintNFT(addr2.address, tokenURI)
      ).to.be.revertedWithCustomError(nft, "OwnableUnauthorizedAccount");
    });

    it("应该正确递增 tokenCounter", async function () {
      await nft.mintNFT(addr1.address, tokenURI);
      expect(await nft.tokenCounter()).to.equal(1);

      await nft.mintNFT(addr2.address, tokenURI);
      expect(await nft.tokenCounter()).to.equal(2);
    });

    it("应该正确设置 tokenURI", async function () {
      await nft.mintNFT(addr1.address, tokenURI);
      expect(await nft.tokenURI(0)).to.equal(tokenURI);
    });
  });

  describe("所有权", function () {
    it("应该正确转移 NFT 所有权", async function () {
      await nft.mintNFT(addr1.address, "test-uri");
      
      await nft.connect(addr1).transferFrom(addr1.address, addr2.address, 0);
      expect(await nft.ownerOf(0)).to.equal(addr2.address);
    });
  });
}); 