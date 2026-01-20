# Faucet Smart Contracts

Modern Solidity faucet contract for Maroo testnets.

## Features

- ✅ Rate limiting per address
- ✅ Configurable drip amounts
- ✅ Owner controls
- ✅ ReentrancyGuard protection
- ✅ Comprehensive test suite
- ✅ Gas optimized

## Setup

### Install Foundry

```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

### Install Dependencies

```bash
cd contracts
forge install
```

## Build

```bash
forge build
```

## Test

```bash
# Run all tests
forge test

# Run with gas report
forge test --gas-report

# Run with verbosity
forge test -vvv

# Run specific test
forge test --match-test test_Drip
```

## Deploy

### Local (Anvil)

```bash
# Terminal 1: Start local node
anvil

# Terminal 2: Deploy
forge script script/DeployFaucet.s.sol --rpc-url localhost --broadcast
```

### Maroo Testnet

```bash
# Set environment variables
export PRIVATE_KEY=your_private_key
export DRIP_AMOUNT=2000000000000000000  # 2 LUX
export COOLDOWN_TIME=86400              # 24 hours
export INITIAL_FUNDING=100000000000000000000  # 100 LUX

# Deploy
forge script script/DeployFaucet.s.sol \
  --rpc-url https://api.lux-test.network/ext/C/rpc \
  --broadcast \
  --verify
```

### Environment Variables

- `DRIP_AMOUNT` - Amount to drip per request (wei) - default: 2 ether
- `COOLDOWN_TIME` - Cooldown between drips (seconds) - default: 24 hours
- `INITIAL_FUNDING` - Initial funding amount (wei) - default: 100 ether

## Contract Interface

### User Functions

- `drip()` - Request tokens from faucet
- `canDrip(address)` - Check if address can request drip
- `timeUntilNextDrip(address)` - Get cooldown remaining

### Admin Functions

- `setDripAmount(uint256)` - Update drip amount
- `setCooldownTime(uint256)` - Update cooldown time
- `withdraw(address, uint256)` - Withdraw funds

## Coverage

```bash
forge coverage
```

## Gas Snapshot

```bash
forge snapshot
```
