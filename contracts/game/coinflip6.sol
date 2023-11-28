// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "hardhat/console.sol";
import "./Irng6.sol";

contract CoinFlip {
    using SafeMath for uint256;

    IERC20 public PayToken;
    IRandomNumberGenerator public RNG; // Instance of Random Number Generator.

    uint256 public constant minBet = 0.0001 ether;
    uint256 public constant maxBet = 1000000 ether;

    mapping(address => uint256) public totalWins;
    mapping(address => uint256) public totalLoss;
    mapping(address => uint256) public totalBets;
    mapping(address => uint256) public balances;

    event gameWon(address player, uint256 amount);
    event gameLost(address player, uint256 amount);

    constructor(address _payToken, address _rng) public {
        RNG = IRandomNumberGenerator(_rng);
        PayToken = IERC20(_payToken);
    }

    function convertUint256ToUint(uint256 value) public pure returns (uint) {
        // Check if the value can safely fit within a uint
        require(value <= type(uint).max, "Value exceeds uint bounds");

        // Explicit type casting from uint256 to uint
        return uint(value);
    }

    function random() private view returns (uint) {
        return RNG.getRandomNumber();
    }

    function flipCoin(uint256 _betAmount) public {
        require(_betAmount >= minBet, "Increase your Bet Amount");
        require(_betAmount <= maxBet, "Decrease your Bet Amount");
        uint256 allowance = PayToken.allowance(msg.sender, address(this));
        require(allowance >= _betAmount, "Increase your AQUA token allowance");
        require(PayToken.balanceOf(msg.sender) >= _betAmount, "Increase your AQUA token balance");

        // from , to , amount
        PayToken.transferFrom( msg.sender, address(this), _betAmount);

        uint256 bet = _betAmount;
        uint256 randomNumber = random();
        uint256 randomNumberFlipped = randomNumber % 2;

        console.log("randomNumberFlipped: ",randomNumberFlipped,  randomNumber);
        

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
        require(PayToken.balanceOf(address(this)) >= amount, " CoinFlip out of funds");
        // to user
        PayToken.transfer(msg.sender, amount);
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
