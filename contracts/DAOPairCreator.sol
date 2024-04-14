// SPDX-License-Identifier: GPL-3.0

pragma solidity =0.6.12;

import "./interfaces/IDAOPairCreator.sol";
import "./amm/interfaces/IUniswapV2Factory.sol";
import "./amm/interfaces/IUniswapV2Router02.sol";
import "./amm/libraries/TransferHelper.sol";

contract DAOPairCreator is IDAOPairCreator {
    IUniswapV2Factory public factory;
    IUniswapV2Router02 public router;
    address public admin;
    address public USDP;
    address public rubyStaker;
    uint256 public minimumUnlockedBalance = 0;
    uint256 public minimumLockedBalance = 100000 ether;

    constructor(
        address _admin,
        address _factory,
        address _router,
        address _usdp,
        address _rubyStaker
    ) public {
        require(_admin != address(0), "DAOPairCreator: INVALID_INIT_ARG");
        require(_factory != address(0), "DAOPairCreator: INVALID_INIT_ARG");
        require(_router != address(0), "DAOPairCreator: INVALID_INIT_ARG");
        require(_usdp != address(0), "DAOPairCreator: INVALID_INIT_ARG");
        admin = _admin;
        factory = IUniswapV2Factory(_factory);
        router = IUniswapV2Router02(_router);
        USDP = _usdp;
        rubyStaker = _rubyStaker;
    }

    function createPair(address tokenA, address tokenB) external override returns (address pair) {
        authorized(msg.sender);
        require(tokenA == USDP || tokenB == USDP, "DAOPairCreator: INVALID_TOKEN");
        pair = factory.createPair(tokenA, tokenB);
    }

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
        override
        returns (
            uint256 amountA,
            uint256 amountB,
            uint256 liquidity
        )
    {
        authorized(msg.sender);
        require(tokenA == USDP || tokenB == USDP, "DAOPairCreator: INVALID_TOKEN");
        TransferHelper.safeTransferFrom(tokenA, msg.sender, address(this), amountADesired);
        TransferHelper.safeTransferFrom(tokenB, msg.sender, address(this), amountBDesired);
        TransferHelper.safeApprove(tokenA, address(router), amountADesired);
        TransferHelper.safeApprove(tokenB, address(router), amountBDesired);
        (amountA, amountB, liquidity) = router.addLiquidity(
            tokenA,
            tokenB,
            amountADesired,
            amountBDesired,
            amountAMin,
            amountBMin,
            to,
            deadline
        );
        if (amountADesired > amountA) TransferHelper.safeTransfer(tokenA, msg.sender, amountADesired - amountA);
        if (amountBDesired > amountB) TransferHelper.safeTransfer(tokenB, msg.sender, amountBDesired - amountB);
        TransferHelper.safeApprove(tokenA, address(router), 0);
        TransferHelper.safeApprove(tokenB, address(router), 0);
    }

    function setAdmin(address newAdmin) external override {
        require(msg.sender == admin, "DAOPairCreator: FORBIDDEN");
        require(newAdmin != address(0), "DAOPairCreator: INVALID_INIT_ARG");
        admin = newAdmin;
    }

    function setMinimumBalanceRequired(uint256 unlocked, uint256 locked) external override {
        require(msg.sender == admin, "DAOPairCreator: FORBIDDEN");
        minimumUnlockedBalance = unlocked;
        minimumLockedBalance = locked;
    }

    function authorized(address user) public view override returns (bool) {
        (bool success0, bytes memory unlockedData) = rubyStaker.staticcall(
            abi.encodeWithSignature("unlockedBalance(address)", user)
        );
        require(success0, "DAOPairCreator: INVALID_CALL");
        uint256 unlocked = abi.decode(unlockedData, (uint256));
        (bool success1, bytes memory lockedData) = rubyStaker.staticcall(
            abi.encodeWithSignature("lockedBalances(address)", user)
        );
        require(success1, "DAOPairCreator: INVALID_CALL");
        uint256 locked = abi.decode(lockedData, (uint256));
        require(unlocked >= minimumUnlockedBalance, "DAOPairCreator: INSUFFICIENT UNLOCKED RUBY");
        require(locked >= minimumLockedBalance, "DAOPairCreator: INSUFFICIENT LOCKED RUBY");
        return true;
    }
}
