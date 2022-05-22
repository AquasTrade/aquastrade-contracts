import { expect, assert } from "chai";
import { network, upgrades } from "hardhat";
import { BigNumber } from "ethers";

const { lotto, generateLottoNumbers } = require("./settings.ts");

describe("Lottery Factory contract", function () {
  beforeEach(async function () {
    // Getting the signers provided by ethers
    const signers = await ethers.getSigners();
    // Creating the active wallets for use
    this.owner = signers[0];
    this.buyer = signers[1];
    this.treasury = signers[2];
    this.burner = signers[3];
    this.nobody = signers[4];

    // from RNG_Test
    // each num % (10 ** lotterySize)
    this.RNG_NUMBERS = [126009, 5533037, 9311954, 5319410, 9952834, 3396771, 5720753];

    // Getting the lottery code (abi, bytecode, name)
    this.factoryContract = await ethers.getContractFactory("LotteryFactory");
    this.lotteryContract = await ethers.getContractFactory("Lottery");
    // Getting the lotteryNFT code (abi, bytecode, name)
    this.mock_erc20Contract = await ethers.getContractFactory("MockERC20");
    this.mock_erc721Contract = await ethers.getContractFactory("MockERC721Token");
    this.randGenContract = await ethers.getContractFactory("RNG_Test");
    // Deploying the instances
    this.rubyInstance = await this.mock_erc20Contract.deploy("RUBY Token", "RUBY", lotto.buy.ruby, 18);
    this.randGenInstance = await this.randGenContract.deploy();
    this.nftInstance = await this.mock_erc721Contract.deploy("Lottery Bonus", "Bonus");
    this.factoryInstance = await upgrades.deployProxy(this.factoryContract, [
      this.rubyInstance.address,
      this.randGenInstance.address,
      this.treasury.address,
      this.burner.address,
    ]);
    await this.factoryInstance.deployed();
    this.nftInstance.mint(this.owner.address, "");
    this.rubyInstance.connect(this.owner).transfer(this.buyer.address, lotto.buy.halfRuby);
  });
  describe("Creating a new lottery tests", function () {
    /**
     * Tests that in the nominal case nothing goes wrong
     */
    it("Nominal case", async function () {
      await this.nftInstance.connect(this.owner).approve(this.factoryInstance.address, 1);
      // Creating a new lottery
      await expect(
        this.factoryInstance
          .connect(this.owner)
          .createNewLotto(
            this.rubyInstance.address,
            this.nftInstance.address,
            1,
            lotto.setup.sizeOfLottery,
            lotto.newLotto.cost,
            lotto.newLotto.distribution,
            lotto.newLotto.duration,
          ),
      ).to.emit(this.factoryInstance, lotto.events.new)

      let lotteryInstance = await this.lotteryContract.attach(this.factoryInstance.getCurrentLotto());

      expect(await lotteryInstance.hasNFTPrize(), "NFT prize").to.be.eq(true);
      expect(await lotteryInstance.getBonusNFT(), "NFT address").to.be.eq(this.nftInstance.address);

      expect(await lotteryInstance.getTicketPrice()).to.be.eq(lotto.newLotto.cost);

      expect(await lotteryInstance.getTicketERC20(), "Collateral address").to.be.eq(this.rubyInstance.address);
      expect(await lotteryInstance.getTicketERC20Symbol()).to.be.eq("RUBY");
      expect(await lotteryInstance.getTicketERC20Decimals()).to.be.eq(18);

      expect(await lotteryInstance.getLotterySize()).to.be.eq(lotto.setup.sizeOfLottery);
      expect(await lotteryInstance.getTicketsRemaining()).to.be.eq(10 ** lotto.setup.sizeOfLottery);
    });
    /**
     * Testing that non-admins cannot create a lotto, pause a lotto, stop a lotto
     */
    it("Invalid admin (factory)", async function () {
      await expect(
        this.factoryInstance
          .connect(this.buyer)
          .createNewLotto(
            this.rubyInstance.address,
            this.nftInstance.address,
            1,
            lotto.setup.sizeOfLottery,
            lotto.newLotto.cost,
            lotto.newLotto.distribution,
            lotto.newLotto.duration,
          ),
      ).to.be.revertedWith(lotto.errors.invalid_owner);
    });
    it("Invalid admin (lottery)", async function () {
      await this.nftInstance.connect(this.owner).approve(this.factoryInstance.address, 1);
      await this.factoryInstance
        .connect(this.owner)
        .createNewLotto(
          this.rubyInstance.address,
          this.nftInstance.address,
          1,
          lotto.setup.sizeOfLottery,
          lotto.newLotto.cost,
          lotto.newLotto.distribution,
          lotto.newLotto.duration,
        );
      this.lotteryInstance = this.lotteryContract.attach(await this.factoryInstance.getCurrentLotto());

      await expect(
        this.lotteryInstance.connect(this.buyer).pause()
      ).to.be.revertedWith(lotto.errors.invalid_owner)
      await expect(
        this.lotteryInstance.connect(this.buyer).unpause()
      ).to.be.revertedWith(lotto.errors.invalid_owner)
      await expect(
        this.lotteryInstance.connect(this.buyer).stop()
      ).to.be.revertedWith(lotto.errors.invalid_owner)

    });
    /**
     * Create multiple Lottery
     */
    it("Multiple case", async function () {
      this.nftInstance.mint(this.owner.address, "");
      this.nftInstance.mint(this.owner.address, "");
      await this.nftInstance.approve(this.factoryInstance.address, 2);
      await this.nftInstance.approve(this.factoryInstance.address, 3);
      // Creating a new lottery
      await expect(
        this.factoryInstance
          .connect(this.owner)
          .createNewLotto(
            this.rubyInstance.address,
            this.nftInstance.address,
            2,
            lotto.setup.sizeOfLottery,
            lotto.newLotto.cost,
            lotto.newLotto.distribution,
            lotto.newLotto.duration,
          ),
      ).to.emit(this.factoryInstance, lotto.events.new)

      await expect(
        this.factoryInstance
          .connect(this.owner)
          .createNewLotto(
            this.rubyInstance.address,
            this.nftInstance.address,
            3,
            lotto.setup.sizeOfLottery,
            lotto.newLotto.cost,
            lotto.newLotto.distribution,
            lotto.newLotto.duration,
          ),
      ).to.emit(this.factoryInstance, lotto.events.new)

    });
    /**
     * Create multiple Lottery with different NFT collection
     */
    it("Multiple case(different NFT Collection)", async function () {
      this.nftInstance.mint(this.owner.address, 2);
      let nftInstance1 = await this.mock_erc721Contract.deploy("Bonus NFT", "Bonus");
      nftInstance1.mint(this.owner.address, "");
      await this.nftInstance.connect(this.owner).approve(this.factoryInstance.address, 2);
      await nftInstance1.connect(this.owner).approve(this.factoryInstance.address, 1);
      // Creating a new lottery
      await expect(
        this.factoryInstance
          .connect(this.owner)
          .createNewLotto(
            this.rubyInstance.address,
            this.nftInstance.address,
            2,
            lotto.setup.sizeOfLottery,
            lotto.newLotto.cost,
            lotto.newLotto.distribution,
            lotto.newLotto.duration,
          ),
      ).to.emit(this.factoryInstance, lotto.events.new)

      await expect(
        this.factoryInstance
          .connect(this.owner)
          .createNewLotto(
            this.rubyInstance.address,
            nftInstance1.address,
            1,
            lotto.setup.sizeOfLottery,
            lotto.newLotto.cost,
            lotto.newLotto.distribution,
            lotto.newLotto.duration,
          ),
      ).to.emit(this.factoryInstance, lotto.events.new)
    });
    /**
     * Wrong nft this.owner Lottery
     */
    it("Create Lottery test(wrong nft owner)", async function () {
      this.nftInstance.mint(this.owner.address, 2);
      this.nftInstance.mint(this.owner.address, 3);
      await this.nftInstance.connect(this.owner).approve(this.factoryInstance.address, 2);
      await this.nftInstance.connect(this.owner).approve(this.factoryInstance.address, 3);
      // Creating a new lottery
      await expect(
        this.factoryInstance
          .connect(this.owner)
          .createNewLotto(
            this.rubyInstance.address,
            this.nftInstance.address,
            2,
            lotto.setup.sizeOfLottery,
            lotto.newLotto.cost,
            lotto.newLotto.distribution,
            lotto.newLotto.duration,
          ),
      ).to.emit(this.factoryInstance, lotto.events.new)

      await expect(
        this.factoryInstance
          .connect(this.owner)
          .createNewLotto(
            this.rubyInstance.address,
            this.nftInstance.address,
            2,
            lotto.setup.sizeOfLottery,
            lotto.newLotto.cost,
            lotto.newLotto.distribution,
            lotto.newLotto.duration,
          ),
      ).to.be.revertedWith(lotto.errors.invalid_nft_owner);
    });
  });

  describe("Buying tickets tests", function () {
    /**
     * Creating a lotto for all buying tests to use. Will be a new instance
     * for each lotto.
     */
    beforeEach(async function () {
      await this.nftInstance.connect(this.owner).approve(this.factoryInstance.address, 1);
      await this.factoryInstance
        .connect(this.owner)
        .createNewLotto(
          this.rubyInstance.address,
          this.nftInstance.address,
          1,
          lotto.setup.sizeOfLottery,
          lotto.newLotto.cost,
          lotto.newLotto.distribution,
          lotto.newLotto.duration,
        );
      this.lotteryInstance = this.lotteryContract.attach(await this.factoryInstance.getCurrentLotto());
    });
    /**
     * Tests the batch buying of one token
     */
    it("Batch buying 1 tickets", async function () {
      // Getting the price to buy
      let price = await this.lotteryInstance.costToBuyTickets(1);
      // Generating chosen numbers for buy
      let ticketNumbers = generateLottoNumbers({
        numberOfTickets: 1,
        lottoSize: lotto.setup.sizeOfLottery,
      });
      // Approving lotto to spend cost
      await this.rubyInstance.connect(this.owner).approve(this.lotteryInstance.address, price.toString());
      // Batch buying tokens
      await this.lotteryInstance.buyTicket(1, ticketNumbers);
      // Testing results
      assert.equal(price.toString(), lotto.buy.one.cost, "Incorrect cost for batch buy of 1");
      expect(await this.lotteryInstance.getTicketsRemaining()).to.be.eq(10 ** lotto.setup.sizeOfLottery - 1);
    });
    it("Buying same ticket as someone else", async function () {
      let price = await this.lotteryInstance.costToBuyTickets(3);
      await this.rubyInstance.connect(this.owner).approve(this.lotteryInstance.address, price.toString());

      // Generating chosen numbers for buy
      let ticketNumbers = [1, 2];

      // Check availble api
      expect(await this.lotteryInstance.isTicketAvailable(1)).to.be.eq(true);
      expect(await this.lotteryInstance.isTicketAvailable(2)).to.be.eq(true);
      expect(await this.lotteryInstance.areTicketsAvailable([1, 2])).to.eql([true, true]);

      // Buy 2 available tickets
      await this.lotteryInstance.buyTicket(2, ticketNumbers);

      // Confirm we bought
      expect(await this.lotteryInstance.getNumTicketsSold()).to.be.eq(2);
      let myTickets = await this.lotteryInstance.getTickets(this.owner.address);
      expect(BigNumber.from(1)).to.be.eq(myTickets[0]);
      expect(BigNumber.from(2)).to.be.eq(myTickets[1]);

      expect(await this.lotteryInstance.areTicketsAvailable([1, 2])).to.eql([false, false]);

      // Buy 1 taken ticket
      let ticketNumbers2 = [2, 3];
      expect(await this.lotteryInstance.isTicketAvailable(3)).to.be.eq(true);
      await this.lotteryInstance.buyTicket(2, ticketNumbers2);
      // Confirm we bought just the #3
      expect(await this.lotteryInstance.getNumTicketsSold()).to.be.eq(3);
      let myTickets2 = await this.lotteryInstance.getTickets(this.owner.address);
      expect(BigNumber.from(1)).to.be.eq(myTickets2[0]);
      expect(BigNumber.from(2)).to.be.eq(myTickets2[1]);
      expect(BigNumber.from(3)).to.be.eq(myTickets2[2]);

      expect(await this.lotteryInstance.areTicketsAvailable([1, 2, 3])).to.eql([false, false, false]);
    });
    /**
     * Tests the batch buying of ten token
     */
    it("Batch buying 10 tickets", async function () {
      // Getting the price to buy
      let price = await this.lotteryInstance.costToBuyTickets(10);
      // Generating chosen numbers for buy
      let ticketNumbers = generateLottoNumbers({
        numberOfTickets: 10,
        lottoSize: lotto.setup.sizeOfLottery,
      });
      // Approving lotto to spend cost
      await this.rubyInstance.connect(this.owner).approve(this.lotteryInstance.address, price.toString());
      // Batch buying tokens
      await this.lotteryInstance.buyTicket(10, ticketNumbers);
      // Testing results
      // TODO get user balances
      assert.equal(price.toString(), lotto.buy.ten.cost, "Incorrect cost for batch buy of 10");
    });
    /**
     * Tests the batch buying of fifty token
     */
    it("Batch buying 50 tickets", async function () {
      // Getting the price to buy
      let price = await this.lotteryInstance.costToBuyTickets(50);
      // Generating chosen numbers for buy
      let ticketNumbers = generateLottoNumbers({
        numberOfTickets: 50,
        lottoSize: lotto.setup.sizeOfLottery,
      });
      // Approving lotto to spend cost
      await this.rubyInstance.connect(this.owner).approve(this.lotteryInstance.address, price.toString());
      // Batch buying tokens
      await this.lotteryInstance.buyTicket(50, ticketNumbers);
      // Testing results
      assert.equal(price.toString(), lotto.buy.fifty.cost, "Incorrect cost for batch buy of 50");
    });
    /**
     * Tests the batch buying with invalid ticket numbers
     */
    it("Invalid chosen numbers", async function () {
      // Getting the price to buy
      let price = await this.lotteryInstance.costToBuyTickets(10);
      // Generating chosen numbers for buy
      let ticketNumbers = generateLottoNumbers({
        numberOfTickets: 9,
        lottoSize: lotto.setup.sizeOfLottery,
      });
      // Approving lotto to spend cost
      await this.rubyInstance.connect(this.owner).approve(this.factoryInstance.address, price.toString());
      // Batch buying tokens
      await expect(this.lotteryInstance.connect(this.owner).buyTicket(10, ticketNumbers)).to.be.revertedWith(
        lotto.errors.invalid_mint_numbers,
      );
    });
    /**
     * Tests the batch buying when paused
     */
    it("When paused", async function () {
      // Getting the price to buy
      let price = await this.lotteryInstance.costToBuyTickets(10);
      // Generating chosen numbers for buy
      let ticketNumbers = generateLottoNumbers({
        numberOfTickets: 10,
        lottoSize: lotto.setup.sizeOfLottery,
      });
      // Approving lotto to spend cost
      await this.rubyInstance.connect(this.owner).approve(this.factoryInstance.address, price.toString());
      await this.lotteryInstance.connect(this.owner).pause();
      // Batch buying tokens
      await expect(this.lotteryInstance.connect(this.owner).buyTicket(10, ticketNumbers)).to.be.revertedWith(
        lotto.errors.invalid_mint_paused,
      );
    });
    /**
     * Tests the batch buying with invalid approve
     */
    it("Invalid ruby transfer", async function () {
      // Getting the price to buy
      let price = await this.lotteryInstance.costToBuyTickets(10);
      // Generating chosen numbers for buy
      let ticketNumbers = generateLottoNumbers({
        numberOfTickets: 10,
        lottoSize: lotto.setup.sizeOfLottery,
      });
      // Batch buying tokens
      await expect(this.lotteryInstance.connect(this.owner).buyTicket(10, ticketNumbers)).to.be.revertedWith(
        lotto.errors.invalid_mint_approve,
      );
    });
    /**
     * Tests the batch buying after the valid time period fails
     */
    it("Invalid buying time", async function () {
      // Getting the price to buy
      let price = await this.lotteryInstance.costToBuyTickets(10);
      // Generating chosen numbers for buy
      let ticketNumbers = generateLottoNumbers({
        numberOfTickets: 10,
        lottoSize: lotto.setup.sizeOfLottery,
      });
      // Approving lotto to spend cost
      await this.rubyInstance.connect(this.owner).approve(this.lotteryInstance.address, price);
      // Setting the time forward
      await network.provider.send("evm_increaseTime", [lotto.newLotto.duration + 10]);
      await network.provider.send("evm_mine");
      // Batch buying tokens
      await expect(this.lotteryInstance.connect(this.owner).buyTicket(10, ticketNumbers)).to.be.revertedWith(
        lotto.errors.invalid_buying_timestamp_closed,
      );
    });
  });
  describe("Drawing numbers tests", function () {
    beforeEach(async function () {
      await this.nftInstance.connect(this.owner).approve(this.factoryInstance.address, 1);
      // Creating a new lottery
      await this.factoryInstance
        .connect(this.owner)
        .createNewLotto(
          this.rubyInstance.address,
          this.nftInstance.address,
          1,
          lotto.setup.sizeOfLottery,
          lotto.newLotto.cost,
          lotto.newLotto.distribution,
          lotto.newLotto.duration,
        );
      this.lotteryInstance = this.lotteryContract.attach(await this.factoryInstance.getCurrentLotto());
    });
    /**
     * Testing that the winning numbers can be set in the nominal case
     */
    it("Set winning numbers", async function () {
      // Setting the time so that we can set winning numbers
      // Setting the time forward
      await network.provider.send("evm_increaseTime", [lotto.newLotto.duration + 10]);
      await network.provider.send("evm_mine");
      // Drawing the numbers
      await this.lotteryInstance.connect(this.owner).drawWinningNumbers();

      // Getting info after call
      let lotteryInfoAfter = await this.lotteryInstance.getWinningNumbers();
      // Testing
      assert.equal(lotteryInfoAfter.toString(), lotto.newLotto.win.winningNumbers, "Winning numbers incorrect after");
    });
    /**
     * Testing that a non owner cannot set the winning numbers
     */
    it("Invalid winning numbers (owner)", async function () {
      // Setting the time forward
      await network.provider.send("evm_increaseTime", [lotto.newLotto.duration + 10]);
      await network.provider.send("evm_mine");
      // Drawing the numbers
      await expect(this.lotteryInstance.connect(this.buyer).drawWinningNumbers()).to.be.revertedWith(
        lotto.errors.invalid_owner,
      );
    });
    /**
     * Testing that numbers cannot be updated once chosen
     */
    it("Invalid winning numbers (already chosen)", async function () {
      // Setting the time so that we can set winning numbers
      // Setting the time forward
      await network.provider.send("evm_increaseTime", [lotto.newLotto.duration + 10]);
      await network.provider.send("evm_mine");
      // Drawing the numbers
      await this.lotteryInstance.connect(this.owner).drawWinningNumbers();
      // Drawing the numbers again
      await expect(this.lotteryInstance.connect(this.owner).drawWinningNumbers()).to.be.revertedWith(
        lotto.errors.invalid_draw_repeat,
      );
    });
    /**
     * Testing that winning numbers cannot be set while lottery still in
     * progress
     */
    it("Invalid winning numbers (time)", async function () {
      await expect(this.lotteryInstance.connect(this.owner).drawWinningNumbers()).to.be.revertedWith(
        lotto.errors.invalid_draw_time,
      );
    });
  });

  describe("Claiming tickets tests", function () {
    beforeEach(async function () {
      await this.nftInstance.connect(this.owner).approve(this.factoryInstance.address, 1);
      await this.factoryInstance
        .connect(this.owner)
        .createNewLotto(
          this.rubyInstance.address,
          this.nftInstance.address,
          1,
          lotto.setup.sizeOfLottery,
          lotto.newLotto.cost,
          lotto.newLotto.distribution,
          lotto.newLotto.duration,
        );
      this.lotteryInstance = this.lotteryContract.attach(await this.factoryInstance.getCurrentLotto());
      // Buying tickets
      // Getting the price to buy
      let prices = await this.lotteryInstance.costToBuyTickets(50);
      // Sending the this.buyer the needed amount of ruby
      // Approving lotto to spend cost
      await this.rubyInstance.connect(this.buyer).approve(this.lotteryInstance.address, prices);
      // Generating chosen numbers for buy
      let ticketNumbers = generateLottoNumbers({
        numberOfTickets: 50,
        lottoSize: lotto.setup.sizeOfLottery,
      });
      // Batch buying tokens
      await this.lotteryInstance.connect(this.buyer).buyTicket(50, ticketNumbers);
    });
    /**
     * Testing that a claim cannot happen while the lottery is still active
     */
    it("Invalid claim (incorrect time)", async function () {
      // Setting current time so that drawing is correct
      // Setting the time forward
      await network.provider.send("evm_increaseTime", [lotto.newLotto.duration + 10]);
      await network.provider.send("evm_mine");
      // Drawing the numbers
      await this.lotteryInstance.connect(this.owner).drawWinningNumbers();

      // Setting the time backward
      await network.provider.send("evm_increaseTime", [-lotto.newLotto.duration + 10]);
      await network.provider.send("evm_mine");
      // Claiming winnings
      await expect(this.lotteryInstance.connect(this.buyer).claimReward()).to.be.revertedWith(
        lotto.errors.invalid_claim_time,
      );
    });
    it("Invalid claim (not closed, so close early)", async function () {
      await expect(this.lotteryInstance.connect(this.buyer).claimReward()).to.be.revertedWith(
        lotto.errors.invalid_claim_time,
      );

      // advance until only half way finished
      await network.provider.send("evm_increaseTime", [lotto.newLotto.duration / 2]);
      await network.provider.send("evm_mine");

      await expect(this.lotteryInstance.connect(this.buyer).claimReward()).to.be.revertedWith(
        lotto.errors.invalid_claim_time,
      );

      // also can't draw
      await expect(this.lotteryInstance.connect(this.owner).drawWinningNumbers()).to.be.revertedWith(
        lotto.errors.invalid_claim_time,
      );

      await this.lotteryInstance.connect(this.owner).stop();  // sets end to current block

      // go forward 1s
      await network.provider.send("evm_increaseTime", [1]);
      await network.provider.send("evm_mine");

      await expect(this.lotteryInstance.connect(this.owner).drawWinningNumbers());
      await expect(this.lotteryInstance.connect(this.buyer).claimReward());
    });
    /**
     * Testing that a claim cannot happen until the winning numbers are
     * chosen.
     */
    it("Invalid claim (winning numbers not chosen)", async function () {
      // Setting the time forward
      await network.provider.send("evm_increaseTime", [lotto.newLotto.duration + 10]);
      await network.provider.send("evm_mine");
      // Claiming winnings
      await expect(this.lotteryInstance.connect(this.buyer).claimReward()).to.be.revertedWith(
        lotto.errors.invalid_claim_draw,
      );
    });
  });
  describe("Claim Test for inividual winners", function () {
    beforeEach(async function () {
      await this.nftInstance.connect(this.owner).approve(this.factoryInstance.address, 1);
      await this.factoryInstance
        .connect(this.owner)
        .createNewLotto(
          this.rubyInstance.address,
          this.nftInstance.address,
          1,
          lotto.setup.sizeOfLottery,
          lotto.newLotto.cost,
          lotto.newLotto.distribution,
          lotto.newLotto.duration,
        );
      this.lotteryInstance = this.lotteryContract.attach(await this.factoryInstance.getCurrentLotto());
      // Buying tickets
      // Getting the price to buy
      let prices = await this.lotteryInstance.costToBuyTickets(49);
      // Sending the this.buyer the needed amount of ruby
      // Approving lotto to spend cost
      await this.rubyInstance.connect(this.buyer).approve(this.lotteryInstance.address, prices);
      // Generating chosen numbers for buy
      let ticketNumbers = generateLottoNumbers({
        numberOfTickets: 49,
        lottoSize: lotto.setup.sizeOfLottery,
      });
      // Batch buying tokens
      await this.lotteryInstance.connect(this.buyer).buyTicket(49, ticketNumbers);
    });
    /**
     * Testing that claim for 1st winner
     */
    it("Claim Test (1st winner)", async function () {
      let price = await this.lotteryInstance.costToBuyTickets(1);
      await this.rubyInstance.connect(this.buyer).approve(this.lotteryInstance.address, price);
      await this.lotteryInstance.connect(this.buyer).buyTicket(1, [lotto.newLotto.win.winningNumbersArr[0]]);
      // Setting current time so that drawing is correct
      // Setting the time forward
      await network.provider.send("evm_increaseTime", [lotto.newLotto.duration + 10]);
      await network.provider.send("evm_mine");
      // Drawing the numbers
      await this.lotteryInstance.connect(this.owner).drawWinningNumbers();
      // Claiming winnings
      let balanceBefore = await this.rubyInstance.balanceOf(this.buyer.address);
      await this.lotteryInstance.connect(this.buyer).claimReward();
      let balanceAfter = await this.rubyInstance.balanceOf(this.buyer.address);
      let diff = balanceAfter.sub(balanceBefore);
      expect(diff, "1st winner claim amount is wrong").to.be.eq(lotto.newLotto.win.first);

      assert.equal(await this.nftInstance.ownerOf(1), this.buyer.address);
    });
    /**
     * Testing that claim for 2nd winner
     */
    it("Claim Test (2nd winner)", async function () {
      let price = await this.lotteryInstance.costToBuyTickets(1);
      await this.rubyInstance.connect(this.buyer).approve(this.lotteryInstance.address, price);
      await this.lotteryInstance.connect(this.buyer).buyTicket(1, [lotto.newLotto.win.winningNumbersArr[1]]);
      // Setting current time so that drawing is correct
      // Setting the time forward
      await network.provider.send("evm_increaseTime", [lotto.newLotto.duration + 10]);
      await network.provider.send("evm_mine");
      // Drawing the numbers
      await this.lotteryInstance.connect(this.owner).drawWinningNumbers();
      // Claiming winnings
      let balanceBefore = await this.rubyInstance.balanceOf(this.buyer.address);
      await this.lotteryInstance.connect(this.buyer).claimReward();
      let balanceAfter = await this.rubyInstance.balanceOf(this.buyer.address);
      let diff = balanceAfter.sub(balanceBefore);
      expect(diff, "2nd winner claim amount is wrong").to.be.eq(lotto.newLotto.win.second);
    });
    /**
     * Testing that claim for 3rd winner
     */
    it("Claim Test (3rd winner)", async function () {
      let price = await this.lotteryInstance.costToBuyTickets(1);
      await this.rubyInstance.connect(this.buyer).approve(this.lotteryInstance.address, price);
      await this.lotteryInstance.connect(this.buyer).buyTicket(1, [lotto.newLotto.win.winningNumbersArr[2]]);
      // Setting current time so that drawing is correct
      // Setting the time forward
      await network.provider.send("evm_increaseTime", [lotto.newLotto.duration + 10]);
      await network.provider.send("evm_mine");
      // Drawing the numbers
      await this.lotteryInstance.connect(this.owner).drawWinningNumbers();
      // Claiming winnings
      let balanceBefore = await this.rubyInstance.balanceOf(this.buyer.address);
      await this.lotteryInstance.connect(this.buyer).claimReward();
      let balanceAfter = await this.rubyInstance.balanceOf(this.buyer.address);
      let diff = balanceAfter.sub(balanceBefore);
      expect(diff, "3rd winner claim amount is wrong").to.be.eq(lotto.newLotto.win.third);
    });
    /**
     * Testing that claim for 4th winner
     */
    it("Claim Test (4th winner)", async function () {
      let price = await this.lotteryInstance.costToBuyTickets(1);
      await this.rubyInstance.connect(this.buyer).approve(this.lotteryInstance.address, price);
      await this.lotteryInstance.connect(this.buyer).buyTicket(1, [lotto.newLotto.win.winningNumbersArr[3]]);
      // Setting current time so that drawing is correct
      // Setting the time forward
      await network.provider.send("evm_increaseTime", [lotto.newLotto.duration + 10]);
      await network.provider.send("evm_mine");
      // Drawing the numbers
      await this.lotteryInstance.connect(this.owner).drawWinningNumbers();
      // Claiming winnings
      let balanceBefore = await this.rubyInstance.balanceOf(this.buyer.address);
      await this.lotteryInstance.connect(this.buyer).claimReward();
      let balanceAfter = await this.rubyInstance.balanceOf(this.buyer.address);
      let diff = balanceAfter.sub(balanceBefore);
      expect(diff, "4th winner claim amount is wrong").to.be.eq(lotto.newLotto.win.fourth);
    });
  });
  describe("Withdrawal test", function () {
    beforeEach(async function () {
      await this.nftInstance.connect(this.owner).approve(this.factoryInstance.address, 1);
      await this.factoryInstance
        .connect(this.owner)
        .createNewLotto(
          this.rubyInstance.address,
          this.nftInstance.address,
          1,
          lotto.setup.sizeOfLottery,
          lotto.newLotto.cost,
          lotto.newLotto.distribution,
          lotto.newLotto.duration,
        );
      this.lotteryInstance = this.lotteryContract.attach(await this.factoryInstance.getCurrentLotto());
      // Buying tickets
      // Getting the price to buy
      let prices = await this.lotteryInstance.costToBuyTickets(50);
      // Sending the this.buyer the needed amount of ruby
      // Approving lotto to spend cost
      await this.rubyInstance.connect(this.buyer).approve(this.lotteryInstance.address, prices);
      // Generating chosen numbers for buy
      let ticketNumbers = generateLottoNumbers({
        numberOfTickets: 50,
        lottoSize: lotto.setup.sizeOfLottery,
      });
      // Batch buying tokens
      await this.lotteryInstance.connect(this.buyer).buyTicket(50, ticketNumbers);
    });

    it("Custom Withdrawal", async function () {
      // Setting the time forward
      await network.provider.send("evm_increaseTime", [lotto.newLotto.duration + 10]);
      await network.provider.send("evm_mine");
      // Drawing the numbers
      let balanceBefore = await this.rubyInstance.balanceOf(this.lotteryInstance.address);
      await this.lotteryInstance.connect(this.owner).withdraw(lotto.buy.one.cost);
      let balanceAfter = await this.rubyInstance.balanceOf(this.lotteryInstance.address);
      let diff = balanceBefore.sub(balanceAfter);
      expect(diff, "Withdrawal amount is invalid").to.be.eq(lotto.buy.one.cost);
    });

    it("Invalid Withdrawal(Not Admin)", async function () {
      // Setting the time forward
      await network.provider.send("evm_increaseTime", [lotto.newLotto.duration + 10]);
      await network.provider.send("evm_mine");
      // Drawing the numbers
      await this.lotteryInstance.connect(this.owner).drawWinningNumbers();
      await expect(this.lotteryInstance.connect(this.buyer).withdraw(lotto.buy.one.cost)).to.be.revertedWith(
        lotto.errors.invalid_owner,
      );
    });

    it("Invalid Withdrawal(before closed)", async function () {
      await expect(this.lotteryInstance.connect(this.owner).withdraw(lotto.buy.one.cost)).to.be.revertedWith(
        "Lottery: Ticket selling is not yet closed",
      );
    });

    it("Total Withdrawal", async function () {
      await network.provider.send("evm_increaseTime", [lotto.newLotto.duration + 10]);
      await network.provider.send("evm_mine");

      let nftBalanceBeforeL = await this.nftInstance.balanceOf(this.lotteryInstance.address);
      expect(nftBalanceBeforeL).to.be.eq(1);
      let nftBalanceBeforeB = await this.nftInstance.balanceOf(this.owner.address);
      expect(nftBalanceBeforeB).to.be.eq(0);

      let balanceBefore = await this.rubyInstance.balanceOf(this.lotteryInstance.address);
      await this.lotteryInstance.connect(this.owner).withdraw(balanceBefore);

      let balanceAfter = await this.rubyInstance.balanceOf(this.lotteryInstance.address);
      expect(balanceAfter).to.be.eq(0);

      let nftBalanceAfterL = await this.nftInstance.balanceOf(this.lotteryInstance.address);
      expect(nftBalanceAfterL).to.be.eq(0);
      let nftBalanceAfterB = await this.nftInstance.balanceOf(this.owner.address);
      expect(nftBalanceAfterB).to.be.eq(1);
    });

  });
  describe("Lottery Factory view test", function () {
    beforeEach(async function () {
      await this.nftInstance.connect(this.owner).approve(this.factoryInstance.address, 1);
      await this.factoryInstance
        .connect(this.owner)
        .createNewLotto(
          this.rubyInstance.address,
          this.nftInstance.address,
          1,
          lotto.setup.sizeOfLottery,
          lotto.newLotto.cost,
          lotto.newLotto.distribution,
          lotto.newLotto.duration,
        );
      this.lotteryInstance = this.lotteryContract.attach(await this.factoryInstance.getCurrentLotto());
      // Buying tickets
      // Getting the price to buy
      let prices = await this.lotteryInstance.costToBuyTickets(49);
      // Sending the this.buyer the needed amount of ruby
      // Approving lotto to spend cost
      await this.rubyInstance.connect(this.buyer).approve(this.lotteryInstance.address, prices);
      // Generating chosen numbers for buy
      let ticketNumbers = generateLottoNumbers({
        numberOfTickets: 49,
        lottoSize: lotto.setup.sizeOfLottery,
      });
      // Batch buying tokens
      await this.lotteryInstance.connect(this.buyer).buyTicket(49, ticketNumbers);
    });
    it("costToBuyTickets function", async function () {
      assert.equal(
        (await this.factoryInstance.costToBuyTickets(1)).toString(),
        lotto.newLotto.cost.toString(),
        "Cost is inccorect",
      );
    });
    /**
     * Testing that the winning numbers can be set in the nominal case
     */
    it("Get winning numbers", async function () {
      // Setting the time so that we can set winning numbers
      // Setting the time forward
      await network.provider.send("evm_increaseTime", [lotto.newLotto.duration + 10]);
      await network.provider.send("evm_mine");
      // Drawing the numbers
      await this.lotteryInstance.connect(this.owner).drawWinningNumbers();

      // Getting info after call
      let lotteryInfoAfter = await this.factoryInstance.getWinningNumbers();
      // Testing
      assert.equal(lotteryInfoAfter.toString(), lotto.newLotto.win.winningNumbers, "Winning numbers incorrect after");
    });
    /**
     * GetReward view test Lottery Factory
     */
    it("GetReward Test (1st winner)", async function () {
      let price = await this.lotteryInstance.costToBuyTickets(1);
      await this.rubyInstance.connect(this.owner).approve(this.lotteryInstance.address, price);
      await this.lotteryInstance.connect(this.owner).buyTicket(1, [lotto.newLotto.win.winningNumbersArr[0]]);
      // Setting current time so that drawing is correct
      // Setting the time forward
      await network.provider.send("evm_increaseTime", [lotto.newLotto.duration + 10]);
      await network.provider.send("evm_mine");
      // Drawing the numbers
      await this.lotteryInstance.connect(this.owner).drawWinningNumbers();
      // // Claiming winnings
      // let balanceBefore = new BigNumber((await this.rubyInstance.balanceOf(this.owner.address)).toString());
      // await this.lotteryInstance.connect(this.owner).claimReward();
      // let balanceAfter = new BigNumber((await this.rubyInstance.balanceOf(this.owner.address)).toString());
      // let diff = balanceAfter.minus(balanceBefore);
      assert.equal(
        (await this.lotteryInstance.getRewardAmount(this.owner.address)).toString(),
        lotto.newLotto.win.first.toString(),
        "1st winner claim amount is wrong",
      );
      assert.equal(
        await this.lotteryInstance.getRewardNFT(this.owner.address),
        true,
        "NFT reward to 1st winner is invalid",
      );
    });
  });
  describe("Un-won tickets burn and treasury (1 possible winner)", function () {
    beforeEach(async function () {
      await this.nftInstance.connect(this.owner).approve(this.factoryInstance.address, 1);
      await this.factoryInstance.connect(this.owner).createNewLotto(
        this.rubyInstance.address,
        this.nftInstance.address,
        1,
        4, // 10 ** 4 = 10000 tickets
        lotto.newLotto.cost,
        [50, 40, 10],
        lotto.newLotto.duration,
      );
      this.lotteryInstance = this.lotteryContract.attach(await this.factoryInstance.getCurrentLotto());
    });
    it("0 tickets", async function () {
      await network.provider.send("evm_increaseTime", [lotto.newLotto.duration + 10]);
      await network.provider.send("evm_mine");

      let t_balanceBefore = await this.rubyInstance.balanceOf(this.treasury.address);
      let b_balanceBefore = await this.rubyInstance.balanceOf(this.burner.address);

      await this.lotteryInstance.connect(this.owner).drawWinningNumbers();

      let t_balanceAfter = await this.rubyInstance.balanceOf(this.treasury.address);
      let b_balanceAfter = await this.rubyInstance.balanceOf(this.burner.address);
      let t_diff = t_balanceAfter.sub(t_balanceBefore);
      let b_diff = b_balanceAfter.sub(b_balanceBefore);

      let balanceBefore = await this.rubyInstance.balanceOf(this.buyer.address);
      await this.lotteryInstance.connect(this.buyer).claimReward();
      let balanceAfter = await this.rubyInstance.balanceOf(this.buyer.address);
      let diff = balanceAfter.sub(balanceBefore);

      expect(diff).to.be.eq(0);
      expect(b_diff).to.be.eq(0);
      expect(t_diff).to.be.eq(0);
    });
    it("1 winner", async function () {
      let price = await this.lotteryInstance.getTicketPrice();

      expect(price).to.be.eq(lotto.newLotto.cost);
      expect(price).to.be.eq(ethers.utils.parseUnits("10", 18));

      await this.rubyInstance.connect(this.buyer).approve(this.lotteryInstance.address, price);

      await this.lotteryInstance.connect(this.buyer).buyTicket(1, [lotto.newLotto.win.winningNumbersArr[0]]);

      await network.provider.send("evm_increaseTime", [lotto.newLotto.duration + 10]);
      await network.provider.send("evm_mine");

      let t_balanceBefore = await this.rubyInstance.balanceOf(this.treasury.address);
      let b_balanceBefore = await this.rubyInstance.balanceOf(this.burner.address);

      await this.lotteryInstance.connect(this.owner).drawWinningNumbers();

      let t_balanceAfter = await this.rubyInstance.balanceOf(this.treasury.address);
      let b_balanceAfter = await this.rubyInstance.balanceOf(this.burner.address);
      let t_diff = t_balanceAfter.sub(t_balanceBefore);
      let b_diff = b_balanceAfter.sub(b_balanceBefore);

      let balanceBefore = await this.rubyInstance.balanceOf(this.buyer.address);
      await this.lotteryInstance.connect(this.buyer).claimReward();
      let balanceAfter = await this.rubyInstance.balanceOf(this.buyer.address);
      let diff = balanceAfter.sub(balanceBefore);

      // buyer wins 50 % aka 5 RUBY
      expect(diff, "Buyer wins 5").to.be.eq(lotto.newLotto.cost.div(2));
      // burn 40% aka 4 RUBY
      expect(b_diff, "Burn 4").to.be.eq(ethers.utils.parseUnits("4", 18));
      // treasury 10% aka 1 RUBY
      expect(t_diff, "Treasury 1").to.be.eq(ethers.utils.parseUnits("1", 18));
    });
    it("0 winner", async function () {
      let price = await this.lotteryInstance.getTicketPrice();

      expect(price).to.be.eq(lotto.newLotto.cost);
      expect(price).to.be.eq(ethers.utils.parseUnits("10", 18));

      await this.rubyInstance.connect(this.buyer).approve(this.lotteryInstance.address, price);

      await this.lotteryInstance.connect(this.buyer).buyTicket(
        1,
        [0], // not a winning number
      );

      await network.provider.send("evm_increaseTime", [lotto.newLotto.duration + 10]);
      await network.provider.send("evm_mine");

      let t_balanceBefore = await this.rubyInstance.balanceOf(this.treasury.address);
      let b_balanceBefore = await this.rubyInstance.balanceOf(this.burner.address);

      await this.lotteryInstance.connect(this.owner).drawWinningNumbers();

      let t_balanceAfter = await this.rubyInstance.balanceOf(this.treasury.address);
      let b_balanceAfter = await this.rubyInstance.balanceOf(this.burner.address);
      let t_diff = t_balanceAfter.sub(t_balanceBefore);
      let b_diff = b_balanceAfter.sub(b_balanceBefore);

      let balanceBefore = await this.rubyInstance.balanceOf(this.buyer.address);
      await this.lotteryInstance.connect(this.buyer).claimReward();
      let balanceAfter = await this.rubyInstance.balanceOf(this.buyer.address);
      let diff = balanceAfter.sub(balanceBefore);

      // buyer 0
      expect(diff, "Buyer 0").to.be.eq(0);
      // burn 40% aka 4 RUBY
      expect(b_diff, "Burn 0").to.be.eq(ethers.utils.parseUnits("4", 18));
      // treasury 10% + Un-won 50% aka 6 RUBY
      expect(t_diff, "Treasury 0").to.be.eq(ethers.utils.parseUnits("6", 18));
    });
  });
  describe("Un-won tickets burn and treasury (2 possible winners)", function () {
    beforeEach(async function () {
      await this.nftInstance.connect(this.owner).approve(this.factoryInstance.address, 1);
      await this.factoryInstance.connect(this.owner).createNewLotto(
        this.rubyInstance.address,
        this.nftInstance.address,
        1,
        4, // 10 ** 4 = 10000 tickets
        lotto.newLotto.cost,
        [30, 20, 40, 10],
        lotto.newLotto.duration,
      );
      this.lotteryInstance = this.lotteryContract.attach(await this.factoryInstance.getCurrentLotto());
    });
    it("1 winner (1st)", async function () {
      let price = await this.lotteryInstance.getTicketPrice();
      await this.rubyInstance.connect(this.buyer).approve(this.lotteryInstance.address, price);
      await this.lotteryInstance.connect(this.buyer).buyTicket(1, [lotto.newLotto.win.winningNumbersArr[0]]);
      await network.provider.send("evm_increaseTime", [lotto.newLotto.duration + 10]);
      await network.provider.send("evm_mine");

      let t_balanceBefore = await this.rubyInstance.balanceOf(this.treasury.address);
      let b_balanceBefore = await this.rubyInstance.balanceOf(this.burner.address);

      await expect (
        await this.lotteryInstance.connect(this.owner).drawWinningNumbers(),
        "Emit correct draw winners event").to.emit(
          this.lotteryInstance,"DrewWinningNumber").withArgs(
            await this.lotteryInstance.getID(), 1, [this.buyer.address, ethers.constants.AddressZero])

      let t_balanceAfter = await this.rubyInstance.balanceOf(this.treasury.address);
      let b_balanceAfter = await this.rubyInstance.balanceOf(this.burner.address);
      let t_diff = t_balanceAfter.sub(t_balanceBefore);
      let b_diff = b_balanceAfter.sub(b_balanceBefore);

      let balanceBefore = await this.rubyInstance.balanceOf(this.buyer.address);
      await this.lotteryInstance.connect(this.buyer).claimReward();
      let balanceAfter = await this.rubyInstance.balanceOf(this.buyer.address);
      let diff = balanceAfter.sub(balanceBefore);

      // buyer wins 1st place 30 % aka 3 RUBY
      expect(diff, "Buyer wins 3").to.be.eq(ethers.utils.parseUnits("3", 18));
      // burn 40% aka 4 RUBY
      expect(b_diff, "Burn 4").to.be.eq(ethers.utils.parseUnits("4", 18));
      // treasury 10% + Un-won 20% aka 3 RUBY
      expect(t_diff, "Treasury 3").to.be.eq(ethers.utils.parseUnits("3", 18));
    });
    it("1 winner (2nd)", async function () {
      let price = await this.lotteryInstance.getTicketPrice();
      await this.rubyInstance.connect(this.buyer).approve(this.lotteryInstance.address, price);
      await this.lotteryInstance.connect(this.buyer).buyTicket(1, [lotto.newLotto.win.winningNumbersArr[1]]);
      await network.provider.send("evm_increaseTime", [lotto.newLotto.duration + 10]);
      await network.provider.send("evm_mine");

      let t_balanceBefore = await this.rubyInstance.balanceOf(this.treasury.address);
      let b_balanceBefore = await this.rubyInstance.balanceOf(this.burner.address);

      let pot = await this.lotteryInstance.connect(this.buyer).getTotalRuby();
      await this.lotteryInstance.connect(this.owner).drawWinningNumbers();

      let t_balanceAfter = await this.rubyInstance.balanceOf(this.treasury.address);
      let b_balanceAfter = await this.rubyInstance.balanceOf(this.burner.address);
      let t_diff = t_balanceAfter.sub(t_balanceBefore);
      let b_diff = b_balanceAfter.sub(b_balanceBefore);

      let balanceBefore = await this.rubyInstance.balanceOf(this.buyer.address);
      await this.lotteryInstance.connect(this.buyer).claimReward();
      let balanceAfter = await this.rubyInstance.balanceOf(this.buyer.address);
      let diff = balanceAfter.sub(balanceBefore);

      // buyer wins 2nd place 20 % aka 2 RUBY
      expect(diff, "Buyer wins 2").to.be.eq(ethers.utils.parseUnits("2", 18));
      // burn 40% aka 4 RUBY
      expect(b_diff, "Burn 4").to.be.eq(ethers.utils.parseUnits("4", 18));
      // treasury 10% + Un-won 30% aka 4 RUBY
      expect(t_diff, "Treasury 3").to.be.eq(ethers.utils.parseUnits("4", 18));
    });
    it("1 winner (1st & 2nd)", async function () {
      let price = await this.lotteryInstance.getTicketPrice();
      await this.rubyInstance.connect(this.buyer).approve(this.lotteryInstance.address, price.mul(2));
      await this.lotteryInstance
        .connect(this.buyer)
        .buyTicket(2, [lotto.newLotto.win.winningNumbersArr[0], lotto.newLotto.win.winningNumbersArr[1]]);
      await network.provider.send("evm_increaseTime", [lotto.newLotto.duration + 10]);
      await network.provider.send("evm_mine");

      let t_balanceBefore = await this.rubyInstance.balanceOf(this.treasury.address);
      let b_balanceBefore = await this.rubyInstance.balanceOf(this.burner.address);

      let pot = await this.lotteryInstance.connect(this.buyer).getTotalRuby();
      await this.lotteryInstance.connect(this.owner).drawWinningNumbers();

      let t_balanceAfter = await this.rubyInstance.balanceOf(this.treasury.address);
      let b_balanceAfter = await this.rubyInstance.balanceOf(this.burner.address);
      let t_diff = t_balanceAfter.sub(t_balanceBefore);
      let b_diff = b_balanceAfter.sub(b_balanceBefore);

      let balanceBefore = await this.rubyInstance.balanceOf(this.buyer.address);
      await this.lotteryInstance.connect(this.buyer).claimReward();
      let balanceAfter = await this.rubyInstance.balanceOf(this.buyer.address);
      let diff = balanceAfter.sub(balanceBefore);

      // buyer wins 1&2 place 30% + 20%
      expect(diff, "Buyer wins 10").to.be.eq(pot.mul(50).div(100));
      // burn 40%
      expect(b_diff, "Burn 8").to.be.eq(pot.mul(40).div(100));
      // treasury 10%
      expect(t_diff, "Treasury 2").to.be.eq(pot.mul(10).div(100));
    });
    it("0 winner (2 tickets)", async function () {
      let price = await this.lotteryInstance.getTicketPrice();

      expect(price).to.be.eq(lotto.newLotto.cost);
      expect(price).to.be.eq(ethers.utils.parseUnits("10", 18));

      await this.rubyInstance.connect(this.buyer).approve(this.lotteryInstance.address, price.mul(2));

      await this.lotteryInstance.connect(this.buyer).buyTicket(
        2,
        [0, 1], // not winning numbers
      );

      await network.provider.send("evm_increaseTime", [lotto.newLotto.duration + 10]);
      await network.provider.send("evm_mine");

      let t_balanceBefore = await this.rubyInstance.balanceOf(this.treasury.address);
      let b_balanceBefore = await this.rubyInstance.balanceOf(this.burner.address);

      let pot = await this.lotteryInstance.connect(this.buyer).getTotalRuby();
      expect(pot, "Pot is 20").to.be.eq(ethers.utils.parseUnits("20", 18));

      await this.lotteryInstance.connect(this.owner).drawWinningNumbers();

      let t_balanceAfter = await this.rubyInstance.balanceOf(this.treasury.address);
      let b_balanceAfter = await this.rubyInstance.balanceOf(this.burner.address);
      let t_diff = t_balanceAfter.sub(t_balanceBefore);
      let b_diff = b_balanceAfter.sub(b_balanceBefore);

      let balanceBefore = await this.rubyInstance.balanceOf(this.buyer.address);
      await this.lotteryInstance.connect(this.buyer).claimReward();
      let balanceAfter = await this.rubyInstance.balanceOf(this.buyer.address);
      let diff = balanceAfter.sub(balanceBefore);

      // buyer
      expect(diff, "Buyer wins 0").to.be.eq(0);
      // burn 40%
      expect(b_diff, "Burn 8").to.be.eq(pot.mul(40).div(100));
      // treasury 10% + un-won 50%
      expect(t_diff, "Treasury 12").to.be.eq(pot.mul(60).div(100));
    });
  });
  describe("Small lottery (1 winner)", function () {
    beforeEach(async function () {
      this.ticketCost = ethers.utils.parseUnits("10", 18);
      this.duration = 24 * 60 * 60;
      this.lotterySize = 1; // 10 tickets

      await this.nftInstance.connect(this.owner).approve(this.factoryInstance.address, 1);
      await this.factoryInstance
        .connect(this.owner)
        .createNewLotto(
          this.rubyInstance.address,
          this.nftInstance.address,
          1,
          this.lotterySize,
          this.ticketCost,
          [50, 25, 25],
          this.duration,
        );
      this.lotteryInstance = this.lotteryContract.attach(await this.factoryInstance.getCurrentLotto());
    });
    it("1 ticket 1 winner", async function () {
      let price = await this.lotteryInstance.getTicketPrice();
      await this.rubyInstance.connect(this.buyer).approve(this.lotteryInstance.address, price);

      await this.lotteryInstance.connect(this.buyer).buyTicket(1, [this.RNG_NUMBERS[0] % 10 ** this.lotterySize]);

      // check bought numbers
      let tickets = await this.lotteryInstance.connect(this.buyer).getTickets(this.buyer.address);
      expect(tickets, "Correct tickets").to.be.eql([BigNumber.from(this.RNG_NUMBERS[0] % 10 ** this.lotterySize)]);

      expect(await this.lotteryInstance.isTicketAvailable(this.RNG_NUMBERS[0] % 10 ** this.lotterySize)).to.be.eq(
        false,
      );

      await network.provider.send("evm_increaseTime", [this.duration + 10]);
      await network.provider.send("evm_mine");

      let pot = await this.lotteryInstance.connect(this.buyer).getTotalRuby();
      await this.lotteryInstance.connect(this.owner).drawWinningNumbers();

      let winningNumbers = await this.lotteryInstance.connect(this.buyer).getWinningNumbers();
      expect(winningNumbers, "Correct winning numbers").to.be.eql([
        BigNumber.from(this.RNG_NUMBERS[0] % 10 ** this.lotterySize),
      ]);
      let winningAddresses = await this.lotteryInstance.connect(this.buyer).getWinningAddresses();
      expect(winningAddresses, "Buyer is the winner").to.be.eql([this.buyer.address]);

      let nftBalanceBefore = await this.nftInstance.balanceOf(this.buyer.address);
      let balanceBefore = await this.rubyInstance.balanceOf(this.buyer.address);
      await this.lotteryInstance.connect(this.buyer).claimReward();
      let balanceAfter = await this.rubyInstance.balanceOf(this.buyer.address);
      let nftBalanceAfter = await this.nftInstance.balanceOf(this.buyer.address);

      let diff = balanceAfter.sub(balanceBefore);
      expect(diff, "Buyer wins half the pot").to.be.eq(pot.div(2));

      let nftDiff = nftBalanceAfter.sub(nftBalanceBefore);
      expect(nftDiff, "Buyer wins NFT").to.be.eq(1);
    });
    it("1 ticket 1 winner (without NFT)", async function () {
      await this.factoryInstance
        .connect(this.owner)
        .createNewLotto(
          this.rubyInstance.address,
          ethers.constants.AddressZero,
          0,
          this.lotterySize,
          this.ticketCost,
          [50, 25, 25],
          this.duration,
        );
      let lotteryInstance = this.lotteryContract.attach(await this.factoryInstance.getCurrentLotto());

      expect(await lotteryInstance.hasNFTPrize(), "No NFT prize").to.be.eq(false);

      let price = await lotteryInstance.getTicketPrice();
      await this.rubyInstance.connect(this.buyer).approve(lotteryInstance.address, price);

      await lotteryInstance.connect(this.buyer).buyTicket(1, [this.RNG_NUMBERS[0] % 10 ** this.lotterySize]);

      await network.provider.send("evm_increaseTime", [this.duration + 10]);
      await network.provider.send("evm_mine");

      let pot = await lotteryInstance.connect(this.buyer).getTotalRuby();
      await lotteryInstance.connect(this.owner).drawWinningNumbers();

      let nftBalanceBefore = await this.nftInstance.balanceOf(this.buyer.address);
      let balanceBefore = await this.rubyInstance.balanceOf(this.buyer.address);
      await lotteryInstance.connect(this.buyer).claimReward();
      let balanceAfter = await this.rubyInstance.balanceOf(this.buyer.address);
      let nftBalanceAfter = await this.nftInstance.balanceOf(this.buyer.address);

      let diff = balanceAfter.sub(balanceBefore);
      expect(diff, "Buyer wins half the pot").to.be.eq(pot.div(2));

      let nftDiff = nftBalanceAfter.sub(nftBalanceBefore);
      expect(nftDiff, "Buyer wins NO NFT").to.be.eq(0);
    });
    it("2 duplicate tickets 1 winner", async function () {
      let price = await this.lotteryInstance.getTicketPrice();
      await this.rubyInstance.connect(this.buyer).approve(this.lotteryInstance.address, price.mul(2));

      await this.lotteryInstance
        .connect(this.buyer)
        .buyTicket(2, [this.RNG_NUMBERS[0] % 10 ** this.lotterySize, this.RNG_NUMBERS[0] % 10 ** this.lotterySize]);

      // check bought numbers
      let tickets = await this.lotteryInstance.connect(this.buyer).getTickets(this.buyer.address);
      expect(tickets, "Correct tickets").to.be.eql([BigNumber.from(this.RNG_NUMBERS[0] % 10 ** this.lotterySize)]);

      await network.provider.send("evm_increaseTime", [this.duration + 10]);
      await network.provider.send("evm_mine");

      let pot = await this.lotteryInstance.connect(this.buyer).getTotalRuby();
      await this.lotteryInstance.connect(this.owner).drawWinningNumbers();

      let winningNumbers = await this.lotteryInstance.connect(this.buyer).getWinningNumbers();
      expect(winningNumbers, "Correct winning numbers").to.be.eql([
        BigNumber.from(this.RNG_NUMBERS[0] % 10 ** this.lotterySize),
      ]);
      let winningAddresses = await this.lotteryInstance.connect(this.buyer).getWinningAddresses();
      expect(winningAddresses, "Buyer is the winner").to.be.eql([this.buyer.address]);

      let balanceBefore = await this.rubyInstance.balanceOf(this.buyer.address);
      await this.lotteryInstance.connect(this.buyer).claimReward();
      let balanceAfter = await this.rubyInstance.balanceOf(this.buyer.address);
      let diff = balanceAfter.sub(balanceBefore);
      expect(diff, "Buyer wins half the pot").to.be.eq(pot.div(2));
    });
  });
});
