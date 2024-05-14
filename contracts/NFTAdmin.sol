// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

import "./interfaces/INFTAdmin.sol";
import "./interfaces/INFT.sol";

contract NFTAdmin is INFTAdmin, OwnableUpgradeable {
    address public override profileNFT;

    address public override bronzeSwapNFT;
    address public override silverSwapNFT;
    address public override goldSwapNFT;

    // profile NFT minters
    mapping(address => bool) public override minters;

    modifier onylMinter() {
        require(minters[msg.sender], "NFTAdmin: Minting not allowed");
        _;
    }

    function initialize(
        address _owner,
        address _profileNFT,
        address _freeSwapNFT
    ) public initializer {
        require(_owner != address(0), "NFTAdmin: Invalid owner address");
        require(_profileNFT != address(0), "NFTAdmin: Invalid  profile NFT");
        require(_freeSwapNFT != address(0), "NFTAdmin: Invalid  free swap NFT");
        profileNFT = _profileNFT;
        goldSwapNFT = _freeSwapNFT;

        OwnableUpgradeable.__Ownable_init();
        transferOwnership(_owner);
    }

    /**
        @notice Calculate the fee multiplier that needs to be applied in the 
        AMM swapping calculations. The fee deduction is dependent on the
        `user`. The fee multiplier is determined by internal rules. Currently the 
        single rule is having balance of at least 1 at the ProfileNFT contract.
        In the future more rules should be added.
        The `feeMultiplier` is in range of [997, 1000]: 
            - 997 means fee of 30 basis points
            - 1000 means fee of 0 basis points
        @param user - the address of the user
     */
    function calculateAmmSwapFeeDeduction(address user) external view override returns (uint256 feeMultiplier) {
        if (INFT(goldSwapNFT).balanceOf(user) > 0) {
            return 1000; // no fee
        }

        if (INFT(silverSwapNFT).balanceOf(user) > 0) {
            return 999;
        }

        if (INFT(bronzeSwapNFT).balanceOf(user) > 0) {
            return 998;
        }

        return 997; // 30 bps fee
    }

    // function calculateLPFeeDeduction(address user) public view returns (uint256 feeAmount) {

    // }

    // Mint profile NFT if the user has no profile NFTs
    // The exploitability of this is a feature. Users can mint multiple profile NFTs by design
    // Example: User can do a swap, have NFT minted, then he can transfer the NFT, do another
    // swap and get another NFT - this is not a bug but a feature.
    function mintProfileNFT(address user) external override onylMinter {
        if (INFT(profileNFT).balanceOf(user) == 0) {
            INFT(profileNFT).mint(user);
        }
    }

    function setProfileNFT(address newProfileNFT) external override onlyOwner {
        require(newProfileNFT != address(0), "NFTAdmin: Invalid profile NFT");
        profileNFT = newProfileNFT;
        emit ProfileNFTset(profileNFT);
    }

    function setBronzeSwapNFT(address newSwapNFT) external override onlyOwner {
        require(newSwapNFT != address(0), "NFTAdmin: Invalid free swap NFT");
        bronzeSwapNFT = newSwapNFT;
        emit BronzeSwapNFTSet(newSwapNFT);
    }

    function setSilverSwapNFT(address newSwapNFT) external override onlyOwner {
        require(newSwapNFT != address(0), "NFTAdmin: Invalid free swap NFT");
        silverSwapNFT = newSwapNFT;
        emit SilverSwapNFTSet(newSwapNFT);
    }

    function setGoldSwapNFT(address newSwapNFT) external override onlyOwner {
        require(newSwapNFT != address(0), "NFTAdmin: Invalid free swap NFT");
        goldSwapNFT = newSwapNFT;
        emit GoldSwapNFTSet(newSwapNFT);
    }

    function setMinter(address minter, bool allowance) external override onlyOwner {
        require(minter != address(0), "NFTAdmin: Invalid minter address");
        minters[minter] = allowance;
        emit MinterSet(minter, allowance);
    }
}
