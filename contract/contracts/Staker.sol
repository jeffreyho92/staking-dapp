// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

contract Staker {

    struct Stake{
        uint256 balance;
        uint256 depositTimestamp;
    }

    mapping(address => Stake) public stakes;

    uint256 public rewardRatePerSecond;
    uint256 public withdrawalDeadline = 60 seconds;

    event Staking(address indexed sender, uint256 amount);
    event Execute(address indexed sender, uint256 amount);
    event Received(address indexed sender, uint256 amount, uint256 interest);

    constructor(uint256 rewardRate) {
        rewardRatePerSecond = rewardRate;
    }

    modifier withdrawalDeadlineReached(bool requireReached){
        uint256 timeRemaining = withdrawalTimeLeft();
        if(requireReached){
            require(timeRemaining == 0, "Withdrawal period is not reached yet");
        } else {
            require(timeRemaining > 0, "Withdrawal period has been reached");
        }
        _;
    }
    
    function stake() public payable withdrawalDeadlineReached(false){
        require(stakes[msg.sender].balance <= 0, "You are staking!");
        stakes[msg.sender] = Stake(msg.value, block.timestamp);
        emit Staking(msg.sender, msg.value);
    }

    function withdraw() public withdrawalDeadlineReached(true){
        require(stakes[msg.sender].balance > 0, "You have no balance to withdraw!");
        uint256 individualBalance = stakes[msg.sender].balance;
        uint256 interest = ((block.timestamp - stakes[msg.sender].depositTimestamp ) * rewardRatePerSecond);
        uint256 indBalanceRewards = individualBalance + interest;
        
        // contract's balance not enought to pay interest
        if(address(this).balance < indBalanceRewards){
            interest = address(this).balance - individualBalance;
            indBalanceRewards = address(this).balance;
        }
        stakes[msg.sender].balance = 0;
        stakes[msg.sender].depositTimestamp = 0;

        (bool sent, ) = msg.sender.call{value: indBalanceRewards}("");
        require(sent, "RIP; withdrawal failed!");
        emit Received(msg.sender, indBalanceRewards, interest);
    }

    function withdrawalTimeLeft() public view returns (uint256){
        uint256 depositTimestamp = block.timestamp;
        if(stakes[msg.sender].depositTimestamp > 0){
            depositTimestamp = stakes[msg.sender].depositTimestamp;
        }
        uint256 deadline = depositTimestamp + withdrawalDeadline;
        if(block.timestamp >= deadline){
            return (0);
        } else {
            return (deadline - block.timestamp);
        }
    }

    receive() external payable {
    }
}