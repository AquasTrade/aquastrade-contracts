// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";

/**
 * @dev THIS CONTRACT IS FOR TESTING PURPOSES ONLY.
 */
contract Mock_erc721 is ERC721, IERC721Receiver {
    constructor() ERC721("Lottery Bonus", "LB") public {
    }

    function mint(address _to, uint256 tokenId) public {
        _safeMint(_to, tokenId);
    }

    function onERC721Received(address, address, uint256, bytes memory) public virtual override returns (bytes4) {
        return this.onERC721Received.selector;
    }
}