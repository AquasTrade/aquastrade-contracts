// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./Irng.sol";

abstract contract RNG is IRandomNumberGenerator {
    function getRandomNumber(uint256 lotterySize, uint256 count) public view override returns (uint256[] memory) {
        uint256[] memory randomness = new uint256[](count);
        uint256 value = uint256(getRandom());
        for (uint256 i = 0; value != 0 && i < count; ) {
            randomness[i] = value % uint256(10)**lotterySize;
            uint256 j;
            for (j = 0; j < i; j++) if (randomness[j] == randomness[i]) break;
            value = value / (uint256(10**lotterySize));
            if (j < i) continue;
            else i++;
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
