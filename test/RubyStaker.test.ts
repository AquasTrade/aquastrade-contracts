const { ethers, network } = require("hardhat");
import { expect } from "chai";
import { BigNumber } from "ethers";
import { ADDRESS_ZERO, advanceTimeAndBlock, latest, assertStakerBalances } from "./utilities";

describe("RubyStaker", function () {
  before(async function () {
    this.signers = await ethers.getSigners();
    this.alice = this.signers[0];
    this.owner = this.signers[0];
    this.bob = this.signers[1];
    this.carol = this.signers[2];
    this.treasury = this.signers[3];
    this.minter = this.signers[4];

    this.rubyStaker = await ethers.getContractFactory("RubyStaker");
    this.RubyToken = await ethers.getContractFactory("RubyTokenMintable");


  });

  beforeEach(async function () {
    // deploys the ruby token and sends funds to the deployer
    this.ruby = await this.RubyToken.deploy(); // b=1
    await this.ruby.deployed();

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

    // TODO: get block timestamp
    const tx = await this.staker.mint(this.bob.address, mintAmounts[0]);
    // const receipt = await tx.wait(1);
    // console.log("receipt", receipt);
    // const lockedUntil = Math.floor(receipt.timestamp.toNumber() / 604800 + 12) * 604800;

    await advanceTimeAndBlock(604800);

    expect (await this.staker.mint(this.bob.address, mintAmounts[1])).to.emit(this.staker, "Staked").withArgs(this.bob.address, mintAmounts[1]);
    expect (await this.staker.mint(this.bob.address, mintAmounts[2])).to.emit(this.staker, "Staked").withArgs(this.bob.address, mintAmounts[2]);

    await advanceTimeAndBlock(604800 * 2);

    expect (await this.staker.mint(this.bob.address, mintAmounts[3])).to.emit(this.staker, "Staked").withArgs(this.bob.address, mintAmounts[3]);

    const unlockedBalance = await this.staker.unlockedBalance(this.bob.address);
    const withdrawableBalances = await this.staker.withdrawableBalance(this.bob.address);
    const earnedBalances = await this.staker.earnedBalances(this.bob.address);

    const totalSupply = await this.staker.totalSupply();
    const lockedSupply = await this.staker.lockedSupply();

    expect(unlockedBalance).to.be.eq(0);


    expect(earnedBalances.total).to.be.eq(140000);
    expect(earnedBalances.earningsData[0].amount).to.be.eq(30000);
    // expect(earnedBalances.earningsData[0].unlockTime).to.be.eq(lockedUntil); // TODO
    expect(earnedBalances.earningsData[1].amount).to.be.eq(90000);
    // expect(earnedBalances.earningsData[1].unlockTime).to.be.eq(lockedUntil + 604800); // TODO
    expect(earnedBalances.earningsData[2].amount).to.be.eq(20000);
    // expect(earnedBalances.earningsData[2].unlockTime).to.be.eq(lockedUntil + 604800 * 3); // TODO

    expect(withdrawableBalances.amount).to.be.eq(70000);
    expect(withdrawableBalances.penaltyAmount).to.be.eq(70000);

    expect(totalSupply).to.be.eq(140000);
    expect(lockedSupply).to.be.eq(0);




  }); 


  it("single user locking should work as expected", async function () {

    const bobInitialBalance = await this.ruby.balanceOf(this.bob.address);
    const stakeAmount = 100000;
    
    expect (await this.staker.connect(this.bob).stake(stakeAmount, true)).to.emit(this.staker, "Staked").withArgs(this.bob.address, stakeAmount);
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
    // expect(lockedBalances.lockData[0].unlockTime).to.be.eq(x); // TODO:

    expect(earnedBalances.total).to.be.eq(0);
    expect(earnedBalances.earningsData.length).to.be.eq(0);

    expect(totalSupply).to.be.eq(stakeAmount);
    expect(lockedSupply).to.be.eq(stakeAmount);

  }); 

//   it("multiple user locking should work as expected", async function () {

//   }); 

//   it("locks expiring should work as expected", async function () {

//   }); 


//   it("withdrawal unlocked should work as expected", async function () {

//     }); 

//     it("partial withdrawal unlocked should work as expected", async function () {

//     }); 

});