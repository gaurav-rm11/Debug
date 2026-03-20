const { expect } = require("chai");
const hre = require("hardhat");

describe("BountyEscrow", function () {
  let Escrow, escrow, owner, researcher;

  beforeEach(async function () {
    [owner, researcher] = await hre.ethers.getSigners();
    Escrow = await hre.ethers.getContractFactory("BountyEscrow");
    // Deploy with 1 ETH initial bounty
    escrow = await Escrow.deploy("Test Program Engine", { value: hre.ethers.parseEther("1.0") });
  });

  it("Should set the right organization and deposit funds on deployment", async function () {
    expect(await escrow.organization()).to.equal(owner.address);
    expect(await escrow.bountyAmount()).to.equal(hre.ethers.parseEther("1.0"));
    
    const contractBalance = await hre.ethers.provider.getBalance(await escrow.getAddress());
    expect(contractBalance).to.equal(hre.ethers.parseEther("1.0"));
  });

  it("Should pay the researcher successfully and update balance", async function () {
    const payout = hre.ethers.parseEther("0.6");
    
    await escrow.approveAndPay(researcher.address, payout);
      
    // Assert remaining balance
    expect(await escrow.bountyAmount()).to.equal(hre.ethers.parseEther("0.4"));
    
    const contractBalance = await hre.ethers.provider.getBalance(await escrow.getAddress());
    expect(contractBalance).to.equal(hre.ethers.parseEther("0.4"));
  });

  it("Should fail payout if insufficient funds", async function () {
    const payout = hre.ethers.parseEther("2.0");
    let failed = false;
    try {
      await escrow.approveAndPay(researcher.address, payout);
    } catch (error) {
      failed = true;
    }
    expect(failed).to.be.true;
  });

  it("Should close bounty and refund remainder", async function () {
    await escrow.closeBounty();
    expect(await escrow.isActive()).to.equal(false);
    expect(await escrow.bountyAmount()).to.equal(0n);
    
    const contractBalance = await hre.ethers.provider.getBalance(await escrow.getAddress());
    expect(contractBalance).to.equal(0n);
  });
});
