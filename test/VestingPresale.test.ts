import { expect } from "chai";
import { ethers, network } from "hardhat";

import {
  advanceTimeByTimestamp,
} from "./utilities";

describe("VestingPresale", function () {

  before(async function () {
    this.signers = await ethers.getSigners();

    this.owner = this.signers[0];
    this.beneficiary = this.signers[1];
    this.other = this.signers[2]

    this.Vester = await ethers.getContractFactory("Vester");
    this.RubyToken = await ethers.getContractFactory("RubyTokenMintable");
  });

  beforeEach(async function () {
    this.ruby = await this.RubyToken.deploy();
    await this.ruby.deployed();

    const blockNumber = await ethers.provider.getBlockNumber();
    const block = await ethers.provider.getBlock(blockNumber);

    this.START = block.timestamp;
    this.presale = await this.Vester.deploy(this.beneficiary.address,
                                            this.START,
                                            0,  // no cliff, linear whole way
                                            60 * 60 * 24 * 365,  // 12 months
                                            true)
     await this.presale.deployed();

     await this.ruby.transfer(this.presale.address, 3650)
  });

  it("beneficiary 1 day 1 token", async function () {
    expect(await this.ruby.balanceOf(this.presale.address)).to.be.eq(3650)

    advanceTimeByTimestamp(60*60*24) // 1 day

    const amt = await this.presale.releaseableAmount(this.ruby.address);
    expect(amt).to.be.within(9, 11)

    expect(await this.presale.connect(this.beneficiary).release(this.ruby.address, amt)).to.emit(this.presale, "TokensReleased")

    expect(await this.ruby.balanceOf(this.presale.address)).to.be.within(3639, 3641)
    expect(await this.ruby.balanceOf(this.beneficiary.address)).to.be.within(9, 11)
  });

  it("beneficiary 1 day 1 token (request more)", async function () {
    expect(await this.ruby.balanceOf(this.presale.address)).to.be.eq(3650)

    advanceTimeByTimestamp(60*60*24) // 1 day

    // pass 1000, but only 10 are due, so 1000 is clamped to 10
    expect(await this.presale.connect(this.beneficiary).release(this.ruby.address, 1000)).to.emit(this.presale, "TokensReleased")

    expect(await this.ruby.balanceOf(this.presale.address)).to.be.within(3639, 3641)
    expect(await this.ruby.balanceOf(this.beneficiary.address)).to.be.within(9, 11)
  });

  it("beneficiary sequential", async function () {
    expect(await this.ruby.balanceOf(this.presale.address)).to.be.eq(3650)

    advanceTimeByTimestamp(60*60*24) // 1 day

    // only 10 are due, so 1000 is clamped to 10
    expect(await this.presale.connect(this.beneficiary).release(this.ruby.address, 10)).to.emit(this.presale, "TokensReleased")
    expect(await this.ruby.balanceOf(this.presale.address)).to.be.within(3639, 3641)
    expect(await this.ruby.balanceOf(this.beneficiary.address)).to.be.within(9, 11)

    // none ready
    await expect(this.presale.connect(this.beneficiary).release(this.ruby.address, 10)).to.be.revertedWith("TokenVesting: no tokens are due");

    advanceTimeByTimestamp(60*60*24) // 1 day

    // 1 more day, 10 more
    expect(await this.presale.connect(this.beneficiary).release(this.ruby.address, 10)).to.emit(this.presale, "TokensReleased")
    expect(await this.ruby.balanceOf(this.presale.address)).to.be.within(3629, 3631)
    expect(await this.ruby.balanceOf(this.beneficiary.address)).to.be.within(19, 21)

    // 1 year the remaining
    advanceTimeByTimestamp(60*60*24*366) // 1 year+

    // empty
    const amt = await this.presale.releaseableAmount(this.ruby.address);
    expect(await this.presale.connect(this.beneficiary).release(this.ruby.address, amt)).to.emit(this.presale, "TokensReleased")
    expect(await this.ruby.balanceOf(this.presale.address)).to.be.eq(0)
    expect(await this.ruby.balanceOf(this.beneficiary.address)).to.be.eq(3650)
  });

  it("non-beneficiary cannot release", async function () {
    expect(await this.ruby.balanceOf(this.presale.address)).to.be.eq(3650)

    advanceTimeByTimestamp(60*60*24) // 1 day

    const amt = await this.presale.releaseableAmount(this.ruby.address);
    expect(amt).to.be.within(9, 11)

    await expect(this.presale.connect(this.other).release(this.ruby.address, amt)).to.be.revertedWith("Vester: not beneficiary");

    // but beneficiary can release
    expect(await this.presale.connect(this.beneficiary).release(this.ruby.address, amt)).to.emit(this.presale, "TokensReleased")
    expect(await this.ruby.balanceOf(this.presale.address)).to.be.within(3639, 3641)
    expect(await this.ruby.balanceOf(this.beneficiary.address)).to.be.within(9, 11)

  });

  it("non-beneficiary cannot transfer beneficiary", async function () {
    await expect(this.presale.connect(this.other).transferBeneficiary(this.other.address)).to.be.revertedWith("Vester: not beneficiary");
  });

  it("beneficiary transfer", async function () {
    expect(await this.ruby.balanceOf(this.presale.address)).to.be.eq(3650)

    advanceTimeByTimestamp(60*60*24) // 1 day

    const amt = await this.presale.releaseableAmount(this.ruby.address);
    expect(amt).to.be.within(9, 11)

    expect(await this.ruby.balanceOf(this.other.address)).to.be.eq(0)
    expect(await this.ruby.balanceOf(this.beneficiary.address)).to.be.eq(0)

    await this.presale.connect(this.beneficiary).transferBeneficiary(this.other.address);

    // new beneficiary can release
    expect(await this.presale.connect(this.other).release(this.ruby.address, amt)).to.emit(this.presale, "TokensReleased")
    expect(await this.ruby.balanceOf(this.presale.address)).to.be.within(3639, 3641)
    expect(await this.ruby.balanceOf(this.other.address)).to.be.within(9, 11)

    expect(await this.ruby.balanceOf(this.beneficiary.address)).to.be.eq(0)

  });

  it("non-owner cannot revoke", async function () {
    expect(await this.ruby.balanceOf(this.presale.address)).to.be.eq(3650)

    advanceTimeByTimestamp(60*60*24) // 1 day

    await expect(this.presale.connect(this.other).revoke(this.ruby.address)).to.be.revertedWith("Ownable: caller is not the owner");

  });

  this.afterEach(async function () {
    // reset eth balances
    await network.provider.request({
      method: "hardhat_reset",
      params: [],
    });
  });
});
