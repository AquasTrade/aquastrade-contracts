// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.5.0;

interface IDAOPairCreator {

    function createPair(address tokenA, address tokenB) external returns (address pair);

    function setAdmin(address newAdmin) external;

    function setFactory(address newAdmin) external;

    function setRubyStaker(address newAdmin) external;

    function setUSDP(address usdp) external;

    function setMinimumBalanceRequired(uint256 x) external;

    function authorized(address user) external view returns (bool);
}
