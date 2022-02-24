// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

import "./interfaces/IRubyNFTAdmin.sol";
import "./interfaces/IRubyNFT.sol";

contract RubyNFTAdmin is IRubyNFTAdmin, OwnableUpgradeable {
    address public override profileNFT;

    // profile NFT minters
    mapping(address => bool) public override minters;

    modifier onylMinter() {
        require(minters[msg.sender], "RubyNFTAdmin: Minting not allowed");
        _;
    }

    function initialize(address _owner, address _profileNFT) public initializer {
        require(_owner != address(0), "RubyNFTAdmin: Invalid owner address.");
        require(_profileNFT != address(0), "RubyNFTAdmin: Invalid RUBY profile nft.");
        profileNFT = _profileNFT;

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
     */
    function calculateAmmSwapFeeDeduction(address user) external view override returns (uint256 feeMultiplier) {
        // TODO: REPLACE with the RubyFreeSwapNFT address
        address freeSwapNFT = 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0;
        if (IRubyNFT(freeSwapNFT).balanceOf(user) > 0) {
            return 1000; // no fee
        }

        return 997; // 30 bps fee
    }

    // function calculateLPFeeDeduction(address user) public view returns (uint256 feeAmount) {

    // }

    // Mint profile NFT if the user has no profile NFTs
    // The exploitability of this is a feature. Users can mint multiple profile NFTs by design
    function mintProfileNFT(address user) external override onylMinter {
        if (IRubyNFT(profileNFT).balanceOf(user) == 0) {
            IRubyNFT(profileNFT).mint(user);
        }
    }

    // ADMIN FUNCTIONS
    function setProfileNFT(address newProfileNFT) external override onlyOwner {
        require(newProfileNFT != address(0), "RubyNFTAdmin: Invalid profile NFT address");
        profileNFT = newProfileNFT;
    }

    function setMinter(address minter, bool isAllowed) external override onlyOwner {
        require(minter != address(0), "RubyNFTAdmin: Invalid minter address");
        minters[minter] = isAllowed;
    }


}
