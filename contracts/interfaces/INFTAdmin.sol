// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;

interface INFTAdmin {
    event MinterSet(address indexed minter, bool allowance);

    event GoldSwapNFTSet(address indexed goldSwapNFT);
    event SilverSwapNFTSet(address indexed silverSwapNFT);
    event BronzeSwapNFTSet(address indexed bronzeSwapNFT);
    event ProfileNFTset(address indexed profileNFT);

    function profileNFT() external view returns (address);

    function goldSwapNFT() external view returns (address);

    function silverSwapNFT() external view returns (address);

    function bronzeSwapNFT() external view returns (address);

    function minters(address minter) external view returns (bool);

    function calculateAmmSwapFeeDeduction(address user) external view returns (uint256 feeMultiplier);

    function mintProfileNFT(address user) external;

    function setProfileNFT(address newProfileNFT) external;

    function setGoldSwapNFT(address newSwapNFT) external;

    function setSilverSwapNFT(address newSwapNFT) external;

    function setBronzeSwapNFT(address newSwapNFT) external;

    function setMinter(address minter, bool allowance) external;
}
