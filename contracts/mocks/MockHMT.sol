// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./MockERC20.sol";

contract MockHMT is MockERC20 {
    constructor() public MockERC20("Human Token", "HMT", 1_000_000_000 * 10**18, 18) {}
}
