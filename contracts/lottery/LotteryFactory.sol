// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/utils/Address.sol";
// Inherited allowing for ownership of contract
import "@openzeppelin/contracts/access/Ownable.sol";

import "@openzeppelin/contracts/math/SafeMath.sol";

import "./Lottery.sol";

contract LotteryFactory is Ownable {

    // Safe math
    using SafeMath for uint256;
    // Safe ERC20
    using SafeERC20 for IERC20;
    // Address functionality 
    using Address for address;

    // Instance of Ruby token (collateral currency for lotto)
    address private ruby;
    address private RNG;
    address private timer;
    uint256 private constant MAX_WINNERS = 10;

    mapping (uint256 => Lottery) private allLotteries;
    uint256 private lotteryId;

    event LotteryCreated(uint256 _lotteryId);

    constructor(address _ruby, address _randomNumberGenerator, address _timer) public {
        require(
          _ruby != address(0),
          "ruby cannot be 0 address"
        );
        
        require(
          _randomNumberGenerator != address(0),
          "randomNumberGenerator cannot be 0 address"
        );
        ruby = _ruby;
        RNG = _randomNumberGenerator;
        timer = _timer;
    }

    function createNewLotto(address _nft, uint256 _tokenId, uint256 _lotterySize, uint256 ticketPrice, uint256[] calldata distribution, uint256 duration) external onlyOwner() {
        require(
            _nft != address(0),
            "Nft cannot be 0 address"
        );
        require(
            distribution.length >= 2,
            "Invalid distribution"
        );
        require(
            distribution.length <= MAX_WINNERS + 1,
            "Invalid distribution"
        );
        require(IERC721(_nft).ownerOf(_tokenId) == msg.sender, "Owner of NFT is invalid");
        lotteryId ++;
        allLotteries[lotteryId] = new Lottery(timer, address(this), ruby, _nft, _tokenId, _lotterySize, ticketPrice, distribution, duration, RNG);
        Lottery(allLotteries[lotteryId]).transferOwnership(msg.sender);
        IERC721(_nft).transferFrom(msg.sender, address(allLotteries[lotteryId]), _tokenId);
        emit LotteryCreated(lotteryId);
    }

    function getCurrentLotto() external view returns(address) {
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
            "RNG cannot be 0 address"
        );
        RNG = _RNG;
    }

    function setRuby(address _ruby) external onlyOwner() {
        require(
            _ruby != address(0),
            "Ruby cannot be 0 address"
        );
        ruby = _ruby;
    }

}