import { expect, assert } from "chai";
import { network, upgrades } from "hardhat";
import { BigNumber } from "ethers";

describe("Lottery Factory contract", function() {
    beforeEach(async function () {
        // Getting the signers provided by ethers
        const signers = await ethers.getSigners();
        // Creating the active wallets for use
        this.owner = signers[0];
        this.buyer = signers[1];
        this.treasury = signers[2];
        this.burner = signers[3];

        // Getting the lottery code (abi, bytecode, name)
        this.factoryContract = await ethers.getContractFactory("LotteryFactory");
        this.lotteryContract = await ethers.getContractFactory("Lottery");
        // Getting the lotteryNFT code (abi, bytecode, name)
        this.mock_erc20Contract = await ethers.getContractFactory("MockERC20");
        this.mock_erc721Contract = await ethers.getContractFactory("MockERC721Token");
        this.randGenContract = await ethers.getContractFactory("RNG_Test");
        // Deploying the instances
        this.rubyInstance = await this.mock_erc20Contract.deploy(
            "RUBY Token", "RUBY", ethers.utils.parseUnits("10000000", 18), 18
        );
        this.randGenInstance = await this.randGenContract.deploy();
        this.nftInstance = await this.mock_erc721Contract.deploy("Lottery Bonus", "Bonus");
        this.factoryInstance = await upgrades.deployProxy(
            this.factoryContract,
            [this.rubyInstance.address, this.randGenInstance.address, this.treasury.address, this.burner.address]
        );
        await this.factoryInstance.deployed();
        this.nftInstance.mint(this.owner.address, "");
        this.rubyInstance.connect(this.owner).transfer(
            this.buyer.address,
            ethers.utils.parseUnits("5000000", 18)
        );

        // from RNG_Test
        // each num % (10 ** lotterySize)
        this.RNG_NUMBERS = [126009, 5533037, 9311954, 5319410, 9952834, 3396771, 5720753]

    });
    describe("Small lottery", function() {
        beforeEach( async function () {
            this.ticketCost = ethers.utils.parseUnits("10", 18);
            this.day = 24 * 60 * 60 * 1000
            this.lotterySize = 1  // 10 tickets

            await this.nftInstance.connect(this.owner).approve(this.factoryInstance.address, 1);
            await this.factoryInstance.connect(this.owner).createNewLotto(this.rubyInstance.address, this.nftInstance.address, 1,
                this.lotterySize,
                this.ticketCost,
                [50, 25, 25],
                this.day)
            this.lotteryInstance = this.lotteryContract.attach(await this.factoryInstance.getCurrentLotto());
        });
        it("1 ticket 1 winner", async function() {
            let price = await this.lotteryInstance.getTicketPrice();
            await this.rubyInstance.connect(this.buyer).approve(
                this.lotteryInstance.address,
                price
            );

            await this.lotteryInstance.connect(this.buyer).buyTicket(
                1,
                [this.RNG_NUMBERS[0] % (10 ** this.lotterySize)]
            );

            // check bought numbers
            let tickets = await this.lotteryInstance.connect(this.buyer).getTickets(this.buyer.address)
            expect(tickets,
                'Correct tickets').to.be.eql([BigNumber.from((this.RNG_NUMBERS[0] % (10 ** this.lotterySize)))])

            expect (
                await this.lotteryInstance.isTicketAvailable(this.RNG_NUMBERS[0] % (10 ** this.lotterySize))
            ).to.be.eq(false);

            await network.provider.send("evm_increaseTime", [this.day + 10]);
            await network.provider.send("evm_mine");

            let pot = await this.lotteryInstance.connect(this.buyer).getTotalRuby();
            await this.lotteryInstance.connect(this.owner).drawWinningNumbers()

            let winningNumbers = await this.lotteryInstance.connect(this.buyer).getWinningNumbers()
            expect(winningNumbers,
                'Correct winning numbers').to.be.eql([BigNumber.from((this.RNG_NUMBERS[0] % (10 ** this.lotterySize)))])
            let winningAddresses = await this.lotteryInstance.connect(this.buyer).getWinningAddresses()
            expect(winningAddresses,
                'Buyer is the winner').to.be.eql([this.buyer.address])

            let balanceBefore = await this.rubyInstance.balanceOf(this.buyer.address);
            await this.lotteryInstance.connect(this.buyer).claimReward();
            let balanceAfter = await this.rubyInstance.balanceOf(this.buyer.address);
            let diff = balanceAfter.sub(balanceBefore);
            expect (diff, 'Buyer wins half the pot').to.be.eq(pot.div(2));
        });
        it("2 duplicate tickets 1 winner", async function() {
            let price = await this.lotteryInstance.getTicketPrice();
            await this.rubyInstance.connect(this.buyer).approve(
                this.lotteryInstance.address,
                price.mul(2)
            );

            await this.lotteryInstance.connect(this.buyer).buyTicket(
                2,
                [this.RNG_NUMBERS[0] % (10 ** this.lotterySize), this.RNG_NUMBERS[0] % (10 ** this.lotterySize)]
            );

            // check bought numbers
            let tickets = await this.lotteryInstance.connect(this.buyer).getTickets(this.buyer.address)
            expect(tickets,
                'Correct tickets').to.be.eql([BigNumber.from((this.RNG_NUMBERS[0] % (10 ** this.lotterySize)))])

            await network.provider.send("evm_increaseTime", [this.day + 10]);
            await network.provider.send("evm_mine");

            let pot = await this.lotteryInstance.connect(this.buyer).getTotalRuby();
            await this.lotteryInstance.connect(this.owner).drawWinningNumbers()

            let winningNumbers = await this.lotteryInstance.connect(this.buyer).getWinningNumbers()
            expect(winningNumbers,
                'Correct winning numbers').to.be.eql([BigNumber.from((this.RNG_NUMBERS[0] % (10 ** this.lotterySize)))])
            let winningAddresses = await this.lotteryInstance.connect(this.buyer).getWinningAddresses()
            expect(winningAddresses,
                'Buyer is the winner').to.be.eql([this.buyer.address])

            let balanceBefore = await this.rubyInstance.balanceOf(this.buyer.address);
            await this.lotteryInstance.connect(this.buyer).claimReward();
            let balanceAfter = await this.rubyInstance.balanceOf(this.buyer.address);
            let diff = balanceAfter.sub(balanceBefore);
            expect (diff, 'Buyer wins half the pot').to.be.eq(pot.div(2));
        });
    });
});
