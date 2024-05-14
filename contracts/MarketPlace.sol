// SPDX-License-Identifier: MIT
//pragma solidity ^0.8.9;
//pragma solidity =0.6.12;
pragma solidity 0.6.12;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract MarketPlace {
    using Counters for Counters.Counter;

    Counters.Counter public _itemCounter;

    struct Item {
        bool listing;
        address nft;
        uint256 id;
        uint256 price;
        address seller;
    }

    // nft => id => Item
    mapping(uint256 => Item) public items;
    IERC20 public immutable payToken;

    event Listed(address indexed nft, uint256 indexed id, address indexed seller, uint256 price);
    event Canceled(address indexed nft, uint256 indexed id, address indexed seller, uint256 price);
    event Bought(address indexed nft, uint256 indexed id, address indexed buyer, uint256 price);

    constructor(IERC20 _paytoken) public {
        payToken = _paytoken;
    }

    function listNFT(
        address nft,
        uint256 id,
        uint256 price
    ) public {
        uint256 itemCounter = _itemCounter.current();
        _itemCounter.increment();
        IERC721(nft).transferFrom(msg.sender, address(this), id);
        items[itemCounter] = Item({ listing: true, nft: nft, id: id, price: price, seller: msg.sender });
        emit Listed(nft, id, msg.sender, price);
    }

    function cancelListing(uint256 itemCounter) public {
        Item memory item = items[itemCounter];
        require(msg.sender == item.seller && item.listing, "!seller");
        IERC721(item.nft).transferFrom(address(this), item.seller, item.id);
        Item storage _item = items[itemCounter];
        _item.listing = false;
        emit Canceled(item.nft, item.id, item.seller, item.price);
    }

    function buy(uint256 itemCounter, uint256 amount) public {
        Item memory item = items[itemCounter];
        require(item.nft != address(0) && item.listing, "!listed");
        require(amount >= item.price, "invavlid amount");
        Item storage _item = items[itemCounter];
        _item.listing = false;
        payToken.transferFrom(msg.sender, item.seller, amount);
        IERC721(item.nft).transferFrom(address(this), msg.sender, item.id);
        emit Bought(item.nft, item.id, msg.sender, amount);
    }

    function getListedItems() public view returns (Item[] memory) {
        uint256 itemCounter = _itemCounter.current();
        Item[] memory _items = new Item[](itemCounter);
        for (uint256 i = 0; i < itemCounter; i++) {
            Item memory item = items[i];
            if (item.listing) {
                _items[i] = item;
            }
        }
        return _items;
    }
}
