// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.5.0;

interface IPairCreator {
    function authorized(address user) external view returns (bool);
}
