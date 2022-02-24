// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.6.12;

interface IRubyNFTAdmin {
    function profileNFT() external view returns (address);

    function minters(address minter) external view returns (bool);

    function calculateAmmSwapFeeDeduction(address user) external view returns (uint256 feeMultiplier);

    function mintProfileNFT(address user) external;

    function setProfileNFT(address newProfileNFT) external;

    function setMinter(address minter, bool isAllowed) external;
}
