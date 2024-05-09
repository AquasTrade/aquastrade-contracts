// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

import "hardhat/console.sol";
import "../interfaces/INFT.sol";
import "../token_mappings/AQUA.sol";
import "../amm/interfaces/IUniswapV2Router02.sol";
import "../amm/interfaces/IUniswapV2Factory.sol";

interface IERC20Metadata is IERC20 {
    /**
     * @dev Returns the name of the token.
     */
    function name() external view returns (string memory);

    /**
     * @dev Returns the symbol of the token.
     */
    function symbol() external view returns (string memory);

    /**
     * @dev Returns the decimals places of the token.
     */
    function decimals() external view returns (uint8);
}

/*

working 


v0.2.1 : working on getPrices : consumeFeed
0xF0C811ED700D02274E6d059b26d045edB79B70Ee

v0.2.2 : working on getPrices : consumeFeeds
0x012D95449F3FE5E9263A2bA75406b78e83546510

add updateFeeds ( pass in a fat array of tickers and gog og ogogogogog )

ok whats next?  How about getting the TVL of EuropaHUB for the Frontend ? because now I can calculate pricing 

ETHC - BTC 
Stables 

Exotics 
SKL + RUBY + AQUA + SKILL etc 

*/

contract AquasFeed is Ownable {
    using Counters for Counters.Counter;
    Counters.Counter public _itemCounter; // change this to private
    struct Feed {
        uint256 id;
        address router;
        address pool;
        address quote;
        address base;
        uint256 priceFeed;
        uint256 pricePool;
    }

    mapping(uint256 => Feed) public Feeds;

    address[] private pathSell;

    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    address public NFTAddress; // Set erc721 collection
    address public UNISWAP_V2_ROUTER;
    address public UNISWAP_V2_FACTORY;
    uint256 public FeedID; // storage length : starts at 0
    uint256 public FeedMaximum; // should match the amm pools length

    mapping(uint256 => uint256) private DataFeedPrice; // Last recommended price for AMM POOL from oracle
    mapping(uint256 => uint256) private PoolPrice; // Last price from actual AMM POOL

    mapping(uint256 => address) public PoolAddresses; // AMM POOL ADDRESSES
    mapping(uint256 => address) public PoolAssetQuote; // Quote and Base asset for fetching decimals
    mapping(uint256 => address) public PoolAssetBase; // Quote and Base asset for fetching decimals

    event NewDataFeed(uint256 _index, address _pool);
    event NewPool(uint256 _index, address _pool);

    constructor(address _router, address _factory, address _nft) public {
        UNISWAP_V2_ROUTER = _router;
        UNISWAP_V2_FACTORY = _factory;
        NFTAddress = _nft;
        FeedID = 0;
        FeedMaximum = IUniswapV2Factory(UNISWAP_V2_FACTORY).allPairsLength();
    }

    function setNftAddress(address newAddress) external onlyOwner {
        require(address(newAddress) != address(0), "AquasFeed: newNFT Address");
        NFTAddress = newAddress;
    }

    // pass in the uniswap factory Pool address . pair.sol
    // token A Quote Asset
    // token B Base Asset
    function addDataFeed(address _ammPoolAddress, address newTokenQuote, address newTokenBase) public {
        require(address(_ammPoolAddress) != address(0), "AquasFeed: Requires New DataFeed Address");

        // make sure the datafeed doesn't already exist
        for (uint256 i = 0; i <= FeedID; i++) {
            if (PoolAddresses[i] == _ammPoolAddress) {
                // match : datafeed exists, break return
                return;
            }
        }
        // only nft holders can add PoolAddresses
        bool NFT = false;
        if (address(NFTAddress) != address(0)) {
            if (INFT(NFTAddress).balanceOf(msg.sender) > 0) {
                NFT = true;
            }
        }

        uint256 poolLength = IUniswapV2Factory(UNISWAP_V2_FACTORY).allPairsLength();

        // make sure the pool address exists and matches the requested new DataFeed
        bool poolExist = false;
        for (uint256 i = 0; i < poolLength; i++) {
            address pool = IUniswapV2Factory(UNISWAP_V2_FACTORY).allPairs(i);
            if (_ammPoolAddress == pool) {
                poolExist = true;
            }
            // doesn't exist
        }

        // ok, if NFT owner== true and dataFeed doesn't exist , time to make new dataFeed

        if (NFT && poolExist) {
            PoolAddresses[FeedID] = _ammPoolAddress;
            PoolAssetQuote[FeedID] = newTokenQuote;
            PoolAssetBase[FeedID] = newTokenBase;
            emit NewDataFeed(FeedID, _ammPoolAddress);
            _getAndUpdatePoolPrice(newTokenQuote, newTokenBase);
            FeedID++;
        }

        // make pool
        address newPool;
        if (!poolExist && NFT) {
            newPool = IUniswapV2Factory(UNISWAP_V2_FACTORY).createPair(newTokenQuote, newTokenBase);
        }
        // make new datafeed with new pool address : Requested market didn't exist
        if (NFT && !poolExist) {
            PoolAddresses[FeedID] = newPool;
            PoolAssetQuote[FeedID] = newTokenQuote;
            PoolAssetBase[FeedID] = newTokenBase;
            emit NewDataFeed(FeedID, newPool);
            emit NewPool(poolLength + 1, newPool);

            FeedID++;
        }

        FeedMaximum = IUniswapV2Factory(UNISWAP_V2_FACTORY).allPairsLength();

        // created new amm pool if didn't exist
        // created new datafeed  object
        // updated FeedIDs and FeedMaximum

        _makeFeed();
    }

    function _makeFeed() internal {
        // Test
        uint256 itemCounter = _itemCounter.current();
        _itemCounter.increment();

        Feeds[itemCounter] = Feed({
            id: itemCounter,
            router: UNISWAP_V2_ROUTER,
            pool: PoolAddresses[itemCounter],
            quote: PoolAssetQuote[itemCounter],
            base: PoolAssetBase[itemCounter],
            priceFeed: getPriceWithIndex(itemCounter),
            pricePool: getPoolPriceWithIndex(itemCounter)
        });
    }

    function decimals(address _token) public view virtual returns (uint8) {
        return IERC20Metadata(address(_token)).decimals();
    }

    function getPriceWithIndex(uint256 _dataFeedIndex) public view returns (uint256 _price) {
        require(_dataFeedIndex <= FeedID, "AquasFeed: Missing FeedID");
        _price = DataFeedPrice[_dataFeedIndex];
        return _price;
    }

    function getPriceWithAddress(address _poolAddress) external view returns (uint256 _price) {
        for (uint256 i = 0; i <= FeedID; i++) {
            if (PoolAddresses[i] == _poolAddress) {
                return DataFeedPrice[i];
            }
        }
    }

    function getPoolPriceWithIndex(uint256 _dataFeedIndex) public view returns (uint256 _price) {
        require(_dataFeedIndex <= FeedID, "AquasFeed: Missing FeedID");
        _price = PoolPrice[_dataFeedIndex];
        return _price;
    }

    function getPoolPriceWithAddress(address _poolAddress) external view returns (uint256 _price) {
        for (uint256 i = 0; i <= FeedID; i++) {
            if (PoolAddresses[i] == _poolAddress) {
                return PoolPrice[i];
            }
        }
    }

    function consumeFeed(uint256 _feedID) external view returns (Feed memory) {
        return Feeds[_feedID];
    }

    function consumeFeeds() public view returns (Feed[] memory) {
        uint256 itemCounter = _itemCounter.current();
        Feed[] memory _items = new Feed[](itemCounter);
        for (uint256 i = 0; i < itemCounter; i++) {
            // todo : double check this.  maybe this should be zero <= and not <
            Feed memory item = Feeds[i];
            //   if (item.listing) {
            _items[i] = item;
            //  }
        }
        return _items;
    }

    function updateFeed(uint256 _dataFeedIndex, uint256 _price) external onlyOwner {
        require(_dataFeedIndex <= FeedID, "AquasFeed: Missing FeedID");
        require(_price > 0, "AquasFeed: Incorrect Input Price");
        DataFeedPrice[_dataFeedIndex] = _price;
        _updatePoolFeed(_dataFeedIndex);
    }

    // Update all DataFeeds
    function updateFeeds(uint256[] memory _price) external onlyOwner {
        require(_price.length == FeedID, "AquasFeed: Incorrect Price.Length!=FeedID");
        for (uint256 i = 0; i < FeedID; i++) {
            // FeedID starts at index 1
            DataFeedPrice[i] = _price[i]; // starts at zero index
            _updatePoolFeed(i);
        }
    }

    function _updatePoolFeed(uint256 _dataFeedIndex) internal {
        _getAndUpdatePoolPrice(PoolAssetQuote[_dataFeedIndex], PoolAssetBase[_dataFeedIndex]);
        // Leave this alone shince this is only updaing the values
        Feeds[_dataFeedIndex] = Feed({
            id: _dataFeedIndex,
            router: UNISWAP_V2_ROUTER,
            pool: PoolAddresses[_dataFeedIndex],
            quote: PoolAssetQuote[_dataFeedIndex],
            base: PoolAssetBase[_dataFeedIndex],
            priceFeed: getPriceWithIndex(_dataFeedIndex),
            pricePool: getPoolPriceWithIndex(_dataFeedIndex)
        });
    }

    function _getAndUpdatePoolPrice(address _tokenQuote, address _tokenBase) internal {
        uint256 min = 1000;
        uint256 _amountIn = 1e18;
        uint8 decimalQuote = decimals(_tokenQuote);
        uint8 one = 1;
        uint8 ten = 10;
        require(decimalQuote > 0, "AquasFeed: Missing TokenQuote Decimals");

        // todo bug
        if (decimalQuote != 18) {
            //   _amountIn = uint256(one * ten ** decimalQuote);// didn't work
            _amountIn = uint256(one) * uint256(ten) ** uint256(decimalQuote); // test
            //  _amountIn << one * ten ** decimalQuote;// test next
        }
        require(_amountIn >= min, "AquasFeed: Missing TokenQuote Input Amounts");

        bool matched = false;

        address pool = IUniswapV2Factory(UNISWAP_V2_FACTORY).getPair(_tokenQuote, _tokenBase);

        uint256 found;
        for (uint256 i = 0; i <= FeedID; i++) {
            if (pool == PoolAddresses[i]) {
                matched = true;
                found = i;
            }
        }

        if (matched) {
            // sell route : Selling 1 QUOTE asset and see how much asset Base is returned
            pathSell = new address[](2);
            pathSell[0] = _tokenQuote;
            pathSell[1] = _tokenBase;

            // idea
            // amountIN is reduced 1000x and the output is increased 1000x (better price precision for btc and eth)
            uint256 reduceInputAmount = _amountIn.div(min);

            if (reduceInputAmount > 0) {
                uint256[] memory amountOutMins = IUniswapV2Router02(UNISWAP_V2_ROUTER).getAmountsOut(
                    reduceInputAmount,
                    pathSell,
                    997
                );
                uint256 output = amountOutMins[pathSell.length - 1];
                output = output.mul(min);
                PoolPrice[found] = output;
            }
        }
        matched = false; // reentry
    }

    // New Ideas
    function europaUSDTVL() external view returns (uint256 _stableTVL, uint256 _majorTVL, uint256 _minorTVL) {
        require(FeedID >= 4, "AquasFeed: Missing FeedIDs");

        uint256 usdc = IERC20(PoolAssetQuote[0]).totalSupply() * 10 ** 12;
        uint256 usdt = IERC20(PoolAssetQuote[1]).totalSupply() * 10 ** 12;

        uint256 usdp = IERC20(PoolAssetQuote[2]).totalSupply();
        uint256 dai = IERC20(PoolAssetQuote[3]).totalSupply();

        _stableTVL = usdp + dai + usdc + usdt;
        _majorTVL = usdp + dai;
        _minorTVL = usdc + usdt;

        return (_stableTVL, _majorTVL, _minorTVL);
    }

    function europaMAJORTVL() external view returns (uint256 _majorTVL) {
        require(FeedID >= 6, "AquasFeed: Missing FeedIDs");
        uint256 btc = IERC20(PoolAssetQuote[4]).totalSupply() * 10 ** 10; // BTC
        uint256 eth = IERC20(PoolAssetQuote[5]).totalSupply(); // ETH
        uint256 skl = IERC20(PoolAssetQuote[6]).totalSupply(); // SKL
        uint256 btc_tvl = btc * getPoolPriceWithIndex(4);
        uint256 eth_tvl = eth * getPoolPriceWithIndex(5);
        uint256 skl_tvl = skl * getPoolPriceWithIndex(6);
        _majorTVL = btc_tvl + eth_tvl + skl_tvl;
        return (_majorTVL);
    }

    function europaMINORTVL() external view returns (uint256 _majorTVL) {
        require(FeedID >= 6, "AquasFeed: Missing FeedIDs");

        uint256 btc = IERC20(PoolAssetQuote[4]).totalSupply() * 10 ** 10; // BTC
        uint256 eth = IERC20(PoolAssetQuote[5]).totalSupply(); // ETH

        // Get the prices.   and do the math
        //
        uint256 btc_tvl = btc * getPoolPriceWithIndex(4);
        uint256 eth_tvl = eth * getPoolPriceWithIndex(5);

        _majorTVL = btc_tvl + eth_tvl;

        return (_majorTVL);
    }
}
