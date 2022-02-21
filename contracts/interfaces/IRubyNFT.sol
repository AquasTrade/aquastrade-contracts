// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.6.12;
import "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol";

interface IRubyNFT is IERC721Upgradeable {
    function nftIds() external view returns (uint256);

    function nftFactory() external view returns (address);

    function mint(address to) external;

    function setNftFactory(address newNftFactory) external;
}
