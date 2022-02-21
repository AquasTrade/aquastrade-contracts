// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

import "./interfaces/IRubyFeeAdmin.sol";

contract RubyFeeAdmin is IRubyFeeAdmin, OwnableUpgradeable {
    address public override freeSwapNFT;

    function initialize(address _owner, address _freeSwapNFT) public initializer {
        require(_owner != address(0), "FeeAdmin: Invalid owner address.");
        require(_freeSwapNFT != address(0), "FeeAdmin: Invalid RUBY free swap nft address.");
        freeSwapNFT = _freeSwapNFT;

        OwnableUpgradeable.__Ownable_init();
        transferOwnership(_owner);
    }

    /**
        @notice Calculate the fee multiplier that needs to be applied in the 
        AMM swapping calculations. The fee deduction is dependent on the
        `user`. The fee multiplier is determined by internal rules. Currently the 
        single rule is having balance of at least 1 at the RubyProfileNFT contract.
        In the future more rules should be added.
        The `feeMultiplier` is in range of [997, 1000]: 
            - 997 means fee of 30 basis points
            - 1000 means fee of 0 basis points
        @param user - the address of the user
        @param feeMultiplier - uniswapv2 fee multiplier, in range: [997, 1000]
     */
    function calculateAmmSwapFeeDeduction(address user) external view override returns (uint256 feeMultiplier) {
        if (IERC721(freeSwapNFT).balanceOf(user) > 0) {
            return 1000; // no fee
        }

        return 997; // 30 bps fee
    }

    // function calculateLPFeeDeduction(address user) public view returns (uint256 feeAmount) {

    // }
}
