// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";

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

contract AquasPresale is Ownable {
    // ERC20 operations
    using SafeERC20 for IERC20;

    address public presaleOwner; // Changges when listing expires , ?

    address[] public USD; // Changges when listing expires , ?

    // Tokens for sale
    IERC20 public currentTokenSale; // Can be changed after end of listing

    // Price per one token
    uint256 public price;

    // Max Allocation for one wallet
    uint256 public maxAllocation;

    // Variable for hold information about is sale paused or no
    bool public isPaused;

    // Mapping which hold how much bought every wallet
    mapping(address => uint256) public allocations;

    event NewPresale(address token, address creator);

    /**
     * @dev Returns the symbol of the token.
     */
    constructor(address _token, address[] memory _stables) public {
        isPaused = true;
        presaleOwner = msg.sender;
        price = 1 ether;
        maxAllocation = 1000 ether;
        currentTokenSale = IERC20(_token);
        USD = _stables;
    }

    /// @notice Main method for buying Whole tokens
    function buy(address _tokenIn, uint256 _amountIn) external {
        require(!isPaused, "AquasPresale: sale is not active at this moment");
        // check allowed USD addresses
        bool matched = false;
        for (uint256 i = 0; i < USD.length; i++) {
            if (USD[i] == _tokenIn) {
                matched = true;
            }
        }
        if (matched) {
            uint8 normal = 18;
            uint8 decimalQuote = decimals(_tokenIn);
            uint8 mod = normal - decimalQuote;
            require(decimalQuote > 0, "AquasPresale: Missing TokenQuote Decimals");

            uint256 _usdAmount;
            if (mod != 0) {
                _usdAmount = uint256(_amountIn) * uint256(10) ** uint256(mod); // for USDT and USDC 6 decimal support
            } else {
                _usdAmount = _amountIn;
            }

            require(_usdAmount >= price, "AquasPresale: Min, input too small for current presale Price");

            // calculate how many tokens (Full token: not rounded)
            // to send based on the usd value in 18 decimals
            // and price per token in usd value 18 decimals
            uint256 sendAmount = (_usdAmount / price) * uint256(10) ** uint256(decimals(address(currentTokenSale))); // test

            require(sendAmount <= maxAllocation, "AquasPresale: Buy out is too large, Try smaller amount");
            // does contract have enough tokens
            require(currentTokenSale.balanceOf(address(this)) >= sendAmount, "Presale: Presale is Out of Tokens");

            IERC20(_tokenIn).transferFrom(msg.sender, presaleOwner, _amountIn);

            currentTokenSale.safeTransfer(msg.sender, sendAmount);
        }
    }

    /**
     * @dev Returns the symbol of the token.
     */
    function decimals(address _token) public view virtual returns (uint8) {
        return IERC20Metadata(address(_token)).decimals();
    }

    /**
     * @dev anyone can list a token and accept all Stables for that token
     */
    function setToken(address token_) public {
        require(isPaused, "AquasPresale: Must wait for Presale to end");
        isPaused = false;
        presaleOwner = msg.sender; // set new Owner
        emit NewPresale(token_, presaleOwner);
        currentTokenSale = IERC20(token_);
    }

    /// @notice Method for withdraw all tokens for sale from contract
    function withdrawTokens() public {
        require(presaleOwner == _msgSender() || msg.sender == owner(), "AquasPresale: Not your Presale");
        currentTokenSale.safeTransfer(presaleOwner, getTokensBalance());
        isPaused = true;
    }

    /// @notice Method for restart presale auction
    function restartSale() external onlyOwner {
        currentTokenSale.safeTransfer(presaleOwner, getTokensBalance());
        presaleOwner = msg.sender;
        price = 1 ether;
        maxAllocation = 1000 ether;
    }

    /// @notice Changing allocation per one wallet
    function setMaxAllocation(uint256 maxAllocation_) public {
        require(presaleOwner == _msgSender(), "AquasPresale: Not your Presale");
        maxAllocation = maxAllocation_;
    }

    /// @notice Changing price per one token
    function setTokenPrice(uint256 price_) public {
        require(presaleOwner == _msgSender(), "AquasPresale: Not your Presale");
        price = price_;
    }

    /// @notice Method for pause sale (Buying will be not possible until sale will be started)
    function pauseSale() public {
        require(presaleOwner == _msgSender(), "AquasPresale: Not your Presale");
        isPaused = true;
    }

    /// @notice Method for start auction
    function startSale() public {
        require(presaleOwner == _msgSender(), "AquasPresale: Not your Presale");
        isPaused = false;
    }

    /**
     * @dev Returns the symbol of the token.
     */
    function getTokensBalance() public view returns (uint256 balance) {
        balance = currentTokenSale.balanceOf(address(this));
    }
}
