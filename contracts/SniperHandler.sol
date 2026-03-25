// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "@somnia-chain/reactivity-contracts/contracts/SomniaEventHandler.sol";

/// @title SniperHandler — On-chain reactive NFT sniper
/// @author GDA Labs
/// @notice Subscribes to marketplace Listed events via Somnia Reactivity.
///         When a listing price is below the threshold, auto-buys it in the same block.
contract SniperHandler is SomniaEventHandler {
    /// @dev keccak256("Listed(uint256,address,uint256,address,uint256)")
    bytes32 public constant LISTED_SIG =
        keccak256("Listed(uint256,address,uint256,address,uint256)");

    address public owner;
    address public marketplace;
    uint256 public maxPrice;
    bool public active;

    // Stats
    uint256 public totalSniped;
    uint256 public totalSpent;

    event Sniped(uint256 indexed listingId, uint256 price, address nftContract, uint256 tokenId);
    event ConfigUpdated(address marketplace, uint256 maxPrice, bool active);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor(address _marketplace, uint256 _maxPrice) {
        owner = msg.sender;
        marketplace = _marketplace;
        maxPrice = _maxPrice;
        active = true;
    }

    /// @notice Called by Somnia Reactivity Precompile when a Listed event fires
    function _onEvent(
        address emitter,
        bytes32[] calldata topics,
        bytes calldata data
    ) internal override {
        // Only process Listed events from our marketplace
        if (!active) return;
        if (emitter != marketplace) return;
        if (topics[0] != LISTED_SIG) return;

        // Decode indexed params from topics
        uint256 listingId = uint256(topics[1]);
        address nftContract = address(uint160(uint256(topics[2])));
        uint256 tokenId = uint256(topics[3]);

        // Decode non-indexed params
        (address seller, uint256 price) = abi.decode(data, (address, uint256));

        // Don't snipe our own listings
        if (seller == owner) return;

        // Price check — is it below our threshold?
        if (price > maxPrice) return;

        // Check we have enough balance
        if (address(this).balance < price) return;

        // SNIPE! Buy immediately in the same block
        (bool ok, ) = marketplace.call{value: price}(
            abi.encodeWithSignature("buy(uint256)", listingId)
        );

        if (ok) {
            totalSniped++;
            totalSpent += price;
            emit Sniped(listingId, price, nftContract, tokenId);
        }
    }

    /// @notice Update sniper configuration
    function configure(address _marketplace, uint256 _maxPrice, bool _active) external onlyOwner {
        marketplace = _marketplace;
        maxPrice = _maxPrice;
        active = _active;
        emit ConfigUpdated(_marketplace, _maxPrice, _active);
    }

    /// @notice Withdraw STT balance
    function withdraw() external onlyOwner {
        (bool ok, ) = owner.call{value: address(this).balance}("");
        require(ok, "Withdraw failed");
    }

    /// @notice Withdraw a sniped NFT
    function withdrawNFT(address nftContract, uint256 tokenId, address to) external onlyOwner {
        IERC721Minimal(nftContract).transferFrom(address(this), to, tokenId);
    }

    /// @notice Fund the sniper with STT for auto-buying
    receive() external payable {}
}

interface IERC721Minimal {
    function transferFrom(address from, address to, uint256 tokenId) external;
}
