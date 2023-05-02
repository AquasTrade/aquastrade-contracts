// SPDX-License-Identifier: GPL-3.0

pragma solidity =0.6.12;

import "./interfaces/IDAOPairCreator.sol";
import "./amm/UniswapV2Pair.sol";

contract DAOPairCreator is IDAOPairCreator {
    address public override feeTo;
    address public override admin;
    address public USDP;
    address public rubyStaker;

    uint256 public minimumBalanceRequired = 100000 ether;

    // A mapping used to determine who can swap with fee deduction
    // (used for the UniswapV2Pair pairs). Only the RubyRouter at first.
    mapping(address => bool) public override feeDeductionSwappers;

    mapping(address => mapping(address => address)) public override getPair;
    address[] public override allPairs;

    constructor(address _admin, address _usdp) public {
        require(_admin != address(0), "DAOPairCreator: INVALID_INIT_ARG");
        require(_usdp != address(0), "DAOPairCreator: INVALID_INIT_ARG");
        admin = _admin;
        USDP = _usdp;
    }

    function allPairsLength() external view override returns (uint256) {
        return allPairs.length;
    }

    function pairCodeHash() external pure returns (bytes32) {
        return keccak256(type(UniswapV2Pair).creationCode);
    }

    function createPair(address tokenB) external override returns (address pair) {
        require(authorized(msg.sender), "DAOPairCreator: FORBIDDEN");
        address tokenA = USDP;
        require(tokenA != tokenB, "DAOPairCreator: IDENTICAL_ADDRESSES");
        (address token0, address token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        require(token0 != address(0), "DAOPairCreator: ZERO_ADDRESS");
        require(getPair[token0][token1] == address(0), "DAOPairCreator: PAIR_EXISTS"); // single check is sufficient
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
        require(msg.sender == admin, "DAOPairCreator: FORBIDDEN");
        feeTo = newFeeTo;
        emit FeeToRecipientSet(newFeeTo);
    }

    function setFeeDeductionSwapper(address feeDeductionSwapper, bool allowance) external override {
        require(msg.sender == admin, "DAOPairCreator: FORBIDDEN");
        require(feeDeductionSwapper != address(0), "DAOPairCreator: INVALID_INIT_ARG");

        feeDeductionSwappers[feeDeductionSwapper] = allowance;
        emit FeeDecutionSwapperSet(feeDeductionSwapper, allowance);
    }

    function setAdmin(address newAdmin) external override {
        require(msg.sender == admin, "DAOPairCreator: FORBIDDEN");
        require(newAdmin != address(0), "DAOPairCreator: INVALID_INIT_ARG");
        
        admin = newAdmin;
        emit AdminSet(newAdmin);
    }

    function setUSDP(address _usdp) external override {
        require(msg.sender == admin, "DAOPairCreator: FORBIDDEN");
        require(_usdp != address(0), "DAOPairCreator: INVALID_INIT_ARG");
        
        USDP = _usdp;
    }

    function setMinimumBalanceRequired(uint256 x) external {
        require(msg.sender == admin, "DAOPairCreator: FORBIDDEN");
        minimumBalanceRequired = x;
    }

    function authorized(address user) public view returns (bool) {
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
