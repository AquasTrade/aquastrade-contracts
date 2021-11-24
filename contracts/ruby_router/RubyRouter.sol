// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "../amm/interfaces/IUniswapV2Router02.sol";
import "../stable_swap/interfaces/ISwap.sol";

import { SwapType, AMMSwapType, AMMSwapDetails, StableSwapDetails, SwapDetails } from "./RoutingUtils.sol";

contract RubyRouter is OwnableUpgradeable {
    using SafeERC20 for IERC20;
    using SafeMath for uint256;

    IUniswapV2Router02 public ammRouter;
    mapping(ISwap => bool) public enabledStablePools;

    // Should be set to 3 with a single stable pool.
    // Set as a variable for future upgradeability
    uint256 private _maxSwapHops;

    /*** EVENTS ***/
    event StablePoolEnabled(ISwap indexed stablePool);

    event StablePoolDisabled(ISwap indexed stablePool);

    event MaxSwapHopsSet(uint256 maxSwapHops);

    function initialize(
        IUniswapV2Router02 ammRouter_,
        ISwap stablePool,
        uint256 maxSwapHops_
    ) public initializer {
        __Ownable_init();
        require(address(ammRouter_) != address(0), "RubyRouter: Invalid AMM router address address.");
        require(address(stablePool) != address(0), "RubyRouter: Invalid Stable Pool address.");
        require(maxSwapHops_ != 0, "RubyRouter: Invalid max swap hops.");
        ammRouter = ammRouter_;
        enableStablePool(stablePool);
        enabledStablePools[stablePool] = true;
        _maxSwapHops = maxSwapHops_;
    }

    function swap(SwapDetails calldata swapDetails) public returns (uint256 outputAmount) {
        require(swapDetails.order.length <= _maxSwapHops, "Invalid number of swap calls");

        for (uint256 i = 0; i < swapDetails.order.length; i++) {
            require(
                swapDetails.order[i] == SwapType.AMM || swapDetails.order[i] == SwapType.STABLE_POOL,
                "RubyRouter: Invalid swap type"
            );

            if (swapDetails.order[i] == SwapType.AMM) {
                outputAmount = _swapAmm(swapDetails.ammSwaps[i]);
            } else {
                outputAmount = _swapStablePool(swapDetails.stableSwaps[i]);
            }
        }
    }

    function _swapAmm(AMMSwapDetails calldata swapDetails) private returns (uint256 outputAmount) {
        require(
            swapDetails.swapType == AMMSwapType.EXACT_TOKENS_FOR_TOKENS ||
                swapDetails.swapType == AMMSwapType.TOKENS_FOR_EXACT_TOKENS,
            "RubyRouter: Invalid AMM swap type"
        );
        uint256[] memory outputAmounts;
        if (swapDetails.swapType == AMMSwapType.EXACT_TOKENS_FOR_TOKENS) {
            outputAmounts = ammRouter.swapExactTokensForTokens(
                swapDetails.amount0,
                swapDetails.amount1,
                swapDetails.path,
                swapDetails.to,
                swapDetails.deadline
            );
        } else {
            outputAmounts = ammRouter.swapTokensForExactETH(
                swapDetails.amount0,
                swapDetails.amount1,
                swapDetails.path,
                swapDetails.to,
                swapDetails.deadline
            );
        }
        outputAmount = outputAmounts[outputAmounts.length - 1];
    }

    function _swapStablePool(StableSwapDetails calldata swapDetails) private returns (uint256 outputAmount) {
        require(enabledStablePools[ISwap(swapDetails.stablePool)], "RubyRouter: The stable pool is not enabled");
        outputAmount = ISwap(swapDetails.stablePool).swap(
            swapDetails.tokenIndexFrom,
            swapDetails.tokenIndexTo,
            swapDetails.dx,
            swapDetails.minDy,
            swapDetails.deadline
        );
    }

    function enableStablePool(ISwap stablePool) public onlyOwner {
        require(address(stablePool) != address(0), "RubyRouter: The stablePool cannot be the zero address");
        enabledStablePools[stablePool] = true;
        emit StablePoolEnabled(stablePool);
    }

    function disableStablePool(ISwap stablePool) public onlyOwner {
        require(address(stablePool) != address(0), "RubyRouter: The stablePool cannot be the zero address");
        enabledStablePools[stablePool] = false;
        emit StablePoolDisabled(stablePool);
    }

    function setMaxHops(uint256 maxSwapHops) public onlyOwner {
        require(maxSwapHops > 0, "RubyRouter: Invalid max swap hops;");
        _maxSwapHops = maxSwapHops;
    }
}
