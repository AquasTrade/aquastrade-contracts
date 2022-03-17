const { ethers } = require("ethers");
const { BigNumber } = require("bignumber.js");

const lotto = {
    setup: {
        sizeOfLottery: 4,
    },
    newLotto: {
        distribution: [40, 25, 10, 5, 20],
        prize: ethers.utils.parseUnits("1000", 18),
        cost: ethers.utils.parseUnits("10", 18),
        closeIncrease: 24 * 60 * 60 * 1000 + 10,
        endIncrease: 20000,
        day: 24 * 60 * 60 * 1000,
        win: {
            blankWinningNumbers: "",
            winningNumbers: "3037,1954,9410,2834",
            winningNumbersArr: [ 3037,1954,9410,2834 ],
            first: ethers.utils.parseUnits("200", 18),
            second: ethers.utils.parseUnits("125", 18),
            third: ethers.utils.parseUnits("50", 18),
            fourth: ethers.utils.parseUnits("25", 18),
        }
    }, 
    events: {
        new: "LotteryCreated",
    },
    buy: {
        ruby: ethers.utils.parseUnits("10000000", 18),
        halfRuby: ethers.utils.parseUnits("5000000", 18),
        one: {
            cost: ethers.utils.parseUnits('10', 18)
        },
        ten: {
            cost: ethers.utils.parseUnits('100', 18)
        },
        fifty: {
            cost: ethers.utils.parseUnits('500', 18)
        }
    },
    errorData: {
        distribution_length: [5, 10, 15, 20, 10],
        distribution_total: [5, 10, 15, 20],
        prize: ethers.utils.parseUnits("0", 18),
        cost: ethers.utils.parseUnits("0", 18),
        startTime: ethers.utils.parseUnits("0", 18),
        ticketNumbers: [22, 15, 35, 40],
        bucket: 0
    },
    errors: {
        invalid_nft_owner: "LotteryFactory: Owner of NFT is invalid",
        invalid_owner: "Ownable: caller is not the owner",
        invalid_buying_timestamp_closed: "Lottery: Ticket selling is closed",
        invalid_mint_numbers: "Lottery: Invalid chosen numbers",
        invalid_mint_approve: "ERC20: transfer amount exceeds allowance",
        invalid_mint_paused: "Pausable: paused",
        invalid_draw_time: "Lottery: Ticket selling is not yet closed",
        invalid_draw_repeat: "Lottery: Have already drawn the winning number",
        invalid_claim_time: "Lottery: Ticket selling is not yet closed",
        invalid_claim_draw: "Lottery: Winning Numbers not chosen yet",
    }
}

function generateLottoNumbers({
    numberOfTickets,
    lottoSize,
}: {numberOfTickets: number, lottoSize: number}) {
    let numberOfNumbers : number[] = [];
    for (let i = 0; i < numberOfTickets; i++) {
        for (;;) {
            let val = Math.floor(Math.random() * (10 ** lottoSize - 1) + 1); 
            let j;
            for (j = 0; j < i; j++) if (numberOfNumbers[j] == val) break;
            if (j == i) {
                numberOfNumbers[i] = val;
                break;
            }
        }
    }
    return numberOfNumbers;
}

module.exports = {
    lotto,
    BigNumber,
    generateLottoNumbers
}