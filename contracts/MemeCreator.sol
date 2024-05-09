// SPDX-License-Identifier: GPL-3.0

pragma solidity =0.6.12;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IPairCreator.sol";
import "./amm/interfaces/IUniswapV2Factory.sol";
import "./amm/interfaces/IUniswapV2Router02.sol";
import "./amm/libraries/TransferHelper.sol";

import "./token_mappings/SkaleMappedERC20Token.sol";

// new
import "./interfaces/INFTAdmin.sol";

/*

Deploy ERC20 token and 100% of token supply is used in ADD_liquidty
depending on what nft they hold, depends on the AQUA % 


v0.0.2
0xbB794A1F6C13E604bFEf1b56FbE1e02d1674f4f2

*/

contract MemeCreator is Ownable {
    INFTAdmin public nftAdmin;
    IUniswapV2Factory public factory;
    IUniswapV2Router02 public router;
    SkaleMappedERC20Token public latestToken;
    address public AQUA;
    address public rubyStaker;
    uint256 public baseBalance;
    address public dEAD = 0x0000000000000000000000000000000000000000;

    constructor(address _router, address _factory, address _baseToken, INFTAdmin _nftAdmin) public {
        require(_factory != address(0), "DAOPairCreator: INVALID_INIT_ARG");
        require(_router != address(0), "DAOPairCreator: INVALID_INIT_ARG");
        require(_baseToken != address(0), "DAOPairCreator: INVALID_INIT_ARG");
        require(address(_nftAdmin) != address(0), "UniswapV2: INVALID_INIT_ARG");

        factory = IUniswapV2Factory(_factory);
        router = IUniswapV2Router02(_router);
        AQUA = _baseToken;
        nftAdmin = _nftAdmin;
        baseBalance = 5000 ether;
    }

    function setBaseAmount(uint256 _baseAmount) external onlyOwner {
        baseBalance = _baseAmount * 10 ** 18;
    }

    // Deploy erc20 token
    function deployToken(
        string memory _name,
        string memory _symbol,
        uint8 _decimal,
        uint256 _totalSupply
    ) public returns (uint256 amountA, uint256 amountB, uint256 liquidity) {
        authorized(msg.sender);
        //deploy token
        latestToken = new SkaleMappedERC20Token(_name, _symbol, _decimal);
        // Mint
        address _tokenAddress = address(latestToken);
        uint256 _amountMod = _totalSupply * uint256(10) ** uint256(_decimal);
        latestToken.mint(address(this), _amountMod);

        // gold 30x , 10x silver , bronze 1x Min_AQUA
        uint256 nft = nftAdmin.calculateAmmSwapFeeDeduction(msg.sender);
        uint256 multi = baseBalance;
        if (nft == 1000) {
            multi = 30 * baseBalance;
        }
        if (nft == 999) {
            multi = 10 * baseBalance;
        }

        uint256 amountADesired = IERC20(address(latestToken)).balanceOf(address(this));
        uint256 amountBDesired = multi;

        factory.createPair(_tokenAddress, AQUA);

        TransferHelper.safeApprove(_tokenAddress, address(router), _amountMod);
        TransferHelper.safeApprove(AQUA, address(router), multi);
        (amountA, amountB, liquidity) = router.addLiquidity(
            _tokenAddress,
            AQUA,
            amountADesired,
            amountBDesired,
            0,
            0,
            dEAD,
            block.timestamp
        );
        if (amountADesired > amountA) TransferHelper.safeTransfer(_tokenAddress, dEAD, amountADesired - amountA);
        if (amountBDesired > amountB) TransferHelper.safeTransfer(AQUA, dEAD, amountBDesired - amountB);
        TransferHelper.safeApprove(_tokenAddress, address(router), 0);
        TransferHelper.safeApprove(AQUA, address(router), 0);
    }

    function authorized(address user) public view returns (bool) {
        //uint256 aqua =   IERC20(address(AQUA)).balanceOf(user);
        uint256 wallet = nftAdmin.calculateAmmSwapFeeDeduction(user);
        require(wallet > 997, "USER NOT NFT HOLDER ");
        return true;
    }
}
