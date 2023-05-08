// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.5.0;

interface IDAOPairCreator {
    function createPair(address tokenA, address tokenB) external returns (address pair);

    function setAdmin(address newAdmin) external;

    function setMinimumBalanceRequired(uint256 unlocked, uint256 locked) external;

    function authorized(address user) external view returns (bool);

    function addLiquidity(
        address tokenA,
        address tokenB,
        uint256 amountADesired,
        uint256 amountBDesired,
        uint256 amountAMin,
        uint256 amountBMin,
        address to,
        uint256 deadline
    )
        external
        returns (
            uint256 amountA,
            uint256 amountB,
            uint256 liquidity
        );
}
