// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

// RubyMine is fork of SushiBar
contract RubyMine is ERC20("RubyMine", "xRUBY") {
    using SafeMath for uint256;
    IERC20 public ruby;

    // Define the Ruby token contract
    constructor(IERC20 _ruby) public {
        ruby = _ruby;
    }

    // Enter the mine. Pay some RUBYs. Earn some shares.
    // Locks RUBY and mints xRUBY
    function enter(uint256 _amount) public {
        // Gets the amount of Ruby locked in the contract
        uint256 totalRuby = ruby.balanceOf(address(this));
        // Gets the amount of xRUBY in existence
        uint256 totalShares = totalSupply();
        // If no xRUBY exists, mint it 1:1 to the amount put in
        if (totalShares == 0 || totalRuby == 0) {
            _mint(msg.sender, _amount);
        }
        // Calculate and mint the amount of xRUBY the RUBY is worth. The ratio will change overtime, as xRUBY is burned/minted and RUBY deposited + gained from fees / withdrawn.
        else {
            uint256 what = _amount.mul(totalShares).div(totalRuby);
            _mint(msg.sender, what);
        }
        // Lock the Ruby in the contract
        ruby.transferFrom(msg.sender, address(this), _amount);
    }

    // Leave the mine. Claim back your RUBYs.
    // Unlocks the staked + gained Ruby and burns xRuby
    function leave(uint256 _share) public {
        // Gets the amount of xRuby in existence
        uint256 totalShares = totalSupply();
        // Calculates the amount of Ruby the xRuby is worth
        uint256 what = _share.mul(ruby.balanceOf(address(this))).div(totalShares);
        _burn(msg.sender, _share);
        ruby.transfer(msg.sender, what);
    }
}
