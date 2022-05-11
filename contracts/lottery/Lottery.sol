// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;
// Imported OZ helper contracts
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

import "./IRandomNumberGenerator.sol";
import "../interfaces/IRubyNFT.sol";
import "../token_mappings/RubyToken.sol";
//import "hardhat/console.sol";

contract Lottery is Ownable, Pausable {
    // Libraries
    // Safe math
    using SafeMath for uint256;
    // Safe ERC20
    using SafeERC20 for RubyToken;
    // Address functionality 
    using Address for address;
    uint256 private constant MAX_WINNERS = 10;

    address private factory; // LotteryFactory address.
    RubyToken private ruby; // Instance of Ruby token (collateral currency for lotto).
    IRandomNumberGenerator internal RNG; // Instance of Random Number Generator.
    IRubyNFT private nft; // Instance of NFT for lottery reward.
    uint256 private bonusTokenId; // ID of NFT for lottery reward.

    uint256 private startingTimestamp; // Block timestamp for start of lottery.
    uint256 private closingTimestamp; // Block timestamp for end of lottery.
    uint256 private lotterySize; // Digit count of ticket.
    uint256 private winnersSize; // The number of winners for reward.
    uint256 private rubyTotal; // Total prize pool.
    uint256[] private winners; // The winning numbers.
    uint256 private ticketPrice; // Cost per ticket in $ruby.
    uint256[] private prizeDistribution; // An array defining the distribution of the prize pool.
    address private treasury;

    mapping (uint256 => address) private ticketsToPerson;
    mapping (uint256 => uint256) private visited;
    mapping (address => uint256[]) private personToTickets;
    mapping (address => bool) private claimed;
    uint256 private count;

    event NewTickets(uint256 ticketSize, uint256[] _choosenTicketNumbers);
    event DrewWinningNumber(uint256[] _winners);
    event RewardClaimed(address to);

    constructor (address _factory, address _ruby, address _nft, uint256 _bonusTokenId, uint256 _lotterySize, uint256 _ticketPrice, uint256[] memory _prizeDistribution /*first, second, ..., last, burn, treasury*/, address _treasury, uint256 _duration, address _RNG) 
      public {
    	require(
          _ruby != address(0),
          "Lottery: Ruby cannot be 0 address"
      );
      require(
          _factory != address(0),
          "Lottery: Factory cannot be 0 address"
      );
      require(
          _nft != address(0),
          "Lottery: Nft cannot be 0 address"
      );
      require(
          _RNG != address(0),
          "Lottery: Random Number Generator cannot be 0 address"
      );
      require(
          _treasury != address(0),
          "Lottery: Treasury cannot be 0 address"
      );
    	require(
          _prizeDistribution.length >= 3,
          "Lottery: Invalid distribution"
      );
      require(
          _prizeDistribution.length <= MAX_WINNERS + 2,
          "Lottery: Invalid distribution"
      );
      winnersSize = uint256(_prizeDistribution.length - 2);
    	uint256 prizeDistributionTotal = 0;
      for (uint256 j = 0; j < _prizeDistribution.length; j++) {
          prizeDistributionTotal = prizeDistributionTotal.add(
              uint256(_prizeDistribution[j])
          );
      }
      // Ensuring that prize distribution total is 100%
      require(
          prizeDistributionTotal == 100,
          "Lottery: Prize distribution is not 100%"
      );
      count = 1;
      factory = _factory;
      ruby = RubyToken(_ruby);
      RNG = IRandomNumberGenerator(_RNG);
      nft = IRubyNFT(_nft);
      bonusTokenId = _bonusTokenId;
      treasury = _treasury;
      ticketPrice = _ticketPrice;
    	lotterySize = _lotterySize;
    	startingTimestamp = getCurrentTime();
    	closingTimestamp = startingTimestamp + _duration;
    	prizeDistribution = _prizeDistribution;
    }

    modifier opened() {
      require(getCurrentTime() >= startingTimestamp, "Lottery: Ticket selling is not yet started");
      require(getCurrentTime() < closingTimestamp, "Lottery: Ticket selling is closed");
      _;
    }
    modifier closed() {
      require(getCurrentTime() >= closingTimestamp, "Lottery: Ticket selling is not yet closed");
      _;
    }
    modifier drew() {
    	require(winners.length == winnersSize, "Lottery: Winning Numbers not chosen yet");
      _;
    }

    function pause() external onlyOwner() {
      _pause();
    }

    function unpause() external onlyOwner() {
      _unpause();
    }

    /// @notice Buy ticket for lottery.
    /// @param _ticketSize The number of tickets to buy.
    /// @param _choosenTicketNumbers An array containing the ticket numbers to buy.
    function buyTicket(uint256 _ticketSize, uint256[] calldata _choosenTicketNumbers) external opened() whenNotPaused() {
    	// Ensuring that there are the right amount of chosen numbers
      require(
          _choosenTicketNumbers.length == _ticketSize,
          "Lottery: Invalid chosen numbers"
      );
      count = count + 1;
      for (uint256 i = 0; i < _choosenTicketNumbers.length; i++) {
      	require(_choosenTicketNumbers[i] < uint256(10) ** lotterySize, "Lottery: Ticket Number is out of range");
      	require(ticketsToPerson[_choosenTicketNumbers[i]] == address(0), "Lottery: Ticket Number is already exist");
      	require(visited[_choosenTicketNumbers[i]] != count, "Lottery: Requested Ticket Numbers are not unique");
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
    		ticketsToPerson[_choosenTicketNumbers[i]] = msg.sender;
        personToTickets[msg.sender].push(_choosenTicketNumbers[i]);
    	}
    	emit NewTickets(_ticketSize, _choosenTicketNumbers);
    }

    /// @notice Draw winning numbers.
    function drawWinningNumbers() external closed() onlyOwner() {
    	require(winners.length == 0, "Lottery: Have already drawn the winning number");
      winners = RNG.getRandomNumber(lotterySize, winnersSize);
      ruby.safeTransfer(treasury, rubyTotal.mul(prizeDistribution[prizeDistribution.length - 1]).div(100));
      // ruby.burn(rubyTotal.mul(prizeDistribution[prizeDistribution.length - 2]).div(100));
      ruby.safeTransfer(address(0xdeadbeef), rubyTotal.mul(prizeDistribution[prizeDistribution.length - 2]).div(100));
    	emit DrewWinningNumber(winners);
    }

    function withdraw(uint256 _amount) external drew() onlyOwner() {
      ruby.safeTransfer(
          msg.sender, 
          _amount
      );
    }

    /// @notice Claim rewards to caller if he/she bought winning ticket
    function claimReward() external closed() drew() {
      uint256 prize = 0;
      require(claimed[msg.sender] == false, "Lottery: Already Claimed");
      if (ticketsToPerson[winners[0]] == msg.sender) nft.safeTransferFrom(address(this), msg.sender, bonusTokenId);
      for (uint256 i = 0; i < winnersSize; i++) {
        uint256 winner = winners[i];
        address winAddress = ticketsToPerson[winner];
        if (winAddress == msg.sender) {
          prize = prize.add(rubyTotal.mul(prizeDistribution[i]).div(100));
        }
      }
      ruby.transfer(address(msg.sender), prize);
      claimed[msg.sender] = true;
      emit RewardClaimed(msg.sender);
    }

    //-------------------------------------------------------------------------
    // VIEW FUNCTIONS 
    //-------------------------------------------------------------------------
    function getCurrentTime() internal view returns(uint256) {
      return block.timestamp;
    }

    /// @notice Check the reward amount.
    /// @param to The address where you want to check the reward amount.
    function getRewardAmount(address to) public view drew() returns (uint256) {
      uint256 prize = 0;
      for (uint256 i = 0; i < winnersSize; i++) {
        uint256 winner = winners[i];
        address winAddress = ticketsToPerson[winner];
        if (winAddress == to) prize = prize.add(rubyTotal.mul(prizeDistribution[i]).div(100));
      }
      return prize;
    }

    /// @notice Check the reward NFT.
    /// @param to The address where you want to check the reward NFT.
    function getRewardNFT(address to) public view drew() returns(bool) {
      if (ticketsToPerson[winners[0]] == to) return true;
      return false;
    }

    /// @notice Cost to buy tickets in $ruby.
    /// @param _ticketSize The number of tickets to buy.
    function costToBuyTickets(uint256 _ticketSize) external view returns(uint256) {
      return ticketPrice * _ticketSize;
    }

    function getWinningNumbers() external view drew() returns (uint256[] memory) {
      return winners;
    }
    function getStartingTimestamp() external view returns (uint256) {
      return startingTimestamp;
    }
    function getClosingTimestamp() external view returns (uint256) {
      return closingTimestamp;
    }
    function getTickets(address person) external view returns(uint256[] memory) {
      return personToTickets[person];
    }
    function getLotterySize() external view returns(uint256) {
      return lotterySize;
    }
    function getTotalRuby() external view returns(uint256) {
      return rubyTotal;
    }
    function getDistibution() external view returns(uint256[] memory) {
      return prizeDistribution;
    }
    function getBonusNFT() external view returns(address) {
      return address(nft);
    }
    function getBonusId() external view returns(uint256) {
      return bonusTokenId;
    }
    function getNftDescription() external view returns(string memory) {
      return nft.description();
    }
    function getVisualAppearance() external view returns(string memory) {
      return nft.visualAppearance();
    }
    function isOpened() external view returns(bool) {
      return getCurrentTime() >= startingTimestamp && getCurrentTime() < closingTimestamp;
    }
    function isClosed() external view returns(bool) {
      return getCurrentTime() >= closingTimestamp;
    }
    function isDrawn() external view returns(bool) {
      return winners.length == winnersSize;
    }
    function getClaimed(address who) external view returns(bool) {
      return claimed[who];
    }

    //-------------------------------------------------------------------------
    // SET FUNCTIONS 
    //-------------------------------------------------------------------------
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
