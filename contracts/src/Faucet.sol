// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title Faucet
 * @notice A simple faucet contract for distributing test tokens on Maroo testnets
 * @dev Implements rate limiting and configurable drip amounts
 */
contract Faucet is Ownable, ReentrancyGuard {
    /// @notice Amount of tokens to drip per request (in wei)
    uint256 public dripAmount;

    /// @notice Cooldown period between drips for the same address (in seconds)
    uint256 public cooldownTime;

    /// @notice Mapping of address to last drip timestamp
    mapping(address => uint256) public lastDripTime;

    /// @notice Event emitted when tokens are dripped
    event Dripped(address indexed recipient, uint256 amount, uint256 timestamp);

    /// @notice Event emitted when drip amount is updated
    event DripAmountUpdated(uint256 oldAmount, uint256 newAmount);

    /// @notice Event emitted when cooldown time is updated
    event CooldownTimeUpdated(uint256 oldTime, uint256 newTime);

    /// @notice Event emitted when owner withdraws funds
    event Withdrawn(address indexed to, uint256 amount);

    /// @notice Error thrown when trying to drip before cooldown expires
    error CooldownNotExpired(uint256 remainingTime);

    /// @notice Error thrown when faucet has insufficient balance
    error InsufficientBalance(uint256 requested, uint256 available);

    /// @notice Error thrown when transfer fails
    error TransferFailed();

    /**
     * @notice Constructor
     * @param _dripAmount Initial drip amount in wei
     * @param _cooldownTime Initial cooldown time in seconds
     */
    constructor(
        uint256 _dripAmount,
        uint256 _cooldownTime
    ) Ownable(msg.sender) {
        dripAmount = _dripAmount;
        cooldownTime = _cooldownTime;
    }

    /**
     * @notice Request tokens from the faucet
     * @dev Rate limited by cooldownTime per address
     */
    function drip() external nonReentrant {
        uint256 timeSinceLastDrip = block.timestamp - lastDripTime[msg.sender];

        if (timeSinceLastDrip < cooldownTime) {
            revert CooldownNotExpired(cooldownTime - timeSinceLastDrip);
        }

        uint256 balance = address(this).balance;
        if (balance < dripAmount) {
            revert InsufficientBalance(dripAmount, balance);
        }

        lastDripTime[msg.sender] = block.timestamp;

        (bool success,) = msg.sender.call{value: dripAmount}("");
        if (!success) revert TransferFailed();

        emit Dripped(msg.sender, dripAmount, block.timestamp);
    }

    /**
     * @notice Set the drip amount
     * @param _dripAmount New drip amount in wei
     */
    function setDripAmount(uint256 _dripAmount) external onlyOwner {
        uint256 oldAmount = dripAmount;
        dripAmount = _dripAmount;
        emit DripAmountUpdated(oldAmount, _dripAmount);
    }

    /**
     * @notice Set the cooldown time
     * @param _cooldownTime New cooldown time in seconds
     */
    function setCooldownTime(uint256 _cooldownTime) external onlyOwner {
        uint256 oldTime = cooldownTime;
        cooldownTime = _cooldownTime;
        emit CooldownTimeUpdated(oldTime, _cooldownTime);
    }

    /**
     * @notice Withdraw funds from the faucet
     * @param to Address to send funds to
     * @param amount Amount to withdraw in wei
     */
    function withdraw(address payable to, uint256 amount) external onlyOwner {
        uint256 balance = address(this).balance;
        if (balance < amount) {
            revert InsufficientBalance(amount, balance);
        }

        (bool success,) = to.call{value: amount}("");
        if (!success) revert TransferFailed();

        emit Withdrawn(to, amount);
    }

    /**
     * @notice Get time until next drip is available for an address
     * @param user Address to check
     * @return Time remaining in seconds, 0 if drip is available
     */
    function timeUntilNextDrip(address user) external view returns (uint256) {
        uint256 timeSinceLastDrip = block.timestamp - lastDripTime[user];
        if (timeSinceLastDrip >= cooldownTime) {
            return 0;
        }
        return cooldownTime - timeSinceLastDrip;
    }

    /**
     * @notice Check if an address can request a drip
     * @param user Address to check
     * @return True if drip is available
     */
    function canDrip(address user) external view returns (bool) {
        return block.timestamp - lastDripTime[user] >= cooldownTime;
    }

    /**
     * @notice Receive function to accept ETH
     */
    receive() external payable {}
}
