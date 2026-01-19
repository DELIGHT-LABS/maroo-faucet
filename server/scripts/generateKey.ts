#!/usr/bin/env ts-node
/**
 * Generate a new wallet for the faucet
 * Usage: pnpm generate
 */

import Web3 from 'web3'
import fs from 'fs'
import path from 'path'

const web3 = new Web3()

// ANSI colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
}

function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`)
}

async function generateWallet() {
  log('\n🔑 Generating new wallet for Lux Faucet...', colors.cyan)

  // Generate new account
  const account = web3.eth.accounts.create()

  // Remove 0x prefix from private key
  const privateKey = account.privateKey.replace('0x', '')

  log('\n✅ Wallet Generated Successfully!', colors.green + colors.bright)
  log('━'.repeat(80), colors.cyan)

  log('\n📋 Wallet Details:', colors.bright)
  log(`   Address:     ${account.address}`, colors.yellow)
  log(`   Private Key: ${privateKey}`, colors.red)

  log('\n━'.repeat(80), colors.cyan)

  // Update .env file
  const envPath = path.join(__dirname, '..', '.env')
  let envContent = ''

  try {
    envContent = fs.readFileSync(envPath, 'utf-8')
  } catch (error) {
    log('\n⚠️  .env file not found, creating one...', colors.yellow)
    envContent = fs.readFileSync(path.join(__dirname, '..', '.env.example'), 'utf-8')
  }

  // Replace PK line
  const updatedContent = envContent.replace(
    /^PK=.*$/m,
    `PK="${privateKey}"`
  )

  fs.writeFileSync(envPath, updatedContent)

  log('\n✅ Updated .env file with new private key!', colors.green)

  // Instructions
  log('\n📖 Next Steps:', colors.cyan + colors.bright)
  log('\n1️⃣  Fund this address with testnet tokens:', colors.yellow)
  log(`   ${account.address}`, colors.bright)

  log('\n2️⃣  Get testnet tokens from:', colors.yellow)
  log('   • C-Chain Testnet: https://faucet.lux.network', colors.cyan)
  log('   • Or use the Lux Testnet Faucet', colors.cyan)

  log('\n3️⃣  Verify the chains in config.json match your funded networks', colors.yellow)

  log('\n4️⃣  Start the faucet:', colors.yellow)
  log('   pnpm dev', colors.green + colors.bright)

  log('\n━'.repeat(80), colors.cyan)

  log('\n⚠️  SECURITY WARNING:', colors.red + colors.bright)
  log('   • NEVER commit .env to git (already in .gitignore)', colors.red)
  log('   • NEVER use mainnet private keys', colors.red)
  log('   • Keep this private key secure', colors.red)

  log('\n━'.repeat(80) + '\n', colors.cyan)
}

// Run the generator
generateWallet().catch((error) => {
  log(`\n❌ Error generating wallet: ${error.message}`, colors.red)
  process.exit(1)
})
