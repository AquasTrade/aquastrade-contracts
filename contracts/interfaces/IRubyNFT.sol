// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.6.12;
import "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol";

interface IRubyNFT is IERC721Upgradeable {
    function nftIds() external view returns (uint256);

    function minters(address minter) external view returns (bool);

    function description() external view returns (string memory);

    function visualAppearance() external view returns (string memory);

    function mint(address to) external;

    function setMinter(address minter, bool allowance) external;

    function setDescription(string memory _description) external;

    function setVisualAppearance(string memory _visualAppearance) external;
}