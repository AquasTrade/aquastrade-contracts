import { expect } from "chai";
import { ethers, network } from "hardhat";
import { deployAMM, deployNftsAndNftAdmin, deployRubyStaker } from "./utilities/deployment";

describe("DAOPairCreator", function () {
  const transferAmount = ethers.utils.parseUnits("1000000", 18);
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
    await this.ruby.transfer(this.bob.address, transferAmount);
    await this.usdp.transfer(this.alice.address, transferAmount);
    await this.usdp.transfer(this.bob.address, transferAmount);
    await this.erc20.transfer(this.alice.address, transferAmount);
    await this.erc20.transfer(this.bob.address, transferAmount);

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

    await this.factory.setPairCreator(this.dao.address, true);
    await this.factory.setPairCreator(this.router.address, true);

    await this.ruby.approve(this.staker.address, ownerBalance);
    await this.ruby.connect(this.alice).approve(this.staker.address, transferAmount);
    await this.ruby.connect(this.bob).approve(this.staker.address, transferAmount);
    await this.usdp.connect(this.alice).approve(this.dao.address, transferAmount);
    await this.usdp.connect(this.bob).approve(this.dao.address, transferAmount);
    await this.erc20.connect(this.alice).approve(this.dao.address, transferAmount);
    await this.erc20.connect(this.bob).approve(this.dao.address, transferAmount);

    expect(await this.staker.connect(this.bob).stake(transferAmount, true))
      .to.emit(this.staker, "Staked")
      .withArgs(this.bob.address, transferAmount);
  });

  describe("createPair", function () {
    it("should revert when not authorized", async function () {
      await expect(this.dao.connect(this.alice).createPair(this.usdp.address, this.erc20.address)).to.be.revertedWith(
        "DAOPairCreator: FORBIDDEN",
      );
    });

    it("should revert if invalid token is passed", async function () {
      await expect(this.dao.connect(this.bob).createPair(this.ruby.address, this.erc20.address)).to.be.revertedWith(
        "DAOPairCreator: INVALID_TOKEN",
      );
    });

    it("should revert when user has insufficient locked ruby", async function () {
      const transferAmount = ethers.utils.parseUnits("10000", 18);
      expect(await this.staker.connect(this.alice).stake(transferAmount, true))
        .to.emit(this.staker, "Staked")
        .withArgs(this.alice.address, transferAmount);
      await expect(this.dao.connect(this.alice).createPair(this.usdp.address, this.erc20.address)).to.be.revertedWith(
        "DAOPairCreator: FORBIDDEN",
      );
    });

    it("should revert when user has insufficient unlocked ruby", async function () {
      const transferAmount = ethers.utils.parseUnits("10000", 18);
      expect(await this.staker.connect(this.alice).stake(transferAmount, false))
        .to.emit(this.staker, "Staked")
        .withArgs(this.alice.address, transferAmount);
      await expect(this.dao.connect(this.alice).createPair(this.usdp.address, this.erc20.address)).to.be.revertedWith(
        "DAOPairCreator: FORBIDDEN",
      );
    });

    it("should create a new pair successfully (user who has locked ruby)", async function () {
      await expect(this.dao.connect(this.bob).createPair(this.usdp.address, this.erc20.address)).to.emit(
        this.factory,
        "PairCreated",
      );
    });

    it("should create a new pair successfully (user who has unlocked ruby", async function () {
      const transferAmount = ethers.utils.parseUnits("1000000", 18);
      expect(await this.staker.connect(this.alice).stake(transferAmount, false))
        .to.emit(this.staker, "Staked")
        .withArgs(this.alice.address, transferAmount);
      await expect(this.dao.connect(this.alice).createPair(this.usdp.address, this.erc20.address)).to.emit(
        this.factory,
        "PairCreated",
      );
    });
  });

  describe("addLiquidity", function () {
    it("should revert when not authorized", async function () {
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
            deadline
          ),
      ).to.be.revertedWith("DAOPairCreator: FORBIDDEN");
    });

    it("should revert if invalid token is passed", async function () {
      const blockNumber = await ethers.provider.getBlockNumber();
      const blockData = await ethers.provider.getBlock(blockNumber);
      const deadline = ethers.BigNumber.from(blockData.timestamp + 23600);
      await expect(
        this.dao
          .connect(this.bob)
          .addLiquidity(
            this.ruby.address,
            this.erc20.address,
            transferAmount,
            transferAmount,
            transferAmount,
            transferAmount,
            this.bob.address,
            deadline
          ),
      ).to.be.revertedWith("DAOPairCreator: INVALID_TOKEN");
    });

    it("should revert when user has insufficient locked ruby", async function () {
      const transferAmount = ethers.utils.parseUnits("10000", 18);
      expect(await this.staker.connect(this.alice).stake(transferAmount, true))
        .to.emit(this.staker, "Staked")
        .withArgs(this.alice.address, transferAmount);
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
              deadline
            ),
        ).to.be.revertedWith("DAOPairCreator: FORBIDDEN");
    });

    it("should revert when user has insufficient unlocked ruby", async function () {
      const transferAmount = ethers.utils.parseUnits("10000", 18);
      expect(await this.staker.connect(this.alice).stake(transferAmount, false))
        .to.emit(this.staker, "Staked")
        .withArgs(this.alice.address, transferAmount);
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
              deadline
            ),
        ).to.be.revertedWith("DAOPairCreator: FORBIDDEN");
    });

    it("should create a new pair successfully (user who has locked ruby)", async function () {
      const blockNumber = await ethers.provider.getBlockNumber();
      const blockData = await ethers.provider.getBlock(blockNumber);
      const deadline = ethers.BigNumber.from(blockData.timestamp + 23600);
      await expect(
        this.dao
          .connect(this.bob)
          .addLiquidity(
            this.usdp.address,
            this.erc20.address,
            transferAmount,
            transferAmount,
            transferAmount,
            transferAmount,
            this.bob.address,
            deadline
          ),
      ).to.emit(this.factory, "PairCreated");
    });

    it("should create a new pair successfully (user who has unlocked ruby", async function () {
      const transferAmount = ethers.utils.parseUnits("1000000", 18);
      expect(await this.staker.connect(this.alice).stake(transferAmount, false))
        .to.emit(this.staker, "Staked")
        .withArgs(this.alice.address, transferAmount);
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
              deadline
            ),
        ).to.emit(this.factory, "PairCreated");
    });
  });
});
