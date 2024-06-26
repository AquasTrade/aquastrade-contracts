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
import "../interfaces/INFTAdmin.sol";
import "hardhat/console.sol";

import { SwapType, AMMSwapType, AMMSwapDetails, StableSwapDetails, SwapDetails } from "./RouterUtils.sol";

contract AquasRouter is OwnableUpgradeable {
    using SafeERC20 for IERC20;
    using SafeMath for uint256;

    address public rubyStableSwap;
    IUniswapV2Router02 public ammRouter;
    INFTAdmin public nftAdmin;
    mapping(ISwap => bool) public enabledStablePools;

    // Should be set to 3 with a single stable pool.
    // Set as a variable for future upgradeability
    uint256 private _maxSwapHops;

    /*** EVENTS ***/
    event StablePoolEnabled(address stablePool);
    event StablePoolDisabled(address stablePool);
    event AmmRouterSet(address newAmmRouter);
    event NftAdminSet(address newNftAdmin);
    event MaxHopsSet(uint256 maxSwapHops);

    event Swap(
        address indexed sender,
        uint256 amount0In,
        uint256 amount1Out,
        address token0,
        address token1,
        address indexed to
    );

    function initialize(
        address _owner,
        IUniswapV2Router02 _ammRouter,
        ISwap _stablePool,
        INFTAdmin _nftAdmin,
        uint256 maxSwapHops_
    ) public initializer {
        require(_owner != address(0), "AquasRouter: Invalid owner.");
        require(address(_ammRouter) != address(0), "AquasRouter: Invalid AMM router address.");
        require(address(_stablePool) != address(0), "AquasRouter: Invalid Stable Pool address.");
        require(address(_nftAdmin) != address(0), "AquasRouter: Invalid NFT admin address.");
        require(maxSwapHops_ != 0, "AquasRouter: Invalid max swap hops.");

        __Ownable_init();
        transferOwnership(_owner);

        rubyStableSwap = address(_stablePool);
        ammRouter = _ammRouter;
        nftAdmin = _nftAdmin;
        _maxSwapHops = maxSwapHops_;

        enableStablePool(_stablePool);
        enabledStablePools[_stablePool] = true;
    }

    function swap(SwapDetails calldata swapDetails) public returns (uint256 outputAmount) {
        require(swapDetails.order.length <= _maxSwapHops, "Invalid number of swap calls");

        (address tokenInAddr, uint256 amountIn) = _handleInputToken(swapDetails);

        uint256 ammSwapIndex = 0;
        uint256 stableSwapIndex = 0;
        for (uint256 i = 0; i < swapDetails.order.length; i++) {
            require(
                swapDetails.order[i] == SwapType.AMM || swapDetails.order[i] == SwapType.STABLE_POOL,
                "AquasRouter: Invalid swap type"
            );

            if (swapDetails.order[i] == SwapType.AMM) {
                outputAmount = _swapAmm(swapDetails.ammSwaps[ammSwapIndex]);
                ammSwapIndex++;
            } else {
                outputAmount = _swapStablePool(swapDetails.stableSwaps[stableSwapIndex]);
                stableSwapIndex++;
            }
        }

        address tokenOutAddr = _handleOutputToken(swapDetails, outputAmount);

        // mint a profile NFT if the user does not hold any Profile NFT already
        nftAdmin.mintProfileNFT(tx.origin);

        emit Swap(msg.sender, amountIn, outputAmount, tokenInAddr, tokenOutAddr, tx.origin);
    }

    function _handleInputToken(SwapDetails calldata swapDetails)
        private
        returns (address tokenInAddr, uint256 amountIn)
    {
        if (swapDetails.order[0] == SwapType.AMM) {
            uint256[] memory amounts;
            if (swapDetails.ammSwaps[0].swapType == AMMSwapType.EXACT_TOKENS_FOR_TOKENS) {
                amounts = UniswapV2Library.getAmountsOut(
                    ammRouter.factory(),
                    swapDetails.ammSwaps[0].amountIn,
                    swapDetails.ammSwaps[0].path,
                    nftAdmin.calculateAmmSwapFeeDeduction(tx.origin)
                );
            } else {
                amounts = UniswapV2Library.getAmountsIn(
                    ammRouter.factory(),
                    swapDetails.ammSwaps[0].amountOut,
                    swapDetails.ammSwaps[0].path,
                    nftAdmin.calculateAmmSwapFeeDeduction(tx.origin)
                );
            }
            tokenInAddr = swapDetails.ammSwaps[0].path[0];
            amountIn = amounts[0];
        } else {
            //StableSwap
            ISwap stablePool = ISwap(swapDetails.stableSwaps[0].stablePool);
            require(enabledStablePools[stablePool], "AquasRouter: The stable pool is not enabled");
            tokenInAddr = address(stablePool.getToken(swapDetails.stableSwaps[0].tokenIndexFrom));
            amountIn = swapDetails.stableSwaps[0].dx;
        }

        IERC20 tokenIn = IERC20(tokenInAddr);
        tokenIn.safeTransferFrom(msg.sender, address(this), amountIn);
    }

    // Transfers the output token back to the user
    function _handleOutputToken(SwapDetails calldata swapDetails, uint256 amountOut)
        private
        returns (address tokenOutAddr)
    {
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
            "AquasRouter: Invalid AMM swap type"
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
            outputAmounts = ammRouter.swapTokensForExactTokens(
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
        require(enabledStablePools[stablePool], "AquasRouter: The stable pool is not enabled");

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
        if (tokenAllowance < amountIn) {
            tokenIn.safeIncreaseAllowance(spender, amountIn);
        }
    }

    function enableStablePool(ISwap stablePool) public onlyOwner {
        require(address(stablePool) != address(0), "AquasRouter: The stablePool cannot be the zero address");
        enabledStablePools[stablePool] = true;
        emit StablePoolEnabled(address(stablePool));
    }

    function disableStablePool(ISwap stablePool) public onlyOwner {
        require(address(stablePool) != address(0), "AquasRouter: The stablePool cannot be the zero address");
        enabledStablePools[stablePool] = false;
        emit StablePoolDisabled(address(stablePool));
    }

    function setAmmRouter(IUniswapV2Router02 newAmmRouter) public onlyOwner {
        require(address(newAmmRouter) != address(0), "AquasRouter: Invalid AMM router address.");
        ammRouter = newAmmRouter;
        emit AmmRouterSet(address(newAmmRouter));
    }

    function setNftAdmin(INFTAdmin newNftAdmin) public onlyOwner {
        require(address(newNftAdmin) != address(0), "AquasRouter: Invalid NFT admin address.");
        nftAdmin = newNftAdmin;
        emit NftAdminSet(address(newNftAdmin));
    }

    function setMaxHops(uint256 maxSwapHops) public onlyOwner {
        require(maxSwapHops > 0, "AquasRouter: Invalid max swap hops;");
        _maxSwapHops = maxSwapHops;
        emit MaxHopsSet(maxSwapHops);
    }
}
