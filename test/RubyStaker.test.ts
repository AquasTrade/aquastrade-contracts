const { ethers, network } = require("hardhat");
import { expect } from "chai";
import { BigNumber } from "ethers";
import { RubyStaker } from "../typechain";
import { RubyBar__factory } from "../typechain/factories/RubyBar__factory";
import { ADDRESS_ZERO, advanceTimeByTimestamp, advanceTimeToTimestamp, latest, assertStakerBalances } from "./utilities";

describe("RubyStaker", function () {
  before(async function () {
    this.signers = await ethers.getSigners();
    this.alice = this.signers[0];
    this.owner = this.signers[0];
    this.bob = this.signers[1];
    this.carol = this.signers[2];
    this.treasury = this.signers[3];
    this.minter = this.signers[4];

    this.rewardDuration = 86400 * 7;
    this.lockDuration = this.rewardDuration * 13;

    this.rubyStaker = await ethers.getContractFactory("RubyStaker");
    this.RubyToken = await ethers.getContractFactory("RubyTokenMintable");
    this.USDPtoken = await ethers.getContractFactory("MockUSDP");
    this.DAItoken = await ethers.getContractFactory("MockDAI");

  });

  beforeEach(async function () {
    // deploys the ruby token and sends funds to the deployer
    this.ruby = await this.RubyToken.deploy(); 
    await this.ruby.deployed();

    this.usdp = await this.USDPtoken.deploy(); 
    await this.usdp.deployed();

    this.dai = await this.DAItoken.deploy(); 
    await this.dai.deployed();

    const ownerBalance = await this.ruby.balanceOf(this.owner.address);


    const transferAmount = ethers.utils.parseUnits("1000000", 18);
    await this.ruby.transfer(this.bob.address, transferAmount);
    await this.ruby.transfer(this.carol.address, transferAmount);


    this.staker = await this.rubyStaker.deploy(this.ruby.address);
    await this.staker.deployed();

    await this.ruby.approve(this.staker.address, ownerBalance);
    await this.ruby.connect(this.bob).approve(this.staker.address, transferAmount);
    await this.ruby.connect(this.carol).approve(this.staker.address, transferAmount);


  });

  // ADMIN FUNCTIONS

  it("should be deployed correctly", async function () {

    const rubyToken = await this.staker.rubyToken();
    const numRewards = await this.staker.numRewards();
    const rewardData = await this.staker.rewardData(0);
    expect(rubyToken).to.be.eq(this.ruby.address);
    expect(numRewards).to.be.eq(1);

    expect(rewardData.rewardToken).to.be.eq(this.ruby.address);
    expect(rewardData.lastUpdateTime.toNumber()).to.be.greaterThan(0);

  });

  it("reward minter should be set correctly", async function () {
    let rewardMinter = await this.staker.rewardMinter();
    expect(rewardMinter).to.be.eq(ADDRESS_ZERO);

    expect(await this.staker.setRewardMinter(this.owner.address)).to.emit(this.staker, "RewardMinterSet").withArgs(this.owner.address);

    rewardMinter = await this.staker.rewardMinter();
    expect(rewardMinter).to.be.eq(this.owner.address);
  });

  it("reward should be added correctly", async function () {

    expect(await this.staker.addReward(this.ruby.address, this.owner.address)).to.emit(this.staker, "RewardDataRegistered").withArgs(this.ruby.address, this.owner.address);

    const numRewards = await this.staker.numRewards();
    const rewardData = await this.staker.rewardData(1);
    const rewardDistributorSet = await this.staker.rewardDistributors(1, this.owner.address);

    expect(numRewards).to.be.eq(2);

    expect(rewardData.rewardToken).to.be.eq(this.ruby.address);
    expect(rewardData.lastUpdateTime.toNumber()).to.be.greaterThan(0);
    expect(rewardData.periodFinish.toNumber()).to.be.greaterThan(0);
    expect(rewardDistributorSet).to.be.eq(true);
  }); 


  it("reward distributor should be approved correctly", async function () {

    expect(await this.staker.addReward(this.ruby.address, this.owner.address)).to.emit(this.staker, "RewardDataRegistered").withArgs(this.ruby.address, this.owner.address);

    const rewardDistributorSet = await this.staker.rewardDistributors(1, this.owner.address);
    
    let rewardDistributor2Set = await this.staker.rewardDistributors(1, this.bob.address);
    expect(rewardDistributorSet).to.be.eq(true);
    expect(rewardDistributor2Set).to.be.eq(false);

    // Approve reward distributor
    expect(await this.staker.approveRewardDistributor(1, this.bob.address, true)).to.emit(this.staker, "RewardDistributorApproved").withArgs(this.ruby.address, this.bob.address, true);
    rewardDistributor2Set = await this.staker.rewardDistributors(1, this.bob.address);
    expect(rewardDistributor2Set).to.be.eq(true);

    // Dissaprove reward distributor
    expect(await this.staker.approveRewardDistributor(1, this.bob.address, false)).to.emit(this.staker, "RewardDistributorApproved").withArgs(this.ruby.address, this.bob.address, false);
    rewardDistributor2Set = await this.staker.rewardDistributors(1, this.bob.address);
    expect(rewardDistributor2Set).to.be.eq(false);
  }); 

  // STAKING FUNCTIONS

  it("single user staking should work as expected", async function () {

    const bobInitialBalance = await this.ruby.balanceOf(this.bob.address);
    const stakeAmount = 100000;
    
    expect (await this.staker.connect(this.bob).stake(stakeAmount, false)).to.emit(this.staker, "Staked").withArgs(this.bob.address, stakeAmount);
    const bobBalance = await this.ruby.balanceOf(this.bob.address);
    const stakerBalance = await this.ruby.balanceOf(this.staker.address);

    expect(bobBalance).to.be.eq(bobInitialBalance.sub(stakeAmount));
    expect(stakerBalance).to.be.eq(stakeAmount);

    const totalBalance = await this.staker.totalBalance(this.bob.address);
    const unlockedBalance = await this.staker.unlockedBalance(this.bob.address);
    const lockedBalances = await this.staker.lockedBalances(this.bob.address);
    const earnedBalances = await this.staker.earnedBalances(this.bob.address);

    const totalSupply = await this.staker.totalSupply();
    const lockedSupply = await this.staker.lockedSupply();

    expect(totalBalance).to.be.eq(stakeAmount);
    expect(unlockedBalance).to.be.eq(stakeAmount);

    expect(lockedBalances.total).to.be.eq(0);
    expect(lockedBalances.unlockable).to.be.eq(0);
    expect(lockedBalances.locked).to.be.eq(0);
    expect(lockedBalances.lockData.length).to.be.eq(0);

    expect(earnedBalances.total).to.be.eq(0);
    expect(earnedBalances.earningsData.length).to.be.eq(0);

    expect(totalSupply).to.be.eq(stakeAmount);
    expect(lockedSupply).to.be.eq(0);

  }); 

  it("multiple user staking should work as expected", async function () {

    const bobInitialBalance = await this.ruby.balanceOf(this.bob.address);
    const stakeAmounts = [100000, 500000, 66666]
    const bobStakedAmount = stakeAmounts[0] + stakeAmounts[1];
    const totalStakeAmount = stakeAmounts[0] + stakeAmounts[1] + stakeAmounts[2];
    
    expect (await this.staker.connect(this.bob).stake(stakeAmounts[0], false)).to.emit(this.staker, "Staked").withArgs(this.bob.address, stakeAmounts[0]);
    expect (await this.staker.connect(this.bob).stake(stakeAmounts[1], false)).to.emit(this.staker, "Staked").withArgs(this.bob.address, stakeAmounts[1]);
    expect (await this.staker.connect(this.carol).stake(stakeAmounts[2], false)).to.emit(this.staker, "Staked").withArgs(this.carol.address, stakeAmounts[2]);

    const bobBalance = await this.ruby.balanceOf(this.bob.address);
    const stakerBalance = await this.ruby.balanceOf(this.staker.address);

    expect(bobBalance).to.be.eq(bobInitialBalance.sub(bobStakedAmount));
    expect(stakerBalance).to.be.eq(totalStakeAmount);

    const totalBalance = await this.staker.totalBalance(this.bob.address);
    const unlockedBalance = await this.staker.unlockedBalance(this.bob.address);
    const lockedBalances = await this.staker.lockedBalances(this.bob.address);
    const earnedBalances = await this.staker.earnedBalances(this.bob.address);

    const totalSupply = await this.staker.totalSupply();
    const lockedSupply = await this.staker.lockedSupply();

    expect(totalBalance).to.be.eq(bobStakedAmount);
    expect(unlockedBalance).to.be.eq(bobStakedAmount);

    expect(lockedBalances.total).to.be.eq(0);
    expect(lockedBalances.unlockable).to.be.eq(0);
    expect(lockedBalances.locked).to.be.eq(0);
    expect(lockedBalances.lockData.length).to.be.eq(0);

    expect(earnedBalances.total).to.be.eq(0);
    expect(earnedBalances.earningsData.length).to.be.eq(0);

    expect(totalSupply).to.be.eq(totalStakeAmount);
    expect(lockedSupply).to.be.eq(0);


  }); 

  it("multiple user minting should work as expected", async function () {

    const mintAmounts = [30000, 50000, 40000, 20000];

    expect(await this.staker.setRewardMinter(this.owner.address)).to.emit(this.staker, "RewardMinterSet").withArgs(this.owner.address);

    expect (await this.staker.mint(this.bob.address, mintAmounts[0])).to.emit(this.staker, "Staked").withArgs(this.bob.address, mintAmounts[0]);
    const block = await ethers.provider.getBlock();
    const lockedUntil = Math.floor(block.timestamp / this.rewardDuration) * this.rewardDuration + this.lockDuration;


    await advanceTimeByTimestamp(this.rewardDuration);

    expect (await this.staker.mint(this.bob.address, mintAmounts[1])).to.emit(this.staker, "Staked").withArgs(this.bob.address, mintAmounts[1]);
    expect (await this.staker.mint(this.bob.address, mintAmounts[2])).to.emit(this.staker, "Staked").withArgs(this.bob.address, mintAmounts[2]);

    await advanceTimeByTimestamp(this.rewardDuration * 2);

    expect (await this.staker.mint(this.bob.address, mintAmounts[3])).to.emit(this.staker, "Staked").withArgs(this.bob.address, mintAmounts[3]);

    const unlockedBalance = await this.staker.unlockedBalance(this.bob.address);
    const withdrawableBalances = await this.staker.withdrawableBalance(this.bob.address);
    const earnedBalances = await this.staker.earnedBalances(this.bob.address);

    const totalSupply = await this.staker.totalSupply();
    const lockedSupply = await this.staker.lockedSupply();

    expect(unlockedBalance).to.be.eq(0);


    expect(earnedBalances.total).to.be.eq(140000);
    expect(earnedBalances.earningsData[0].amount).to.be.eq(30000);
    expect(earnedBalances.earningsData[0].unlockTime).to.be.eq(lockedUntil); 
    expect(earnedBalances.earningsData[1].amount).to.be.eq(90000);
    expect(earnedBalances.earningsData[1].unlockTime).to.be.eq(lockedUntil + this.rewardDuration); 
    expect(earnedBalances.earningsData[2].amount).to.be.eq(20000);
    expect(earnedBalances.earningsData[2].unlockTime).to.be.eq(lockedUntil + this.rewardDuration * 3);

    expect(withdrawableBalances.amount).to.be.eq(70000);
    expect(withdrawableBalances.penaltyAmount).to.be.eq(70000);

    expect(totalSupply).to.be.eq(140000);
    expect(lockedSupply).to.be.eq(0);


  }); 


  it("single user locking should work as expected", async function () {

    const bobInitialBalance = await this.ruby.balanceOf(this.bob.address);
    const stakeAmount = 100000;
    
    expect (await this.staker.connect(this.bob).stake(stakeAmount, true)).to.emit(this.staker, "Staked").withArgs(this.bob.address, stakeAmount);

    const block = await ethers.provider.getBlock();
    const lockedUntil = Math.floor(block.timestamp / this.rewardDuration) * this.rewardDuration + this.lockDuration;

    const bobBalance = await this.ruby.balanceOf(this.bob.address);
    const stakerBalance = await this.ruby.balanceOf(this.staker.address);

    expect(bobBalance).to.be.eq(bobInitialBalance.sub(stakeAmount));
    expect(stakerBalance).to.be.eq(stakeAmount);

    const totalBalance = await this.staker.totalBalance(this.bob.address);
    const unlockedBalance = await this.staker.unlockedBalance(this.bob.address);
    const lockedBalances = await this.staker.lockedBalances(this.bob.address);
    const earnedBalances = await this.staker.earnedBalances(this.bob.address);

    const totalSupply = await this.staker.totalSupply();
    const lockedSupply = await this.staker.lockedSupply();

    expect(totalBalance).to.be.eq(stakeAmount);
    expect(unlockedBalance).to.be.eq(0);

    expect(lockedBalances.total).to.be.eq(100000);
    expect(lockedBalances.unlockable).to.be.eq(0);
    expect(lockedBalances.locked).to.be.eq(100000);
    expect(lockedBalances.lockData[0].amount).to.be.eq(100000);
    expect(lockedBalances.lockData[0].unlockTime).to.be.eq(lockedUntil);

    expect(earnedBalances.total).to.be.eq(0);
    expect(earnedBalances.earningsData.length).to.be.eq(0);

    expect(totalSupply).to.be.eq(stakeAmount);
    expect(lockedSupply).to.be.eq(stakeAmount);

  }); 

  it("multiple user locking should work as expected", async function () {

    const bobInitialBalance = await this.ruby.balanceOf(this.bob.address);
    const stakeAmounts = [10000, 20000, 30000, 40000]
    const totalStaked = 100000
    
    expect (await this.staker.connect(this.bob).stake(stakeAmounts[0], true)).to.emit(this.staker, "Staked").withArgs(this.bob.address, stakeAmounts[0]);
    expect (await this.staker.connect(this.bob).stake(stakeAmounts[1], true)).to.emit(this.staker, "Staked").withArgs(this.bob.address, stakeAmounts[1]);
    const block = await ethers.provider.getBlock();
    const lockedUntil = Math.floor(block.timestamp / this.rewardDuration) * this.rewardDuration + this.lockDuration;

    await advanceTimeByTimestamp(this.rewardDuration);
    expect (await this.staker.connect(this.bob).stake(stakeAmounts[2], true)).to.emit(this.staker, "Staked").withArgs(this.bob.address, stakeAmounts[2]);
    await advanceTimeByTimestamp(this.rewardDuration * 3);
    expect (await this.staker.connect(this.bob).stake(stakeAmounts[3], true)).to.emit(this.staker, "Staked").withArgs(this.bob.address, stakeAmounts[3]);


    const bobBalance = await this.ruby.balanceOf(this.bob.address);
    const stakerBalance = await this.ruby.balanceOf(this.staker.address);

    expect(bobBalance).to.be.eq(bobInitialBalance.sub(totalStaked));
    expect(stakerBalance).to.be.eq(totalStaked);

    const totalBalance = await this.staker.totalBalance(this.bob.address);
    const unlockedBalance = await this.staker.unlockedBalance(this.bob.address);
    const lockedBalances = await this.staker.lockedBalances(this.bob.address);
    const earnedBalances = await this.staker.earnedBalances(this.bob.address);

    const totalSupply = await this.staker.totalSupply();
    const lockedSupply = await this.staker.lockedSupply();

    expect(totalBalance).to.be.eq(totalStaked);
    expect(unlockedBalance).to.be.eq(0);

    expect(lockedBalances.total).to.be.eq(100000);
    expect(lockedBalances.unlockable).to.be.eq(0);
    expect(lockedBalances.locked).to.be.eq(100000);
    expect(lockedBalances.lockData[0].amount).to.be.eq(stakeAmounts[0] + stakeAmounts[1]);
    expect(lockedBalances.lockData[0].unlockTime).to.be.eq(lockedUntil);

    expect(lockedBalances.lockData[1].amount).to.be.eq(stakeAmounts[2]);
    expect(lockedBalances.lockData[1].unlockTime).to.be.eq(lockedUntil + this.rewardDuration); // TODO:
    
    expect(lockedBalances.lockData[2].amount).to.be.eq(stakeAmounts[3]);
    expect(lockedBalances.lockData[2].unlockTime).to.be.eq(lockedUntil + this.rewardDuration * 4); // TODO:

    expect(earnedBalances.total).to.be.eq(0);
    expect(earnedBalances.earningsData.length).to.be.eq(0);

    expect(totalSupply).to.be.eq(totalStaked);
    expect(lockedSupply).to.be.eq(totalStaked);

  }); 

  it("locks expiring should work as expected", async function () {

    const bobInitialBalance = await this.ruby.balanceOf(this.bob.address);
    const stakeAmounts = [20000, 30000, 50000]
    const totalStaked = 100000
    
    expect (await this.staker.connect(this.bob).stake(stakeAmounts[0], true)).to.emit(this.staker, "Staked").withArgs(this.bob.address, stakeAmounts[0]);

    let block = await ethers.provider.getBlock();
    const lockedUntil = Math.floor(block.timestamp / this.rewardDuration) * this.rewardDuration + this.lockDuration;

    await advanceTimeByTimestamp(this.rewardDuration);

    expect (await this.staker.connect(this.bob).stake(stakeAmounts[1], true)).to.emit(this.staker, "Staked").withArgs(this.bob.address, stakeAmounts[1]);
    await advanceTimeByTimestamp(this.rewardDuration);
    expect (await this.staker.connect(this.bob).stake(stakeAmounts[2], true)).to.emit(this.staker, "Staked").withArgs(this.bob.address, stakeAmounts[2]);
    await advanceTimeToTimestamp(lockedUntil + 1);
    
    let bobBalance = await this.ruby.balanceOf(this.bob.address);
    let stakerBalance = await this.ruby.balanceOf(this.staker.address);

    expect(bobBalance).to.be.eq(bobInitialBalance.sub(totalStaked));
    expect(stakerBalance).to.be.eq(totalStaked);

    let totalBalance = await this.staker.totalBalance(this.bob.address);
    let unlockedBalance = await this.staker.unlockedBalance(this.bob.address);
    let lockedBalances = await this.staker.lockedBalances(this.bob.address);
    let earnedBalances = await this.staker.earnedBalances(this.bob.address);

    let totalSupply = await this.staker.totalSupply();
    let lockedSupply = await this.staker.lockedSupply();

    expect(totalBalance).to.be.eq(totalStaked);
    expect(unlockedBalance).to.be.eq(0);

    expect(lockedBalances.total).to.be.eq(totalStaked);
    expect(lockedBalances.unlockable).to.be.eq(stakeAmounts[0]);
    expect(lockedBalances.locked).to.be.eq(stakeAmounts[1] + stakeAmounts[2]);

    expect(lockedBalances.lockData[0].amount).to.be.eq(stakeAmounts[1]);
    expect(lockedBalances.lockData[0].unlockTime).to.be.eq(lockedUntil + this.rewardDuration);

    expect(lockedBalances.lockData[1].amount).to.be.eq(stakeAmounts[2]);
    expect(lockedBalances.lockData[1].unlockTime).to.be.eq(lockedUntil + this.rewardDuration * 2);

    expect(earnedBalances.total).to.be.eq(0);
    expect(earnedBalances.earningsData.length).to.be.eq(0);

    expect(totalSupply).to.be.eq(totalStaked);
    expect(lockedSupply).to.be.eq(totalStaked);

    await advanceTimeByTimestamp(this.rewardDuration);

    lockedBalances = await this.staker.lockedBalances(this.bob.address);

    expect(lockedBalances.total).to.be.eq(totalStaked);
    expect(lockedBalances.unlockable).to.be.eq(stakeAmounts[0] + stakeAmounts[1]);
    expect(lockedBalances.locked).to.be.eq(stakeAmounts[2]);

    expect(lockedBalances.lockData[0].amount).to.be.eq(stakeAmounts[2]);
    expect(lockedBalances.lockData[0].unlockTime).to.be.eq(lockedUntil + this.rewardDuration * 2);

    expect (await this.staker.connect(this.bob).withdrawExpiredLocks()).to.emit(this.staker, "ExpiredLocksWithdrawal").withArgs(this.bob.address, stakeAmounts[0] + stakeAmounts[1]);

    bobBalance = await this.ruby.balanceOf(this.bob.address);
    stakerBalance = await this.ruby.balanceOf(this.staker.address);

    let amountWithdrawn = stakeAmounts[0] + stakeAmounts[1];

    expect(bobBalance).to.be.eq(bobInitialBalance.sub(totalStaked).add(amountWithdrawn));
    expect(stakerBalance).to.be.eq(totalStaked - amountWithdrawn);

    totalBalance = await this.staker.totalBalance(this.bob.address);
    unlockedBalance = await this.staker.unlockedBalance(this.bob.address);
    lockedBalances = await this.staker.lockedBalances(this.bob.address);
    earnedBalances = await this.staker.earnedBalances(this.bob.address);

    totalSupply = await this.staker.totalSupply();
    lockedSupply = await this.staker.lockedSupply();


    expect(totalBalance).to.be.eq(stakeAmounts[2]);
    expect(unlockedBalance).to.be.eq(0);

    expect(lockedBalances.total).to.be.eq(stakeAmounts[2]);
    expect(lockedBalances.unlockable).to.be.eq(0);
    expect(lockedBalances.locked).to.be.eq(stakeAmounts[2]);

    expect(lockedBalances.lockData[0].amount).to.be.eq(stakeAmounts[2]);
    expect(lockedBalances.lockData[0].unlockTime).to.be.eq(lockedUntil + this.rewardDuration * 2);

    expect(earnedBalances.total).to.be.eq(0);
    expect(earnedBalances.earningsData.length).to.be.eq(0);

    expect(totalSupply).to.be.eq(totalStaked - amountWithdrawn);
    expect(lockedSupply).to.be.eq(totalStaked - amountWithdrawn);

 
    await advanceTimeByTimestamp(this.rewardDuration);


    lockedBalances = await this.staker.lockedBalances(this.bob.address);

    expect(lockedBalances.total).to.be.eq(stakeAmounts[2]);
    expect(lockedBalances.unlockable).to.be.eq(stakeAmounts[2]);
    expect(lockedBalances.locked).to.be.eq(0);

    expect(lockedBalances.lockData.length).to.be.eq(0);

    expect (await this.staker.connect(this.bob).withdrawExpiredLocks()).to.emit(this.staker, "ExpiredLocksWithdrawal").withArgs(this.bob.address, stakeAmounts[2]);

    bobBalance = await this.ruby.balanceOf(this.bob.address);
    stakerBalance = await this.ruby.balanceOf(this.staker.address);


    expect(bobBalance).to.be.eq(bobInitialBalance);
    expect(stakerBalance).to.be.eq(0);

    totalBalance = await this.staker.totalBalance(this.bob.address);
    unlockedBalance = await this.staker.unlockedBalance(this.bob.address);
    lockedBalances = await this.staker.lockedBalances(this.bob.address);
    earnedBalances = await this.staker.earnedBalances(this.bob.address);

    totalSupply = await this.staker.totalSupply();
    lockedSupply = await this.staker.lockedSupply();


    expect(totalBalance).to.be.eq(0);
    expect(unlockedBalance).to.be.eq(0);

    expect(lockedBalances.total).to.be.eq(0);
    expect(lockedBalances.unlockable).to.be.eq(0);
    expect(lockedBalances.locked).to.be.eq(0);

    expect(lockedBalances.lockData.length).to.be.eq(0);

    expect(earnedBalances.total).to.be.eq(0);
    expect(earnedBalances.earningsData.length).to.be.eq(0);

    expect(totalSupply).to.be.eq(0);
    expect(lockedSupply).to.be.eq(0);


  }); 

  it("withdrwing unlocked stake should work as expected", async function () {

    const bobInitialBalance = await this.ruby.balanceOf(this.bob.address);
    const stakeAmount = 10000;
    
    expect (await this.staker.connect(this.bob).stake(stakeAmount, false)).to.emit(this.staker, "Staked").withArgs(this.bob.address, stakeAmount);
    expect (await this.staker.connect(this.bob).withdraw(stakeAmount)).to.emit(this.staker, "Withdrawal").withArgs(this.bob.address, stakeAmount);
    
    let bobBalance = await this.ruby.balanceOf(this.bob.address);
    let stakerBalance = await this.ruby.balanceOf(this.staker.address);

    expect(bobBalance).to.be.eq(bobInitialBalance);
    
    expect(stakerBalance).to.be.eq(0);

  }); 

  it("withdrawing partial unlocked stake should work as expected", async function () {

    const bobInitialBalance = await this.ruby.balanceOf(this.bob.address);
    const stakeAmount = 10000;
    
    expect (await this.staker.connect(this.bob).stake(stakeAmount, false)).to.emit(this.staker, "Staked").withArgs(this.bob.address, stakeAmount);
    expect (await this.staker.connect(this.bob).withdraw(4000)).to.emit(this.staker, "Withdrawal").withArgs(this.bob.address, 4000);
    
    let bobBalance = await this.ruby.balanceOf(this.bob.address);
    let stakerBalance = await this.ruby.balanceOf(this.staker.address);

    expect(bobBalance).to.be.eq(bobInitialBalance.sub(stakeAmount).add(4000));
    expect(stakerBalance).to.be.eq(stakeAmount - 4000);

  }); 

  it("withdrawing unlocked earned balance should work as expected", async function () {

    const bobInitialBalance = await this.ruby.balanceOf(this.bob.address);
    const stakeAmount = 10000;
    const mintAmount = 30000;
    
    expect(await this.staker.setRewardMinter(this.owner.address)).to.emit(this.staker, "RewardMinterSet").withArgs(this.owner.address);


    expect (await this.staker.connect(this.bob).stake(stakeAmount, false)).to.emit(this.staker, "Staked").withArgs(this.bob.address, stakeAmount);
    expect (await this.staker.mint(this.bob.address, mintAmount)).to.emit(this.staker, "Staked").withArgs(this.bob.address, mintAmount);
    await this.ruby.transfer(this.staker.address, mintAmount);


    let block = await ethers.provider.getBlock();
    const lockedUntil = Math.floor(block.timestamp / this.rewardDuration) * this.rewardDuration + this.lockDuration;
    
    let earnedBalances = await this.staker.earnedBalances(this.bob.address);
    expect(earnedBalances.total).to.be.eq(mintAmount);
    expect(earnedBalances.earningsData[0].amount).to.be.eq(mintAmount);
    expect(earnedBalances.earningsData[0].unlockTime).to.be.eq(lockedUntil);

    expect (await this.staker.connect(this.bob).withdraw(stakeAmount)).to.emit(this.staker, "Withdrawal").withArgs(this.bob.address, stakeAmount);

    let bobBalance = await this.ruby.balanceOf(this.bob.address);
    let stakerBalance = await this.ruby.balanceOf(this.staker.address);

    expect(bobBalance).to.be.eq(bobInitialBalance);
    expect(stakerBalance).to.be.eq(mintAmount);

    earnedBalances = await this.staker.earnedBalances(this.bob.address);
    expect(earnedBalances.total).to.be.eq(mintAmount);
    expect(earnedBalances.earningsData[0].amount).to.be.eq(mintAmount);
    expect(earnedBalances.earningsData[0].unlockTime).to.be.eq(lockedUntil);


  });

  it("withdrawing unlocked and earned balance with penalty should work as expected", async function () {

    const bobInitialBalance = await this.ruby.balanceOf(this.bob.address);
    const stakeAmount = 10000;
    const mintAmount = 30000;
    
    expect(await this.staker.setRewardMinter(this.owner.address)).to.emit(this.staker, "RewardMinterSet").withArgs(this.owner.address);


    expect (await this.staker.connect(this.bob).stake(stakeAmount, false)).to.emit(this.staker, "Staked").withArgs(this.bob.address, stakeAmount);
    expect (await this.staker.mint(this.bob.address, mintAmount)).to.emit(this.staker, "Staked").withArgs(this.bob.address, mintAmount);
    await this.ruby.transfer(this.staker.address, mintAmount);


    let block = await ethers.provider.getBlock();
    const lockedUntil = Math.floor(block.timestamp / this.rewardDuration) * this.rewardDuration + this.lockDuration;
    
    let earnedBalances = await this.staker.earnedBalances(this.bob.address);
    expect(earnedBalances.total).to.be.eq(mintAmount);
    expect(earnedBalances.earningsData[0].amount).to.be.eq(mintAmount);
    expect(earnedBalances.earningsData[0].unlockTime).to.be.eq(lockedUntil);

    await expect (this.staker.connect(this.bob).withdraw(25001)).to.be.revertedWith("RubyStaker: Insufficient balance after penalty");

    expect (await this.staker.connect(this.bob).withdraw(25000)).to.emit(this.staker, "Withdrawal").withArgs(this.bob.address, 25000);


    let bobBalance = await this.ruby.balanceOf(this.bob.address);
    let stakerBalance = await this.ruby.balanceOf(this.staker.address);

    expect(bobBalance).to.be.eq(bobInitialBalance.add(15000));
    expect(stakerBalance).to.be.eq(mintAmount - 15000);

    earnedBalances = await this.staker.earnedBalances(this.bob.address);
    expect(earnedBalances.total).to.be.eq(0);
    expect(earnedBalances.earningsData.length).to.be.eq(0);

    const totalSupply = await this.staker.totalSupply();
    expect(totalSupply).to.be.eq(0);

  });

  it("withdrawing unlocked and earned partial balance should work as expected", async function () {
    const bobInitialBalance = await this.ruby.balanceOf(this.bob.address);
    const mintAmounts = [30000, 60000];
    const stakeAmount = 10000;
    
    expect(await this.staker.setRewardMinter(this.owner.address)).to.emit(this.staker, "RewardMinterSet").withArgs(this.owner.address);

    expect (await this.staker.mint(this.bob.address, mintAmounts[0])).to.emit(this.staker, "Staked").withArgs(this.bob.address, mintAmounts[0]);
    await this.ruby.transfer(this.staker.address, mintAmounts[0]);

    let block = await ethers.provider.getBlock();
    const lockedUntil = Math.floor(block.timestamp / this.rewardDuration) * this.rewardDuration + this.lockDuration;
    
    await advanceTimeByTimestamp(this.rewardDuration)

    expect (await this.staker.connect(this.bob).stake(stakeAmount, false)).to.emit(this.staker, "Staked").withArgs(this.bob.address, stakeAmount);

    expect (await this.staker.mint(this.bob.address, mintAmounts[1])).to.emit(this.staker, "Staked").withArgs(this.bob.address, mintAmounts[1]);
    await this.ruby.transfer(this.staker.address, mintAmounts[1]);

    expect (await this.staker.connect(this.bob).withdraw(15000)).to.emit(this.staker, "Withdrawal").withArgs(this.bob.address, 15000);

    let bobBalance = await this.ruby.balanceOf(this.bob.address);
    let stakerBalance = await this.ruby.balanceOf(this.staker.address);

    expect(bobBalance).to.be.eq(bobInitialBalance.add(5000));
    expect(stakerBalance).to.be.eq(mintAmounts[0] + mintAmounts[1] - 5000);

    let earnedBalances = await this.staker.earnedBalances(this.bob.address);
    expect(earnedBalances.total).to.be.eq(80000);
    expect(earnedBalances.earningsData[0].amount).to.be.eq(20000);
    expect(earnedBalances.earningsData[0].unlockTime).to.be.eq(lockedUntil);

    expect(earnedBalances.earningsData[1].amount).to.be.eq(60000);
    expect(earnedBalances.earningsData[1].unlockTime).to.be.eq(lockedUntil + this.rewardDuration);

    expect (await this.staker.connect(this.bob).withdraw(15000)).to.emit(this.staker, "Withdrawal").withArgs(this.bob.address, 15000);

    bobBalance = await this.ruby.balanceOf(this.bob.address);
    stakerBalance = await this.ruby.balanceOf(this.staker.address);

    expect(bobBalance).to.be.eq(bobInitialBalance.add(20000));
    expect(stakerBalance).to.be.eq(mintAmounts[0] + mintAmounts[1] - 20000);

    earnedBalances = await this.staker.earnedBalances(this.bob.address);
    expect(earnedBalances.total).to.be.eq(50000);
    expect(earnedBalances.earningsData[0].amount).to.be.eq(50000);
    expect(earnedBalances.earningsData[0].unlockTime).to.be.eq(lockedUntil + this.rewardDuration);

  });


  it("withdrawing earned balance without penalty should work as expected", async function () {
 
    const bobInitialBalance = await this.ruby.balanceOf(this.bob.address);
    const mintAmounts = [30000, 60000];
    
    const totalMintAmount = mintAmounts[0] + mintAmounts[1];

    expect(await this.staker.setRewardMinter(this.owner.address)).to.emit(this.staker, "RewardMinterSet").withArgs(this.owner.address);

    expect (await this.staker.mint(this.bob.address, mintAmounts[0])).to.emit(this.staker, "Staked").withArgs(this.bob.address, mintAmounts[0]);
    await this.ruby.transfer(this.staker.address, mintAmounts[0]);

    let block = await ethers.provider.getBlock();
    const lockedUntil = Math.floor(block.timestamp / this.rewardDuration) * this.rewardDuration + this.lockDuration;
    
    await advanceTimeByTimestamp(this.rewardDuration)

    expect (await this.staker.mint(this.bob.address, mintAmounts[1])).to.emit(this.staker, "Staked").withArgs(this.bob.address, mintAmounts[1]);
    await this.ruby.transfer(this.staker.address, mintAmounts[1]);

    await advanceTimeToTimestamp(lockedUntil + this.rewardDuration + 3);

    block = await ethers.provider.getBlock();

    let earnedBalances = await this.staker.earnedBalances(this.bob.address);
    let unlockedBalance = await this.staker.unlockedBalance(this.bob.address);

    expect(earnedBalances.total).to.be.eq(0);
    expect(earnedBalances.earningsData.length).to.be.eq(0);
    expect(unlockedBalance).to.be.eq(totalMintAmount);


    await expect (this.staker.connect(this.bob).withdraw(totalMintAmount + 1)).to.be.revertedWith("RubyStaker: Insufficient unlocked balance");

    expect (await this.staker.connect(this.bob).withdraw(totalMintAmount)).to.emit(this.staker, "Withdrawal").withArgs(this.bob.address, totalMintAmount);

    let bobBalance = await this.ruby.balanceOf(this.bob.address);
    let stakerBalance = await this.ruby.balanceOf(this.staker.address);

    expect(bobBalance).to.be.eq(bobInitialBalance.add(totalMintAmount));
    expect(stakerBalance).to.be.eq(0);

    earnedBalances = await this.staker.earnedBalances(this.bob.address);
    unlockedBalance = await this.staker.unlockedBalance(this.bob.address);

    expect(earnedBalances.total).to.be.eq(0);
    expect(earnedBalances.earningsData.length).to.be.eq(0);
    expect(unlockedBalance).to.be.eq(0);
    
    const totalSupply = await this.staker.totalSupply();
    expect(totalSupply).to.be.eq(0);

  });


  it("withdrawing earned partial balance with penalty should work as expected", async function () {
    const bobInitialBalance = await this.ruby.balanceOf(this.bob.address);
    const mintAmounts = [30000, 60000];
    

    expect(await this.staker.setRewardMinter(this.owner.address)).to.emit(this.staker, "RewardMinterSet").withArgs(this.owner.address);

    expect (await this.staker.mint(this.bob.address, mintAmounts[0])).to.emit(this.staker, "Staked").withArgs(this.bob.address, mintAmounts[0]);
    await this.ruby.transfer(this.staker.address, mintAmounts[0]);

    let block = await ethers.provider.getBlock();
    const lockedUntil = Math.floor(block.timestamp / this.rewardDuration) * this.rewardDuration + this.lockDuration;
    
    await advanceTimeByTimestamp(this.rewardDuration);


    expect (await this.staker.mint(this.bob.address, mintAmounts[1])).to.emit(this.staker, "Staked").withArgs(this.bob.address, mintAmounts[1]);
    await this.ruby.transfer(this.staker.address, mintAmounts[1]);

    await advanceTimeToTimestamp(lockedUntil + 1);

    let earnedBalances = await this.staker.earnedBalances(this.bob.address);
    let unlockedBalance = await this.staker.unlockedBalance(this.bob.address);

    expect(earnedBalances.total).to.be.eq(mintAmounts[1]);
    expect(earnedBalances.earningsData[0].amount).to.be.eq(mintAmounts[1]);
    expect(earnedBalances.earningsData[0].unlockTime).to.be.eq(lockedUntil + this.rewardDuration);
    expect(unlockedBalance).to.be.eq(mintAmounts[0]);


    await expect (this.staker.connect(this.bob).withdraw(60000 + 1)).to.be.revertedWith("RubyStaker: Insufficient balance after penalty");

    expect (await this.staker.connect(this.bob).withdraw(60000)).to.emit(this.staker, "Withdrawal").withArgs(this.bob.address, 60000);

    let bobBalance = await this.ruby.balanceOf(this.bob.address);
    let stakerBalance = await this.ruby.balanceOf(this.staker.address);

    expect(bobBalance).to.be.eq(bobInitialBalance.add(60000));
    expect(stakerBalance).to.be.eq(30000);

    earnedBalances = await this.staker.earnedBalances(this.bob.address);
    unlockedBalance = await this.staker.unlockedBalance(this.bob.address);

    expect(earnedBalances.total).to.be.eq(0);
    expect(earnedBalances.earningsData.length).to.be.eq(0);
    expect(unlockedBalance).to.be.eq(0);
    
    const totalSupply = await this.staker.totalSupply();
    expect(totalSupply).to.be.eq(0);

  });


  it("exiting with penalty should work as expected", async function () {
 
    const bobInitialBalance = await this.ruby.balanceOf(this.bob.address);
    const mintAmounts = [30000, 60000];
    const stakeAmount = 10000;
    
    expect (await this.staker.connect(this.bob).stake(stakeAmount, false)).to.emit(this.staker, "Staked").withArgs(this.bob.address, stakeAmount);

    expect(await this.staker.setRewardMinter(this.owner.address)).to.emit(this.staker, "RewardMinterSet").withArgs(this.owner.address);

    expect (await this.staker.mint(this.bob.address, mintAmounts[0])).to.emit(this.staker, "Staked").withArgs(this.bob.address, mintAmounts[0]);
    await this.ruby.transfer(this.staker.address, mintAmounts[0]);

    await advanceTimeByTimestamp(this.rewardDuration);

    expect (await this.staker.mint(this.bob.address, mintAmounts[1])).to.emit(this.staker, "Staked").withArgs(this.bob.address, mintAmounts[1]);
    await this.ruby.transfer(this.staker.address, mintAmounts[1]);

    await this.staker.connect(this.bob).exit()

    let bobBalance = await this.ruby.balanceOf(this.bob.address);
    let stakerBalance = await this.ruby.balanceOf(this.staker.address);

    expect(bobBalance).to.be.eq(bobInitialBalance.add(45000));
    expect(stakerBalance).to.be.eq(45000);

    let earnedBalances = await this.staker.earnedBalances(this.bob.address);
    let unlockedBalance = await this.staker.unlockedBalance(this.bob.address);

    expect(earnedBalances.total).to.be.eq(0);
    expect(earnedBalances.earningsData.length).to.be.eq(0);
    expect(unlockedBalance).to.be.eq(0);
    
    const totalSupply = await this.staker.totalSupply();
    expect(totalSupply).to.be.eq(0);

  });


  it("exiting with partial penalty should work as expected", async function () {
 
    const bobInitialBalance = await this.ruby.balanceOf(this.bob.address);
    const mintAmounts = [30000, 60000];
    const stakeAmount = 10000;
    
    expect (await this.staker.connect(this.bob).stake(stakeAmount, false)).to.emit(this.staker, "Staked").withArgs(this.bob.address, stakeAmount);

    expect(await this.staker.setRewardMinter(this.owner.address)).to.emit(this.staker, "RewardMinterSet").withArgs(this.owner.address);

    expect (await this.staker.mint(this.bob.address, mintAmounts[0])).to.emit(this.staker, "Staked").withArgs(this.bob.address, mintAmounts[0]);
    await this.ruby.transfer(this.staker.address, mintAmounts[0]);

    let block = await ethers.provider.getBlock();
    const lockedUntil = Math.floor(block.timestamp / this.rewardDuration) * this.rewardDuration + this.lockDuration;

    await advanceTimeByTimestamp(this.rewardDuration);

    expect (await this.staker.mint(this.bob.address, mintAmounts[1])).to.emit(this.staker, "Staked").withArgs(this.bob.address, mintAmounts[1]);
    await this.ruby.transfer(this.staker.address, mintAmounts[1]);

    await advanceTimeToTimestamp(lockedUntil + 2);


    await this.staker.connect(this.bob).exit()

    let bobBalance = await this.ruby.balanceOf(this.bob.address);
    let stakerBalance = await this.ruby.balanceOf(this.staker.address);

    expect(bobBalance).to.be.eq(bobInitialBalance.add(60000));
    expect(stakerBalance).to.be.eq(30000);

    let earnedBalances = await this.staker.earnedBalances(this.bob.address);
    let unlockedBalance = await this.staker.unlockedBalance(this.bob.address);

    expect(earnedBalances.total).to.be.eq(0);
    expect(earnedBalances.earningsData.length).to.be.eq(0);
    expect(unlockedBalance).to.be.eq(0);
    
    const totalSupply = await this.staker.totalSupply();
    expect(totalSupply).to.be.eq(0);

  });

  it("exiting with no penalty should work as expected", async function () {
 
    const bobInitialBalance = await this.ruby.balanceOf(this.bob.address);
    const mintAmounts = [30000, 60000];
    const stakeAmount = 10000;
    
    expect (await this.staker.connect(this.bob).stake(stakeAmount, false)).to.emit(this.staker, "Staked").withArgs(this.bob.address, stakeAmount);

    expect(await this.staker.setRewardMinter(this.owner.address)).to.emit(this.staker, "RewardMinterSet").withArgs(this.owner.address);

    expect (await this.staker.mint(this.bob.address, mintAmounts[0])).to.emit(this.staker, "Staked").withArgs(this.bob.address, mintAmounts[0]);
    await this.ruby.transfer(this.staker.address, mintAmounts[0]);

    let block = await ethers.provider.getBlock();
    const lockedUntil = Math.floor(block.timestamp / this.rewardDuration) * this.rewardDuration + this.lockDuration;

    await advanceTimeByTimestamp(this.rewardDuration);

    expect (await this.staker.mint(this.bob.address, mintAmounts[1])).to.emit(this.staker, "Staked").withArgs(this.bob.address, mintAmounts[1]);
    await this.ruby.transfer(this.staker.address, mintAmounts[1]);

    await advanceTimeToTimestamp(lockedUntil + this.rewardDuration + 2);

    await this.staker.connect(this.bob).exit()

    let bobBalance = await this.ruby.balanceOf(this.bob.address);
    let stakerBalance = await this.ruby.balanceOf(this.staker.address);

    expect(bobBalance).to.be.eq(bobInitialBalance.add(90000));
    expect(stakerBalance).to.be.eq(0);

    let earnedBalances = await this.staker.earnedBalances(this.bob.address);
    let unlockedBalance = await this.staker.unlockedBalance(this.bob.address);

    expect(earnedBalances.total).to.be.eq(0);
    expect(earnedBalances.earningsData.length).to.be.eq(0);
    expect(unlockedBalance).to.be.eq(0);
    
    const totalSupply = await this.staker.totalSupply();
    expect(totalSupply).to.be.eq(0);

  });


  it("getting penalties as locker should work as expected", async function () {
 
    const bobInitialBalance = await this.ruby.balanceOf(this.bob.address);
    const mintAmount = ethers.utils.parseUnits("100000", 18);
    const stakeAmount = ethers.utils.parseUnits("1", 18);
    
    expect (await this.staker.connect(this.bob).stake(stakeAmount, true)).to.emit(this.staker, "Staked").withArgs(this.bob.address, stakeAmount);

    expect(await this.staker.setRewardMinter(this.owner.address)).to.emit(this.staker, "RewardMinterSet").withArgs(this.owner.address);

    expect (await this.staker.mint(this.carol.address, mintAmount)).to.emit(this.staker, "Staked").withArgs(this.carol.address, mintAmount);
    await this.ruby.transfer(this.staker.address, mintAmount);

    await this.staker.connect(this.carol).exit()

    await advanceTimeByTimestamp(this.rewardDuration + 2);

    await this.staker.connect(this.bob).getReward();

    let bobBalance = await this.ruby.balanceOf(this.bob.address);
    let lessThanAmount = (ethers.utils.parseUnits("2", 18))

    const initialNumber = (bobInitialBalance.add(mintAmount.div(2)).sub(bobBalance));

    expect(initialNumber).to.be.lt(lessThanAmount);
  });

  it("only locked users should receive penalties", async function () {
 
    const mintAmount = ethers.utils.parseUnits("100000", 18);
    const stakeAmounts = [
      ethers.utils.parseUnits("10", 18),
      ethers.utils.parseUnits("1", 18),
      ethers.utils.parseUnits("10", 18),
      ethers.utils.parseUnits("1", 18),
    ]
    
    expect (await this.staker.connect(this.bob).stake(stakeAmounts[0], false)).to.emit(this.staker, "Staked").withArgs(this.bob.address, stakeAmounts[0]);
    expect (await this.staker.connect(this.bob).stake(stakeAmounts[1], true)).to.emit(this.staker, "Staked").withArgs(this.bob.address, stakeAmounts[1]);
    expect (await this.staker.connect(this.carol).stake(stakeAmounts[2], true)).to.emit(this.staker, "Staked").withArgs(this.carol.address, stakeAmounts[2]);

    await advanceTimeByTimestamp(this.rewardDuration);
    expect (await this.staker.connect(this.bob).stake(stakeAmounts[3], true)).to.emit(this.staker, "Staked").withArgs(this.bob.address, stakeAmounts[3]);
    await advanceTimeByTimestamp(this.rewardDuration + 1);


    expect(await this.staker.setRewardMinter(this.owner.address)).to.emit(this.staker, "RewardMinterSet").withArgs(this.owner.address);

    expect (await this.staker.mint(this.carol.address, mintAmount)).to.emit(this.staker, "Staked").withArgs(this.carol.address, mintAmount);
    await this.ruby.transfer(this.staker.address, mintAmount);

    await this.staker.connect(this.carol).exit()

    expect (await this.staker.mint(this.carol.address, mintAmount)).to.emit(this.staker, "Staked").withArgs(this.carol.address, mintAmount);
    await this.ruby.transfer(this.staker.address, mintAmount);

    await advanceTimeByTimestamp(this.rewardDuration + 1);

    const bobInitialBalance = await this.ruby.balanceOf(this.bob.address);
    const carolInitialBalance = await this.ruby.balanceOf(this.carol.address);


    await this.staker.connect(this.bob).getReward();
    await this.staker.connect(this.carol).getReward();

    const bobBalanceAfter = await this.ruby.balanceOf(this.bob.address);
    const carolBalanceAfter = await this.ruby.balanceOf(this.carol.address);

    expect((carolBalanceAfter.sub(carolInitialBalance)).div(bobBalanceAfter.sub(bobInitialBalance))).to.be.eq(5);
  });

  it("regular rewards should work as expected", async function () {

    await this.staker.addReward(this.ruby.address, this.owner.address);
    await this.staker.addReward(this.usdp.address, this.owner.address);


    await this.ruby.approve(this.staker.address, ethers.constants.MaxUint256);
    await this.usdp.approve(this.staker.address, ethers.constants.MaxUint256);

    const mintAmount = ethers.utils.parseUnits("5", 18);
    const stakeAmounts = [
      ethers.utils.parseUnits("1", 18),
      ethers.utils.parseUnits("5", 18),
      ethers.utils.parseUnits("1", 18)
    ];
    
    expect (await this.staker.connect(this.bob).stake(stakeAmounts[0], true)).to.emit(this.staker, "Staked").withArgs(this.bob.address, stakeAmounts[0]);
    expect (await this.staker.connect(this.carol).stake(stakeAmounts[1], false)).to.emit(this.staker, "Staked").withArgs(this.carol.address, stakeAmounts[1]);

    await advanceTimeByTimestamp(this.rewardDuration);
    expect (await this.staker.connect(this.bob).stake(stakeAmounts[2], true)).to.emit(this.staker, "Staked").withArgs(this.bob.address, stakeAmounts[2]);

    expect(await this.staker.setRewardMinter(this.owner.address)).to.emit(this.staker, "RewardMinterSet").withArgs(this.owner.address);
    expect (await this.staker.mint(this.carol.address, mintAmount)).to.emit(this.staker, "Staked").withArgs(this.carol.address, mintAmount);
    await this.ruby.transfer(this.staker.address, mintAmount);

    await advanceTimeByTimestamp(this.rewardDuration + 1);

    const rewardAmounts = [
      ethers.utils.parseUnits("100000", 18),
      ethers.utils.parseUnits("500000", 18),
    ]

    await this.staker.notifyRewardAmount(1, rewardAmounts[0])
    await this.staker.notifyRewardAmount(2, rewardAmounts[1])
    await advanceTimeByTimestamp(this.rewardDuration + 1);

    const bobInitialBalanceToken1 = await this.ruby.balanceOf(this.bob.address);
    const carolInitialBalanceToken1 = await this.ruby.balanceOf(this.carol.address);
    const bobInitialBalanceToken2 = await this.usdp.balanceOf(this.bob.address);
    const carolInitialBalanceToken2 = await this.usdp.balanceOf(this.carol.address);


    const pendingBob = await this.staker.claimableRewards(this.bob.address);
    const pendingCarol = await this.staker.claimableRewards(this.carol.address);

    await this.staker.connect(this.bob).getReward();
    await this.staker.connect(this.carol).getReward();

    const actualBalanceBobToken1 = (await this.ruby.balanceOf(this.bob.address)).sub(bobInitialBalanceToken1);
    const actualBalanceBobToken2 = (await this.usdp.balanceOf(this.bob.address)).sub(bobInitialBalanceToken2);
    const actualBalanceCarolToken1 = (await this.ruby.balanceOf(this.carol.address)).sub(carolInitialBalanceToken1);
    const actualBalanceCarolToken2 = (await this.usdp.balanceOf(this.carol.address)).sub(carolInitialBalanceToken2);

    expect(pendingBob[0].token).to.be.eq(this.ruby.address);
    expect(pendingBob[0].amount).to.be.eq(0);

    expect(pendingBob[1].token).to.be.eq(this.ruby.address);
    expect(pendingBob[1].amount).to.be.eq(actualBalanceBobToken1);

    expect(pendingBob[2].token).to.be.eq(this.usdp.address);
    expect(pendingBob[2].amount).to.be.eq(actualBalanceBobToken2);


    expect(pendingCarol[0].token).to.be.eq(this.ruby.address);
    expect(pendingCarol[0].amount).to.be.eq(0);

    expect(pendingCarol[1].token).to.be.eq(this.ruby.address);
    expect(pendingCarol[1].amount).to.be.eq(actualBalanceCarolToken1);

    expect(pendingCarol[2].token).to.be.eq(this.usdp.address);
    expect(pendingCarol[2].amount).to.be.eq(actualBalanceCarolToken2);

    expect (actualBalanceCarolToken1.div(actualBalanceBobToken1)).to.be.eq(5);
    expect (actualBalanceCarolToken2.div(actualBalanceBobToken2)).to.be.eq(5);

  });


  it("regular and lock rewards should work as expected", async function () {

    const carolInitialBalanceBuby = await this.ruby.balanceOf(this.carol.address);

    await this.staker.addReward(this.dai.address, this.owner.address);
    await this.staker.addReward(this.usdp.address, this.owner.address);


    await this.dai.approve(this.staker.address, ethers.constants.MaxUint256);
    await this.usdp.approve(this.staker.address, ethers.constants.MaxUint256);

    const mintAmount = ethers.utils.parseUnits("5", 18);
    const stakeAmounts = [
      ethers.utils.parseUnits("1", 18),
      ethers.utils.parseUnits("5", 18),
      ethers.utils.parseUnits("1", 18)
    ];
    

    expect (await this.staker.connect(this.bob).stake(stakeAmounts[0], true)).to.emit(this.staker, "Staked").withArgs(this.bob.address, stakeAmounts[0]);
    expect (await this.staker.connect(this.carol).stake(stakeAmounts[1], false)).to.emit(this.staker, "Staked").withArgs(this.carol.address, stakeAmounts[1]);

    await advanceTimeByTimestamp(this.rewardDuration);
    expect (await this.staker.connect(this.bob).stake(stakeAmounts[2], true)).to.emit(this.staker, "Staked").withArgs(this.bob.address, stakeAmounts[2]);

    expect(await this.staker.setRewardMinter(this.owner.address)).to.emit(this.staker, "RewardMinterSet").withArgs(this.owner.address);
    expect (await this.staker.mint(this.carol.address, mintAmount)).to.emit(this.staker, "Staked").withArgs(this.carol.address, mintAmount);
    await this.ruby.transfer(this.staker.address, mintAmount);

    await advanceTimeByTimestamp(this.rewardDuration - 1);

    expect (await this.staker.mint(this.bob.address, mintAmount)).to.emit(this.staker, "Staked").withArgs(this.bob.address, mintAmount);
    await this.ruby.transfer(this.staker.address, mintAmount);

    await this.staker.connect(this.bob).exit();

    const rewardAmounts = [
      ethers.utils.parseUnits("100000", 18),
      ethers.utils.parseUnits("500000", 18),
    ]

    await this.staker.notifyRewardAmount(1, rewardAmounts[0])
    await this.staker.notifyRewardAmount(2, rewardAmounts[1])
    await advanceTimeByTimestamp(this.rewardDuration);

    const bobInitialBalanceToken1 = await this.dai.balanceOf(this.bob.address);
    const carolInitialBalanceToken1 = await this.dai.balanceOf(this.carol.address);
    const bobInitialBalanceToken2 = await this.usdp.balanceOf(this.bob.address);
    const carolInitialBalanceToken2 = await this.usdp.balanceOf(this.carol.address);

    const initialBalanceBobRuby = await this.ruby.balanceOf(this.bob.address)

    const pendingBob = await this.staker.claimableRewards(this.bob.address);

    await this.staker.connect(this.bob).getReward();

    await this.staker.connect(this.carol).exit();

    const actualBalanceBobRuby = (await this.ruby.balanceOf(this.bob.address)).sub(initialBalanceBobRuby) 

    const actualBalanceBobToken1 = (await this.dai.balanceOf(this.bob.address)).sub(bobInitialBalanceToken1);
    const actualBalanceBobToken2 = (await this.usdp.balanceOf(this.bob.address)).sub(bobInitialBalanceToken2);


    expect(pendingBob[0].token).to.be.eq(this.ruby.address);
    expect(pendingBob[0].amount).to.be.eq(actualBalanceBobRuby);

    expect(pendingBob[1].token).to.be.eq(this.dai.address);
    expect(pendingBob[1].amount).to.be.eq(actualBalanceBobToken1);

    expect(pendingBob[2].token).to.be.eq(this.usdp.address);
    expect(pendingBob[2].amount).to.be.eq(actualBalanceBobToken2);

    const currentBalanceCarolToken1 = await this.dai.balanceOf(this.carol.address);
    const currentBalanceCarolToken2 = await this.usdp.balanceOf(this.carol.address);


    expect((currentBalanceCarolToken1.sub(carolInitialBalanceToken1)).div(actualBalanceBobToken1)).to.be.eq(5);
    expect((currentBalanceCarolToken2.sub(carolInitialBalanceToken2)).div(actualBalanceBobToken2)).to.be.eq(5);

    const currentBalanceCarolRuby = await this.ruby.balanceOf(this.carol.address);
    const currentBalanceBobRuby = await this.ruby.balanceOf(this.bob.address);


    const oneUnit =  ethers.utils.parseUnits("1", 18);
    expect(currentBalanceCarolRuby).to.be.eq(carolInitialBalanceBuby.add(mintAmount.div(2)))
    expect(currentBalanceBobRuby).to.be.lt(initialBalanceBobRuby.add(mintAmount.div(2)))
    expect(currentBalanceBobRuby).to.be.gt((initialBalanceBobRuby.add(mintAmount.div(2))).sub(oneUnit))
  });


  it("notify many times should work as expected", async function () {

    await this.staker.addReward(this.dai.address, this.owner.address);
    await this.dai.approve(this.staker.address, ethers.constants.MaxUint256);

    const stakeAmount = ethers.utils.parseUnits("1", 18);
    const rewardAmount = ethers.utils.parseUnits("10000", 18);


    expect (await this.staker.connect(this.bob).stake(stakeAmount, true)).to.emit(this.staker, "Staked").withArgs(this.bob.address, stakeAmount);

    for(let i = 0; i < 20; i++) {
      await this.staker.notifyRewardAmount(1, rewardAmount)
      await advanceTimeByTimestamp(3);
    }

    await advanceTimeByTimestamp(this.rewardDuration + 1);

    const initialBalanceBobDai = await this.dai.balanceOf(this.bob.address);
    await this.staker.connect(this.bob).getReward();
    const currentBalanceBobDai = await this.dai.balanceOf(this.bob.address);

    const oneUnit =  ethers.utils.parseUnits("1", 18);
    expect (currentBalanceBobDai).to.be.lt(initialBalanceBobDai.add(rewardAmount.mul(20)));
    expect (currentBalanceBobDai).to.be.gt(initialBalanceBobDai.add(rewardAmount.mul(20)).sub(oneUnit));
   
  });


});