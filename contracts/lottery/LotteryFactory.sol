// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

import "./Lottery.sol";
import "../interfaces/IRubyNFT.sol";
// import "hardhat/console.sol";

contract LotteryFactory is OwnableUpgradeable {

    // Safe math
    using SafeMath for uint256;
    // Safe ERC20
    using SafeERC20 for IERC20;

    // Instance of Ruby token (collateral currency for lotto)
    address private ruby;
    address private RNG;
    uint256 private constant MAX_WINNERS = 10;

    mapping (uint256 => Lottery) private allLotteries;
    uint256 private lotteryId;

    event LotteryCreated(uint256 _lotteryId);

    //-------------------------------------------------------------------------
    // initializer
    //-------------------------------------------------------------------------
    function initialize(address _ruby, address _randomNumberGenerator) public initializer {
        require(
          _ruby != address(0),
          "LotteryFactory: ruby cannot be 0 address"
        );
        
        require(
          _randomNumberGenerator != address(0),
          "LotteryFactory: randomNumberGenerator cannot be 0 address"
        );
        ruby = _ruby;
        RNG = _randomNumberGenerator;
        OwnableUpgradeable.__Ownable_init();
    }

    /// @notice Create a new Lottery instance.
    /// @param _nft The NFT address for bonus.
    /// @param _tokenId The Bonus NFT ID.
    /// @param _lotterySize Digit count of ticket.
    /// @param ticketPrice Cost per ticket in $ruby.
    /// @param distribution An array defining the distribution of the prize pool.
    /// @param duration The duration until no more tickets will be sold for the lottery from now.
    function createNewLotto(address _nft, uint256 _tokenId, uint256 _lotterySize, uint256 ticketPrice, uint256[] calldata distribution, address _treasury, uint256 duration) external onlyOwner() {
        require(
            _nft != address(0),
            "LotteryFactory: Nft cannot be 0 address"
        );
        require(
            distribution.length >= 2,
            "LotteryFactory: Invalid distribution"
        );
        require(
            distribution.length <= MAX_WINNERS + 1,
            "LotteryFactory: Invalid distribution"
        );
        require(IRubyNFT(_nft).ownerOf(_tokenId) == msg.sender, "LotteryFactory: Owner of NFT is invalid");
        lotteryId ++;
        allLotteries[lotteryId] = new Lottery(address(this), ruby, _nft, _tokenId, _lotterySize, ticketPrice, distribution, _treasury, duration, RNG);
        Lottery(allLotteries[lotteryId]).transferOwnership(owner());
        IRubyNFT(_nft).transferFrom(msg.sender, address(allLotteries[lotteryId]), _tokenId);
        emit LotteryCreated(lotteryId);
    }

    function getCurrentLotto() public view returns(address) {
        return address(allLotteries[lotteryId]);
    }

    function getLotto(uint256 _lotteryId) external view returns(address) {
        return address(allLotteries[_lotteryId]);
    }

    function getCurrentLottoryId() external view returns(uint256) {
        return lotteryId;
    }

    function setRNG(address _RNG) external onlyOwner() {
        require(
            _RNG != address(0),
            "LotteryFactory: RNG cannot be 0 address"
        );
        RNG = _RNG;
    }

    function setRuby(address _ruby) external onlyOwner() {
        require(
            _ruby != address(0),
            "LotteryFactory: Ruby cannot be 0 address"
        );
        ruby = _ruby;
    }

    function getRewardAmount(address to) external view returns (uint256) {
        return Lottery(getCurrentLotto()).getRewardAmount(to);
    }

    function getRewardNFT(address to) external view returns(bool) {
        return Lottery(getCurrentLotto()).getRewardNFT(to);
    }

    function getRNG() external view returns (address) {
        return address(RNG);
    }

    function getRuby() external view returns (address) {
        return address(ruby);
    }

    function costToBuyTickets(uint256 _ticketSize) external view returns(uint256) {
      return Lottery(getCurrentLotto()).costToBuyTickets(_ticketSize);
    }

    function getWinningNumbers() external view returns (uint256[] memory) {
      return Lottery(getCurrentLotto()).getWinningNumbers();
    }
}