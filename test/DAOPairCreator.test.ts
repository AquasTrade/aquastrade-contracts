import { expect } from "chai";
import { ethers, network } from "hardhat";
import { deployAMM, deployNftsAndNftAdmin, deployRubyStaker } from "./utilities/deployment";

describe("DAOPairCreator", function () {
  const transferAmount = ethers.utils.parseUnits("1000000", 18);
  const minLockedRequired = ethers.utils.parseUnits("10000", 18);
  const minUnlockedRequired = ethers.utils.parseUnits("100", 18);
  beforeEach(async function () {
    this.signers = await ethers.getSigners();
    this.owner = this.signers[0];
    this.alice = this.signers[1];
    this.bob = this.signers[2];

    let { nftAdmin } = await deployNftsAndNftAdmin(this.owner.address);

    // AMM
    let { factory, ammRouter } = await deployAMM(this.owner.address, nftAdmin.address);
    this.factory = factory;
    this.router = ammRouter;

    let MockUSDP = await ethers.getContractFactory("MockUSDP");
    this.usdp = await MockUSDP.deploy();
    await this.usdp.deployed();

    let MockERC20 = await ethers.getContractFactory("MockERC20");
    this.erc20 = await MockERC20.deploy(`Mock token`, `MTK`, ethers.utils.parseUnits("10000000000", 18), 18);
    await this.erc20.deployed();

    this.RubyToken = await ethers.getContractFactory("RubyTokenMintable");
    this.ruby = await this.RubyToken.deploy();
    await this.ruby.deployed();

    const ownerBalance = await this.ruby.balanceOf(this.owner.address);

    await this.ruby.transfer(this.alice.address, transferAmount);
    await this.usdp.transfer(this.alice.address, transferAmount);
    await this.erc20.transfer(this.alice.address, transferAmount);

    this.staker = await deployRubyStaker(this.owner.address, this.ruby.address, 5);

    this.DAO = await ethers.getContractFactory("DAOPairCreator");
    this.dao = await this.DAO.deploy(
      this.owner.address,
      this.factory.address,
      this.router.address,
      this.usdp.address,
      this.staker.address,
    );
    await this.dao.deployed();

    await this.dao.setMinimumBalanceRequired(minUnlockedRequired, minLockedRequired);
    await this.factory.setPairCreator(this.router.address, true);

    await this.ruby.approve(this.staker.address, ownerBalance);
    await this.ruby.connect(this.alice).approve(this.staker.address, transferAmount);
    await this.usdp.connect(this.alice).approve(this.dao.address, transferAmount);
    await this.erc20.connect(this.alice).approve(this.dao.address, transferAmount);
  });

  describe("createPair", function () {
    it("should revert when user has insufficient locked ruby", async function () {
      expect(await this.staker.connect(this.alice).stake(minUnlockedRequired, false))
        .to.emit(this.staker, "Staked")
        .withArgs(this.alice.address, minUnlockedRequired);
      await expect(this.dao.connect(this.alice).createPair(this.usdp.address, this.erc20.address)).to.be.revertedWith(
        "DAOPairCreator: INSUFFICIENT LOCKED RUBY",
      );
    });

    it("should revert when user has insufficient unlocked ruby", async function () {
      expect(await this.staker.connect(this.alice).stake(minLockedRequired, true))
        .to.emit(this.staker, "Staked")
        .withArgs(this.alice.address, minLockedRequired);
      await expect(this.dao.connect(this.alice).createPair(this.usdp.address, this.erc20.address)).to.be.revertedWith(
        "DAOPairCreator: INSUFFICIENT UNLOCKED RUBY",
      );
    });

    it("should revert if invalid token is passed", async function () {
      expect(await this.staker.connect(this.alice).stake(minUnlockedRequired, false))
        .to.emit(this.staker, "Staked")
        .withArgs(this.alice.address, minUnlockedRequired);
      expect(await this.staker.connect(this.alice).stake(minLockedRequired, true))
        .to.emit(this.staker, "Staked")
        .withArgs(this.alice.address, minLockedRequired);
      await expect(this.dao.connect(this.alice).createPair(this.ruby.address, this.erc20.address)).to.be.revertedWith(
        "DAOPairCreator: INVALID_TOKEN",
      );
    });

    it("should revert if DAOPairCreator is not set as pair creator of factory", async function () {
      expect(await this.staker.connect(this.alice).stake(minUnlockedRequired, false))
        .to.emit(this.staker, "Staked")
        .withArgs(this.alice.address, minUnlockedRequired);
      expect(await this.staker.connect(this.alice).stake(minLockedRequired, true))
        .to.emit(this.staker, "Staked")
        .withArgs(this.alice.address, minLockedRequired);
      await expect(this.dao.connect(this.alice).createPair(this.usdp.address, this.erc20.address)).to.be.revertedWith(
        "UniswapV2: FORBIDDEN",
      );
    });

    it("should create a new pair successfully", async function () {
      expect(await this.staker.connect(this.alice).stake(minUnlockedRequired, false))
        .to.emit(this.staker, "Staked")
        .withArgs(this.alice.address, minUnlockedRequired);
      expect(await this.staker.connect(this.alice).stake(minLockedRequired, true))
        .to.emit(this.staker, "Staked")
        .withArgs(this.alice.address, minLockedRequired);
      await this.factory.setPairCreator(this.dao.address, true);
      await expect(this.dao.connect(this.alice).createPair(this.usdp.address, this.erc20.address)).to.emit(
        this.factory,
        "PairCreated",
      );
    });
  });

  describe("addLiquidity", function () {
    it("should revert when user has insufficient locked ruby", async function () {
      expect(await this.staker.connect(this.alice).stake(minUnlockedRequired, false))
        .to.emit(this.staker, "Staked")
        .withArgs(this.alice.address, minUnlockedRequired);
      const blockNumber = await ethers.provider.getBlockNumber();
      const blockData = await ethers.provider.getBlock(blockNumber);
      const deadline = ethers.BigNumber.from(blockData.timestamp + 23600);
      await expect(
        this.dao
          .connect(this.alice)
          .addLiquidity(
            this.usdp.address,
            this.erc20.address,
            transferAmount,
            transferAmount,
            transferAmount,
            transferAmount,
            this.alice.address,
            deadline,
          ),
      ).to.be.revertedWith("DAOPairCreator: INSUFFICIENT LOCKED RUBY");
    });

    it("should revert when user has insufficient unlocked ruby", async function () {
      expect(await this.staker.connect(this.alice).stake(minLockedRequired, true))
        .to.emit(this.staker, "Staked")
        .withArgs(this.alice.address, minLockedRequired);
      const blockNumber = await ethers.provider.getBlockNumber();
      const blockData = await ethers.provider.getBlock(blockNumber);
      const deadline = ethers.BigNumber.from(blockData.timestamp + 23600);
      await expect(
        this.dao
          .connect(this.alice)
          .addLiquidity(
            this.usdp.address,
            this.erc20.address,
            transferAmount,
            transferAmount,
            transferAmount,
            transferAmount,
            this.alice.address,
            deadline,
          ),
      ).to.be.revertedWith("DAOPairCreator: INSUFFICIENT UNLOCKED RUBY");
    });

    it("should revert if invalid token is passed", async function () {
      expect(await this.staker.connect(this.alice).stake(minUnlockedRequired, false))
        .to.emit(this.staker, "Staked")
        .withArgs(this.alice.address, minUnlockedRequired);
      expect(await this.staker.connect(this.alice).stake(minLockedRequired, true))
        .to.emit(this.staker, "Staked")
        .withArgs(this.alice.address, minLockedRequired);
      const blockNumber = await ethers.provider.getBlockNumber();
      const blockData = await ethers.provider.getBlock(blockNumber);
      const deadline = ethers.BigNumber.from(blockData.timestamp + 23600);
      await expect(
        this.dao
          .connect(this.alice)
          .addLiquidity(
            this.ruby.address,
            this.erc20.address,
            transferAmount,
            transferAmount,
            transferAmount,
            transferAmount,
            this.alice.address,
            deadline,
          ),
      ).to.be.revertedWith("DAOPairCreator: INVALID_TOKEN");
    });

    it("should revert if DAOPairCreator is not set as pair creator of factory", async function () {
      expect(await this.staker.connect(this.alice).stake(minUnlockedRequired, false))
        .to.emit(this.staker, "Staked")
        .withArgs(this.alice.address, minUnlockedRequired);
      expect(await this.staker.connect(this.alice).stake(minLockedRequired, true))
        .to.emit(this.staker, "Staked")
        .withArgs(this.alice.address, minLockedRequired);
      const blockNumber = await ethers.provider.getBlockNumber();
      const blockData = await ethers.provider.getBlock(blockNumber);
      const deadline = ethers.BigNumber.from(blockData.timestamp + 23600);
      await expect(
        this.dao
          .connect(this.alice)
          .addLiquidity(
            this.usdp.address,
            this.erc20.address,
            transferAmount,
            transferAmount,
            transferAmount,
            transferAmount,
            this.alice.address,
            deadline,
          ),
      ).to.be.revertedWith("UniswapV2Router: PAIR_NOT_CREATED");
    });

    it("should addLiquidity successfully - 1", async function () {
      expect(await this.staker.connect(this.alice).stake(minUnlockedRequired, false))
        .to.emit(this.staker, "Staked")
        .withArgs(this.alice.address, minUnlockedRequired);
      expect(await this.staker.connect(this.alice).stake(minLockedRequired, true))
        .to.emit(this.staker, "Staked")
        .withArgs(this.alice.address, minLockedRequired);
      await this.factory.setPairCreator(this.dao.address, true);
      const blockNumber = await ethers.provider.getBlockNumber();
      const blockData = await ethers.provider.getBlock(blockNumber);
      const deadline = ethers.BigNumber.from(blockData.timestamp + 23600);
      await expect(
        this.dao
          .connect(this.alice)
          .addLiquidity(
            this.usdp.address,
            this.erc20.address,
            transferAmount,
            transferAmount,
            0,
            0,
            this.alice.address,
            deadline,
          ),
      ).to.emit(this.factory, "PairCreated");
      const pairAddress = this.factory.getPair(this.usdp.address, this.erc20.address);
      const aliceUsdpBalance = await this.usdp.balanceOf(this.alice.address);
      const pairUsdpBalance = await this.usdp.balanceOf(pairAddress);
      expect(aliceUsdpBalance.add(pairUsdpBalance)).to.be.equal(transferAmount);

      const aliceErc20Balance = await this.erc20.balanceOf(this.alice.address);
      const pairErc20Balance = await this.erc20.balanceOf(pairAddress);
      expect(aliceErc20Balance.add(pairErc20Balance)).to.be.equal(transferAmount);
    });

    it("should addLiquidity successfully - 2", async function () {
      expect(await this.staker.connect(this.alice).stake(minUnlockedRequired, false))
        .to.emit(this.staker, "Staked")
        .withArgs(this.alice.address, minUnlockedRequired);
      expect(await this.staker.connect(this.alice).stake(minLockedRequired, true))
        .to.emit(this.staker, "Staked")
        .withArgs(this.alice.address, minLockedRequired);
      await this.factory.setPairCreator(this.dao.address, true);
      const liquidityAmount = ethers.utils.parseUnits("10000", 18);
      let blockNumber = await ethers.provider.getBlockNumber();
      let blockData = await ethers.provider.getBlock(blockNumber);
      let deadline = ethers.BigNumber.from(blockData.timestamp + 23600);
      await expect(
        this.dao
          .connect(this.alice)
          .addLiquidity(
            this.usdp.address,
            this.erc20.address,
            liquidityAmount,
            liquidityAmount.mul(2),
            0,
            0,
            this.alice.address,
            deadline,
          ),
      ).to.emit(this.factory, "PairCreated");
      let pairAddress = this.factory.getPair(this.usdp.address, this.erc20.address);
      let aliceUsdpBalance = await this.usdp.balanceOf(this.alice.address);
      let pairUsdpBalance = await this.usdp.balanceOf(pairAddress);
      expect(aliceUsdpBalance.add(pairUsdpBalance)).to.be.equal(transferAmount);

      let aliceErc20Balance = await this.erc20.balanceOf(this.alice.address);
      let pairErc20Balance = await this.erc20.balanceOf(pairAddress);
      expect(aliceErc20Balance.add(pairErc20Balance)).to.be.equal(transferAmount);

      blockNumber = await ethers.provider.getBlockNumber();
      blockData = await ethers.provider.getBlock(blockNumber);
      deadline = ethers.BigNumber.from(blockData.timestamp + 23600);
      await this.dao
        .connect(this.alice)
        .addLiquidity(
          this.usdp.address,
          this.erc20.address,
          liquidityAmount,
          liquidityAmount,
          0,
          0,
          this.alice.address,
          deadline,
        );
      aliceUsdpBalance = await this.usdp.balanceOf(this.alice.address);
      pairUsdpBalance = await this.usdp.balanceOf(pairAddress);
      expect(aliceUsdpBalance.add(pairUsdpBalance)).to.be.equal(transferAmount);

      aliceErc20Balance = await this.erc20.balanceOf(this.alice.address);
      pairErc20Balance = await this.erc20.balanceOf(pairAddress);
      expect(aliceErc20Balance.add(pairErc20Balance)).to.be.equal(transferAmount);
    });
  });
});
