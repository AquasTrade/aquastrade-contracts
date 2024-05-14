// SPDX-License-Identifier: MIT

//SPDX-License-Identifier: Unlicense
pragma solidity ^0.6.12;

/**
 * @title ERC20 interface
 * @dev see https://eips.ethereum.org/EIPS/eip-20
 */
interface IERC20 {
    function transfer(address to, uint256 value) external returns (bool);

    function approve(address spender, uint256 value) external returns (bool);

    function transferFrom(address from, address to, uint256 value) external returns (bool);

    function totalSupply() external view returns (uint256);

    function balanceOf(address who) external view returns (uint256);

    function allowance(address owner, address spender) external view returns (uint256);

    event Transfer(address indexed from, address indexed to, uint256 value);

    event Approval(address indexed owner, address indexed spender, uint256 value);
}

/**
 * @title ERC20 Airdrop dapp smart contract
 */
contract AquasTradeAirdrop {
      address public Aqua;
       address private admin;
  IERC20 public LastAirDropToken;


      constructor(
        address _aqua
    ) public payable {
        require(_aqua != address(0), "AquasTradeAirdrop: Invalid  address");
        Aqua = _aqua;
         admin = msg.sender;
    }

  /**
   * @dev doAirdrop is the main method for distribution
   * @param tokenAddress address ERC20 token to airdrop
   * @param addresses address[] addresses to airdrop
   * @param values address[] values for each address
   */
  function doAirdrop(address tokenAddress, address[] calldata addresses, uint256 [] calldata values) external returns (uint256) {
    uint256 i = 0;
    LastAirDropToken = IERC20(tokenAddress);
    while (i < addresses.length) {
      LastAirDropToken.transferFrom(msg.sender, addresses[i], values[i]);
      i += 1;
    }
    return i;
  }

   function withdraw() public  {
     uint256 amount = LastAirDropToken.balanceOf(address(this));
        require(amount >= 0, " No funds in Airdrop");
        require(msg.sender == admin, " Not admin");
        LastAirDropToken.transfer(msg.sender, amount);
    }

    
}