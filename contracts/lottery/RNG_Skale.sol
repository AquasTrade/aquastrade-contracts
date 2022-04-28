// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;

import "./IRandomNumberGenerator.sol";

contract RNG_Skale is IRandomNumberGenerator {
    constructor()  public {}

    function getRandomNumber(uint256 lotterySize) public override
        returns (uint256 randomness) 
    {
        return uint256(getRandom()) % uint256(10) ** lotterySize;
    }

    function getRandom() internal view returns (bytes32 addr) {
        assembly {
            let freemem := mload(0x40)
            let start_addr := add(freemem, 0)
            if iszero(staticcall(gas(), 0x18, 0, 0, start_addr, 32)) {
              invalid()
            }
            addr := mload(freemem)
        }
    }
}