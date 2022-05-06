import { expect, assert } from "chai";
import { network, upgrades } from "hardhat";
const { 
    lotto,
    BigNumber,
    generateLottoNumbers
} = require("./settings.ts");

describe("Lottery Factory contract", function() {
    beforeEach(async function () {
        // Getting the signers provided by ethers
        const signers = await ethers.getSigners();
        // Creating the active wallets for use
        this.owner = signers[0];
        this.buyer = signers[1];
        this.treasury = signers[2];

        // Getting the lottery code (abi, bytecode, name)
        this.factoryContract = await ethers.getContractFactory("LotteryFactory");
        this.lotteryContract = await ethers.getContractFactory("Lottery");
        // Getting the lotteryNFT code (abi, bytecode, name)
        this.mock_erc20Contract = await ethers.getContractFactory("MockERC20");
        this.mock_erc721Contract = await ethers.getContractFactory("MockERC721Token");
        this.randGenContract = await ethers.getContractFactory("RNG_Test");
        // Deploying the instances
        this.rubyInstance = await this.mock_erc20Contract.deploy(
            "RUBY Token", "RUBY", lotto.buy.ruby, 18
        );
        this.randGenInstance = await this.randGenContract.deploy();
        this.nftInstance = await this.mock_erc721Contract.deploy("Lottery Bonus", "Bonus");
        this.factoryInstance = await upgrades.deployProxy(
            this.factoryContract,
            [this.rubyInstance.address, this.randGenInstance.address]
        );
        await this.factoryInstance.deployed();
        this.nftInstance.mint(this.owner.address, "");
        this.rubyInstance.connect(this.owner).transfer(
            this.buyer.address,
            lotto.buy.halfRuby
        );
    });
    describe("Creating a new lottery tests", function() {
        /**
         * Tests that in the nominal case nothing goes wrong
         */ 
        it("Nominal case", async function() {
            await this.nftInstance.connect(this.owner).approve(this.factoryInstance.address, 1);
            // Creating a new lottery
            await expect(
                this.factoryInstance.connect(this.owner).createNewLotto(this.nftInstance.address, 1, lotto.setup.sizeOfLottery, lotto.newLotto.cost, lotto.newLotto.distribution, this.treasury.address, lotto.newLotto.day)
            ).to.emit(this.factoryInstance, lotto.events.new)
            // Checking that emitted event contains correct information
            .withArgs(
                1
            );
        });
        /**
         * Testing that non-admins cannot create a lotto
         */
        it("Invalid admin", async function() {
            await expect(
                this.factoryInstance.connect(this.buyer).createNewLotto(this.nftInstance.address, 1, lotto.setup.sizeOfLottery, lotto.newLotto.cost, lotto.newLotto.distribution, this.treasury.address, lotto.newLotto.day)
            ).to.be.revertedWith(lotto.errors.invalid_owner);
        });
        /**
         * Create multiple Lottery
         */
        it("Multiple case", async function() {
            this.nftInstance.mint(this.owner.address, "");
            this.nftInstance.mint(this.owner.address, "");
            await this.nftInstance.approve(this.factoryInstance.address, 2);
            await this.nftInstance.approve(this.factoryInstance.address, 3);
            // Creating a new lottery
            await expect(
                this.factoryInstance.connect(this.owner).createNewLotto(this.nftInstance.address, 2, lotto.setup.sizeOfLottery, lotto.newLotto.cost, lotto.newLotto.distribution, this.treasury.address, lotto.newLotto.day)
            ).to.emit(this.factoryInstance, lotto.events.new)
            // Checking that emitted event contains correct information
            .withArgs(
                1
            );
            await expect(
                this.factoryInstance.connect(this.owner).createNewLotto(this.nftInstance.address, 3, lotto.setup.sizeOfLottery, lotto.newLotto.cost, lotto.newLotto.distribution, this.treasury.address, lotto.newLotto.day)
            ).to.emit(this.factoryInstance, lotto.events.new)
            // Checking that emitted event contains correct information
            .withArgs(
                2
            );
        });
        /**
         * Create multiple Lottery with different NFT collection
         */
        it("Multiple case(different NFT Collection)", async function() {
            this.nftInstance.mint(this.owner.address, 2);
            let nftInstance1 = await this.mock_erc721Contract.deploy("Bonus NFT", "Bonus");
            nftInstance1.mint(this.owner.address, "");
            await this.nftInstance.connect(this.owner).approve(this.factoryInstance.address, 2);
            await nftInstance1.connect(this.owner).approve(this.factoryInstance.address, 1);
            // Creating a new lottery
            await expect(
                this.factoryInstance.connect(this.owner).createNewLotto(this.nftInstance.address, 2, lotto.setup.sizeOfLottery, lotto.newLotto.cost, lotto.newLotto.distribution, this.treasury.address, lotto.newLotto.day)
            ).to.emit(this.factoryInstance, lotto.events.new)
            // Checking that emitted event contains correct information
            .withArgs(
                1
            );
            await expect(
                this.factoryInstance.connect(this.owner).createNewLotto(nftInstance1.address, 1, lotto.setup.sizeOfLottery, lotto.newLotto.cost, lotto.newLotto.distribution, this.treasury.address, lotto.newLotto.day)
            ).to.emit(this.factoryInstance, lotto.events.new)
            // Checking that emitted event contains correct information
            .withArgs(
                2
            );
        });
        /**
         * Wrong nft this.owner Lottery
         */
        it("Create Lottery test(wrong nft owner)", async function() {
            this.nftInstance.mint(this.owner.address, 2);
            this.nftInstance.mint(this.owner.address, 3);
            await this.nftInstance.connect(this.owner).approve(this.factoryInstance.address, 2);
            await this.nftInstance.connect(this.owner).approve(this.factoryInstance.address, 3);
            // Creating a new lottery
            await expect(
                this.factoryInstance.connect(this.owner).createNewLotto(this.nftInstance.address, 2, lotto.setup.sizeOfLottery, lotto.newLotto.cost, lotto.newLotto.distribution, this.treasury.address, lotto.newLotto.day)
            ).to.emit(this.factoryInstance, lotto.events.new)
            // Checking that emitted event contains correct information
            .withArgs(
                1
            );
            await expect(
                this.factoryInstance.connect(this.owner).createNewLotto(this.nftInstance.address, 2, lotto.setup.sizeOfLottery, lotto.newLotto.cost, lotto.newLotto.distribution, this.treasury.address, lotto.newLotto.day)
            ).to.be.revertedWith(lotto.errors.invalid_nft_owner);
        });
    });

    describe("Buying tickets tests", function() {
        /**
         * Creating a lotto for all buying tests to use. Will be a new instance
         * for each lotto. 
         */
        beforeEach( async function () {
            await this.nftInstance.connect(this.owner).approve(this.factoryInstance.address, 1);
            await this.factoryInstance.connect(this.owner).createNewLotto(this.nftInstance.address, 1, lotto.setup.sizeOfLottery, lotto.newLotto.cost, lotto.newLotto.distribution, this.treasury.address, lotto.newLotto.day)
            this.lotteryInstance = this.lotteryContract.attach(await this.factoryInstance.getCurrentLotto());
        });
        /**
         * Tests the batch buying of one token
         */
        it("Batch buying 1 tickets", async function() {
            // Getting the price to buy
            let price = await this.lotteryInstance.costToBuyTickets(
                1
            );
            // Generating chosen numbers for buy
            let ticketNumbers = generateLottoNumbers({
                numberOfTickets: 1, 
                lottoSize: lotto.setup.sizeOfLottery
            });
            // Approving lotto to spend cost
            await this.rubyInstance.connect(this.owner).approve(
                this.lotteryInstance.address,
                price.toString()
            );
            // Batch buying tokens
            await this.lotteryInstance.buyTicket(
                1,
                ticketNumbers
            );
            // Testing results
            assert.equal(
                price.toString(),
                lotto.buy.one.cost,
                "Incorrect cost for batch buy of 1"
            );
        });
        /**
         * Tests the batch buying of ten token
         */
        it("Batch buying 10 tickets", async function() {
            // Getting the price to buy
            let price = await this.lotteryInstance.costToBuyTickets(
                10
            );
            // Generating chosen numbers for buy
            let ticketNumbers = generateLottoNumbers({
                numberOfTickets: 10, 
                lottoSize: lotto.setup.sizeOfLottery
            });
            // Approving lotto to spend cost
            await this.rubyInstance.connect(this.owner).approve(
                this.lotteryInstance.address,
                price.toString()
            );
            // Batch buying tokens
            await this.lotteryInstance.buyTicket(
                10,
                ticketNumbers
            );
            // Testing results
            // TODO get user balances
            assert.equal(
                price.toString(),
                lotto.buy.ten.cost,
                "Incorrect cost for batch buy of 10"
            );
        });
        /**
         * Tests the batch buying of fifty token
         */
        it("Batch buying 50 tickets", async function() {
            // Getting the price to buy
            let price = await this.lotteryInstance.costToBuyTickets(
                50
            );
            // Generating chosen numbers for buy
            let ticketNumbers = generateLottoNumbers({
                numberOfTickets: 50, 
                lottoSize: lotto.setup.sizeOfLottery
            });
            // Approving lotto to spend cost
            await this.rubyInstance.connect(this.owner).approve(
                this.lotteryInstance.address,
                price.toString()
            );
            // Batch buying tokens
            await this.lotteryInstance.buyTicket(
                50,
                ticketNumbers
            );
            // Testing results
            assert.equal(
                price.toString(),
                lotto.buy.fifty.cost,
                "Incorrect cost for batch buy of 50"
            );
        }); 
        /**
         * Tests the batch buying with invalid ticket numbers
         */
        it("Invalid chosen numbers", async function() {
            // Getting the price to buy
            let price = await this.lotteryInstance.costToBuyTickets(
                10
            );
            // Generating chosen numbers for buy
            let ticketNumbers = generateLottoNumbers({
                numberOfTickets: 9, 
                lottoSize: lotto.setup.sizeOfLottery
            });
            // Approving lotto to spend cost
            await this.rubyInstance.connect(this.owner).approve(
                this.factoryInstance.address,
                price.toString()
            );
            // Batch buying tokens
            await expect(
                this.lotteryInstance.connect(this.owner).buyTicket(
                    10,
                    ticketNumbers
                )
            ).to.be.revertedWith(lotto.errors.invalid_mint_numbers);
        });
        /**
         * Tests the batch buying when paused
         */
        it("When paused", async function() {
            // Getting the price to buy
            let price = await this.lotteryInstance.costToBuyTickets(
                10
            );
            // Generating chosen numbers for buy
            let ticketNumbers = generateLottoNumbers({
                numberOfTickets: 10, 
                lottoSize: lotto.setup.sizeOfLottery
            });
            // Approving lotto to spend cost
            await this.rubyInstance.connect(this.owner).approve(
                this.factoryInstance.address,
                price.toString()
            );
            await this.lotteryInstance.connect(this.owner).pause();
            // Batch buying tokens
            await expect(
                this.lotteryInstance.connect(this.owner).buyTicket(
                    10,
                    ticketNumbers
                )
            ).to. be.revertedWith(lotto.errors.invalid_mint_paused);
        });
        /**
         * Tests the batch buying with invalid approve
         */
        it("Invalid ruby transfer", async function() {
            // Getting the price to buy
            let price = await this.lotteryInstance.costToBuyTickets(
                10
            );
            // Generating chosen numbers for buy
            let ticketNumbers = generateLottoNumbers({
                numberOfTickets: 10, 
                lottoSize: lotto.setup.sizeOfLottery,
            });
            // Batch buying tokens
            await expect(
                this.lotteryInstance.connect(this.owner).buyTicket(
                    10,
                    ticketNumbers
                )
            ).to.be.revertedWith(lotto.errors.invalid_mint_approve);
        });
        /**
         * Tests the batch buying after the valid time period fails
         */
        it("Invalid buying time", async function() {
            // Getting the price to buy
            let price = await this.lotteryInstance.costToBuyTickets(
                10
            );
            // Generating chosen numbers for buy
            let ticketNumbers = generateLottoNumbers({
                numberOfTickets: 10, 
                lottoSize: lotto.setup.sizeOfLottery
            });
            // Approving lotto to spend cost
            await this.rubyInstance.connect(this.owner).approve(
                this.lotteryInstance.address,
                price
            );
            // Setting the time forward 
            await network.provider.send("evm_increaseTime", [lotto.newLotto.closeIncrease]);
            await network.provider.send("evm_mine");
            // Batch buying tokens
            await expect(
                this.lotteryInstance.connect(this.owner).buyTicket(
                    10,
                    ticketNumbers
                )
            ).to.be.revertedWith(lotto.errors.invalid_buying_timestamp_closed);
        });
    });
    describe("Drawing numbers tests", function() {
        beforeEach( async function () {
            await this.nftInstance.connect(this.owner).approve(this.factoryInstance.address, 1);
            // Creating a new lottery
            await this.factoryInstance.connect(this.owner).createNewLotto(this.nftInstance.address, 1, lotto.setup.sizeOfLottery, lotto.newLotto.cost, lotto.newLotto.distribution, this.treasury.address, lotto.newLotto.day);
            this.lotteryInstance = this.lotteryContract.attach(await this.factoryInstance.getCurrentLotto());
        });
        /**
         * Testing that the winning numbers can be set in the nominal case
         */
        it("Set winning numbers", async function() {
            // Setting the time so that we can set winning numbers
            // Setting the time forward 
            await network.provider.send("evm_increaseTime", [lotto.newLotto.closeIncrease]);
            await network.provider.send("evm_mine");
            // Drawing the numbers
            await this.lotteryInstance.connect(this.owner).drawWinningNumbers();
            
            // Getting info after call
            let lotteryInfoAfter = await this.lotteryInstance.getWinningNumbers();
            // Testing
            assert.equal(
                lotteryInfoAfter.toString(),
                lotto.newLotto.win.winningNumbers,
                "Winning numbers incorrect after"
            );
        });
        /**
         * Testing that a non owner cannot set the winning numbers
         */
        it("Invalid winning numbers (owner)", async function() {
            // Setting the time forward 
            await network.provider.send("evm_increaseTime", [lotto.newLotto.closeIncrease]);
            await network.provider.send("evm_mine");
            // Drawing the numbers
            await expect(
                this.lotteryInstance.connect(this.buyer).drawWinningNumbers()
            ).to.be.revertedWith(lotto.errors.invalid_owner);
        });
        /**
         * Testing that numbers cannot be updated once chosen
         */
        it("Invalid winning numbers (already chosen)", async function() {
            // Setting the time so that we can set winning numbers
            // Setting the time forward 
            await network.provider.send("evm_increaseTime", [lotto.newLotto.closeIncrease]);
            await network.provider.send("evm_mine");
            // Drawing the numbers
            await this.lotteryInstance.connect(this.owner).drawWinningNumbers();
            // Drawing the numbers again
            await expect(
                this.lotteryInstance.connect(this.owner).drawWinningNumbers()
            ).to.be.revertedWith(lotto.errors.invalid_draw_repeat);
        });
        /**
         * Testing that winning numbers cannot be set while lottery still in 
         * progress
         */
        it("Invalid winning numbers (time)", async function() {
            await expect(
                this.lotteryInstance.connect(this.owner).drawWinningNumbers()
            ).to.be.revertedWith(lotto.errors.invalid_draw_time);
        });
    });

    describe("Claiming tickets tests", function() {
        beforeEach( async function () {
            await this.nftInstance.connect(this.owner).approve(this.factoryInstance.address, 1);
            await this.factoryInstance.connect(this.owner).createNewLotto(this.nftInstance.address, 1, lotto.setup.sizeOfLottery, lotto.newLotto.cost, lotto.newLotto.distribution, this.treasury.address, lotto.newLotto.day)
            this.lotteryInstance = this.lotteryContract.attach(await this.factoryInstance.getCurrentLotto());
            // Buying tickets
            // Getting the price to buy
            let prices = await this.lotteryInstance.costToBuyTickets(50);
            // Sending the this.buyer the needed amount of ruby
            // Approving lotto to spend cost
            await this.rubyInstance.connect(this.buyer).approve(
                this.lotteryInstance.address,
                prices
            );
            // Generating chosen numbers for buy
            let ticketNumbers = generateLottoNumbers({
                numberOfTickets: 50, 
                lottoSize: lotto.setup.sizeOfLottery,
            });
            // Batch buying tokens
            await this.lotteryInstance.connect(this.buyer).buyTicket(
                50,
                ticketNumbers
            );
        });
        /**
         * Testing that a claim cannot happen while the lottery is still active
         */
        it("Invalid claim (incorrect time)", async function() {
            // Setting current time so that drawing is correct
            // Setting the time forward 
            await network.provider.send("evm_increaseTime", [lotto.newLotto.closeIncrease]);
            await network.provider.send("evm_mine");
            // Drawing the numbers
            await this.lotteryInstance.connect(this.owner).drawWinningNumbers()
            
            // Setting the time backward
            await network.provider.send("evm_increaseTime", [-lotto.newLotto.closeIncrease]);
            await network.provider.send("evm_mine");
            // Claiming winnings 
            await expect(
                this.lotteryInstance.connect(this.buyer).claimReward()
            ).to.be.revertedWith(lotto.errors.invalid_claim_time);
        });
        /**
         * Testing that a claim cannot happen until the winning numbers are
         * chosen. 
         */
        it("Invalid claim (winning numbers not chosen)", async function() {
            // Setting the time forward 
            await network.provider.send("evm_increaseTime", [lotto.newLotto.closeIncrease]);
            await network.provider.send("evm_mine");
            // Claiming winnings 
            await expect(
                this.lotteryInstance.connect(this.buyer).claimReward()
            ).to.be.revertedWith(lotto.errors.invalid_claim_draw);
        });
    });
    describe("Claim Test for inividual winners", function() {
        beforeEach( async function () {
            await this.nftInstance.connect(this.owner).approve(this.factoryInstance.address, 1);
            await this.factoryInstance.connect(this.owner).createNewLotto(this.nftInstance.address, 1, lotto.setup.sizeOfLottery, lotto.newLotto.cost, lotto.newLotto.distribution, this.treasury.address, lotto.newLotto.day)
            this.lotteryInstance = this.lotteryContract.attach(await this.factoryInstance.getCurrentLotto());
            // Buying tickets
            // Getting the price to buy
            let prices = await this.lotteryInstance.costToBuyTickets(49);
            // Sending the this.buyer the needed amount of ruby
            // Approving lotto to spend cost
            await this.rubyInstance.connect(this.buyer).approve(
                this.lotteryInstance.address,
                prices
            );
            // Generating chosen numbers for buy
            let ticketNumbers = generateLottoNumbers({
                numberOfTickets: 49, 
                lottoSize: lotto.setup.sizeOfLottery,
            });
            // Batch buying tokens
            await this.lotteryInstance.connect(this.buyer).buyTicket(
                49,
                ticketNumbers
            );
        });
        /**
         * Testing that claim for 1st winner
         */
        it("Claim Test (1st winner)", async function() {
            let price = await this.lotteryInstance.costToBuyTickets(1);
            await this.rubyInstance.connect(this.owner).approve(
                this.lotteryInstance.address,
                price
            );
            await this.lotteryInstance.connect(this.owner).buyTicket(
                1,
                [lotto.newLotto.win.winningNumbersArr[0]]
            );
            // Setting current time so that drawing is correct
            // Setting the time forward 
            await network.provider.send("evm_increaseTime", [lotto.newLotto.closeIncrease]);
            await network.provider.send("evm_mine");
            // Drawing the numbers
            await this.lotteryInstance.connect(this.owner).drawWinningNumbers()
            // Claiming winnings 
            let balanceBefore = new BigNumber((await this.rubyInstance.balanceOf(this.owner.address)).toString());
            await this.lotteryInstance.connect(this.owner).claimReward();
            let balanceAfter = new BigNumber((await this.rubyInstance.balanceOf(this.owner.address)).toString());
            let diff = balanceAfter.minus(balanceBefore);
            assert.equal(
                diff.toString(),
                lotto.newLotto.win.first.toString(),
                "1st winner claim amount is wrong"
            );
            assert.equal(
                await this.nftInstance.ownerOf(1),
                this.owner.address,
                "NFT reward to 1st winner is invalid"
            );
        });
        /**
         * Testing that claim for 2nd winner
         */
        it("Claim Test (2nd winner)", async function() {
            let price = await this.lotteryInstance.costToBuyTickets(1);
            await this.rubyInstance.connect(this.owner).approve(
                this.lotteryInstance.address,
                price
            );
            await this.lotteryInstance.connect(this.owner).buyTicket(
                1,
                [lotto.newLotto.win.winningNumbersArr[1]]
            );
            // Setting current time so that drawing is correct
            // Setting the time forward 
            await network.provider.send("evm_increaseTime", [lotto.newLotto.closeIncrease]);
            await network.provider.send("evm_mine");
            // Drawing the numbers
            await this.lotteryInstance.connect(this.owner).drawWinningNumbers()
            // Claiming winnings 
            let balanceBefore = new BigNumber((await this.rubyInstance.balanceOf(this.owner.address)).toString());
            await this.lotteryInstance.connect(this.owner).claimReward();
            let balanceAfter = new BigNumber((await this.rubyInstance.balanceOf(this.owner.address)).toString());
            let diff = balanceAfter.minus(balanceBefore);
            assert.equal(
                diff.toString(),
                lotto.newLotto.win.second.toString(),
                "2nd winner claim amount is wrong"
            );
        });
        /**
         * Testing that claim for 3rd winner
         */
        it("Claim Test (3rd winner)", async function() {
            let price = await this.lotteryInstance.costToBuyTickets(1);
            await this.rubyInstance.connect(this.owner).approve(
                this.lotteryInstance.address,
                price
            );
            await this.lotteryInstance.connect(this.owner).buyTicket(
                1,
                [lotto.newLotto.win.winningNumbersArr[2]]
            );
            // Setting current time so that drawing is correct
            // Setting the time forward 
            await network.provider.send("evm_increaseTime", [lotto.newLotto.closeIncrease]);
            await network.provider.send("evm_mine");
            // Drawing the numbers
            await this.lotteryInstance.connect(this.owner).drawWinningNumbers()
            // Claiming winnings 
            let balanceBefore = new BigNumber((await this.rubyInstance.balanceOf(this.owner.address)).toString());
            await this.lotteryInstance.connect(this.owner).claimReward();
            let balanceAfter = new BigNumber((await this.rubyInstance.balanceOf(this.owner.address)).toString());
            let diff = balanceAfter.minus(balanceBefore);
            assert.equal(
                diff.toString(),
                lotto.newLotto.win.third.toString(),
                "3rd winner claim amount is wrong"
            );
        });
        /**
         * Testing that claim for 4th winner
         */
        it("Claim Test (4th winner)", async function() {
            let price = await this.lotteryInstance.costToBuyTickets(1);
            await this.rubyInstance.connect(this.owner).approve(
                this.lotteryInstance.address,
                price
            );
            await this.lotteryInstance.connect(this.owner).buyTicket(
                1,
                [lotto.newLotto.win.winningNumbersArr[3]]
            );
            // Setting current time so that drawing is correct
            // Setting the time forward 
            await network.provider.send("evm_increaseTime", [lotto.newLotto.closeIncrease]);
            await network.provider.send("evm_mine");
            // Drawing the numbers
            await this.lotteryInstance.connect(this.owner).drawWinningNumbers()
            // Claiming winnings 
            let balanceBefore = new BigNumber((await this.rubyInstance.balanceOf(this.owner.address)).toString());
            await this.lotteryInstance.connect(this.owner).claimReward();
            let balanceAfter = new BigNumber((await this.rubyInstance.balanceOf(this.owner.address)).toString());
            let diff = balanceAfter.minus(balanceBefore);
            assert.equal(
                diff.toString(),
                lotto.newLotto.win.fourth.toString(),
                "4th winner claim amount is wrong"
            );
        });
    });
    describe("Withdrawal test", function() {
        beforeEach( async function () {
            await this.nftInstance.connect(this.owner).approve(this.factoryInstance.address, 1);
            await this.factoryInstance.connect(this.owner).createNewLotto(this.nftInstance.address, 1, lotto.setup.sizeOfLottery, lotto.newLotto.cost, lotto.newLotto.distribution, this.treasury.address, lotto.newLotto.day)
            this.lotteryInstance = this.lotteryContract.attach(await this.factoryInstance.getCurrentLotto());
            // Buying tickets
            // Getting the price to buy
            let prices = await this.lotteryInstance.costToBuyTickets(50);
            // Sending the this.buyer the needed amount of ruby
            // Approving lotto to spend cost
            await this.rubyInstance.connect(this.buyer).approve(
                this.lotteryInstance.address,
                prices
            );
            // Generating chosen numbers for buy
            let ticketNumbers = generateLottoNumbers({
                numberOfTickets: 50, 
                lottoSize: lotto.setup.sizeOfLottery,
            });
            // Batch buying tokens
            await this.lotteryInstance.connect(this.buyer).buyTicket(
                50,
                ticketNumbers
            );
        });

        it("Custom Withdrawal", async function() {
            // Setting the time forward 
            await network.provider.send("evm_increaseTime", [lotto.newLotto.closeIncrease]);
            await network.provider.send("evm_mine");
            // Drawing the numbers
            await this.lotteryInstance.connect(this.owner).drawWinningNumbers();
            let balanceBefore = new BigNumber((await this.rubyInstance.balanceOf(this.lotteryInstance.address)).toString());
            await this.lotteryInstance.connect(this.owner).withdraw(lotto.buy.one.cost);
            let balanceAfter = new BigNumber((await this.rubyInstance.balanceOf(this.lotteryInstance.address)).toString());
            let diff = balanceBefore.minus(balanceAfter);
            assert.equal(
                diff.toString(),
                lotto.buy.one.cost.toString(),
                "Withdrawal amount is invalid"
            );
        });

        it("Invalid Withdrawal(Not Admin)", async function() {
            // Setting the time forward 
            await network.provider.send("evm_increaseTime", [lotto.newLotto.closeIncrease]);
            await network.provider.send("evm_mine");
            // Drawing the numbers
            await this.lotteryInstance.connect(this.owner).drawWinningNumbers();
            await expect(
                this.lotteryInstance.connect(this.buyer).withdraw(lotto.buy.one.cost)
            ).to.be.revertedWith(lotto.errors.invalid_owner);
        });

        it("Invalid Withdrawal(before draw)", async function() {
            await expect(
                this.lotteryInstance.connect(this.owner).withdraw(lotto.buy.one.cost)
            ).to.be.revertedWith(lotto.errors.invalid_claim_draw);
        });
    });
    describe("Lottery Factory view test", function() {
        beforeEach( async function () {
            await this.nftInstance.connect(this.owner).approve(this.factoryInstance.address, 1);
            await this.factoryInstance.connect(this.owner).createNewLotto(this.nftInstance.address, 1, lotto.setup.sizeOfLottery, lotto.newLotto.cost, lotto.newLotto.distribution, this.treasury.address, lotto.newLotto.day);
            this.lotteryInstance = this.lotteryContract.attach(await this.factoryInstance.getCurrentLotto());
            // Buying tickets
            // Getting the price to buy
            let prices = await this.lotteryInstance.costToBuyTickets(49);
            // Sending the this.buyer the needed amount of ruby
            // Approving lotto to spend cost
            await this.rubyInstance.connect(this.buyer).approve(
                this.lotteryInstance.address,
                prices
            );
            // Generating chosen numbers for buy
            let ticketNumbers = generateLottoNumbers({
                numberOfTickets: 49, 
                lottoSize: lotto.setup.sizeOfLottery,
            });
            // Batch buying tokens
            await this.lotteryInstance.connect(this.buyer).buyTicket(
                49,
                ticketNumbers
            );
        });
        it("costToBuyTickets function", async function() {
            assert.equal(
                (await this.factoryInstance.costToBuyTickets(1)).toString(),
                lotto.newLotto.cost.toString(),
                "Cost is inccorect"
            );
        });
        /**
         * Testing that the winning numbers can be set in the nominal case
         */
        it("Get winning numbers", async function() {
            // Setting the time so that we can set winning numbers
            // Setting the time forward 
            await network.provider.send("evm_increaseTime", [lotto.newLotto.closeIncrease]);
            await network.provider.send("evm_mine");
            // Drawing the numbers
            await this.lotteryInstance.connect(this.owner).drawWinningNumbers();
            
            // Getting info after call
            let lotteryInfoAfter = await this.factoryInstance.getWinningNumbers();
            // Testing
            assert.equal(
                lotteryInfoAfter.toString(),
                lotto.newLotto.win.winningNumbers,
                "Winning numbers incorrect after"
            );
        });
        /**
         * GetReward view test Lottery Factory
         */
        it("GetReward Test (1st winner)", async function() {
            let price = await this.lotteryInstance.costToBuyTickets(1);
            await this.rubyInstance.connect(this.owner).approve(
                this.lotteryInstance.address,
                price
            );
            await this.lotteryInstance.connect(this.owner).buyTicket(
                1,
                [lotto.newLotto.win.winningNumbersArr[0]]
            );
            // Setting current time so that drawing is correct
            // Setting the time forward 
            await network.provider.send("evm_increaseTime", [lotto.newLotto.closeIncrease]);
            await network.provider.send("evm_mine");
            // Drawing the numbers
            await this.lotteryInstance.connect(this.owner).drawWinningNumbers()
            // // Claiming winnings 
            // let balanceBefore = new BigNumber((await this.rubyInstance.balanceOf(this.owner.address)).toString());
            // await this.lotteryInstance.connect(this.owner).claimReward();
            // let balanceAfter = new BigNumber((await this.rubyInstance.balanceOf(this.owner.address)).toString());
            // let diff = balanceAfter.minus(balanceBefore);
            assert.equal(
                (await this.factoryInstance.getRewardAmount(this.owner.address)).toString(),
                lotto.newLotto.win.first.toString(),
                "1st winner claim amount is wrong"
            );
            assert.equal(
                await this.factoryInstance.getRewardNFT(this.owner.address),
                true,
                "NFT reward to 1st winner is invalid"
            );
        });
    });
});
