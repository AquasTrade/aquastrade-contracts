// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.6.12;

interface IRubyNFTFactory {
    function enabledNfts(address nft) external view returns (bool);

    function minterNftAllowances(address minter, address nft) external view returns (bool);

    function maxAmountOfNfts() external view returns (uint256);

    function initialNfts(uint256 index) external view returns (address);

    function setInitialNfts(address _defaultMinter, address[] calldata _initialNfts) external;

    function enableNft(address nft) external;

    function disableNft(address nft) external;

    function setMinter(
        address nft,
        address minter,
        bool allowance
    ) external;

    function mint(address receiver, address[] calldata nfts) external;

    function mintInitial(address receiver) external;
}
