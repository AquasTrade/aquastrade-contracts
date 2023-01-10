const hre = require("hardhat");

const network = hre.network;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const contracts: any = {
  // contracts not deployed on mainnet yet or for some reason the file names are different
  //  europaBrawl: require(`../../deployments/${network.name}/EuropaBRAWL.json`),
  //  europaSKILL: require(`../../deployments/${network.name}/EuropaSKILL.json`),
  //  faucet: require(`../../deployments/${network.name}/Faucet.json`),


  allowList: require(`../../deployments/${network.name}/AllowList.json`),
  amplificationUtils: require(`../../deployments/${network.name}/AmplificationUtils.json`),

  lotteryBurner_Implementation: require(`../../deployments/${network.name}/LotteryBurner_Implementation.json`),
  lotteryBurner_Proxy: require(`../../deployments/${network.name}/LotteryBurner_Proxy.json`),
  lotteryBurner: require(`../../deployments/${network.name}/LotteryBurner.json`),

  lotteryFactory_Implementation: require(`../../deployments/${network.name}/LotteryFactory_Implementation.json`),
  lotteryFactory_Proxy: require(`../../deployments/${network.name}/LotteryFactory_Proxy.json`),
  lotteryFactory: require(`../../deployments/${network.name}/LotteryFactory.json`),

  lpToken: require(`../../deployments/${network.name}/LPToken.json`),
  multicall2: require(`../../deployments/${network.name}/Multicall2.json`),

  RNG_Skale: require(`../../deployments/${network.name}/RNG_Skale.json`),

  rubyDai: require(`../../deployments/${network.name}/RubyDai.json`),
  rubySKL: require(`../../deployments/${network.name}/RubySKL.json`),
  rubyUSDC: require(`../../deployments/${network.name}/RubyUSDC.json`),
  rubyUSDP: require(`../../deployments/${network.name}/RubyUSDP.json`),
  rubyUSDT: require(`../../deployments/${network.name}/RubyUSDT.json`),
  rubyWBTC: require(`../../deployments/${network.name}/RubyWBTC.json`),
  rubyToken: require(`../../deployments/${network.name}/RubyToken.json`),

  wrapDai: require(`../../deployments/${network.name}/WrapDai.json`),
  wrapSKL: require(`../../deployments/${network.name}/WrapSKL.json`),
  wrapUSDC: require(`../../deployments/${network.name}/WrapUSDC.json`),
  wrapUSDP: require(`../../deployments/${network.name}/WrapUSDP.json`),
  wrapUSDT: require(`../../deployments/${network.name}/WrapUSDT.json`),
  wrapWBTC: require(`../../deployments/${network.name}/WrapWBTC.json`),
  wrapRuby: require(`../../deployments/${network.name}/WrapRuby.json`),

  rubyFreeSwapNFT_Im: require(`../../deployments/${network.name}/RubyDai.json`),

  rubyFreeSwapNFT_Implementation: require(`../../deployments/${network.name}/RubyFreeSwapNFT_Implementation.json`),
  rubyFreeSwapNFT_Proxy: require(`../../deployments/${network.name}/RubyFreeSwapNFT_Proxy.json`),
  rubyFreeSwapNFT: require(`../../deployments/${network.name}/RubyFreeSwapNFT.json`),

  rubyMaker_Implementation: require(`../../deployments/${network.name}/RubyMaker_Implementation.json`),
  rubyMaker_Proxy: require(`../../deployments/${network.name}/RubyMaker_Proxy.json`),
  rubyMaker: require(`../../deployments/${network.name}/RubyMaker.json`),

  rubyMasterChef_Implementation: require(`../../deployments/${network.name}/RubyMasterChef_Implementation.json`),
  rubyMasterChef_Proxy: require(`../../deployments/${network.name}/RubyMasterChef_Proxy.json`),
  rubyMasterChef: require(`../../deployments/${network.name}/RubyMasterChef.json`),

  rubyNFTAdmin_Implementation: require(`../../deployments/${network.name}/RubyNFTAdmin_Implementation.json`),
  rubyNFTAdmin_Proxy: require(`../../deployments/${network.name}/RubyNFTAdmin_Proxy.json`),
  rubyNFTAdmin: require(`../../deployments/${network.name}/RubyNFTAdmin.json`),

  rubyProfileNFT_Implementation: require(`../../deployments/${network.name}/RubyProfileNFT_Implementation.json`),
  rubyProfileNFT_Proxy: require(`../../deployments/${network.name}/RubyProfileNFT_Proxy.json`),
  rubyProfileNFT: require(`../../deployments/${network.name}/RubyProfileNFT.json`),

  rubyProxyAdmin: require(`../../deployments/${network.name}/RubyProxyAdmin.json`),

  rubyRouter_Implementation: require(`../../deployments/${network.name}/RubyRouter_Implementation.json`),
  rubyRouter_Proxy: require(`../../deployments/${network.name}/RubyRouter_Proxy.json`),
  rubyRouter: require(`../../deployments/${network.name}/RubyRouter.json`),

  rubyStaker_Implementation: require(`../../deployments/${network.name}/RubyStaker_Implementation.json`),
  rubyStaker_Proxy: require(`../../deployments/${network.name}/RubyStaker_Proxy.json`),
  rubyStaker: require(`../../deployments/${network.name}/RubyStaker.json`),

  rubyUSD4Pool: require(`../../deployments/${network.name}/RubyUSD4Pool.json`),
  rubyUSD4PoolLP: require(`../../deployments/${network.name}/RubyUSD4PoolLPToken.json`),

  swap: require(`../../deployments/${network.name}/Swap.json`),
  swapDeployer: require(`../../deployments/${network.name}/SwapDeployer.json`),
  swapUtils: require(`../../deployments/${network.name}/SwapUtils.json`),

  uniswapFactory: require(`../../deployments/${network.name}/UniswapV2Factory.json`),

  uniswapV2Router02_Implementation: require(`../../deployments/${network.name}/UniswapV2Router02_Implementation.json`),
  uniswapV2Router02_Proxy: require(`../../deployments/${network.name}/UniswapV2Router02_Proxy.json`),
  uniswapV2Router02: require(`../../deployments/${network.name}/UniswapV2Router02.json`),

}

async function main() {

  console.log('verify contracts');

  for (const i in contracts) {
    const contract = contracts[i];
    const args = contract.args;
    const file_location = contract.storageLayout.storage[0].contract;
    console.log("Verifiy: ", i);
    console.log("  args: -", args + '-');
    console.log("  dest: ", file_location);
    await hre.run("verify:verify", {
      constructorArguments: args,
      address: contract.address,
      contract: file_location
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }).then((res: any) => {
      console.log(" res", res)
      return res;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }).catch((err: any) => {
      console.log(" error with contract: ", contract.address, err, '-------')
    })

  }

};

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });