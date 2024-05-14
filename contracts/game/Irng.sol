// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IRandomNumberGenerator {
    function getRandomNumber(uint256 lotterySize, uint256 count) external view returns (uint256[] memory randomness);
}
