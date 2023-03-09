import { RubyMasterChef } from "../../typechain";

export const addDoubleRewardFarm = async (masterChef: RubyMasterChef, lpTokenAddr: string, allocPoints: number, rewarderAddr: string) => {
    const res = await masterChef.add(allocPoints, lpTokenAddr, rewarderAddr);
    const receipt = await res.wait(1);
  
    console.log(`Adding farm for LP token ${lpTokenAddr} with secondary rewarder ${rewarderAddr}`)
  
    if (receipt.status) {
      console.log('Adding to RubyMasterChef successful');
    } else {
      console.log('Adding to RubyMasterChef failed');
    }
  };
  
  export const addSingleRewardFarm = async (masterChef: RubyMasterChef, lpTokenAddr: string, allocPoints: number) => {
    const zeroAddress = "0x0000000000000000000000000000000000000000";
    await addDoubleRewardFarm(masterChef, lpTokenAddr, allocPoints, zeroAddress);
  };