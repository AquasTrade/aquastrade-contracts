// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;
// Imported OZ helper contracts
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
// Inherited allowing for ownership of contract
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "./IRandomNumberGenerator.sol";
import "./Testable.sol";
import "./Timer.sol";
import "../interfaces/IRubyNFT.sol";
// Safe math 
import "hardhat/console.sol";

// TODO rename to Lottery when done
contract Lottery is Ownable, Testable, Pausable {
    // Libraries
    // Safe math
    using SafeMath for uint256;
    // Safe ERC20
    using SafeERC20 for IERC20;
    // Address functionality 
    using Address for address;
    uint256 private constant MAX_WINNERS = 10;

    address private factory;
    // Instance of Ruby token (collateral currency for lotto)
    IERC20 private ruby;
    IRandomNumberGenerator internal RNG;
    IRubyNFT private nft;
    uint256 private bonusTokenId;

    uint256 private startingTimestamp;
    uint256 private closingTimestamp;
    uint256 private lotterySize;
    uint256 private winnersSize;
    uint256 private rubyTotal;
    uint256[] private winners;
    uint256 private ticketPrice;
    uint256[] private prizeDistribution;

    mapping (uint256 => address) private tickets;
    mapping (uint256 => uint256) private visited;
    uint256 private count;

    event NewTickets(uint256 ticketSize, uint256[] _choosenTicketNumbers);
    event DrewWinningNumber(uint256[] _winners);
    event RewardClaimed(address to);

    constructor (address _timer, address _factory, address _ruby, address _nft, uint256 _bonusTokenId, uint256 _lotterySize, uint256 _ticketPrice, uint256[] memory _prizeDistribution /*first, second, ..., last, treasury*/, uint256 _duration, address _RNG) 
      Testable (_timer)
      public {
    	require(
          _ruby != address(0),
          "Ruby cannot be 0 address"
      );
      require(
          _factory != address(0),
          "Factory cannot be 0 address"
      );
      require(
          _nft != address(0),
          "Nft cannot be 0 address"
      );
      require(
          _RNG != address(0),
          "Random Number Generator cannot be 0 address"
      );
    	require(
          _prizeDistribution.length >= 2,
          "Invalid distribution"
      );
      require(
          _prizeDistribution.length <= MAX_WINNERS + 1,
          "Invalid distribution"
      );
      winnersSize = uint256(_prizeDistribution.length - 1);
    	uint256 prizeDistributionTotal = 0;
      for (uint256 j = 0; j < _prizeDistribution.length; j++) {
          prizeDistributionTotal = prizeDistributionTotal.add(
              uint256(_prizeDistribution[j])
          );
      }
      // Ensuring that prize distribution total is 100%
      require(
          prizeDistributionTotal == 100,
          "Prize distribution is not 100%"
      );
      count = 1;
      factory = _factory;
      ruby = IERC20(_ruby);
      RNG = IRandomNumberGenerator(_RNG);
      nft = IRubyNFT(_nft);
      bonusTokenId = _bonusTokenId;

      ticketPrice = _ticketPrice;
    	lotterySize = _lotterySize;
    	startingTimestamp = getCurrentTime();
    	closingTimestamp = startingTimestamp + _duration;
    	prizeDistribution = _prizeDistribution;
    }

    modifier opened() {
      require(getCurrentTime() >= startingTimestamp, "Ticket selling is not yet started");
      require(getCurrentTime() < closingTimestamp, "Ticket selling is closed");
      _;
    }
    modifier closed() {
      require(getCurrentTime() >= closingTimestamp, "Ticket selling is not yet closed");
      _;
    }
    modifier drew() {
    	require(winners.length == winnersSize, "Winning Numbers not chosen yet");
      _;
    }

    function pause() external onlyOwner() {
      _pause();
    }

    function unpause() external onlyOwner() {
      _unpause();
    }

    function buyTicket(uint256 _ticketSize, uint256[] calldata _choosenTicketNumbers) external opened() whenNotPaused() {
    	// Ensuring that there are the right amount of chosen numbers
      require(
          _choosenTicketNumbers.length == _ticketSize,
          "Invalid chosen numbers"
      );
      count = count + 1;
      for (uint256 i = 0; i < _choosenTicketNumbers.length; i++) {
      	require(_choosenTicketNumbers[i] < uint256(10) ** lotterySize, "Ticket Number is out of range");
      	require(tickets[_choosenTicketNumbers[i]] == address(0), "Ticket Number is already exist");
      	require(visited[_choosenTicketNumbers[i]] != count, "Requested Ticket Numbers are not unique");
      	visited[_choosenTicketNumbers[i]] = count;
      }
      uint256 totalCost =  uint256(_ticketSize).mul(ticketPrice);
      ruby.transferFrom(
          msg.sender, 
          address(this), 
          totalCost
      );
      rubyTotal = rubyTotal.add(totalCost);
    	for (uint256 i = 0; i < _choosenTicketNumbers.length; i++) {
    		tickets[_choosenTicketNumbers[i]] = msg.sender;
    	}
    	emit NewTickets(_ticketSize, _choosenTicketNumbers);
    }

    function drawWinningNumbers() external closed() onlyOwner() {
    	require(winners.length == 0, "Have already drawn the winning number");
    	winners = new uint256[](winnersSize);
    	for (uint256 i = 0; i < winnersSize; i++) {
    		for (;;) {
	    		uint256 value = RNG.getRandomNumber(lotterySize);
	    		uint256 j;
	    		for (j = 0; j < i; j++) if (winners[j] == value) break;
	    		if (j == i) {
	    			winners[i] = value;
	    			break;
	    		}
	    	}
    	}
    	emit DrewWinningNumber(winners);
    }

    function withdraw(uint256 _amount) external drew() onlyOwner() {
      ruby.safeTransfer(
          msg.sender, 
          _amount
      );
    }

    function getRewardAmount() external view drew() returns (uint256) {
    	uint256 prize = 0;
    	for (uint256 i = 0; i < winnersSize; i++) {
    		uint256 winner = winners[i];
    		address winAddress = tickets[winner];
    		if (winAddress == msg.sender) prize = prize.add(rubyTotal.mul(prizeDistribution[i]).div(100));
    	}
    	return prize;
    }

    function getRewardNFT() external view drew() returns(bool) {
    	if (tickets[winners[0]] == msg.sender) return true;
    	return false;
    }

    function claimReward() external closed() drew() {
    	uint256 prize = 0;
      if (tickets[winners[0]] == msg.sender) nft.safeTransferFrom(address(this), msg.sender, bonusTokenId);
    	for (uint256 i = 0; i < winnersSize; i++) {
    		uint256 winner = winners[i];
    		address winAddress = tickets[winner];
    		if (winAddress == msg.sender) {
    			tickets[winner] = address(0);
    			prize = prize.add(rubyTotal.mul(prizeDistribution[i]).div(100));
    		}
    	}
    	ruby.transfer(address(msg.sender), prize);
    	emit RewardClaimed(msg.sender);
    }

    function costToBuyTickets(uint256 _ticketSize) external view returns(uint256) {
      return ticketPrice * _ticketSize;
    }

    function getWinningNumbers() external view drew() returns (uint256[] memory) {
      return winners;
    }

    function setTicketPrice(uint256 _price) external onlyOwner() {
        ticketPrice = _price;
    }
    function setStartingTimestamp(uint256 _time) external onlyOwner() {
      startingTimestamp = _time;
    }
    function setClosingTimestamp(uint256 _time) external onlyOwner() {
      closingTimestamp = _time;
    }
}
