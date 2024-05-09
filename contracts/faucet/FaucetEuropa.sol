// SPDX-License-Identifier: MIT
import "@openzeppelin/contracts/access/Ownable.sol";

pragma solidity 0.6.12;

contract FaucetEuropa is Ownable {
    uint256 public constant MINT_AMOUNT_ETH = 0.0001 ether;

    event NewUser(address indexed src);
    event RefillUser(address indexed src);

    constructor() public payable {}

    receive() external payable {}

    fallback() external payable {}

    // wording should be transferAmount or transferFuel ,
    function transferSFUEL(address payable receiver) external {
      
        // balance of the smart contract
        uint256 bal = address(this).balance;
        uint256 user = receiver.balance;
        // Top up to MINT_AMOUNT_ETH
        if (user < MINT_AMOUNT_ETH) {
            uint256 amount = MINT_AMOUNT_ETH - user;
            if (amount <= bal) {
                receiver.transfer(amount);
                if (user == 0) {
                    emit NewUser(receiver);
                } else {
                    emit RefillUser(receiver);
                }
            }
        }
    }

    function withdraw() public onlyOwner {
        msg.sender.transfer(address(this).balance);
    }
}
