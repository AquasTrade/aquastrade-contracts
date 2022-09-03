import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { LotteryFactory, Lottery, RubyNFT } from "../../typechain";

import ERC20ABI from "../../abi/@openzeppelin/contracts/token/ERC20/ERC20.sol/ERC20.json";


interface CreateLotteryArguments {
  collateral: string,
  nft: string,
  nftid: number,
  size: number,
  price: any,
  distribution: string,
  duration: number,
  mint: string,
}

const main = async (taskArgs: CreateLotteryArguments, hre: HardhatRuntimeEnvironment) => {
  if (taskArgs.duration <= 60) {
    throw new Error("Lottery: min duration 1 minute")
  }
  if (taskArgs.duration > (60*60*24*7)) {
    throw new Error("Lottery: max duration 1 week");
  }
  if (taskArgs.size > 5) {
    throw new Error("Lottery: max 100k tickets");
  }

  const ethers = hre.ethers;
  const network = hre.network;
  const account = (await ethers.getSigners())[0];

  const factoryAddr = require(`../../deployments/${network.name}/LotteryFactory.json`).address;
  const factory: LotteryFactory = (await ethers.getContractAt("LotteryFactory", factoryAddr)) as LotteryFactory;

  const lotteryCurrent: Lottery = (await ethers.getContractAt('Lottery', await factory.getCurrentLotto())) as Lottery;
  const isClosed = await lotteryCurrent.isClosed();

  if (!isClosed) {
    throw new Error('Lottery Currently Running');
  }

  const rubyAddr = require(`../../deployments/${network.name}/RubyToken.json`).address;
  const usdpAddr = require(`../../deployments/${network.name}/RubyUSDP.json`).address;

  if (taskArgs.collateral === 'RUBY') {
    taskArgs.collateral = rubyAddr;
  } else if (taskArgs.collateral === 'USDP') {
    taskArgs.collateral = usdpAddr;
  } else {
    throw new Error(`Unsupported collateral ${taskArgs.collateral}`)
  }

  const collateral = new ethers.Contract(taskArgs.collateral, ERC20ABI, ethers.provider);
  const [collateralSymbol, collateralDecimals] = await Promise.all([
    collateral.symbol(),
    collateral.decimals()])

  console.log("Raffle Collateral", collateralSymbol);

  taskArgs.price = ethers.utils.parseUnits(taskArgs.price, collateralDecimals);

  let rubyNFT;
  let rubyNFTAddr;
  if (['None', 'none'].includes(taskArgs.nft)) {
    taskArgs.nft = ethers.constants.AddressZero;
    taskArgs.nftid = 0;
  } else if (taskArgs.nft == 'RubyFreeSwapNFT') {
    rubyNFTAddr = require(`../../deployments/${network.name}/RubyFreeSwapNFT.json`).address;
    rubyNFT = (await ethers.getContractAt('RubyFreeSwapNFT', rubyNFTAddr)) as RubyNFT;
    taskArgs.nft = rubyNFT.address;
  } else if (taskArgs.nft == 'RubyProfileNFT') {
    rubyNFTAddr = require(`../../deployments/${network.name}/RubyProfileNFT.json`).address;
    rubyNFT = (await ethers.getContractAt('RubyProfileNFT', rubyNFTAddr)) as RubyNFT;
    taskArgs.nft = rubyNFT.address;
  } else {
    throw new Error(`Unknown nft '${taskArgs.nft}'`)
  }

  if ((taskArgs.nft != ethers.constants.AddressZero) && (rubyNFT != undefined)) {

    console.log('Lottery NFT', await rubyNFT.description());

    if (taskArgs.mint == "1") {

      const canMint = await rubyNFT.minters(account.address);
      if (!canMint) {
        console.log('Adding minting permission')
        let tx = await rubyNFT.setMinter(account.address, true);
        await tx.wait();
      }

      console.log('Minting NFT');
      let tx = (await rubyNFT.mint(account.address));
      await tx.wait();

      taskArgs.nftid = (await rubyNFT.nftIds()).toNumber() - 1;
      console.log('Minted NFT ID', taskArgs.nftid);
    }

    console.log('Lottery NFT ID', taskArgs.nftid);

    console.log('Approving Lottery To Spend NFT');
    let tx = (await rubyNFT.approve(factoryAddr, taskArgs.nftid));
    await tx.wait();

  }

  const distObj = JSON.parse(taskArgs.distribution);

  console.log('Creating Lottery...');

  // create the Lottery
  let tx = await factory.createNewLotto(
    taskArgs.collateral,
    taskArgs.nft,
    taskArgs.nftid,
    taskArgs.size,
    taskArgs.price,
    distObj,
    taskArgs.duration);
  await tx.wait();

  console.log('Lottery Created');

  const lottery: Lottery = (await ethers.getContractAt('Lottery', await factory.getCurrentLotto())) as Lottery;
  const info = {
    ID: (await lottery.getID()).toString(),
    ticketCollateral: await lottery.getTicketERC20Symbol(),
    ticketPrice: (await lottery.getTicketPrice()).toString(),
    numTickets: 10 ** (await lottery.getLotterySize()).toNumber(),
    hasNFTPrize: await lottery.hasNFTPrize(),
    prizeDistribution: distObj
  }
  console.log('Lottery Details:')
  console.log(info);
};

task("createLottery", "Create a new Lottery")
  .addParam("collateral")
  .addParam("nft")
  .addParam("nftid")
  .addParam("size")
  .addParam("price")
  .addParam("distribution")
  .addParam("duration")
  .addParam("mint")
  .setAction(async (taskArgs, hre) => {
    await main(taskArgs, hre);
  });
