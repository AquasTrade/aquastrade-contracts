// SPDX-License-Identifier: GPL-3.0

pragma solidity =0.6.12;

import "./interfaces/IDAOPairCreator.sol";
import "./amm/interfaces/IUniswapV2Factory.sol";

contract DAOPairCreator is IDAOPairCreator {
    IUniswapV2Factory public factory;
    address public admin;
    address public USDP;
    address public rubyStaker;
    uint256 public minimumBalanceRequired = 100000 ether;

    constructor(address _admin, address _factory, address _usdp, address _rubyStaker) public {
        require(_admin != address(0), "DAOPairCreator: INVALID_INIT_ARG");
        require(_factory != address(0), "DAOPairCreator: INVALID_INIT_ARG");
        require(_usdp != address(0), "DAOPairCreator: INVALID_INIT_ARG");
        admin = _admin;
        factory = IUniswapV2Factory(factory);
        USDP = _usdp;
        rubyStaker = _rubyStaker;
    }

    function createPair(address tokenA, address tokenB) external override returns (address pair) {
        require(authorized(msg.sender), "DAOPairCreator: FORBIDDEN");
        require(tokenA == USDP || tokenB == USDP, "DAOPairCreator: INVALID_TOKEN");
        pair = factory.createPair(tokenA, tokenB);
    }

    function setAdmin(address newAdmin) external override {
        require(msg.sender == admin, "DAOPairCreator: FORBIDDEN");
        require(newAdmin != address(0), "DAOPairCreator: INVALID_INIT_ARG");
        admin = newAdmin;
    }

    function setMinimumBalanceRequired(uint256 x) external override {
        require(msg.sender == admin, "DAOPairCreator: FORBIDDEN");
        minimumBalanceRequired = x;
    }

    function authorized(address user) public view override returns (bool) {
        (bool success0, bytes memory unlockedData) = rubyStaker.staticcall(
            abi.encodeWithSignature("unlockedBalance(address)", user)
        );
        require(success0, "DAOPairCreator: INVALID_CALL");
        (uint256 unlocked) = abi.decode(unlockedData, (uint));
        (bool success1, bytes memory lockedData) = rubyStaker.staticcall(
            abi.encodeWithSignature("lockedBalances(address)", user)
        );
        require(success1, "DAOPairCreator: INVALID_CALL");
        (uint256 locked) = abi.decode(lockedData, (uint));
        return unlocked > minimumBalanceRequired || locked > minimumBalanceRequired;
    }
}
