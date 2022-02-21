// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.6.12;

interface IRubyFeeAdmin {
    function freeSwapNFT() external view returns (address);

    function calculateAmmSwapFeeDeduction(address user) external view returns (uint256 feeMultiplier);
}