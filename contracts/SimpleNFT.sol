// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title SimpleNFT — Minimal ERC721 for demo purposes
/// @author GDA Labs
contract SimpleNFT is ERC721, Ownable {
    uint256 private _nextTokenId;

    constructor() ERC721("Somnia Demo NFT", "SDNFT") Ownable(msg.sender) {}

    function mint(address to) external returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        _mint(to, tokenId);
        return tokenId;
    }

    function batchMint(address to, uint256 count) external returns (uint256 startId) {
        startId = _nextTokenId;
        for (uint256 i = 0; i < count; i++) {
            _mint(to, _nextTokenId++);
        }
    }
}
