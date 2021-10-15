// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;
import "./RubyToken.sol";

// import "./libraries/SafeMath.sol";
import "./libraries/SafeERC20.sol";


import "./uniswapv2/interfaces/IUniswapV2ERC20.sol";
import "./uniswapv2/interfaces/IUniswapV2Pair.sol";
import "./uniswapv2/interfaces/IUniswapV2Factory.sol";

// import "./Ownable.sol";
// 
// RubyMaker is fork of SushiMaker
contract RubyMaker is Ownable {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    IUniswapV2Factory public immutable factory;
    address public immutable bar;
    RubyToken private immutable ruby;
    address private immutable weth;
    uint256 private burnPercent;

    mapping(address => address) internal _bridges;

    event LogBridgeSet(address indexed token, address indexed bridge);
    event LogConvert(
        address indexed server,
        address indexed token0,
        address indexed token1,
        uint256 amount0,
        uint256 amount1,
        uint256 amountRubyDistributed,
        uint256 amountRubyBurned
    );

    event BurnPercentChanged(uint256 newBurnPercent);

    constructor(
        address _factory,
        address _bar,
        RubyToken _ruby,
        address _weth,
        uint256 _burnPercent
    ) public {

        require(_factory != address(0), "RubyMaker: Invalid factory address.");
        require(_bar != address(0), "RubyMaker: Invalid bar address.");
        require(address(_ruby) != address(0), "RubyMaker: Invalid ruby address.");
        require(_weth != address(0), "RubyMaker: Invalid weth address.");
        require(_burnPercent >= 0 && _burnPercent <= 100, "RubyMaker: Invalid burn percent.");

        factory = IUniswapV2Factory(_factory);
        bar = _bar;
        ruby = _ruby;
        weth = _weth;

        // initially to be set to 20 (0.01% of the total trade)
        // 0.05% (1/6th) of the total fees (0.30%) are sent to the RubyMaker
        // 0.04% of these fees (80%) are converted to Ruby and sent to the RubyBar (xRUBY)
        // 0.01% of these fees (20%) are burned
        burnPercent = _burnPercent;
    }

    function setBurnPercent(uint256 newBurnPercent) external onlyOwner {
        require(newBurnPercent >= 0 && newBurnPercent <= 100, "RubyMaker: Invalid burn percent.");
        burnPercent = newBurnPercent;
        emit BurnPercentChanged(newBurnPercent);
    }


    function bridgeFor(address token) public view returns (address bridge) {
        bridge = _bridges[token];
        if (bridge == address(0)) {
            bridge = weth;
        }
    }

    function setBridge(address token, address bridge) external onlyOwner {
        // Checks
        require(token != address(ruby) && token != weth && token != bridge, "RubyMaker: Invalid bridge");

        // Effects
        _bridges[token] = bridge;
        emit LogBridgeSet(token, bridge);
    }

    modifier onlyEOA() {
        // Try to make flash-loan exploit harder to do by only allowing externally owned addresses.
        require(msg.sender == tx.origin, "RubyMaker: must use EOA");
        _;
    }

    function convert(address token0, address token1) external onlyEOA {
        _convert(token0, token1);
    }

    function convertMultiple(address[] calldata token0, address[] calldata token1) external onlyEOA {
        // TODO: This can be optimized a fair bit, but this is safer and simpler for now
        uint256 len = token0.length;
        for (uint256 i = 0; i < len; i++) {
            _convert(token0[i], token1[i]);
        }
    }

    function _convert(address token0, address token1) internal {
        // Interactions
        IUniswapV2Pair pair = IUniswapV2Pair(factory.getPair(token0, token1));
        require(address(pair) != address(0), "RubyMaker: Invalid pair");

        IERC20(address(pair)).safeTransfer(address(pair), pair.balanceOf(address(this)));

        (uint256 amount0, uint256 amount1) = pair.burn(address(this));
        if (token0 != pair.token0()) {
            (amount0, amount1) = (amount1, amount0);
        }

        uint256 convertedRuby = _convertStep(token0, token1, amount0, amount1);
        uint256 rubyBurned = convertedRuby.mul(burnPercent/100);
        convertedRuby = convertedRuby - rubyBurned;
        
        ruby.burnFrom(bar, rubyBurned);

        emit LogConvert(msg.sender, token0, token1, amount0, amount1, convertedRuby, rubyBurned);
    }

    function _convertStep(
        address token0,
        address token1,
        uint256 amount0,
        uint256 amount1
    ) internal returns (uint256 rubyOut) {
        // Interactions
        if (token0 == token1) {
            uint256 amount = amount0.add(amount1);
            if (token0 == address(ruby)) {
                ruby.transfer(bar, amount);
                rubyOut = amount;
            } else if (token0 == weth) {
                rubyOut = _toRUBY(weth, amount);
            } else {
                address bridge = bridgeFor(token0);
                amount = _swap(token0, bridge, amount, address(this));
                rubyOut = _convertStep(bridge, bridge, amount, 0);
            }
        } else if (token0 == address(ruby)) {
            // eg. RUBY - ETH
            ruby.transfer(bar, amount0);
            rubyOut = _toRUBY(token1, amount1).add(amount0);
        } else if (token1 == address(ruby)) {
            // eg. USDT - RUBY
            ruby.transfer(bar, amount1);
            rubyOut = _toRUBY(token0, amount0).add(amount1);
        } else if (token0 == weth) {
            // eg. ETH - USDC
            rubyOut = _toRUBY(weth, _swap(token1, weth, amount1, address(this)).add(amount0));
        } else if (token1 == weth) {
            // eg. USDT - ETH
            rubyOut = _toRUBY(weth, _swap(token0, weth, amount0, address(this)).add(amount1));
        } else {
            // eg. MIC - USDT
            address bridge0 = bridgeFor(token0);
            address bridge1 = bridgeFor(token1);
            if (bridge0 == token1) {
                // eg. MIC - USDT - and bridgeFor(MIC) = USDT
                rubyOut = _convertStep(bridge0, token1, _swap(token0, bridge0, amount0, address(this)), amount1);
            } else if (bridge1 == token0) {
                // eg. WBTC - DSD - and bridgeFor(DSD) = WBTC
                rubyOut = _convertStep(token0, bridge1, amount0, _swap(token1, bridge1, amount1, address(this)));
            } else {
                rubyOut = _convertStep(
                    bridge0,
                    bridge1, // eg. USDT - DSD - and bridgeFor(DSD) = WBTC
                    _swap(token0, bridge0, amount0, address(this)),
                    _swap(token1, bridge1, amount1, address(this))
                );
            }
        }
    }

    function _swap(
        address fromToken,
        address toToken,
        uint256 amountIn,
        address to
    ) internal returns (uint256 amountOut) {
        IUniswapV2Pair pair = IUniswapV2Pair(factory.getPair(fromToken, toToken));
        require(address(pair) != address(0), "RubyMaker: Cannot convert");

        // Interactions
        // X1 - X5: OK
        (uint256 reserve0, uint256 reserve1, ) = pair.getReserves();
        uint256 amountInWithFee = amountIn.mul(997);
        if (fromToken == pair.token0()) {
            amountOut = amountInWithFee.mul(reserve1) / reserve0.mul(1000).add(amountInWithFee);
            IERC20(fromToken).safeTransfer(address(pair), amountIn);
            pair.swap(0, amountOut, to, new bytes(0));
            // TODO: Add maximum slippage?
        } else {
            amountOut = amountInWithFee.mul(reserve0) / reserve1.mul(1000).add(amountInWithFee);
            IERC20(fromToken).safeTransfer(address(pair), amountIn);
            pair.swap(amountOut, 0, to, new bytes(0));
            // TODO: Add maximum slippage?
        }
    }

    function _toRUBY(address token, uint256 amountIn) internal returns (uint256 amountOut) {
        amountOut = _swap(token, address(ruby), amountIn, bar);
    }
}
