import { expect } from "chai";
import { ethers } from "hardhat";

describe("ERC20Wrapper", function () {

  before(async function () {
    this.signers = await ethers.getSigners();
    this.owner = this.signers[0];
    this.user_address = this.signers[1];
  });

  beforeEach(async function () {
    this.MockERC20 = await ethers.getContractFactory("MockERC20", this.owner);
    this.Wrapper = await ethers.getContractFactory("SkaleS2SERC20Wrapper");
    this.eth = await this.MockERC20.deploy("Skale ETHC", "ETHC", 1000000000, 18);
    await this.eth.deployed();
  });

  it("ETHC deployment exists: ", async function () {
    let decimals = await this.eth.decimals();
    let name = await this.eth.name();
    expect(await this.eth.totalSupply()).to.be.gt(0)
  });

  it("ETHC token supply exists under owner address", async function () {
    const balance = await this.eth.balanceOf(this.owner.address);
    expect(await this.eth.totalSupply()).to.be.eq(balance)
  });
  
  it("wrap ethc", async function () {
    let weth = await this.Wrapper.deploy("ETHWrap", "WETH", this.eth.address)
    expect(await weth.decimals()).to.be.eq(18)
  });

  it("wrap usdt", async function () {
    let usdc = await this.MockERC20.deploy("Skale USDC", "USDC", 100, 6);
    let wusdc = await this.Wrapper.deploy("USDCWrap", "WUSDC", usdc.address)
    expect(await wusdc.decimals()).to.be.eq(6)
  });

  it("wrap btc", async function () {
    let btc = await this.MockERC20.deploy("Skale BTC", "WBTC", 100, 8);
    let wbtc = await this.Wrapper.deploy("BTCWrap", "BTC", btc.address)
    expect(await wbtc.decimals()).to.be.eq(8)
  });

  it("Wrap ETHC to wETH", async function () {
    let weth = await this.Wrapper.deploy("ETHWrap", "WETH", this.eth.address)
    const ownerBalance = await this.eth.balanceOf(this.owner.address);
    const amount = ethers.utils.parseEther('0.000000000000000001');
    let approval = await this.eth.approve(weth.address, amount)
    let send = await weth.depositFor(this.owner.address, amount)
    expect(await weth.balanceOf(this.owner.address)).to.be.eq(1)
  });

  it("Unwrap wETH to ETH", async function () {
    let weth = await this.Wrapper.deploy("ETHWrap", "WETH", this.eth.address)
    const ownerBalance = await this.eth.balanceOf(this.owner.address);
    const amount = ethers.utils.parseEther('0.000000000000000001');
    let approval = await this.eth.approve(weth.address, amount)
    let send = await weth.depositFor(this.owner.address, amount)
    let withdraw = await weth.withdrawTo(this.owner.address, amount)
    expect(await weth.balanceOf(this.owner.address)).to.be.eq(0)
  });

});
