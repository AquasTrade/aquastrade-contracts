// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

contract Errors {
    error ZeroData();
    error ZeroAddress();
    error ZeroSrcAmount();
    error ZeroDestAmount();
    error ReturnAmountIsNotEnough();
    error ReturnAmountIsNotEqual();
    error InvalidMsgValue();
    error HasBeenStopped();
}

// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

abstract contract EthReceiver {
    error EthDepositRejected();

    receive() external payable {
        //_receive();
    }
    
    function _receive() internal virtual {
        // solhint-disable-next-line avoid-tx-origin
        if (msg.sender == tx.origin) revert EthDepositRejected();
    }
}



// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

import "./libraries/PitERC20.sol";
import "./EthReceiver.sol";
import "./errors/Errors.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

interface IDaiLikePermit {
    function permit(
        address holder,
        address spender,
        uint256 nonce,
        uint256 expiry,
        bool allowed,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external;
}

interface IERC20MetadataUppercase {
    function NAME() external view returns (string memory); // solhint-disable-line func-name-mixedcase

    function SYMBOL() external view returns (string memory); // solhint-disable-line func-name-mixedcase
}

interface IPermit2 {
    struct PermitDetails {
        // ERC20 token address
        address token;
        // the maximum amount allowed to spend
        uint160 amount;
        // timestamp at which a spender's token allowances become invalid
        uint48 expiration;
        // an incrementing value indexed per owner,token,and spender for each signature
        uint48 nonce;
    }
    /// @notice The permit message signed for a single token allownce
    struct PermitSingle {
        // the permit data for a single token alownce
        PermitDetails details;
        // address permissioned on the allowed tokens
        address spender;
        // deadline on the permit signature
        uint256 sigDeadline;
    }
    /// @notice Packed allowance
    struct PackedAllowance {
        // amount allowed
        uint160 amount;
        // permission expiry
        uint48 expiration;
        // an incrementing value indexed per owner,token,and spender for each signature
        uint48 nonce;
    }

    function transferFrom(address user, address spender, uint160 amount, address token) external;

    function permit(address owner, PermitSingle memory permitSingle, bytes calldata signature) external;

    function allowance(address user, address token, address spender) external view returns (PackedAllowance memory);
}

interface IWETH is IERC20 {
    event Deposit(address indexed dst, uint wad);

    event Withdrawal(address indexed src, uint wad);

    function deposit() external payable;

    function withdraw(uint256 amount) external;
}

interface ISwapManager {
    function swap(bytes calldata data) external payable returns (uint256);
}

contract PiteasRouter is Ownable, EthReceiver {
    using PitERC20 for IERC20;
    using SafeMath for uint256;

    bool private status = true;
    address private swapManager;

    struct Detail {
        IERC20 srcToken;
        IERC20 destToken;
        address payable destAccount;
        uint256 srcAmount;
        uint256 destMinAmount;
    }

    event ChangedStatus(bool indexed status);
    event ChangedSwapManager(address indexed manager);
    event SwapEvent(
        address swapManager,
        IERC20 srcToken,
        IERC20 destToken,
        address indexed sender,
        address destReceiver,
        uint256 srcAmount,
        uint256 destAmount
    );

    modifier checkStatus() {
        if (status == false) {
            revert Errors.HasBeenStopped();
        }
        _;
    }

    function swap(Detail memory detail, bytes calldata data) public payable checkStatus returns (uint256 returnAmount)  {
        if (detail.srcAmount == 0) revert Errors.ZeroSrcAmount();
        if (detail.destMinAmount == 0) revert Errors.ZeroDestAmount();
        if (data.length == 0) revert Errors.ZeroData();

        IERC20 srcToken = detail.srcToken;
        IERC20 destToken = detail.destToken;
       
        bool srcETH = srcToken.isETH();
        if (msg.value < (srcETH ? detail.srcAmount : 0)) revert Errors.InvalidMsgValue();

        uint256 beginBalance = destToken.pbalanceOf(address(this));
        srcToken.execute(payable(msg.sender), swapManager, detail.srcAmount, data);
        returnAmount = destToken.pbalanceOf(address(this)).sub(beginBalance,"Error");
        
        address payable destReceiver = (detail.destAccount == address(0)) ? payable(msg.sender) : detail.destAccount;
        
        if (returnAmount >= detail.destMinAmount) {
            destToken.pTransfer(destReceiver, returnAmount);
        }else{
            revert Errors.ReturnAmountIsNotEnough();
        }

        emit SwapEvent(address(swapManager), srcToken, destToken, msg.sender, destReceiver, detail.srcAmount, returnAmount);
    }
    
    function changeStatus(bool _status) external onlyOwner {
        status = _status;
        emit ChangedStatus(_status);
    }

    function changeSwapManager(address _manager) external onlyOwner {
        if (_manager == address(0)) {
            revert Errors.ZeroAddress();
        }
        swapManager = _manager;
        emit ChangedSwapManager(_manager);
    }

    function withdrawFunds(IERC20 token, uint256 amount) external onlyOwner {
        token.pTransfer(payable(msg.sender), amount);
    }
}