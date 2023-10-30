const hre = require("hardhat");

const network = hre.network;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const contracts: any = {
 // multicall2: require(`../../deployments/${network.name}/Multicall2.json`),
//  uniswapFactory: require(`../../deployments/${network.name}/UniswapV2Factory.json`),

 // uniswapV2Router02_Implementation: require(`../../deployments/${network.name}/UniswapV2Router02_Implementation.json`),
  uniswapV2Router02_Proxy: require(`../../deployments/${network.name}/UniswapV2Router02_Proxy.json`),
  uniswapV2Router02: require(`../../deployments/${network.name}/UniswapV2Router02.json`),

  /*
rubyFreeSwapNFT_Implementation: require(`../../deployments/${network.name}/RubyFreeSwapNFT_Implementation.json`),
  rubyFreeSwapNFT_Proxy: require(`../../deployments/${network.name}/RubyFreeSwapNFT_Proxy.json`),
  rubyFreeSwapNFT: require(`../../deployments/${network.name}/RubyFreeSwapNFT.json`),

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


*/
};

async function main() {
  console.log("verify contracts");

  for (const i in contracts) {
    const contract = contracts[i];
    const args = contract.args;
    console.log("Verifiy contract: ", contract);
   // const file_location = contract.storageLayout.storage[0].contract;
    console.log("Verifiy: ", i);
    console.log("  args: -", args + "-");
  //  console.log("  dest: ", file_location);
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
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
