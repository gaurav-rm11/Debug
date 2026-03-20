// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract BountyEscrow {
    address public organization;
    uint256 public bountyAmount;
    bool public isActive;
    string public programName;
    
    event BountyDeposited(address indexed org, uint256 amount);
    event BountyPaid(address indexed researcher, uint256 amount);
    event BountyClosed();

    constructor(string memory _programName) payable {
        organization = msg.sender;
        bountyAmount = msg.value;
        isActive = true;
        programName = _programName;
        if (msg.value > 0) {
            emit BountyDeposited(msg.sender, msg.value);
        }
    }

    modifier onlyOrg() {
        require(msg.sender == organization, "Only Organization can perform this action");
        _;
    }

    function deposit() external payable onlyOrg {
        require(isActive, "Bounty is closed");
        require(msg.value > 0, "Deposit amount must be > 0");
        bountyAmount += msg.value;
        emit BountyDeposited(msg.sender, msg.value);
    }

    function approveAndPay(address payable researcher, uint256 amount) external onlyOrg {
        require(isActive, "Bounty is closed");
        require(amount <= bountyAmount, "Insufficient funds in escrow");
        require(amount > 0, "Payout amount must be > 0");

        bountyAmount -= amount;
        researcher.transfer(amount);
        
        emit BountyPaid(researcher, amount);
    }

    function closeBounty() external onlyOrg {
        require(isActive, "Bounty is already closed");
        isActive = false;
        
        if (bountyAmount > 0) {
            uint256 amountToRefund = bountyAmount;
            bountyAmount = 0;
            payable(organization).transfer(amountToRefund);
        }
        
        emit BountyClosed();
    }
}
