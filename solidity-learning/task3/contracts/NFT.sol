// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title NFT
 * @dev 实现ERC721标准的NFT合约，支持铸造和转移NFT
 */
contract NFT is ERC721URIStorage, Ownable {
    using Strings for uint256;

    uint256 private _tokenIdCounter;
    string private _baseTokenURI;

    event NFTMinted(address indexed to, uint256 indexed tokenId, string tokenURI);

    /**
     * @dev 构造函数
     * @param name NFT名称
     * @param symbol NFT符号
     * @param baseTokenURI 基础URI
     */
    constructor(
        string memory name,
        string memory symbol,
        string memory baseTokenURI
    ) ERC721(name, symbol) Ownable(msg.sender) {
        _baseTokenURI = baseTokenURI;
    }

    /**
     * @dev 铸造新的NFT
     * @param to 接收者地址
     * @param tokenURI 代币URI
     * @return tokenId 新铸造的NFT的ID
     */
    function mint(address to, string memory tokenURI) public returns (uint256) {
        uint256 tokenId = _tokenIdCounter;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, tokenURI);
        _tokenIdCounter++;

        emit NFTMinted(to, tokenId, tokenURI);
        return tokenId;
    }

    /**
     * @dev 设置基础URI
     * @param baseTokenURI 新的基础URI
     */
    function setBaseURI(string memory baseTokenURI) external onlyOwner {
        _baseTokenURI = baseTokenURI;
    }

    /**
     * @dev 获取当前的代币ID计数器值
     * @return 当前的代币ID计数器值
     */
    function getCurrentTokenId() external view returns (uint256) {
        return _tokenIdCounter;
    }

    /**
     * @dev 重写基础URI函数
     */
    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }
}