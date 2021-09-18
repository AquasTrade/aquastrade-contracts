// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/utils/EnumerableSet.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IRubyMasterChefRewarder.sol";
import "./RubyToken.sol";
import "./libraries/BoringERC20.sol";

import "hardhat/console.sol";



// MasterChef copied from https://github.com/traderjoe-xyz/joe-core/blob/main/contracts/MasterChefJoeV2.sol
// Combines single and double rewards
contract RubyMasterChef is Ownable {
    using SafeMath for uint256;
    using BoringERC20 for IERC20;
    using EnumerableSet for EnumerableSet.AddressSet;

    // Info of each user.
    struct UserInfo {
        uint256 amount; // How many LP tokens the user has provided.
        uint256 rewardDebt; // Reward debt. See explanation below.
        //
        // We do some fancy math here. , any point in time, the amount of RUBYs
        // entitled to a user but is pending to be distributed is:
        //
        //   pending reward = (user.amount * pool.accRubyPerShare) - user.rewardDebt
        //
        // Whenever a user deposits or withdraws LP tokens to a pool. Here's what happens:
        //   1. The pool's `accRubyPerShare` (and `lastRewardTimestamp`) gets updated.
        //   2. User receives the pending reward sent to his/her address.
        //   3. User's `amount` gets updated.
        //   4. User's `rewardDebt` gets updated.
    }

    // Info of each pool.
    struct PoolInfo {
        IERC20 lpToken; // Address of LP token contract.
        uint256 allocPoint; // How many allocation points assigned to this pool. RUBYs to distribute per second.
        uint256 lastRewardTimestamp; // Last timestamp that RUBYs distribution occurs.
        uint256 accRubyPerShare; // Accumulated RUBYs per share, times 1e12. See below.
        IRubyMasterChefRewarder rewarder;
    }

    // The RUBY TOKEN!
    RubyToken public ruby;
    // Dev address.
    address public devAddr;
    // Treasury address.
    address public treasuryAddr;
    // RUBY tokens created per second.
    uint256 public rubyPerSec;
    // Percentage of pool rewards that goes to the treasury.
    uint256 public treasuryPercent;

    // Info of each pool.
    PoolInfo[] public poolInfo;
    // Set of all LP tokens that have been added as pools
    EnumerableSet.AddressSet private lpTokens;
    // Info of each user that stakes LP tokens.
    mapping(uint256 => mapping(address => UserInfo)) public userInfo;
    // Total allocation points. Must be the sum of all allocation points in all pools.
    uint256 public totalAllocPoint;
    // The timestamp when RUBY mining starts.
    uint256 public startTimestamp;

    event Add(uint256 indexed pid, uint256 allocPoint, IERC20 indexed lpToken, IRubyMasterChefRewarder indexed rewarder);
    event Set(uint256 indexed pid, uint256 allocPoint, IRubyMasterChefRewarder indexed rewarder, bool overwrite);
    event Deposit(address indexed user, uint256 indexed pid, uint256 amount);
    event Withdraw(address indexed user, uint256 indexed pid, uint256 amount);
    event UpdatePool(uint256 indexed pid, uint256 lastRewardTimestamp, uint256 lpSupply, uint256 accRubyPerShare);
    event Harvest(address indexed user, uint256 indexed pid, uint256 amount);
    event EmergencyWithdraw(address indexed user, uint256 indexed pid, uint256 amount);
    event SetDevAddress(address indexed oldAddress, address indexed newAddress);
    event UpdateEmissionRate(address indexed user, uint256 _rubyPerSec);

    constructor(
        RubyToken _ruby,
        address _devAddr,
        address _treasuryAddr,
        uint256 _rubyPerSec,
        uint256 _startTimestamp,
        uint256 _treasuryPercent
    ) public {
        require(0 <= _treasuryPercent && _treasuryPercent <= 1000, "Constructor: invalid treasury percent value");
        ruby = _ruby;
        devAddr = _devAddr;
        treasuryAddr = _treasuryAddr;
        rubyPerSec = _rubyPerSec;
        startTimestamp = _startTimestamp;
        treasuryPercent = _treasuryPercent;
        totalAllocPoint = 0;
    }

    function poolLength() external view returns (uint256) {
        return poolInfo.length;
    }

    // Add a new lp to the pool. Can only be called by the owner.
    // XXX DO NOT add the same LP token more than once. Rewards will be messed up if you do.
    function add(
        uint256 _allocPoint,
        IERC20 _lpToken,
        IRubyMasterChefRewarder _rewarder
    ) public onlyOwner {
        require(Address.isContract(address(_lpToken)), "add: LP token must be a valid contract");
        require(Address.isContract(address(_rewarder)) || address(_rewarder) == address(0), "add: rewarder must be contract or zero");
        require(!lpTokens.contains(address(_lpToken)), "add: LP already added");
        massUpdatePools();
        uint256 lastRewardTimestamp = block.timestamp > startTimestamp ? block.timestamp : startTimestamp;
        totalAllocPoint = totalAllocPoint.add(_allocPoint);
        poolInfo.push(
            PoolInfo({
                lpToken: _lpToken,
                allocPoint: _allocPoint,
                lastRewardTimestamp: lastRewardTimestamp,
                accRubyPerShare: 0,
                rewarder: _rewarder
            })
        );
        lpTokens.add(address(_lpToken));
        emit Add(poolInfo.length.sub(1), _allocPoint, _lpToken, _rewarder);
    }

    // Update the given pool's RUBY allocation point. Can only be called by the owner.
    function set(
        uint256 _pid,
        uint256 _allocPoint,
        IRubyMasterChefRewarder _rewarder,
        bool overwrite
    ) public onlyOwner {
        require(Address.isContract(address(_rewarder)) || address(_rewarder) == address(0), "set: rewarder must be contract or zero");
        massUpdatePools();
        totalAllocPoint = totalAllocPoint.sub(poolInfo[_pid].allocPoint).add(_allocPoint);
        poolInfo[_pid].allocPoint = _allocPoint;
        if (overwrite) {
            poolInfo[_pid].rewarder = _rewarder;
        }
        emit Set(_pid, _allocPoint, overwrite ? _rewarder : poolInfo[_pid].rewarder, overwrite);
    }

    // View function to see pending RUBYs on frontend.
    function pendingTokens(uint256 _pid, address _user)
        external
        view
        returns (
            uint256 pendingRuby,
            address bonusTokenAddress,
            string memory bonusTokenSymbol,
            uint256 pendingBonusToken
        )
    {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][_user];
        uint256 accRubyPerShare = pool.accRubyPerShare;
        uint256 lpSupply = pool.lpToken.balanceOf(address(this));
        if (block.timestamp > pool.lastRewardTimestamp && lpSupply != 0) {
            uint256 multiplier = block.timestamp.sub(pool.lastRewardTimestamp);
            uint256 lpPercent = 1000 - treasuryPercent;
            uint256 rubyReward = multiplier.mul(rubyPerSec).mul(pool.allocPoint).div(totalAllocPoint).mul(lpPercent).div(1000);
            accRubyPerShare = accRubyPerShare.add(rubyReward.mul(1e12).div(lpSupply));
        }
        pendingRuby = user.amount.mul(accRubyPerShare).div(1e12).sub(user.rewardDebt);

        // If it's a double reward farm, we return info about the bonus token
        if (address(pool.rewarder) != address(0)) {
            (bonusTokenAddress, bonusTokenSymbol) = rewarderBonusTokenInfo(_pid);
            pendingBonusToken = pool.rewarder.pendingTokens(_user);
        }
    }

    // Get bonus token info from the rewarder contract for a given pool, if it is a double reward farm
    function rewarderBonusTokenInfo(uint256 _pid) public view returns (address bonusTokenAddress, string memory bonusTokenSymbol) {
        PoolInfo storage pool = poolInfo[_pid];
        if (address(pool.rewarder) != address(0)) {
            bonusTokenAddress = address(pool.rewarder.rewardToken());
            bonusTokenSymbol = IERC20(pool.rewarder.rewardToken()).safeSymbol();
        }
    }

    // Update reward variables for all pools. Be careful of gas spending!
    function massUpdatePools() public {
        uint256 length = poolInfo.length;
        for (uint256 pid = 0; pid < length; ++pid) {
            updatePool(pid);
        }
    }

    // Update reward variables of the given pool to be up-to-date.
    function updatePool(uint256 _pid) public {
        PoolInfo storage pool = poolInfo[_pid];
        if (block.timestamp <= pool.lastRewardTimestamp) {
            return;
        }
        uint256 lpSupply = pool.lpToken.balanceOf(address(this));
        if (lpSupply == 0) {
            pool.lastRewardTimestamp = block.timestamp;
            return;
        }
        uint256 multiplier = block.timestamp.sub(pool.lastRewardTimestamp);
        uint256 rubyReward = multiplier.mul(rubyPerSec).mul(pool.allocPoint).div(totalAllocPoint);
        uint256 lpPercent = 1000 - treasuryPercent;
        ruby.mint(treasuryAddr, rubyReward.mul(treasuryPercent).div(1000));
        ruby.mint(address(this), rubyReward.mul(lpPercent).div(1000));
        pool.accRubyPerShare = pool.accRubyPerShare.add(rubyReward.mul(1e12).div(lpSupply).mul(lpPercent).div(1000));
        pool.lastRewardTimestamp = block.timestamp;
        emit UpdatePool(_pid, pool.lastRewardTimestamp, lpSupply, pool.accRubyPerShare);
    }

    // Deposit LP tokens to MasterChef for RUBY allocation.
    function deposit(uint256 _pid, uint256 _amount) public {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        updatePool(_pid);
        if (user.amount > 0) {
            // Harvest accRubyPerShare
            uint256 pending = user.amount.mul(pool.accRubyPerShare).div(1e12).sub(user.rewardDebt);
            safeRubyTransfer(msg.sender, pending);
            emit Harvest(msg.sender, _pid, pending);
        }
        user.amount = user.amount.add(_amount);
        user.rewardDebt = user.amount.mul(pool.accRubyPerShare).div(1e12);

        IRubyMasterChefRewarder rewarder = poolInfo[_pid].rewarder;
        if (address(rewarder) != address(0)) {
            rewarder.onRubyReward(msg.sender, user.amount);
        }

        pool.lpToken.safeTransferFrom(address(msg.sender), address(this), _amount);
        emit Deposit(msg.sender, _pid, _amount);
    }

    // Withdraw LP tokens from MasterChef.
    function withdraw(uint256 _pid, uint256 _amount) public {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        require(user.amount >= _amount, "withdraw: not good");

        updatePool(_pid);

        // Harvest RUBY
        uint256 pending = user.amount.mul(pool.accRubyPerShare).div(1e12).sub(user.rewardDebt);
        safeRubyTransfer(msg.sender, pending);
        emit Harvest(msg.sender, _pid, pending);

        user.amount = user.amount.sub(_amount);
        user.rewardDebt = user.amount.mul(pool.accRubyPerShare).div(1e12);

        IRubyMasterChefRewarder rewarder = poolInfo[_pid].rewarder;
        if (address(rewarder) != address(0)) {
            rewarder.onRubyReward(msg.sender, user.amount);
        }

        pool.lpToken.safeTransfer(address(msg.sender), _amount);
        emit Withdraw(msg.sender, _pid, _amount);
    }

    // Withdraw without caring about rewards. EMERGENCY ONLY.
    function emergencyWithdraw(uint256 _pid) public {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        pool.lpToken.safeTransfer(address(msg.sender), user.amount);
        emit EmergencyWithdraw(msg.sender, _pid, user.amount);
        user.amount = 0;
        user.rewardDebt = 0;
    }

    // Safe ruby transfer function, just in case if rounding error causes pool to not have enough RUBYs.
    function safeRubyTransfer(address _to, uint256 _amount) internal {
        uint256 rubyBal = ruby.balanceOf(address(this));
        if (_amount > rubyBal) {
            ruby.transfer(_to, rubyBal);
        } else {
            ruby.transfer(_to, _amount);
        }
    }

    // Update dev address by the previous dev.
    function dev(address _devAddr) public {
        require(msg.sender == devAddr, "dev: wut?");
        devAddr = _devAddr;
        emit SetDevAddress(msg.sender, _devAddr);
    }

    // Update treasury address by the previous treasury.
    function setTreasuryAddr(address _treasuryAddr) public {
        require(msg.sender == treasuryAddr, "setTreasuryAddr: wut?");
        treasuryAddr = _treasuryAddr;
    }

    function setTreasuryPercent(uint256 _newTreasuryPercent) public onlyOwner {
        require(0 <= _newTreasuryPercent && _newTreasuryPercent <= 1000, "setTreasuryPercent: invalid percent value");
        treasuryPercent = _newTreasuryPercent;
    }

    // Pancake has to add hidden dummy pools inorder to alter the emission,
    // here we make it simple and transparent to all.
    function updateEmissionRate(uint256 _rubyPerSec) public onlyOwner {
        massUpdatePools();
        rubyPerSec = _rubyPerSec;
        emit UpdateEmissionRate(msg.sender, _rubyPerSec);
    }
}