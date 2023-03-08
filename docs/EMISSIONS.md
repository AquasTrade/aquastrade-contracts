# prereq
- double check pool id and allocation point values
- emission rates are in priced in ```wei``` 
```npx hardhat run scripts/debugging/getfarminfo.ts --network rubyNewChain```

# adjust RUBY emissions
- adjust: ```const HUMAN_AMOUNT = "15";``` then run,

```npx hardhat run scripts/emissions/adjustEmissionRate.ts --network rubyNewChain```

# adjust Farm pool emissions
- adjust : 
```
const pool_id = 0;
const allocation_points = 250;
``` 
then run,
```npx hardhat run scripts/emissions/adjustPoolEmissionRate.ts --network rubyNewChain```

# Dual Reward contracts and emissions
- adjust ```poolName``` and ```amount```

```npx hardhat run scripts/emissions/adjustDualRewards.ts --network rubyNewChain```



