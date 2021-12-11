// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/utils/EnumerableSet.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/math/Math.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IRubyStaker.sol";
import "./token_mappings/RubyToken.sol";
import "./libraries/BoringERC20.sol";

import "hardhat/console.sol";

// RubyStaker based on EpsStaker.sol from Ellipsis finance
// (https://github.com/ellipsis-finance/ellipsis/blob/master/contracts/EpsStaker.sol)
contract RubyStaker is Ownable, ReentrancyGuard, IRubyStaker {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    /* ========== EVENTS ========== */

    event RewardMinterUpdate(address indexed oldRewardMinter, address indexed newRewardMinter);
    event RubyTokenEmergencyWithdrawal(address indexed token, address indexed to, uint256 amount);
    event RewardAdded(uint256 reward);
    event Staked(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event RewardPaid(address indexed user, uint256 reward);
    event RewardsDurationUpdated(address token, uint256 newDuration);
    event TreasuryFeeMinted(uint256 amount);

    /* ========== STATE VARIABLES ========== */

    struct Reward {
        uint256 periodFinish;
        uint256 rewardRate;
        uint256 lastUpdateTime;
        uint256 rewardPerTokenStored;
    }
    struct Balances {
        uint256 total;
        uint256 unlocked;
        uint256 locked;
        uint256 earned;
    }
    struct LockedBalance {
        uint256 amount;
        uint256 unlockTime;
    }
    IERC20 public rubyToken;
    address public rewardMinter; // RubyMasterChef
    address public rewardDistributor; // RubyMaker

    // token => amount
    Reward public rewardData;

    // Duration that rewards are streamed over
    uint256 public constant rewardsDuration = 86400 * 7;

    // Duration of lock/earned penalty period
    uint256 public constant lockDuration = rewardsDuration * 12;

    // user => amount
    mapping(address => uint256) public userRewardPaid;
    mapping(address => uint256) public rewards;

    uint256 public lockedSupply;

    // Private mappings for balance data
    mapping(address => Balances) private balances;
    mapping(address => LockedBalance[]) private userLocks;
    mapping(address => LockedBalance[]) private userEarnings;

    /* ========== MODIFIERS ========== */

    modifier onlyRewardMinter() {
        require(msg.sender == rewardMinter, "RubyStaker: Only reward minter can execute this action.");
        _;
    }

    modifier onlyRewardDistributor() {
        require(msg.sender == rewardDistributor, "RubyStaker: Only reward distributor can execute this action.");
        _;
    }

    modifier updateReward(address account) {
        address token = address(rubyToken);
        uint256 balance;
        uint256 supply = lockedSupply;
        rewardData.rewardPerTokenStored = _rewardPerToken(supply);
        rewardData.lastUpdateTime = lastTimeRewardApplicable();
        if (account != address(0)) {
            // Special case, use the locked balances and supply for stakingReward rewards
            rewards[account] = _earned(account, balances[account].locked, supply);
            userRewardPaid[account] = rewardData.rewardPerTokenStored;
            balance = balances[account].total;
        }
        _;
    }

    constructor(address _rubyToken, address _rewardMinter) public {
        require(_rubyToken != address(0), "RubyStaker: Invalid ruby token.");
        require(_rewardMinter != address(0), "RubyStaker: Invalid reward minter address.");
        rubyToken = IERC20(_rubyToken);
        rewardMinter = _rewardMinter;

        // set reward data
        rewardData.lastUpdateTime = block.timestamp;
        rewardData.periodFinish = block.timestamp;
    }

    /* ========== ADMIN CONFIGURATION ========== */

    function updateRewardMinter(address _newRewardMinter) external onlyOwner {
        require(_newRewardMinter != address(0), "RubyStaker: Invalid new reward minter.");
        emit RewardMinterUpdate(rewardMinter, _newRewardMinter);
        rewardMinter = _newRewardMinter;
    }

    /* ========== VIEW FUNCTIONS ========== */

    function _rewardPerToken(uint256 _supply) internal view returns (uint256) {
        if (_supply == 0) {
            return rewardData.rewardPerTokenStored;
        }
        return
            rewardData.rewardPerTokenStored.add(
                lastTimeRewardApplicable().sub(rewardData.lastUpdateTime).mul(rewardData.rewardRate).mul(1e18).div(
                    _supply
                )
            );
    }

    function _earned(
        address _user,
        uint256 _balance,
        uint256 supply
    ) internal view returns (uint256) {
        return _balance.mul(_rewardPerToken(supply).sub(userRewardPaid[_user])).div(1e18).add(rewards[_user]);
    }

    function lastTimeRewardApplicable() public view returns (uint256) {
        return Math.min(block.timestamp, rewardData.periodFinish);
    }

    function getRewardForDuration() external view returns (uint256) {
        return rewardData.rewardRate.mul(rewardsDuration);
    }

    // Address and claimable amount of all reward tokens for the given account
    function claimableRewards(address account) external view returns (uint256 rewardAmount) {
        rewardAmount = _earned(account, balances[account].locked, lockedSupply);
    }

    // Total balance of an account, including unlocked, locked and earned tokens
    function totalBalance(address user) external view returns (uint256 amount) {
        return balances[user].total;
    }

    // Total withdrawable balance for an account to which no penalty is applied
    function unlockedBalance(address user) external view returns (uint256 amount) {
        amount = balances[user].unlocked;
        LockedBalance[] storage earnings = userEarnings[msg.sender];
        for (uint256 i = 0; i < earnings.length; i++) {
            if (earnings[i].unlockTime > block.timestamp) {
                break;
            }
            amount = amount.add(earnings[i].amount);
        }
        return amount;
    }

    // Information on the "earned" balances of a user
    // Earned balances may be withdrawn immediately for a 50% penalty
    function earnedBalances(address user) external view returns (uint256 total, LockedBalance[] memory earningsData) {
        LockedBalance[] storage earnings = userEarnings[user];
        uint256 idx;
        for (uint256 i = 0; i < earnings.length; i++) {
            if (earnings[i].unlockTime > block.timestamp) {
                if (idx == 0) {
                    earningsData = new LockedBalance[](earnings.length - i);
                }
                earningsData[idx] = earnings[i];
                idx++;
                total = total.add(earnings[i].amount);
            }
        }
        return (total, earningsData);
    }

    // Information on a user's locked balances
    function lockedBalances(address user)
        external
        view
        returns (
            uint256 total,
            uint256 unlockable,
            uint256 locked,
            LockedBalance[] memory lockData
        )
    {
        LockedBalance[] storage locks = userLocks[user];
        uint256 idx;
        for (uint256 i = 0; i < locks.length; i++) {
            if (locks[i].unlockTime > block.timestamp) {
                if (idx == 0) {
                    lockData = new LockedBalance[](locks.length - i);
                }
                lockData[idx] = locks[i];
                idx++;
                locked = locked.add(locks[i].amount);
            } else {
                unlockable = unlockable.add(locks[i].amount);
            }
        }
        return (balances[user].locked, unlockable, locked, lockData);
    }

    // Final balance received and penalty balance paid by user upon calling exit
    function withdrawableBalance(address user) public view returns (uint256 amount, uint256 penaltyAmount) {
        Balances storage bal = balances[user];
        if (bal.earned > 0) {
            uint256 amountWithoutPenalty;
            uint256 length = userEarnings[user].length;
            for (uint256 i = 0; i < length; i++) {
                uint256 earnedAmount = userEarnings[user][i].amount;
                if (earnedAmount == 0) continue;
                if (userEarnings[user][i].unlockTime > block.timestamp) {
                    break;
                }
                amountWithoutPenalty = amountWithoutPenalty.add(earnedAmount);
            }

            penaltyAmount = bal.earned.sub(amountWithoutPenalty).div(2);
        }
        amount = bal.unlocked.add(bal.earned).sub(penaltyAmount);
        return (amount, penaltyAmount);
    }

    /* ========== MUTATIVE FUNCTIONS ========== */

    // Lock tokens to receive fees from penalties
    // Locked tokens cannot be withdrawn for lockDuration and are eligible to receive stakingReward rewards
    function stake(uint256 amount, bool lock) external nonReentrant updateReward(msg.sender) {
        require(amount > 0, "RubyStaker: Invalid staking amount");
        Balances storage bal = balances[msg.sender];
        bal.total = bal.total.add(amount);
        if (lock) {
            lockedSupply = lockedSupply.add(amount);
            bal.locked = bal.locked.add(amount);
            uint256 unlockTime = block.timestamp.div(rewardsDuration).mul(rewardsDuration).add(lockDuration);
            uint256 idx = userLocks[msg.sender].length;
            if (idx == 0 || userLocks[msg.sender][idx - 1].unlockTime < unlockTime) {
                userLocks[msg.sender].push(LockedBalance({ amount: amount, unlockTime: unlockTime }));
            } else {
                userLocks[msg.sender][idx - 1].amount = userLocks[msg.sender][idx - 1].amount.add(amount);
            }
        } else {
            bal.unlocked = bal.unlocked.add(amount);
        }
        rubyToken.safeTransferFrom(msg.sender, address(this), amount);
        emit Staked(msg.sender, amount);
    }

    // Mint new tokens
    // Minted tokens receive rewards normally but incur a 50% penalty when
    // withdrawn before lockDuration has passed.
    function mint(address user, uint256 amount) external override onlyRewardMinter updateReward(user) {
        Balances storage bal = balances[user];
        bal.total = bal.total.add(amount);
        bal.earned = bal.earned.add(amount);
        uint256 unlockTime = block.timestamp.div(rewardsDuration).mul(rewardsDuration).add(lockDuration);
        LockedBalance[] storage earnings = userEarnings[user];
        uint256 idx = earnings.length;

        if (idx == 0 || earnings[idx - 1].unlockTime < unlockTime) {
            earnings.push(LockedBalance({ amount: amount, unlockTime: unlockTime }));
        } else {
            earnings[idx - 1].amount = earnings[idx - 1].amount.add(amount);
        }
        emit Staked(user, amount);
    }

    // Withdraw locked tokens
    // First withdraws unlocked tokens, then earned tokens. Withdrawing earned tokens
    // incurs a 50% penalty which is distributed based on locked balances.
    function withdraw(uint256 amount) public nonReentrant updateReward(msg.sender) {
        require(amount > 0, "RubyStaker: Invalid withdraw amount.");
        Balances storage bal = balances[msg.sender];
        uint256 penaltyAmount;

        if (amount <= bal.unlocked) {
            bal.unlocked = bal.unlocked.sub(amount);
        } else {
            uint256 remaining = amount.sub(bal.unlocked);
            require(bal.earned >= remaining, "RubyStaker: Insufficient unlocked balance");
            bal.unlocked = 0;
            bal.earned = bal.earned.sub(remaining);
            for (uint256 i = 0; ; i++) {
                uint256 earnedAmount = userEarnings[msg.sender][i].amount;
                if (earnedAmount == 0) continue;
                if (penaltyAmount == 0 && userEarnings[msg.sender][i].unlockTime > block.timestamp) {
                    penaltyAmount = remaining;
                    require(bal.earned >= remaining, "RubyStaker: Insufficient balance after penalty");
                    bal.earned = bal.earned.sub(remaining);
                    if (bal.earned == 0) {
                        delete userEarnings[msg.sender];
                        break;
                    }
                    remaining = remaining.mul(2);
                }
                if (remaining <= earnedAmount) {
                    userEarnings[msg.sender][i].amount = earnedAmount.sub(remaining);
                    break;
                } else {
                    delete userEarnings[msg.sender][i];
                    remaining = remaining.sub(earnedAmount);
                }
            }
        }

        uint256 adjustedAmount = amount.add(penaltyAmount);
        bal.total = bal.total.sub(adjustedAmount);
        rubyToken.safeTransfer(msg.sender, amount);
        if (penaltyAmount > 0) {
            _notifyReward(penaltyAmount);
        }
        emit Withdrawn(msg.sender, amount);
    }

    // Claim all pending staking rewards
    function getReward() public nonReentrant updateReward(msg.sender) {
        uint256 reward = rewards[msg.sender];
        if (reward > 0) {
            rewards[msg.sender] = 0;
            rubyToken.safeTransfer(msg.sender, reward);
            emit RewardPaid(msg.sender, reward);
        }
    }

    // Withdraw full unlocked balance and claim pending rewards
    function exit() external updateReward(msg.sender) {
        (uint256 amount, uint256 penaltyAmount) = withdrawableBalance(msg.sender);
        delete userEarnings[msg.sender];
        Balances storage bal = balances[msg.sender];
        bal.total = bal.total.sub(bal.unlocked).sub(bal.earned);
        bal.unlocked = 0;
        bal.earned = 0;

        rubyToken.safeTransfer(msg.sender, amount);
        if (penaltyAmount > 0) {
            _notifyReward(penaltyAmount);
        }
        getReward();
    }

    // Withdraw all currently locked tokens where the unlock time has passed
    function withdrawExpiredLocks() external {
        LockedBalance[] storage locks = userLocks[msg.sender];
        Balances storage bal = balances[msg.sender];
        uint256 amount;
        uint256 length = locks.length;
        if (locks[length - 1].unlockTime <= block.timestamp) {
            amount = bal.locked;
            delete userLocks[msg.sender];
        } else {
            for (uint256 i = 0; i < length; i++) {
                if (locks[i].unlockTime > block.timestamp) break;
                amount = amount.add(locks[i].amount);
                delete locks[i];
            }
        }
        bal.locked = bal.locked.sub(amount);
        bal.total = bal.total.sub(amount);
        lockedSupply = lockedSupply.sub(amount);
        rubyToken.safeTransfer(msg.sender, amount);
    }

    /* ========== RESTRICTED FUNCTIONS ========== */

    function _notifyReward(uint256 reward) internal {
        if (block.timestamp >= rewardData.periodFinish) {
            rewardData.rewardRate = reward.div(rewardsDuration);
        } else {
            uint256 remaining = rewardData.periodFinish.sub(block.timestamp);
            uint256 leftover = remaining.mul(rewardData.rewardRate);
            rewardData.rewardRate = reward.add(leftover).div(rewardsDuration);
        }

        rewardData.lastUpdateTime = block.timestamp;
        rewardData.periodFinish = block.timestamp.add(rewardsDuration);
    }

    function notifyRewardAmount(uint256 reward) external onlyRewardDistributor updateReward(address(0)) {
        require(reward > 0, "RubyStaking: No reward");
        // handle the transfer of reward tokens via `transferFrom` to reduce the number
        // of transactions required and ensure correctness of the reward amount
        rubyToken.safeTransferFrom(msg.sender, address(this), reward);
        _notifyReward(reward);
        emit RewardAdded(reward);
    }

    /**
     * @notice Owner should be able to withdraw all the Reward tokens in case of emergency.
     * The owner should be able to withdraw the tokens to himself or another address
     * The RubyStaker contract will be placed behind a timelock, and the owner/deployer will be a multisig,
     * so this should not raise trust concerns.
     * This function is needed because the RubyStaker will be pre-fed with all of the
     * reward tokens (RUBY) tokens dedicated for liquidity mining incentives, and incase
     * of unfortunate situation they should be retreived.
     */
    function emergencyWithdrawRubyToken(address _receiver, uint256 _amount) external override onlyOwner {
        require(_receiver != address(0), "RubyStaker: Invalid withdrawal address.");
        require(_amount != 0, "RubyStaker: Invalid withdrawal amount.");
        require(rubyToken.balanceOf(address(this)) >= _amount, "RubyStaker: Not enough balance to withdraw.");
        rubyToken.safeTransfer(_receiver, _amount);
        emit RubyTokenEmergencyWithdrawal(address(rubyToken), _receiver, _amount);
    }
}
