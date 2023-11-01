// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;

import "@openzeppelin/contracts/math/SafeMath.sol";

import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "hardhat/console.sol";
import "./Irng6.sol";

contract coinflip6 {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    address public PayToken;
    IRandomNumberGenerator public RNG; // Instance of Random Number Generator.

    uint256 public constant minBet = 0.0001 ether;
    uint256 public constant maxBet = 1000000 ether;

    mapping(address => uint256) public totalWins;
    mapping(address => uint256) public totalLoss;
    mapping(address => uint256) public totalBets;
    mapping(address => uint256) public balances;

    event gameWon(address player, uint256 amount);
    event gameLost(address player, uint256 amount);

    constructor(address _payToken) public {
        RNG = IRandomNumberGenerator(msg.sender);
        PayToken = _payToken;
    }

    function convertUint256ToUint(uint256 value) public pure returns (uint) {
        // Check if the value can safely fit within a uint
        require(value <= type(uint).max, "Value exceeds uint bounds");

        // Explicit type casting from uint256 to uint
        return uint(value);
    }

    function random() private view returns (uint) {
        uint256[] memory winners = RNG.getRandomNumber(500, 1);

        uint ok = convertUint256ToUint(winners[0]);

        return ok;
    }

    function flipCoin(uint256 _betAmount) public {
        require(_betAmount >= minBet, "Increase your Bet Amount");
        require(_betAmount <= maxBet, "Decrease your Bet Amount");
        uint256 allowance = IERC20(PayToken).allowance(msg.sender, address(this));
        require(allowance >= _betAmount, "Increase your AQUA token allowance");
        require(IERC20(PayToken).balanceOf(msg.sender) >= _betAmount, "Increase your AQUA token balance");

        // from , to , amount
        IERC20(PayToken).transferFrom(msg.sender, address(this), _betAmount);

        uint256 bet = _betAmount;
        uint256 randomNumber = random();
        uint256 randomNumberFlipped = randomNumber % 2;
        console.log("randomNumberFlipped: ", randomNumberFlipped);

        if (randomNumberFlipped == 0) {
            balances[msg.sender] += bet * 2;
            totalWins[msg.sender] += 1;
            console.log("You won!");
            emit gameWon(msg.sender, bet * 2);
        }
        if (randomNumberFlipped == 1) {
            balances[msg.sender] -= bet;
            totalLoss[msg.sender] += 1;
            console.log("You lost!");
            emit gameLost(msg.sender, bet);
        }
        totalBets[msg.sender] += 1;
    }

    function WithdrawAll() public {
        uint256 amount = balances[msg.sender];
        require(amount >= 0, " No user funds in CoinFlip");
        require(IERC20(PayToken).balanceOf(address(this)) >= amount, " CoinFlip out of funds");
        // to user
        IERC20(PayToken).transferFrom(address(this),msg.sender, amount);
        //reset users stats
        // todo
        balances[msg.sender] = 0;
    }

    function getBalance() public view returns (uint256) {
        return balances[msg.sender];
    }

    function getTotalWins() public view returns (uint256) {
        return totalWins[msg.sender];
    }

    function getTotalLosses() public view returns (uint256) {
        return totalLoss[msg.sender];
    }

    function getTotalBets(address _player) public view returns (uint256) {
        return totalBets[_player];
    }
}
