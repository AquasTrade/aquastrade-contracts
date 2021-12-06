const { ethers, network } = require("hardhat");
import { expect } from "chai";
import { BigNumber } from "ethers";
import { ADDRESS_ZERO, advanceTimeAndBlock, latest } from "./utilities";


// TODO: Tests to be updated
describe("RubyMasterChef", function () {
  before(async function () {
    this.signers = await ethers.getSigners();
    this.alice = this.signers[0];
    this.owner = this.signers[0];
    this.bob = this.signers[1];
    this.carol = this.signers[2];
    this.treasury = this.signers[3];
    this.minter = this.signers[4];

    this.rubyMasterChef = await ethers.getContractFactory("RubyMasterChef");
    this.SimpleRewarderPerSec = await ethers.getContractFactory("SimpleRewarderPerSec");
    this.RubyToken = await ethers.getContractFactory("RubyTokenMintable");
    this.MockERC20 = await ethers.getContractFactory("MockERC20", this.minter);
    this.SushiToken = await ethers.getContractFactory("SushiToken");

    this.treasuryPercent = 100;
    this.lpPercent = 1000 - this.treasuryPercent;
    this.rubyPerSec = 10;
    this.secOffset = 1;
    this.tokenOffset = 1;
    this.reward = (sec: number, percent: number) => (sec * this.rubyPerSec * percent) / 1000;

    // Partner MasterChef parameters
    this.partnerDev = this.signers[5];
    this.partnerRewardPerBlock = 40;
    this.partnerRewardPerSec = 40;
    this.partnerStartBlock = 0;
    this.partnerBonusEndBlock = 10;
    this.partnerChefPid = 0;
    this.partnerChefAllocPoint = 100;
  });

  beforeEach(async function () {
    // deploys the ruby token and sends funds to the deployer
    this.ruby = await this.RubyToken.deploy(); // b=1
    await this.ruby.deployed();


    this.partnerToken = await this.SushiToken.deploy(); // b=2
    await this.partnerToken.deployed();
  });

  it("should revert contract creation if treasury percent don't meet criteria", async function () {
    const startTime = (await latest()).add(60);
    // Invalid treasury percent failure
    await expect(
      this.rubyMasterChef.deploy(this.ruby.address, this.treasury.address, "10", startTime, "1100"),
    ).to.be.revertedWith("Constructor: invalid treasury percent value");
  });

  it("should set correct state variables", async function () {
    // We make start time 60 seconds past the last block
    const startTime = (await latest()).add(60);
    this.chef = await this.rubyMasterChef.deploy(
      this.ruby.address,
      this.treasury.address,
      this.rubyPerSec,
      startTime,
      this.treasuryPercent,
    );
    await this.chef.deployed();

    const ruby = await this.chef.RUBY();
    const treasuryAddr = await this.chef.treasuryAddr();
    const treasuryPercent = await this.chef.treasuryPercent();

    expect(ruby).to.equal(this.ruby.address);
    expect(treasuryAddr).to.equal(this.treasury.address);
    expect(treasuryPercent).to.equal(this.treasuryPercent);
  });

  it("should allow treasury to update themselves", async function () {
    const startTime = (await latest()).add(60);
    this.chef = await this.rubyMasterChef.deploy(
      this.ruby.address,
      this.treasury.address,
      this.rubyPerSec,
      startTime,
      this.treasuryPercent,
    );
    await this.chef.deployed();

    await expect(
      this.chef.connect(this.bob).setTreasuryAddr(this.bob.address, { from: this.bob.address }),
    ).to.be.revertedWith("setTreasuryAddr: not enough permissions to execute this action");

    await this.chef.connect(this.treasury).setTreasuryAddr(this.bob.address, { from: this.treasury.address });
    expect(await this.chef.treasuryAddr()).to.equal(this.bob.address);
  });

  it("should check treasury percent is set correctly", async function () {
    const startTime = (await latest()).add(60);
    this.chef = await this.rubyMasterChef.deploy(
      this.ruby.address,
      this.treasury.address,
      this.rubyPerSec,
      startTime,
      this.treasuryPercent,
    );
    await this.chef.deployed();

    await this.chef.setTreasuryPercent(100);
    expect(await this.chef.treasuryPercent()).to.equal("100");
    // We don't test negative values because function only takes in unsigned ints
    await expect(this.chef.setTreasuryPercent("1200")).to.be.revertedWith("setTreasuryPercent: invalid percent value");
  });

  it("should enable owner to emergency withdraw ruby tokens", async function () {
    const startTime = (await latest()).add(60);
    this.chef = await this.rubyMasterChef.deploy(
      this.ruby.address,
      this.treasury.address,
      this.rubyPerSec,
      startTime,
      this.treasuryPercent,
    );
    await this.chef.deployed();
    const ownerInitialBalance = await this.ruby.balanceOf(this.owner.address);
    const amountToChef = ethers.utils.parseUnits("1000", 18);

    expect(await this.ruby.balanceOf(this.chef.address)).to.equal("0");
    expect(await this.ruby.balanceOf(this.bob.address)).to.equal("0");

    await this.ruby.transfer(this.chef.address, amountToChef); // t-56
    expect(await this.ruby.balanceOf(this.chef.address)).to.equal(amountToChef);

    const initialWithdrawAmount = ethers.utils.parseUnits("10", 18);

    // CASE 1: Owner should be able to withdraw to other users
    await this.chef.emergencyWithdrawRubyTokens(this.bob.address, initialWithdrawAmount);

    // Chef should have `initialWithdrawAmount` less tokens
    expect(await this.ruby.balanceOf(this.chef.address)).to.equal(amountToChef.sub(initialWithdrawAmount));

    // Bob should have `initialWithdrawAmount` tokens
    expect(await this.ruby.balanceOf(this.bob.address)).to.equal(initialWithdrawAmount);

    // CASE 2: Owner should be able to withdraw to himself
    await this.chef.emergencyWithdrawRubyTokens(this.owner.address, initialWithdrawAmount);

    // Owner should have: (ownerInitialBalance - amountToChef + initialWithdrawAmount)
    expect(await this.ruby.balanceOf(this.owner.address)).to.equal(ownerInitialBalance.sub(amountToChef).add(initialWithdrawAmount));

    // CASE 3: Other users should not be able to withdraw
    await expect(
      this.chef.connect(this.bob).emergencyWithdrawRubyTokens(this.bob.address, initialWithdrawAmount)
    ).to.be.revertedWith("Ownable: caller is not the owner");

    // CASE 4: Owner should not be able to withdraw with invalid address
    await expect(
      this.chef.emergencyWithdrawRubyTokens(ADDRESS_ZERO, initialWithdrawAmount)
    ).to.be.revertedWith("emergencyWithdrawRubyTokens: Invalid withdrawal address.");

    // CASE 5: Owner should not be able to withdraw with invalid amount
    await expect(
      this.chef.emergencyWithdrawRubyTokens(this.owner.address, BigNumber.from(0)),
    ).to.be.revertedWith("emergencyWithdrawRubyTokens: Invalid withdrawal amount.");


    // CASE 6: RubyEmergencyWithdrawal event should be emitted
    let chefRemainingBalance = await this.ruby.balanceOf(this.chef.address);
    await expect(this.chef.emergencyWithdrawRubyTokens(this.owner.address, chefRemainingBalance))
    .to.emit(this.chef, "RubyEmergencyWithdrawal").withArgs(this.owner.address, chefRemainingBalance);

    // Owner should have: (ownerInitialBalance - initialWithdrawAmount (the balance sent to bob))
    expect(await this.ruby.balanceOf(this.owner.address)).to.equal(ownerInitialBalance.sub(initialWithdrawAmount));
    expect(await this.ruby.balanceOf(this.chef.address)).to.equal("0");

    // CASE 7: Owner should not be able to withdraw when the RubyMasterChef doesn't have the required withdrawal amount
    await expect(
      this.chef.emergencyWithdrawRubyTokens(this.owner.address, chefRemainingBalance)
    ).to.be.revertedWith("emergencyWithdrawRubyTokens: Not enough balance to withdraw.");

  });

  context("With ERC/LP token added to the field and using SimpleRewarderPerSec", function () {
    beforeEach(async function () {
      this.lp = await this.MockERC20.deploy("LPToken", "LP", "10000000000", 18);
      await this.lp.transfer(this.alice.address, "1000");
      await this.lp.transfer(this.bob.address, "1000");
      await this.lp.transfer(this.carol.address, "1000");

      this.lp2 = await this.MockERC20.deploy("LPToken2", "LP2", "10000000000", 18);
      await this.lp2.transfer(this.alice.address, "1000");
      await this.lp2.transfer(this.bob.address, "1000");
      await this.lp2.transfer(this.carol.address, "1000");

      this.dummyToken = await this.MockERC20.deploy("DummyToken", "DUMMY", "1", 18);
      await this.dummyToken.transfer(this.partnerDev.address, "1");
    });

    it("should check rewarder's arguments are contracts", async function () {
      await expect(
        this.SimpleRewarderPerSec.deploy(ADDRESS_ZERO, this.lp.address, this.partnerRewardPerSec, this.chef.address),
      ).to.be.revertedWith("constructor: reward token must be a valid contract");

      await expect(
        this.SimpleRewarderPerSec.deploy(
          this.partnerToken.address,
          ADDRESS_ZERO,
          this.partnerRewardPerSec,
          this.chef.address,
        ),
      ).to.be.revertedWith("constructor: LP token must be a valid contract");

      await expect(
        this.SimpleRewarderPerSec.deploy(
          this.partnerToken.address,
          this.lp.address,
          this.partnerRewardPerSec,
          ADDRESS_ZERO,
        ),
      ).to.be.revertedWith("constructor: RubyMasterChef must be a valid contract");
    });

    it("should check rewarder added and set properly", async function () {
      const startTime = (await latest()).add(60);
      this.chef = await this.rubyMasterChef.deploy(
        this.ruby.address,
        this.treasury.address,
        this.rubyPerSec,
        startTime,
        this.treasuryPercent,
      );
      await this.chef.deployed();

      this.rewarder = await this.SimpleRewarderPerSec.deploy(
        this.partnerToken.address,
        this.lp.address,
        this.partnerRewardPerSec,
        this.chef.address,
      );
      await this.rewarder.deployed();

      // Try to add rewarder that is neither zero address or contract address
      await expect(this.chef.add("100", this.lp.address, this.treasury.address)).to.be.revertedWith(
        "add: rewarder must be contract or zero",
      );

      await this.chef.add("100", this.lp.address, this.rewarder.address);

      // Try to set rewarder that is neither zero address or contract address
      await expect(this.chef.set("0", "200", this.treasury.address, true)).to.be.revertedWith(
        "set: rewarder must be contract or zero",
      );

      await this.chef.set("0", "200", this.rewarder.address, false);
      expect((await this.chef.poolInfo(0)).allocPoint).to.equal("200");
    });

    it("should allow a given pool's allocation weight and rewarder to be updated", async function () {
      const startTime = (await latest()).add(60);
      this.chef = await this.rubyMasterChef.deploy(
        this.ruby.address,
        this.treasury.address,
        this.rubyPerSec,
        startTime,
        this.treasuryPercent,
      );
      await this.chef.deployed();

      this.rewarder = await this.SimpleRewarderPerSec.deploy(
        this.partnerToken.address,
        this.lp.address,
        this.partnerRewardPerSec,
        this.chef.address,
      );
      await this.rewarder.deployed();

      await this.chef.add("100", this.lp.address, ADDRESS_ZERO);
      expect((await this.chef.poolInfo(0)).allocPoint).to.equal("100");
      expect((await this.chef.poolInfo(0)).rewarder).to.equal(ADDRESS_ZERO);

      await this.chef.set("0", "150", this.rewarder.address, true);
      expect((await this.chef.poolInfo(0)).allocPoint).to.equal("150");
      expect((await this.chef.poolInfo(0)).rewarder).to.equal(this.rewarder.address);
    });

    it("should allow emergency withdraw from rewarder contract", async function () {
      this.rewarder = await this.SimpleRewarderPerSec.deploy(
        this.partnerToken.address,
        this.lp.address,
        this.partnerRewardPerSec,
        this.chef.address,
      );
      await this.rewarder.deployed();

      await this.partnerToken.mint(this.rewarder.address, "1000000");
      await this.rewarder.emergencyWithdraw();
      expect(await this.partnerToken.balanceOf(this.alice.address)).to.equal("1000000");
    });

    it("should reward partner token accurately after rewarder runs out of tokens and is topped up again", async function () {
      const startTime = (await latest()).add(60);
      this.chef = await this.rubyMasterChef.deploy(
        this.ruby.address,
        this.treasury.address,
        this.rubyPerSec,
        startTime,
        this.treasuryPercent,
      );
      await this.chef.deployed(); // t-59

      this.rewarder = await this.SimpleRewarderPerSec.deploy(
        this.partnerToken.address,
        this.lp.address,
        this.partnerRewardPerSec,
        this.chef.address,
      );
      await this.rewarder.deployed(); // t-58

      await this.partnerToken.mint(this.rewarder.address, "80"); // t-57

      await advanceTimeAndBlock(1); // t-56


      await this.chef.add("100", this.lp.address, this.rewarder.address); // t-55

      await this.lp.connect(this.bob).approve(this.chef.address, "1000"); // t-54
      await this.chef.connect(this.bob).deposit(0, "100"); // t-53
      await advanceTimeAndBlock(4); // t-49

      await this.chef.connect(this.bob).deposit(0, "0"); // t-48
      // Bob should have:
      //   - 0 RubyToken
      //   - 80 PartnerToken
      expect(await this.partnerToken.balanceOf(this.bob.address)).to.equal(80);
      await advanceTimeAndBlock(5); // t-43

      await this.partnerToken.mint(this.rewarder.address, "1000"); // t-42
      await advanceTimeAndBlock(10); // t-32

      await this.chef.connect(this.bob).deposit(0, "0"); // t-31

      // Bob should have:
      //   - 0 RubyToken
      //   - 80 + 17*40 = 760 (+40) PartnerToken
      expect(await this.partnerToken.balanceOf(this.bob.address)).to.be.within(760, 800);
    });

    it("should only allow RubyMasterChef to call onRubyReward", async function () {
      const startTime = (await latest()).add(60);
      this.chef = await this.rubyMasterChef.deploy(
        this.ruby.address,
        this.treasury.address,
        this.rubyPerSec,
        startTime,
        this.treasuryPercent,
      );
      await this.chef.deployed(); // t-59

      this.rewarder = await this.SimpleRewarderPerSec.deploy(
        this.partnerToken.address,
        this.lp.address,
        this.partnerRewardPerSec,
        this.chef.address,
      );
      await this.rewarder.deployed(); // t-58

      await this.partnerToken.mint(this.rewarder.address, "1000000000000000000000000"); // t-57

      await advanceTimeAndBlock(1); // t-56

      await this.chef.add("100", this.lp.address, this.rewarder.address); // t-55

      await this.lp.connect(this.bob).approve(this.chef.address, "1000"); // t-54
      await this.chef.connect(this.bob).deposit(0, "100"); // t-53
      await advanceTimeAndBlock(42); // t-11

      await expect(this.rewarder.onRubyReward(this.bob.address, "100")).to.be.revertedWith(
        "onlyRubyMasterChef: only RubyMasterChef can call this function",
      ); // t-10
      await this.chef.connect(this.bob).deposit(0, "0"); // t-9
      // Bob should have:
      //   - 0 RubyToken
      //   - 44*40 = 1760 (+40) PartnerToken
      expect(await this.ruby.balanceOf(this.bob.address)).to.equal("0");
      expect(await this.partnerToken.balanceOf(this.bob.address)).to.be.within(1760, 1800);
    });

    it("should allow rewarder to be set and removed mid farming", async function () {
      const startTime = (await latest()).add(60);
      this.chef = await this.rubyMasterChef.deploy(
        this.ruby.address,
        this.treasury.address,
        this.rubyPerSec,
        startTime,
        this.treasuryPercent,
      );
      await this.chef.deployed(); // t-59

      this.rewarder = await this.SimpleRewarderPerSec.deploy(
        this.partnerToken.address,
        this.lp.address,
        this.partnerRewardPerSec,
        this.chef.address,
      );
      await this.rewarder.deployed(); // t-58

      await this.partnerToken.mint(this.rewarder.address, "1000000000000000000000000"); // t-57

      await this.ruby.transfer(this.chef.address, ethers.utils.parseUnits("10000")); // t-56

      await this.chef.add("100", this.lp.address, ADDRESS_ZERO); // t-55

      await this.lp.connect(this.bob).approve(this.chef.address, "1000"); // t-54
      await this.chef.connect(this.bob).deposit(0, "100"); // t-53
      await advanceTimeAndBlock(42); // t-11

      await this.chef.connect(this.bob).deposit(0, "0"); // t-10
      expect(await this.ruby.balanceOf(this.bob.address)).to.equal("0");
      // At t+10, Bob should have pending:
      //   - 10*9 = 90 = 10 tokens - 1 token for treasury percent (+5) RubyToken
      //   - 0 PartnerToken
      await advanceTimeAndBlock(20); // t+10
      expect((await this.chef.pendingTokens(0, this.bob.address)).pendingRuby).to.be.within(90, 95);
      expect((await this.chef.pendingTokens(0, this.bob.address)).bonusTokenAddress).to.equal(ADDRESS_ZERO);
      expect((await this.chef.pendingTokens(0, this.bob.address)).pendingBonusToken).to.equal(0);

      // Pass rewarder but don't overwrite
      await this.chef.set(0, 100, this.rewarder.address, false); // t+11

      // At t+20, Bob should have pending:
      //   - 10*9 + 10* = 180 (+5) RubyToken
      //   - 0 PartnerToken
      await advanceTimeAndBlock(9); // t+20
      expect((await this.chef.pendingTokens(0, this.bob.address)).pendingRuby).to.be.within(180, 185);
      expect((await this.chef.pendingTokens(0, this.bob.address)).bonusTokenAddress).to.equal(ADDRESS_ZERO);
      expect((await this.chef.pendingTokens(0, this.bob.address)).pendingBonusToken).to.equal(0);

      // Pass rewarder and overwrite
      await this.chef.set(0, 100, this.rewarder.address, true); // t+21

      // At t+30, Bob should have pending:
      //   - 10*9 + 10*9 + 10*9 = 270 (+5) RubyToken
      //   - 0 PartnerToken - this is because rewarder hasn't registered the user yet! User needs to call deposit again
      await advanceTimeAndBlock(9); // t+30
      expect((await this.chef.pendingTokens(0, this.bob.address)).pendingRuby).to.be.within(270, 275);
      expect((await this.chef.pendingTokens(0, this.bob.address)).bonusTokenAddress).to.equal(
        this.partnerToken.address,
      );
      expect((await this.chef.pendingTokens(0, this.bob.address)).bonusTokenSymbol).to.equal("SUSHI");
      expect((await this.chef.pendingTokens(0, this.bob.address)).pendingBonusToken).to.equal(0);

      // Call deposit to start receiving PartnerTokens
      await this.chef.connect(this.bob).deposit(0, 0); // t+31

      // At t+40, Bob should have pending:
      //   - 9*9 = 81 (+10) RubyToken
      //   - 9*40 = 360 (+40) PartnerToken
      await advanceTimeAndBlock(9); // t+40
      expect((await this.chef.pendingTokens(0, this.bob.address)).pendingRuby).to.be.within(81, 91);
      expect((await this.chef.pendingTokens(0, this.bob.address)).bonusTokenAddress).to.equal(
        this.partnerToken.address,
      );
      expect((await this.chef.pendingTokens(0, this.bob.address)).bonusTokenSymbol).to.equal("SUSHI");
      expect((await this.chef.pendingTokens(0, this.bob.address)).pendingBonusToken).to.be.within(360, 400);

      // Set reward rate to zero
      await this.rewarder.setRewardRate(0); // t+41

      // At t+50, Bob should have pending:
      //   - 81 + 10*9 = 171 (+5) RubyToken
      //   - 360 + 1*40 = 400 (+40) PartnerToken
      await advanceTimeAndBlock(4); // t+45
      await advanceTimeAndBlock(5); // t+50
      expect((await this.chef.pendingTokens(0, this.bob.address)).pendingRuby).to.be.within(171, 176);
      expect((await this.chef.pendingTokens(0, this.bob.address)).bonusTokenAddress).to.equal(
        this.partnerToken.address,
      );
      expect((await this.chef.pendingTokens(0, this.bob.address)).bonusTokenSymbol).to.equal("SUSHI");
      expect((await this.chef.pendingTokens(0, this.bob.address)).pendingBonusToken).to.be.within(400, 440);

      // Claim reward
      await this.chef.connect(this.bob).deposit(0, 0); // t+51

      // Bob should have:
      //   - 270 + 1*9 + 171 + 1*9 = 2550 (+5) RubyToken
      //   - 400 (+40) PartnerToken
      expect(await this.ruby.balanceOf(this.bob.address)).to.be.within(459, 464);
      expect(await this.partnerToken.balanceOf(this.bob.address)).to.be.within(400, 440);
    });

    it("should give out RUBYs only after farming time", async function () {
      const startTime = (await latest()).add(60);
      this.chef = await this.rubyMasterChef.deploy(
        this.ruby.address,
        this.treasury.address,
        this.rubyPerSec,
        startTime,
        this.treasuryPercent,
      );
      await this.chef.deployed(); // t-59

      this.rewarder = await this.SimpleRewarderPerSec.deploy(
        this.partnerToken.address,
        this.lp.address,
        this.partnerRewardPerSec,
        this.chef.address,
      );
      await this.rewarder.deployed(); // t-58

      await this.partnerToken.mint(this.rewarder.address, "1000000000000000000000000"); // t-57

      await this.ruby.transfer(this.chef.address, ethers.utils.parseUnits("10000")); // t-56

      await this.chef.add("100", this.lp.address, this.rewarder.address); // t-55

      await this.lp.connect(this.bob).approve(this.chef.address, "1000"); // t-54
      await this.chef.connect(this.bob).deposit(0, "100"); // t-53
      await advanceTimeAndBlock(42); // t-11

      await this.chef.connect(this.bob).deposit(0, "0"); // t-10
      // Bob should have:
      //   - 0 RubyToken
      //   - 43*40 = 1720 (+40) PartnerToken
      expect(await this.ruby.balanceOf(this.bob.address)).to.equal("0");
      expect(await this.partnerToken.balanceOf(this.bob.address)).to.be.within(1720, 1760);
      await advanceTimeAndBlock(8); // t-2

      await this.chef.connect(this.bob).deposit(0, "0"); // t-1
      expect(await this.ruby.balanceOf(this.bob.address)).to.equal("0");
      await advanceTimeAndBlock(10); // t+9

      await this.chef.connect(this.bob).deposit(0, "0"); // t+10
      // Bob should have:
      //   - 10*9 = 90 (+10) RubyToken
      //   - 1720 + 20*40 = 2520 (+40) PartnerToken
      expect(await this.ruby.balanceOf(this.bob.address)).to.be.within(90, 100);
      expect(await this.partnerToken.balanceOf(this.bob.address)).to.be.within(2520, 2560);

      await advanceTimeAndBlock(4); // t+14
      await this.chef.connect(this.bob).deposit(0, "0"); // t+15

      expect(await this.ruby.balanceOf(this.bob.address)).to.be.within(135, 145);
      expect(await this.partnerToken.balanceOf(this.bob.address)).to.be.within(2720, 2760);
      expect(await this.ruby.balanceOf(this.treasury.address)).to.be.within(15, 16);
      // expect(await this.ruby.totalSupply()).to.be.within(150, 160);
    });

    it("should not distribute RUBYs if no one deposit", async function () {
      const startTime = (await latest()).add(60);
      this.chef = await this.rubyMasterChef.deploy(
        this.ruby.address,
        this.treasury.address,
        this.rubyPerSec,
        startTime,
        this.treasuryPercent,
      );
      await this.chef.deployed(); // t-59

      this.rewarder = await this.SimpleRewarderPerSec.deploy(
        this.partnerToken.address,
        this.lp.address,
        this.partnerRewardPerSec,
        this.chef.address,
      );
      await this.rewarder.deployed(); // t-58

      await this.partnerToken.mint(this.rewarder.address, "1000000000000000000000000"); // t-57

      await this.ruby.transfer(this.chef.address, ethers.utils.parseUnits("10000")); // t-56

      await this.chef.add("100", this.lp.address, this.rewarder.address); // t-55
      await this.lp.connect(this.bob).approve(this.chef.address, "1000"); // t-54
      await advanceTimeAndBlock(108); // t+54

      // expect(await this.ruby.totalSupply()).to.equal("0");
      expect(await this.partnerToken.balanceOf(this.bob.address)).to.equal("0");
      await advanceTimeAndBlock(5); // t+59
      // expect(await this.ruby.totalSupply()).to.equal("0");
      expect(await this.partnerToken.balanceOf(this.bob.address)).to.equal("0");
      await advanceTimeAndBlock(5); // t+64
      await this.chef.connect(this.bob).deposit(0, "10"); // t+65
      // expect(await this.ruby.totalSupply()).to.equal("0");
      expect(await this.ruby.balanceOf(this.bob.address)).to.equal("0");
      expect(await this.partnerToken.balanceOf(this.bob.address)).to.equal("0");
      expect(await this.lp.balanceOf(this.bob.address)).to.equal("990");
      await advanceTimeAndBlock(10); // t+75
      // Revert if Bob withdraws more than he deposited
      await expect(this.chef.connect(this.bob).withdraw(0, "11")).to.be.revertedWith("withdraw: not good"); // t+76
      await this.chef.connect(this.bob).withdraw(0, "10"); // t+77

      // expect(await this.ruby.totalSupply()).to.be.within(120, 130);
      expect(await this.ruby.balanceOf(this.bob.address)).to.be.within(108, 113);
      expect(await this.ruby.balanceOf(this.treasury.address)).to.be.within(12, 14);
      expect(await this.partnerToken.balanceOf(this.bob.address)).to.be.within(480, 520);
    });

    it("should distribute RUBYs properly for each staker", async function () {
      const startTime = (await latest()).add(60);
      this.chef = await this.rubyMasterChef.deploy(
        this.ruby.address,
        this.treasury.address,
        this.rubyPerSec,
        startTime,
        this.treasuryPercent,
      );
      await this.chef.deployed(); // t-59

      this.rewarder = await this.SimpleRewarderPerSec.deploy(
        this.partnerToken.address,
        this.lp.address,
        this.partnerRewardPerSec,
        this.chef.address,
      );
      await this.rewarder.deployed(); // t-58

      await this.partnerToken.mint(this.rewarder.address, "1000000000000000000000000"); // t-57
      
      const rubyToMasterChefAmount = BigNumber.from("1000");
      await this.ruby.transfer(this.chef.address, rubyToMasterChefAmount); // t-56
      const aliceRubyBalanceAfterTransfer = await this.ruby.balanceOf(this.alice.address);
      const rubyMasterChefInitialBalance = await this.ruby.balanceOf(this.chef.address);

      await this.chef.add("100", this.lp.address, this.rewarder.address); // t-55
      await this.lp.connect(this.alice).approve(this.chef.address, "1000", {
        from: this.alice.address,
      }); // t-54
      await this.lp.connect(this.bob).approve(this.chef.address, "1000", {
        from: this.bob.address,
      }); // t-53
      await this.lp.connect(this.carol).approve(this.chef.address, "1000", {
        from: this.carol.address,
      }); // t-52

      // Alice deposits 10 LPs at t+10
      await advanceTimeAndBlock(59); // t+9
      await this.chef.connect(this.alice).deposit(0, "10", { from: this.alice.address }); // t+10
      // Bob deposits 20 LPs at t+14
      await advanceTimeAndBlock(3); // t+13
      await this.chef.connect(this.bob).deposit(0, "20"); // t+14
      // Carol deposits 30 LPs at block t+18
      await advanceTimeAndBlock(3); // t+17
      await this.chef.connect(this.carol).deposit(0, "30", { from: this.carol.address }); // t+18
      // Alice deposits 10 more LPs at t+20. At this point:
      //   Alice should have:
      //      - 4*9 + 4*9*1/3 + 2*9*1/6 = 51 (+5) RubyToken
      //      - 4*40 + 4*40*1/3 + 2*40*1/6 = 226 (+40) PartnerToken
      //   Treasury should have: 10*1 = 10 (+2)
      //   MasterChef should have: 1000 - 51 - 10 = 939 (+10)
      await advanceTimeAndBlock(1); // t+19
      await this.chef.connect(this.alice).deposit(0, "10", { from: this.alice.address }); // t+20,
      // expect(await this.ruby.totalSupply()).to.be.within(100, 110);
      // Because LP rewards are divided among participants and rounded down, we account
      // for rounding errors with an offset


      let aliceDistributedTokens = 51;
      let treasuryDistributedTokens = 10;

      let aliceRubyBalanceMin = aliceRubyBalanceAfterTransfer.add(aliceDistributedTokens - this.tokenOffset); 
      let aliceRubyBalanceMax = aliceRubyBalanceAfterTransfer.add(aliceDistributedTokens + 5 + this.tokenOffset); 

      expect(await this.ruby.balanceOf(this.alice.address)).to.be.within(aliceRubyBalanceMin, aliceRubyBalanceMax);
      expect(await this.partnerToken.balanceOf(this.alice.address)).to.be.within(
        226 - this.tokenOffset,
        266 + this.tokenOffset,
      );

      expect(await this.ruby.balanceOf(this.bob.address)).to.equal("0");
      expect(await this.partnerToken.balanceOf(this.bob.address)).to.equal("0");

      expect(await this.ruby.balanceOf(this.carol.address)).to.equal("0");
      expect(await this.partnerToken.balanceOf(this.carol.address)).to.equal("0");

      expect(await this.ruby.balanceOf(this.treasury.address)).to.be.within(
        treasuryDistributedTokens - this.tokenOffset,
        treasuryDistributedTokens + 2 + this.tokenOffset,
      );

      let totalDistributedTokens = aliceDistributedTokens + treasuryDistributedTokens;

      let rubyMasterChefBalanceMin = rubyMasterChefInitialBalance.sub(totalDistributedTokens + this.tokenOffset + 10); 
      let rubyMasterChefBalanceMax = rubyMasterChefInitialBalance.sub(totalDistributedTokens - this.tokenOffset); 
            
      expect(await this.ruby.balanceOf(this.chef.address)).to.be.within(rubyMasterChefBalanceMin, rubyMasterChefBalanceMax);
      // Bob withdraws 5 LPs at t+30. At this point:
      //   Bob should have:
      //     - 4*9*2/3 + 2*9*2/6 + 10*9*2/7 = 55.7 (+5) RubyToken
      //     - 4*40*2/3 + 2*40*2/6 + 10*40*2/7 = 247 (+40) PartnerToken
      //   Treasury should have: 20*1 = 20 (+2)
      //   MasterChef should have: 939 - 55.7 - 10 = 873.3 (+10)
      await advanceTimeAndBlock(9); // t+29
      await this.chef.connect(this.bob).withdraw(0, "5", { from: this.bob.address }); // t+30
      // expect(await this.ruby.totalSupply()).to.be.within(200, 210);
      // Because of rounding errors, we use token offsets
      expect(await this.ruby.balanceOf(this.alice.address)).to.be.within(aliceRubyBalanceMin, aliceRubyBalanceMax);
      expect(await this.partnerToken.balanceOf(this.alice.address)).to.be.within(
        226 - this.tokenOffset,
        266 + this.tokenOffset,
      );

      let bobDistributedTokens = 55;
      treasuryDistributedTokens += 10;


      expect(await this.ruby.balanceOf(this.bob.address)).to.be.within(bobDistributedTokens - this.tokenOffset, bobDistributedTokens + 5 + this.tokenOffset);
      expect(await this.partnerToken.balanceOf(this.bob.address)).to.be.within(
        247 - this.tokenOffset,
        287 + this.tokenOffset,
      );

      expect(await this.ruby.balanceOf(this.carol.address)).to.equal("0");
      expect(await this.partnerToken.balanceOf(this.carol.address)).to.equal("0");

      expect(await this.ruby.balanceOf(this.treasury.address)).to.be.within(
        treasuryDistributedTokens - this.tokenOffset,
        treasuryDistributedTokens + 2 + this.tokenOffset,
      );


      totalDistributedTokens = aliceDistributedTokens + bobDistributedTokens + treasuryDistributedTokens; 

      rubyMasterChefBalanceMin = rubyMasterChefInitialBalance.sub(totalDistributedTokens + this.tokenOffset + 10);
      rubyMasterChefBalanceMax = rubyMasterChefInitialBalance.sub(totalDistributedTokens - this.tokenOffset);


      expect(await this.ruby.balanceOf(this.chef.address)).to.be.within(rubyMasterChefBalanceMin, rubyMasterChefBalanceMax);
      // Alice withdraws 20 LPs at t+40
      // Bob withdraws 15 LPs at t+50
      // Carol withdraws 30 LPs at t+60
      await advanceTimeAndBlock(9); // t+39
      await this.chef.connect(this.alice).withdraw(0, "20", { from: this.alice.address }); // t+40
      await advanceTimeAndBlock(9); // t+49
      await this.chef.connect(this.bob).withdraw(0, "15", { from: this.bob.address }); // t+50
      await advanceTimeAndBlock(9); // t+59
      await this.chef.connect(this.carol).withdraw(0, "30", { from: this.carol.address }); // t+60
      // expect(await this.ruby.totalSupply()).to.be.within(500, 510);
      // Alice should have:
      //  - 51 + 10*9*2/7 + 10*9*20/65 = 104.39(+5) RubyToken
      //  - 226 + 10*40*2/7 + 10*40*20/65 = 463 (+40) PartnerToken
      // note:  10*9*2/7 + 10*9*20/65  = 53.39

      aliceDistributedTokens += 53;

      aliceRubyBalanceMin = aliceRubyBalanceAfterTransfer.add(aliceDistributedTokens - this.tokenOffset); 
      aliceRubyBalanceMax = aliceRubyBalanceAfterTransfer.add(aliceDistributedTokens + 5 + this.tokenOffset); 

      expect(await this.ruby.balanceOf(this.alice.address)).to.be.within(
        aliceRubyBalanceMin,
        aliceRubyBalanceMax,
      );
      expect(await this.partnerToken.balanceOf(this.alice.address)).to.be.within(
        463 - this.tokenOffset,
        503 + this.tokenOffset,
      );
      // Bob should have:
      //  - 55.7 + 10*9*15/65 + 10*9*15/45 = 102.46 (+10) RubyToken
      //  - 247 + 10*40*15/65 + 10*40*15/45 = 472 (+40) PartnerToken
      // note: 10*9*15/65 + 10*9*15/45 = 46.76

      bobDistributedTokens += 46;

      expect(await this.ruby.balanceOf(this.bob.address)).to.be.within(102 - this.tokenOffset, 112 + this.tokenOffset);
      expect(await this.partnerToken.balanceOf(this.bob.address)).to.be.within(
        472 - this.tokenOffset,
        512 + this.tokenOffset,
      );
      // Carol should have:
      //  - 2*9*3/6 + 10*9*3/7 + 10*9*30/65 + 10*9*30/45 + 10*9 = 239.1 (+5) RubyToken
      //  - 2*40*1/2 + 10*40*3/7 + 10*40*30/65 + 10*40*30/45 + 10*40 = 1062 (+40) PartnerToken

      let carolDistributedTokens = 239;

      expect(await this.ruby.balanceOf(this.carol.address)).to.be.within(
        carolDistributedTokens - this.tokenOffset,
        carolDistributedTokens + 5 + this.tokenOffset,
      );
      expect(await this.partnerToken.balanceOf(this.carol.address)).to.be.within(
        1062 - this.tokenOffset,
        1102 + this.tokenOffset,
      );
      // Treasury should have: 50*1 = 50 (+2)
      treasuryDistributedTokens += 30;
      expect(await this.ruby.balanceOf(this.treasury.address)).to.be.within(
        treasuryDistributedTokens - this.tokenOffset,
        treasuryDistributedTokens + 2 + this.tokenOffset,
      );


      totalDistributedTokens = aliceDistributedTokens + bobDistributedTokens + carolDistributedTokens + treasuryDistributedTokens; 

      rubyMasterChefBalanceMin = rubyMasterChefInitialBalance.sub(totalDistributedTokens + this.tokenOffset + 10);
      rubyMasterChefBalanceMax = rubyMasterChefInitialBalance.sub(totalDistributedTokens - this.tokenOffset);
      
      expect(await this.ruby.balanceOf(this.chef.address)).to.be.within(rubyMasterChefBalanceMin, rubyMasterChefBalanceMax);

      // // All of them should have 1000 LPs back.
      expect(await this.lp.balanceOf(this.alice.address)).to.equal("1000");
      expect(await this.lp.balanceOf(this.bob.address)).to.equal("1000");
      expect(await this.lp.balanceOf(this.carol.address)).to.equal("1000");
    });

    it("should give proper RUBYs allocation to each pool", async function () {
      const startTime = (await latest()).add(60);
      this.chef = await this.rubyMasterChef.deploy(
        this.ruby.address,
        this.treasury.address,
        this.rubyPerSec,
        startTime,
        this.treasuryPercent,
      );
      await this.chef.deployed(); // t-59

      this.rewarder = await this.SimpleRewarderPerSec.deploy(
        this.partnerToken.address,
        this.lp.address,
        this.partnerRewardPerSec,
        this.chef.address,
      );
      await this.rewarder.deployed(); // t-58

      await this.partnerToken.mint(this.rewarder.address, "1000000000000000000000000"); // t-57

      const rubyToMasterChefAmount = BigNumber.from("1000");
      await this.ruby.transfer(this.chef.address, rubyToMasterChefAmount); // t-56
      const aliceRubyBalanceAfterTransfer = await this.ruby.balanceOf(this.alice.address);
      const rubyMasterChefInitialBalance = await this.ruby.balanceOf(this.chef.address);

      await this.lp.connect(this.alice).approve(this.chef.address, "1000", { from: this.alice.address }); // t-55
      await this.lp2.connect(this.bob).approve(this.chef.address, "1000", { from: this.bob.address }); // t-54
      // Add first LP to the pool with allocation 10
      await this.chef.add("10", this.lp.address, this.rewarder.address); // t-53
      // Alice deposits 10 LPs at t+10
      await advanceTimeAndBlock(62); // t+9
      await this.chef.connect(this.alice).deposit(0, "10", { from: this.alice.address }); // t+10
      // Add LP2 to the pool with allocation 20 at t+20
      await advanceTimeAndBlock(9); // t+19
      await this.chef.add("20", this.lp2.address, ADDRESS_ZERO); // t+20
      // Alice's pending reward should be:
      //   - 10*9 = 90 (+5) RubyToken
      //   - 10*40 = 400 (+40)  PartnerToken
      expect((await this.chef.pendingTokens(0, this.alice.address)).pendingRuby).to.be.within(
        90 - this.tokenOffset,
        95 + this.tokenOffset,
      );
      expect(await this.rewarder.pendingTokens(this.alice.address)).to.be.within(400, 440);
      // Bob deposits 10 LP2s at t+25
      await advanceTimeAndBlock(4); // t+24
      await this.chef.connect(this.bob).deposit(1, "10", { from: this.bob.address }); // t+25
      // Alice's pending reward should be:
      //   - 90 + 5*1/3*9 = 105 (+5) RubyToken
      //   - 400 + 5*40 = 600 (+40) PartnerToken
      expect((await this.chef.pendingTokens(0, this.alice.address)).pendingRuby).to.be.within(
        105 - this.tokenOffset,
        110 + this.tokenOffset,
      );
      expect(await this.rewarder.pendingTokens(this.alice.address)).to.be.within(600, 640);

      // At this point:
      //   Alice's pending reward should be:
      //     - 105 + 5*1/3*9 = 120 (+5) RubyToken
      //     - 600 + 5*40 = 800 (+40) PartnerToken
      // Bob's pending reward should be:
      //     - 5*2/3*9 = 30 (+50) RubyToken
      //     - 0 PartnerToken
      await advanceTimeAndBlock(5); // t+30

      
      expect((await this.chef.pendingTokens(0, this.alice.address)).pendingRuby).to.be.within(
        120 - this.tokenOffset,
        125 + this.tokenOffset,
      );
      expect(await this.rewarder.pendingTokens(this.alice.address)).to.be.within(800, 840);

      expect((await this.chef.pendingTokens(1, this.bob.address)).pendingRuby).to.be.within(
        30 - this.tokenOffset,
        35 + this.tokenOffset,
      );
      expect(await this.rewarder.pendingTokens(this.bob.address)).to.equal(0);

      // Alice and Bob should not have pending rewards in pools they're not staked in
      expect((await this.chef.pendingTokens(1, this.alice.address)).pendingRuby).to.equal("0");
      expect((await this.chef.pendingTokens(0, this.bob.address)).pendingRuby).to.equal("0");

      // Make sure they have receive the same amount as what was pending
      await this.chef.connect(this.alice).withdraw(0, "10", { from: this.alice.address }); // t+31
      // Alice should have:
      //   - 120 + 1*1/3*9 = 123 (+5) RubyToken
      //   - 800 + 1*40 = 840 (+40) PartnerToken

      let aliceDistributedTokens = 123;


      let aliceRubyBalanceMin = aliceRubyBalanceAfterTransfer.add(aliceDistributedTokens - this.tokenOffset)
      let aliceRubyBalanceMax = aliceRubyBalanceAfterTransfer.add(aliceDistributedTokens  + 5 + this.tokenOffset)

      expect(await this.ruby.balanceOf(this.alice.address)).to.be.within(
        aliceRubyBalanceMin,
        aliceRubyBalanceMax,
      );
      expect(await this.partnerToken.balanceOf(this.alice.address)).to.be.within(840, 880);

      await this.chef.connect(this.bob).withdraw(1, "5", { from: this.bob.address }); // t+32
      // Bob should have:
      //   - 30 + 2*2/3*9 = 42 (+5) RubyToken
      //   - 0 PartnerToken
      let bobDistributedTokens = 42;

      expect(await this.ruby.balanceOf(this.bob.address)).to.be.within(bobDistributedTokens - this.tokenOffset, bobDistributedTokens + 5 + this.tokenOffset);
      expect(await this.rewarder.pendingTokens(this.bob.address)).to.equal(0);
    });

    it("should give proper RUBYs after updating emission rate", async function () {
      const startTime = (await latest()).add(60);
      this.chef = await this.rubyMasterChef.deploy(
        this.ruby.address,
        this.treasury.address,
        this.rubyPerSec,
        startTime,
        this.treasuryPercent,
      );
      await this.chef.deployed(); // t-59

      this.rewarder = await this.SimpleRewarderPerSec.deploy(
        this.partnerToken.address,
        this.lp.address,
        this.partnerRewardPerSec,
        this.chef.address,
      );
      await this.rewarder.deployed(); // t-58

      await this.partnerToken.mint(this.rewarder.address, "1000000000000000000000000"); // t-57

      await this.ruby.transfer(this.chef.address, ethers.utils.parseUnits("10000")); // t-56

      await this.lp.connect(this.alice).approve(this.chef.address, "1000", { from: this.alice.address }); // t-55
      await this.chef.add("10", this.lp.address, this.rewarder.address); // t-54
      // Alice deposits 10 LPs at t+10
      await advanceTimeAndBlock(63); // t+9
      await this.chef.connect(this.alice).deposit(0, "10", { from: this.alice.address }); // t+10
      // At t+110, Alice should have:
      //   - 100*10*0.9 = 900 (+10) RubyToken
      //   - 100*40 = 4000 (+40) PartnerToken
      await advanceTimeAndBlock(100); // t+110
      expect((await this.chef.pendingTokens(0, this.alice.address)).pendingRuby).to.be.within(900, 910);
      expect(await this.rewarder.pendingTokens(this.alice.address)).to.be.within(4000, 4040);
      // Lower RUBY emission rate to 4 RUBY per sec
      await this.chef.updateEmissionRate(4); // t+111
      // At t+115, Alice should have:
      //   - 900 + 1*10*0.9 + 4*4*0.9 = 923.4 (+10) RubyToken
      //   - 4000 + 5*40 = 4200 (+40) PartnerToken
      await advanceTimeAndBlock(4); // t+115
      expect((await this.chef.pendingTokens(0, this.alice.address)).pendingRuby).to.be.within(923, 933);
      expect(await this.rewarder.pendingTokens(this.alice.address)).to.be.within(4200, 4240);
      // Increase PartnerToken emission rate to 90 PartnerToken per block
      await this.rewarder.setRewardRate(90); // t+116
      // At b=35, Alice should have:
      //   - 923.4 + 21*4*0.9 = 999 (+10) RubyToken
      //   - 4200 + 1*40 + 20*90 = 6040 (+90) PartnerToken
      await advanceTimeAndBlock(20); // t+136
      expect((await this.chef.pendingTokens(0, this.alice.address)).pendingRuby).to.be.within(999, 1099);
      expect(await this.rewarder.pendingTokens(this.alice.address)).to.be.within(6040, 6130);
    });
  });

  after(async function () {
    await network.provider.request({
      method: "hardhat_reset",
      params: [],
    });
  });
});
