import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, ethers, getNamedAccounts } = hre;
  const { get } = deployments;
  const { deployer, treasury } = await getNamedAccounts();

  const WINNERS = [
    "0x1c3b1e36fb51923c06084064c8a16042b204423a",
    "0xf45f34330bd4dedac13824e15624d97fbb430183",
    "0xa0545311cac29f6a4c1e48126a76aa891203bd60",
    "0x8dc6477ea473552e4632c0f292a34455a3741091",
    "0x6da35093d7661418dc24606b5d3478cd1e64124d",
    "0xabe99b721ce281c70d03df5a5d23f38c16d7b06a",
    "0xcbb2942037973d54376b61297f77abe461add1ca",
    "0x4bf7db07266896bb7ccdd5c571b19e7e537839b9",
    "0x5f5ea9f524cae330c81f3a2e29ad53610bfd18ea",
    "0x4553ed5d8d3731e629f67bd86abd021175f31848",
  ];

  const freeSwapNFT = await ethers.getContract("freeSwapNFT");

  let mtx;

  for (let addr of WINNERS) {
    mtx = await freeSwapNFT.mint(addr);
    await mtx.wait(1);
    console.log("minted #", (await freeSwapNFT.nftIds()).toNumber() - 1, "to", addr);
  }
};
export default func;

func.dependencies = ["freeSwapNFT"];
func.tags = ["AirdropNFTs"];
