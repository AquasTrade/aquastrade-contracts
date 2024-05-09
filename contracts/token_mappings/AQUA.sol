// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;

import "@openzeppelin/contracts/token/ERC20/ERC20Capped.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title Aqua Token
 * @notice This version of the Aqua token is to be used on the SChain
 * It features access control needed for the IMA TokenManager contract (bridging)
 */
contract AQUA is ERC20Capped, AccessControl {
    /// @notice Access control roles for the IMA TokenManager
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");

    /// @notice Total number of tokens
    uint256 public constant MAX_SUPPLY = 200_000_000e18; // 200 million

    /// @notice The total amount of burned tokens
    uint256 public burnedAmount;

    constructor() public ERC20("Aquas.Trade", "AQUA") ERC20Capped(MAX_SUPPLY) {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);

        grantRole(MINTER_ROLE, msg.sender);
        _mint(msg.sender, MAX_SUPPLY);
    }

    /// @notice Creates `amount` token to `to`. Must only be called by the IMA TokenManager contract
    function mint(address to, uint256 amount) public {
        require(hasRole(MINTER_ROLE, msg.sender), "AQUA::mint: Caller is not a minter");
        _mint(to, amount);
    }

    /// @notice Destroys `amount` of AQUA tokens from the msg.sender.
    /// Must only be called by the IMA TokenManager contract
    function burn(uint256 amount) public virtual {
        require(hasRole(BURNER_ROLE, msg.sender), "AQUA::burn: Caller is not a burner");
        _burn(msg.sender, amount);
        burnedAmount += amount;
    }
}
