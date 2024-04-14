// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;

interface IRandomNumberGenerator {
    function getRandomNumber() external view returns (uint256 randomness);
}
