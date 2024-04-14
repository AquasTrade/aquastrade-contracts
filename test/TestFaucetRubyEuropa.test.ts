import { expect } from "chai";

import { ethers, network } from "hardhat";

describe("FaucetRubyEuropa", function () {
  before(async function () {
    this.signers = await ethers.getSigners();
    this.owner = this.signers[0];
    this.user = this.signers[1];
    this.burn = this.signers[2];
    this.Faucet = await ethers.getContractFactory("FaucetRubyEuropa");
  });

  beforeEach(async function () {
    this.faucet = await this.Faucet.deploy();
    let ownerBefore = await ethers.provider.getBalance(this.owner.address);
    this.userBefore = await ethers.provider.getBalance(this.user.address);
    this.topup = await this.faucet.MINT_AMOUNT_ETH();

    // transfer half of owner balance to faucet
    await this.owner.sendTransaction({
      to: this.faucet.address,
      value: ownerBefore.div(2),
    });

    this.ownerBefore = await ethers.provider.getBalance(this.owner.address);

    // burn almost all eth from user wallet
    await this.user.sendTransaction({
      to: this.burn.address,
      value: this.userBefore.sub(this.topup.div(2)),
    });

    this.faucetBefore = await ethers.provider.getBalance(this.faucet.address);
  });

  it("User topup limited", async function () {
    let bal = await ethers.provider.getBalance(this.user.address);
    expect(bal, "starting user balance less than topup").to.be.lt(this.topup);

    // mint once
    await this.faucet.mint(this.user.address);

    bal = await ethers.provider.getBalance(this.user.address);
    expect(bal, "user balance less than topup max").to.be.lte(this.topup);

    let faucetBal = await ethers.provider.getBalance(this.faucet.address);
    expect(faucetBal, "faucet has less eth").to.be.lt(this.faucetBefore);

    // check mint again does not raise user above

    await this.faucet.mint(this.user.address);
    await this.faucet.mint(this.user.address);
    await this.faucet.mint(this.user.address);

    bal = await ethers.provider.getBalance(this.user.address);
    expect(bal, "user balance less than topup max").to.be.lte(this.topup);

    expect(await ethers.provider.getBalance(this.faucet.address), "faucet has not dispensed more eth").to.be.eq(
      faucetBal,
    );
  });

  it("Only owner can withdraw remaining", async function () {
    await expect(this.faucet.connect(this.burn).withdraw(), "user can't withdraw").to.be.revertedWith(
      "Ownable: caller is not the owner",
    );

    expect(await ethers.provider.getBalance(this.owner.address), "owner has starting funds").to.be.eq(this.ownerBefore);

    expect(await this.faucet.owner()).to.be.eq(this.owner.address);
    await this.faucet.connect(this.owner).withdraw();

    expect(await ethers.provider.getBalance(this.faucet.address), "faucet is empty").to.be.eq(0);
    expect(await ethers.provider.getBalance(this.owner.address), "owner has old faucet funds").to.be.gt(
      this.ownerBefore,
    );
  });

  this.afterEach(async function () {
    // reset eth balances
    await network.provider.request({
      method: "hardhat_reset",
      params: [],
    });
  });
});
