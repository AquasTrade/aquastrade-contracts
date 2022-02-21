// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.6.2;

import "./IUniswapV2Router01.sol";
import "../../interfaces/IRubyFeeAdmin.sol";
import "../../interfaces/IRubyNFTFactory.sol";

interface IUniswapV2Router02 is IUniswapV2Router01 {
    function feeAdmin() external pure returns (IRubyFeeAdmin);

    function nftFactory() external pure returns (IRubyNFTFactory);

    function swapExactTokensForTokensSupportingFeeOnTransferTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external;

    function setFactory(address newFactory) external;

    function setFeeAdmin(IRubyFeeAdmin newFeeAdmin) external;

    function setNFTFactory(IRubyNFTFactory newNftFactory) external;
}