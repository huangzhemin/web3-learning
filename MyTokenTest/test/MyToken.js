const hre = require("hardhat"); //hardhat runtime environment
const { expect } = require("chai");

const initialSupply = 10000;

let MyTokenContract;

let account1, account2;

describe("MyToken Test", async () => {
    const {ethers} = hre;
    beforeEach(async () => {
        [account1, account2] = await ethers.getSigners();
        console.log("account1: ", account1.address);
        console.log("account2: ", account2.address);

        const MyToken = await ethers.getContractFactory("MyToken");
        MyTokenContract = await MyToken.connect(account2).deploy(initialSupply);
        await MyTokenContract.waitForDeployment();

        const MyTokenAddress = await MyTokenContract.getAddress();

        expect(MyTokenAddress).length.greaterThan(0);

        console.log("MyTokenAddress: ", MyTokenAddress);
    })

    it("验证下合约里的name, symbol, decimal", async () => {  
        const name = await MyTokenContract.name();
        const symbol = await MyTokenContract.symbol();
        const decimal = await MyTokenContract.decimals();

        expect(name).to.equal("MyToken");
        expect(symbol).to.equal("MTK");
        expect(decimal).to.equal(18);
        console.log("decimal: ", decimal);
    })

    it("测试转账", async () => {  
        const resp = await MyTokenContract.transfer(account1.address, initialSupply / 2);
        console.log("resp: ", resp);
        const balanceOfAccount2 = await MyTokenContract.balanceOf(account2.address);
        expect(balanceOfAccount2).to.equal(initialSupply / 2);
        console.log("balanceOfAccount2: ", balanceOfAccount2);
    }) 
})