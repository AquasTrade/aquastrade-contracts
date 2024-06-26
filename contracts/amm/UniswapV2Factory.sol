// SPDX-License-Identifier: GPL-3.0

pragma solidity =0.6.12;

import "./interfaces/IUniswapV2Factory.sol";
import "./UniswapV2Pair.sol";

contract UniswapV2Factory is IUniswapV2Factory {
    address public override feeTo;
    address public override admin;

    // A mapping used to determine who can swap with fee deduction
    // (used for the UniswapV2Pair pairs). Only the RubyRouter at first.
    mapping(address => bool) public override feeDeductionSwappers;

    mapping(address => mapping(address => address)) public override getPair;
    address[] public override allPairs;

    constructor(address _admin) public {
        require(_admin != address(0), "UniswapV2: INVALID_INIT_ARG");
        admin = _admin;
    }

    function allPairsLength() external view override returns (uint256) {
        return allPairs.length;
    }

    function pairCodeHash() external pure returns (bytes32) {
        return keccak256(type(UniswapV2Pair).creationCode);
    }

    function createPair(address tokenA, address tokenB) external override returns (address pair) {
        require(tokenA != tokenB, "UniswapV2: IDENTICAL_ADDRESSES");
        (address token0, address token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        require(token0 != address(0), "UniswapV2: ZERO_ADDRESS");
        require(getPair[token0][token1] == address(0), "UniswapV2: PAIR_EXISTS"); // single check is sufficient
        bytes memory bytecode = type(UniswapV2Pair).creationCode;
        bytes32 salt = keccak256(abi.encodePacked(token0, token1));
        assembly {
            pair := create2(0, add(bytecode, 32), mload(bytecode), salt)
        }
        UniswapV2Pair(pair).initialize(token0, token1);
        getPair[token0][token1] = pair;
        getPair[token1][token0] = pair; // populate mapping in the reverse direction
        allPairs.push(pair);
        emit PairCreated(token0, token1, pair, allPairs.length);
    }

    function setFeeTo(address newFeeTo) external override {
        require(msg.sender == admin, "UniswapV2: FORBIDDEN");
        feeTo = newFeeTo;
        emit FeeToRecipientSet(newFeeTo);
    }

    function setFeeDeductionSwapper(address feeDeductionSwapper, bool allowance) external override {
        require(msg.sender == admin, "UniswapV2: FORBIDDEN");
        require(feeDeductionSwapper != address(0), "UniswapV2: INVALID_INIT_ARG");

        feeDeductionSwappers[feeDeductionSwapper] = allowance;
        emit FeeDecutionSwapperSet(feeDeductionSwapper, allowance);
    }

    function setAdmin(address newAdmin) external override {
        require(msg.sender == admin, "UniswapV2: FORBIDDEN");
        require(newAdmin != address(0), "UniswapV2: INVALID_INIT_ARG");

        admin = newAdmin;
        emit AdminSet(newAdmin);
    }
}
