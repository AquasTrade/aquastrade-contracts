// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;

import "./TokenVesting.sol";

/**
 * @title Vester
 * @notice Generic ERC20 token vesting contract with support for beneficiary transfer
 */
contract Vester is TokenVesting {

    /**
     * @notice Emitted when {beneficiary} transfers beneficiary to \`newBeneficiary\`
     */
    event BeneficiaryTransfer(address newBeneficiary);

    /**
     * @dev Creates a vesting contract that vests its balance of any ERC20 token to the
     * beneficiary, gradually in a linear fashion until start + duration. By then all
     * of the balance will have vested.
     * @param beneficiary address of the beneficiary to whom vested tokens are transferred
     * @param cliffDuration duration in seconds of the cliff in which tokens will begin to vest
     * @param start the time (as Unix time) at which point vesting starts
     * @param duration duration in seconds of the period in which the tokens will vest
     * @param revocable whether the vesting is revocable or not
     */
    constructor (address beneficiary, uint256 start, uint256 cliffDuration, uint256 duration, bool revocable)
    TokenVesting(beneficiary, start, cliffDuration, duration, revocable) public { }

    /**
     * @notice Allows the current {beneficiary} to transfer beneficiary status to a new address
     * @dev Beneficiary only
     * @param newBeneficiary New beneficiary address
     */
    function transferBeneficiary(address newBeneficiary) external onlyBeneficiary {
        require(newBeneficiary != address(0), "Vester: zero address");
        _beneficiary = newBeneficiary;
        emit BeneficiaryTransfer(newBeneficiary);
    }

    /**
     * @notice Transfers the specified \`amount\` of vested \`token\` to beneficiary. Only callable by beneficiary
     * @param token ERC20 token which is being vested
     * @param amount Quantity of token to be released
     */
    function release(IERC20 token, uint256 amount) public onlyBeneficiary {
        uint256 unreleased = _releasableAmount(token);
        uint256 releaseAmount = unreleased > amount ? amount : unreleased;

        require(releaseAmount > 0, "TokenVesting: no tokens are due");

        _released[address(token)] = _released[address(token)].add(releaseAmount);

        token.safeTransfer(_beneficiary, releaseAmount);

        emit TokensReleased(address(token), releaseAmount);
    }

    /**
     * @notice passthrough to internal _releaseableAmount function
     * @dev Returns the amount that has already vested but hasn't been released yet.
     * @param token ERC20 token which is being vested
     */
    function releaseableAmount(IERC20 token) public view returns (uint256) {
        return _releasableAmount(token);
    }

    /**
     * @notice Only beneficiary may call
     */
    modifier onlyBeneficiary {
        require(msg.sender == beneficiary(), "Vester: not beneficiary");

        _;
    }
}
