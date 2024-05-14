// npx hardhat run scripts/verify/verifyRubyContracts.ts --network europa
const hre = require("hardhat");
const network = hre.network;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const contracts: any = {
  // 2024 march recheck
  // yes
  /*
   rubyRouter_Implementation: require(`../../deployments/${network.name}/AquasRouter_Implementation.json`),
     rubyFreeSwapNFT_Implementation: require(`../../deployments/${network.name}/BronzeSwapNFT_Implementation.json`),
  rubyFreeSwapNFT_Proxy: require(`../../deployments/${network.name}/BronzeSwapNFT_Proxy.json`),
   marketplace: require(`../../deployments/${network.name}/CoinFlip.json`),
    multicall2: require(`../../deployments/${network.name}/Multicall2.json`),
     uniswapV2Router02_Implementation: require(`../../deployments/${network.name}/UniswapV2Router02_Implementation.json`),
  uniswapV2Router02_Proxy: require(`../../deployments/${network.name}/UniswapV2Router02_Proxy.json`),

  rubyNFTAdmin_Implementation: require(`../../deployments/${network.name}/NFTAdmin_Implementation.json`),
  rubyNFTAdmin_Proxy: require(`../../deployments/${network.name}/NFTAdmin_Proxy.json`),

  rubyProfileNFT_Implementation: require(`../../deployments/${network.name}/ProfileNFT_Implementation.json`),
  rubyProfileNFT_Proxy: require(`../../deployments/${network.name}/ProfileNFT_Proxy.json`),
  */

  // aqua: require(`../../deployments/${network.name}/AQUA.json`),

  //faucet: require(`../../deployments/${network.name}/FaucetEuropa.json`),
  //dca: require(`../../deployments/${network.name}/AquasDCA.json`),
  //dca: require(`../../deployments/${network.name}/AquasDCAMulti.json`),

  presale: require(`../../deployments/${network.name}/AquasPresale.json`),

  // oracle: require(`../../deployments/${network.name}/AquasOracle.json`),

  //feed: require(`../../deployments/${network.name}/AquasFeed.json`),

  // meme: require(`../../deployments/${network.name}/MemeCreator.json`),

  //airdrop: require(`../../deployments/${network.name}/AquasTradeAirdrop.json`),
  //aqua_flip: require(`../../deployments/${network.name}/CoinFlip.json`),
  //rng: require(`../../deployments/${network.name}/RNG_CoinFlip.json`),
  /*
 flip: require(`../../deployments/${network.name}/CoinFlipSKL.json`),
  rubyRouter_Proxy: require(`../../deployments/${network.name}/AquasRouter_Proxy.json`),
  SilverSwapNFT: require(`../../deployments/${network.name}/SilverSwapNFT.json`),
  AquasRouter: require(`../../deployments/${network.name}/AquasRouter.json`),
  uniswapFactory: require(`../../deployments/${network.name}/UniswapV2Factory.json`),
  uniswapV2Router02: require(`../../deployments/${network.name}/UniswapV2Router02.json`),

  rubyNFTAdmin: require(`../../deployments/${network.name}/NFTAdmin.json`),
  rubyProfileNFT: require(`../../deployments/${network.name}/ProfileNFT.json`),

  rubyProxyAdmin: require(`../../deployments/${network.name}/RubyProxyAdmin.json`),

*/
};

async function main() {
  console.log("verify contracts");

  for (const i in contracts) {
    const contract = contracts[i];
    const args = contract?.args;
    console.log("Verifiy contract: ", contract);
    // const file_location = contract.storageLayout.storage[0].contract;
    console.log("Verifiy: ", i);
    console.log("  args: -", typeof args, args + "-");
    //  console.log("  dest: ", file_location);

    if (args) {
      await hre
        .run("verify:verify", {
          constructorArguments: args,
          address: contract.address,
          //    contract: file_location,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        })
        .then((res: any) => {
          console.log(" res", res);
          return res;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        })

        .catch((err: any) => {
          console.log(" error with contract: ", contract.address, err, "-------");
        });
    }

    if (!args) {
      await hre
        .run("verify:verify", {
          address: contract.address,
          //    contract: file_location,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        })
        .then((res: any) => {
          console.log(" res", res);
          return res;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        })

        .catch((err: any) => {
          console.log(" error with contract: ", contract.address, err, "-------");
        });
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    //  process.exit(1);
  });
