// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

/// @title SimpleMarketplace — Minimal NFT marketplace for Reactivity demo
/// @author GDA Labs
contract SimpleMarketplace {
    struct Listing {
        address seller;
        address nftContract;
        uint256 tokenId;
        uint256 price;
        bool active;
    }

    uint256 public nextListingId;
    mapping(uint256 => Listing) public listings;

    /// @dev The key event that Reactivity subscribes to
    event Listed(
        uint256 indexed listingId,
        address indexed nftContract,
        uint256 indexed tokenId,
        address seller,
        uint256 price
    );

    event Sold(
        uint256 indexed listingId,
        address indexed buyer,
        uint256 price
    );

    event Cancelled(uint256 indexed listingId);

    /// @notice List an NFT for sale. Seller must approve this contract first.
    function list(address nftContract, uint256 tokenId, uint256 price) external returns (uint256 listingId) {
        require(price > 0, "Price must be > 0");
        IERC721(nftContract).transferFrom(msg.sender, address(this), tokenId);

        listingId = nextListingId++;
        listings[listingId] = Listing({
            seller: msg.sender,
            nftContract: nftContract,
            tokenId: tokenId,
            price: price,
            active: true
        });

        emit Listed(listingId, nftContract, tokenId, msg.sender, price);
    }

    /// @notice Buy a listed NFT by sending exact price in STT
    function buy(uint256 listingId) external payable {
        Listing storage l = listings[listingId];
        require(l.active, "Not active");
        require(msg.value >= l.price, "Insufficient payment");

        l.active = false;
        IERC721(l.nftContract).transferFrom(address(this), msg.sender, l.tokenId);

        // Pay seller
        (bool ok, ) = l.seller.call{value: l.price}("");
        require(ok, "Payment failed");

        // Refund excess
        if (msg.value > l.price) {
            (bool refundOk, ) = msg.sender.call{value: msg.value - l.price}("");
            require(refundOk, "Refund failed");
        }

        emit Sold(listingId, msg.sender, l.price);
    }

    /// @notice Cancel a listing (seller only)
    function cancel(uint256 listingId) external {
        Listing storage l = listings[listingId];
        require(l.active, "Not active");
        require(l.seller == msg.sender, "Not seller");

        l.active = false;
        IERC721(l.nftContract).transferFrom(address(this), msg.sender, l.tokenId);

        emit Cancelled(listingId);
    }

    /// @notice Get floor price hint (used by sniper for comparison)
    function getListingPrice(uint256 listingId) external view returns (uint256) {
        return listings[listingId].price;
    }
}
