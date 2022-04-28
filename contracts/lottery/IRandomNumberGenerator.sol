// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;

interface IRandomNumberGenerator {

    function getRandomNumber(uint256 lotterySize) external returns (uint256 randomness);

}