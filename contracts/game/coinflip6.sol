// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "hardhat/console.sol";
import "./Irng6.sol";

contract CoinFlip {
    address private admin;
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
        admin = msg.sender;
    }

    function random() private view returns (uint256) {
        return RNG.getRandomNumber();
    }

    function flipCoin(uint256 _betAmount) public {
        require(_betAmount >= minBet, "Increase your Bet Amount");
        require(_betAmount <= maxBet, "Decrease your Bet Amount");
        uint256 allowance = PayToken.allowance(msg.sender, address(this));
        require(allowance >= _betAmount, "Increase your AQUA token allowance");
        require(PayToken.balanceOf(msg.sender) >= _betAmount, "Increase your AQUA token balance");

        // from , to , amount
        PayToken.transferFrom(msg.sender, address(this), _betAmount);

        uint256 bet = _betAmount;
        uint256 randomNumber = random();
        uint256 randomNumberFlipped = randomNumber % 2;

        console.log("randomNumberFlipped: ", randomNumberFlipped, randomNumber);

        if (randomNumberFlipped == 0) {
            balances[msg.sender] += bet * 2;
            totalWins[msg.sender] += 1;
            console.log("You won!");
            emit gameWon(msg.sender, bet * 2);
        }
        if (randomNumberFlipped == 1) {
            // need some logic here
            // do we want to allow negative numbers? if yes, change to int256 and not uint256
            uint256 bal = balances[msg.sender];
            if (bet > bal) {
                balances[msg.sender] = 0;
            } else {
                balances[msg.sender] -= bet; // this will allow a user to compound wins
            }

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
        balances[msg.sender] = 0; // todo this could be the error that makes balance = 115792089237316195423570985008687907853269984665640564021420184007913129639936n
    }

    function WithdrawPrize() public {
        uint256 amount = PayToken.balanceOf(address(this));
        require(amount >= 0, " No funds in CoinFlip");
        require(msg.sender == admin, " Not admin");

        // to user
        PayToken.transfer(msg.sender, amount);
        //reset users stats
        // todo
    }
}
