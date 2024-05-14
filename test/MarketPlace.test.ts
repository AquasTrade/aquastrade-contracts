const { ethers, network } = require("hardhat");
import { expect } from "chai";
import { utils } from "ethers";
import { deploy } from "./utilities";
import { FREE_SWAP_NFT_DETAILS, FREE_SWAP_NFT_APPEARANCE } from "./../deploy/constants";

describe("CoinFl", function () {
  before(async function () {
    const transferAmount = ethers.utils.parseUnits("100000", 18);

    this.Flipper = await ethers.getContractFactory("MarketPlace");

    this.signers = await ethers.getSigners();
    this.alice = this.signers[0];
    this.bob = this.signers[1];
    this.carol = this.signers[2];

    let MockERC20 = await ethers.getContractFactory("MockERC20");
    this.erc20 = await MockERC20.deploy(`Mock token`, `MTK`, ethers.utils.parseUnits("10000000000", 18), 18);

    await this.erc20.deployed();

    await this.erc20.transfer(this.alice.address, transferAmount);

    const name = "Silver Swap NFT";
    const symbol = "SSNFT";

    const description = JSON.stringify(FREE_SWAP_NFT_DETAILS);
    const visualAppearance = JSON.stringify(FREE_SWAP_NFT_APPEARANCE);

    // to alice
    let MockERC721 = await ethers.getContractFactory("NFT");
    this.erc721 = await MockERC721.deploy();
    await this.erc721.deployed();

    await this.erc721.initialize(this.alice.address, name, symbol, description, visualAppearance);
    await this.erc721.setMinter(this.alice.address, true);
    await this.erc721.mint(this.alice.address);

    // await this.erc721.transferFrom(this.alice.address, transferAmount);

    this.coinFlipper = await this.Flipper.deploy(this.erc20.address);
    await this.coinFlipper.deployed();

    await this.erc20.approve(this.coinFlipper.address, transferAmount);
  });

  beforeEach(async function () {
    this.payToken = await this.coinFlipper.payToken();

    console.log("Token", this.payToken);
    await this.erc721.mint(this.alice.address);
    await this.erc721.mint(this.alice.address);
    await this.erc721.mint(this.alice.address);
    await this.erc721.mint(this.alice.address);
    await this.erc721.mint(this.alice.address);
  });

  it("should have tokens", async function () {
    const totalSupply = await this.erc20.totalSupply();
    const aliceBal = await this.erc20.balanceOf(this.alice.address);
    const aliceBal721 = await this.erc721.balanceOf(this.alice.address);
    expect(aliceBal721).to.equal("6");
    expect(totalSupply).to.equal("10000000000000000000000000000");
    expect(aliceBal).to.equal("10000000000000000000000000000");
  });

  it("transfer 1 nft: total 10s", async function () {
    await this.erc721.transferFrom(this.alice.address, this.coinFlipper.address, BigInt(0));
    const aliceBal721 = await this.erc721.balanceOf(this.alice.address);
    expect(aliceBal721).to.equal("10");
  });

  it("mint:send: shouldn't  have nft", async function () {
    await this.erc721.mint(this.alice.address);
    await this.erc721.transferFrom(this.alice.address, this.coinFlipper.address, BigInt(1));
    const aliceBal721 = await this.erc721.balanceOf(this.alice.address);
    expect(aliceBal721).to.equal("15");
  });

  it(" test items in ", async function () {
    console.log("nft 0 ", await this.coinFlipper.items(0)); // if data is empty, then default template returned

    console.log("nft 1 ", await this.coinFlipper.items(1));

    console.log("# of nft right now ", await this.coinFlipper._itemCounter());

    await this.erc721.approve(this.coinFlipper.address, 10);
    await this.erc721.approve(this.coinFlipper.address, 11);
    await this.erc721.approve(this.coinFlipper.address, 12);
    await this.erc721.approve(this.coinFlipper.address, 13);
    await this.erc721.approve(this.coinFlipper.address, 14);

    const list = await this.coinFlipper.listNFT(this.erc721.address, 10, BigInt(100));
    const list2 = await this.coinFlipper.listNFT(this.erc721.address, 11, BigInt(100));
    const list3 = await this.coinFlipper.listNFT(this.erc721.address, 12, BigInt(100));
    const list4 = await this.coinFlipper.listNFT(this.erc721.address, 13, BigInt(100));
    const list5 = await this.coinFlipper.listNFT(this.erc721.address, 14, BigInt(100));

    console.log("# of nft right now ", await this.coinFlipper._itemCounter());

    expect(await this.coinFlipper._itemCounter()).to.equal(5);

    const buy = await this.coinFlipper.buy(3, BigInt(100));

    expect(await this.coinFlipper._itemCounter()).to.equal(5); // bug : never decrements

    console.log("nft 4 ", await this.coinFlipper.items(4));

    console.log("nft 5 ", await this.coinFlipper.items(5));
  });

  after(async function () {
    await network.provider.request({
      method: "hardhat_reset",
      params: [],
    });
  });
});

/*
"inputs": [
        {
          "internalType": "address",
          "name": "_owner",
          "type": "address"
        },
        {
          "internalType": "string",
          "name": "_name",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "_symbol",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "_description",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "_visualAppearance",
          "type": "string"
        }
      ],
*/
