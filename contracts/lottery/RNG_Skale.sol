// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;

import "./IRandomNumberGenerator.sol";

contract RNG_Skale is IRandomNumberGenerator {
    constructor()  public {}

    function getRandomNumber(uint256 lotterySize, uint256 count) public view override
        returns (uint256[] memory) 
    {
        uint256[] memory randomness = new uint256[](count);
        uint256 value = uint256(getRandom());
        for (uint256 i = 0; i < count; i++) {
            randomness[i] = value % uint256(10) ** lotterySize;
            value = value / (uint256(10 ** lotterySize));
    	}
        return randomness;
    }

    function getRandom() public view returns (bytes32 addr) {
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