// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "../amm/interfaces/IUniswapV2Router02.sol";
import "../amm/libraries/TransferHelper.sol";
import "../amm/libraries/UniswapV2Library.sol";
import "../stable_swap/interfaces/ISwap.sol";
import "hardhat/console.sol";

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
        console.log("Swapping tokens...");
        _handleInputToken(swapDetails);

        console.log("Input token handled...");
        uint256 ammSwapIndex = 0;
        uint256 stableSwapIndex = 0;
        for (uint256 i = 0; i < swapDetails.order.length; i++) {
            require(
                swapDetails.order[i] == SwapType.AMM || swapDetails.order[i] == SwapType.STABLE_POOL,
                "RubyRouter: Invalid swap type"
            );

            if (swapDetails.order[i] == SwapType.AMM) {
                console.log("Performing amm swap...");
                outputAmount = _swapAmm(swapDetails.ammSwaps[ammSwapIndex]);
                console.log("Amm swap done, output amount: %s", outputAmount);
                ammSwapIndex++;
            } else {
                console.log("Performing stable swap...");
                outputAmount = _swapStablePool(swapDetails.stableSwaps[stableSwapIndex]);
                console.log("Stable swap done, output amount: %s", outputAmount);
                stableSwapIndex++;
            }
        }

        console.log("Handling output token");
        _handleOutputToken(swapDetails, outputAmount);
        console.log("Output token handled");
    }

    // Approves and transfers the input token to the AMM Router or the StableSwap pool
    // TODO: Handle approval better...
    function _handleInputToken(SwapDetails calldata swapDetails) private {
        address tokenInAddr;
        uint256 amountIn;

        if (swapDetails.order[0] == SwapType.AMM) {
            uint256[] memory amounts;
            if (swapDetails.ammSwaps[0].swapType == AMMSwapType.EXACT_TOKENS_FOR_TOKENS) {
                amounts = UniswapV2Library.getAmountsOut(
                    ammRouter.factory(),
                    swapDetails.ammSwaps[0].amountIn,
                    swapDetails.ammSwaps[0].path
                );
            } else {
                amounts = UniswapV2Library.getAmountsIn(
                    ammRouter.factory(),
                    swapDetails.ammSwaps[0].amountOut,
                    swapDetails.ammSwaps[0].path
                );
            }
            tokenInAddr = swapDetails.ammSwaps[0].path[0];
            amountIn = amounts[0];
        } else {
            //StableSwap
            ISwap stablePool = ISwap(swapDetails.stableSwaps[0].stablePool);
            require(enabledStablePools[stablePool], "RubyRouter: The stable pool is not enabled");
            tokenInAddr = address(stablePool.getToken(swapDetails.stableSwaps[0].tokenIndexFrom));
            amountIn = swapDetails.stableSwaps[0].dx;
        }

        IERC20 tokenIn = IERC20(tokenInAddr);
        tokenIn.safeTransferFrom(msg.sender, address(this), amountIn);
    }

    // Transfers the output token back to the user
    function _handleOutputToken(SwapDetails calldata swapDetails, uint256 amountOut) private {
        address tokenOutAddr;

        uint256 lastHopIndex = swapDetails.order.length - 1;
        if (swapDetails.order[lastHopIndex] == SwapType.AMM) {
            uint256 lastAmmSwapIndex = swapDetails.ammSwaps.length - 1;
            uint256 lastTokenIndex = swapDetails.ammSwaps[lastAmmSwapIndex].path.length - 1;

            tokenOutAddr = swapDetails.ammSwaps[lastAmmSwapIndex].path[lastTokenIndex];
        } else {
            //StableSwap
            uint256 lastStableSwapIndex = swapDetails.stableSwaps.length - 1;
            ISwap stablePool = ISwap(swapDetails.stableSwaps[lastStableSwapIndex].stablePool);
            tokenOutAddr = address(stablePool.getToken(swapDetails.stableSwaps[lastStableSwapIndex].tokenIndexTo));
        }

        IERC20 tokenOut = IERC20(tokenOutAddr);
        tokenOut.safeTransfer(msg.sender, amountOut);
    }

    function _swapAmm(AMMSwapDetails calldata swapDetails) private returns (uint256 outputAmount) {
        require(
            swapDetails.swapType == AMMSwapType.EXACT_TOKENS_FOR_TOKENS ||
                swapDetails.swapType == AMMSwapType.TOKENS_FOR_EXACT_TOKENS,
            "RubyRouter: Invalid AMM swap type"
        );
        uint256[] memory outputAmounts;

        _increaseTokenAllowance(swapDetails.path[0], address(ammRouter), swapDetails.amountIn);

        if (swapDetails.swapType == AMMSwapType.EXACT_TOKENS_FOR_TOKENS) {
            outputAmounts = ammRouter.swapExactTokensForTokens(
                swapDetails.amountIn,
                swapDetails.amountOut,
                swapDetails.path,
                swapDetails.to,
                swapDetails.deadline
            );
        } else {
            outputAmounts = ammRouter.swapTokensForExactETH(
                swapDetails.amountOut,
                swapDetails.amountIn,
                swapDetails.path,
                swapDetails.to,
                swapDetails.deadline
            );
        }
        outputAmount = outputAmounts[outputAmounts.length - 1];
    }

    function _swapStablePool(StableSwapDetails calldata swapDetails) private returns (uint256 outputAmount) {
        ISwap stablePool = ISwap(swapDetails.stablePool);
        require(enabledStablePools[stablePool], "RubyRouter: The stable pool is not enabled");

        address tokenAddress = address(stablePool.getToken(swapDetails.tokenIndexFrom));
        _increaseTokenAllowance(tokenAddress, swapDetails.stablePool, swapDetails.dx);

        outputAmount = ISwap(swapDetails.stablePool).swap(
            swapDetails.tokenIndexFrom,
            swapDetails.tokenIndexTo,
            swapDetails.dx,
            swapDetails.minDy,
            swapDetails.deadline
        );
    }

    function _increaseTokenAllowance(
        address token,
        address spender,
        uint256 amountIn
    ) private {
        IERC20 tokenIn = IERC20(token);
        uint256 tokenAllowance = tokenIn.allowance(address(this), spender);
        console.log("token allowance...", tokenAllowance, spender);
        if (tokenAllowance < amountIn) {
            console.log("increasing tokenAllowance...");
            tokenIn.safeIncreaseAllowance(spender, amountIn);
        }
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
