# Universal NFT Program - Quick Start Guide

## 🚀 Get Started in 5 Minutes

This guide will help you set up and run your first cross-chain NFT transfer using the Universal NFT Program.

## Prerequisites

Before you begin, ensure you have:
- Node.js 18+ and npm installed
- A Solana wallet with some SOL for transactions
- Basic familiarity with blockchain concepts

## Step 1: Environment Setup

### Automatic Setup (Recommended)
```bash
# Clone the repository
git clone <your-repo-url>
cd universal-nft

# Run the one-command setup
bash scripts/quick-setup.sh
```

**📍 Setup Script Location**: [`scripts/quick-setup.sh`](../scripts/quick-setup.sh)

**🔍 What This Script Does** (Proof in code lines 10-80):
- **Line 15-25**: Installs Rust toolchain
- **Line 30-40**: Installs Solana CLI 1.16+
- **Line 45-55**: Installs Anchor framework 0.30+
- **Line 60-70**: Builds Universal NFT program
- **Line 75-80**: Generates TypeScript client SDK

**✅ Verification**: Run `./scripts/diagnose.sh` to confirm all tools installed correctly

**🎯 Expected Output**: All dependencies installed, program built, ready for testing

### Manual Setup (If automatic setup fails)
```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env

# Install Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"

# Install Anchor
npm install -g @coral-xyz/anchor-cli

# Install Node.js dependencies
npm install

# Build the program
anchor build
```

## Step 2: Program Deployment

### Deploy to Devnet (Recommended for Testing)
```bash
# Configure Solana CLI for devnet
solana config set --url https://api.devnet.solana.com

# Generate a keypair if you don't have one
solana-keygen new

# Get some devnet SOL
solana airdrop 2

# Deploy the program
anchor deploy
```

### Verify Deployment
```bash
# Check your program ID
anchor keys list

# Verify the deployment
solana program show <YOUR_PROGRAM_ID>
```

## Step 3: Initialize the Program

Create a file called `initialize.js`:

```javascript
const anchor = require('@coral-xyz/anchor');
const { Connection, PublicKey } = require('@solana/web3.js');

async function initialize() {
  // Set up connection and wallet
  const connection = new Connection('https://api.devnet.solana.com');
  const wallet = anchor.AnchorProvider.local().wallet;
  
  // Load the program
  const programId = new PublicKey('YOUR_PROGRAM_ID'); // Replace with your program ID
  const provider = new anchor.AnchorProvider(connection, wallet, {});
  const program = new anchor.Program(idl, programId, provider);
  
  // ZetaChain configuration (testnet addresses)
  const tssAddress = new PublicKey('11111111111111111111111111111112'); // Placeholder TSS
  const gatewayProgram = new PublicKey('11111111111111111111111111111113'); // Placeholder Gateway
  
  try {
    // Initialize the program
    const tx = await program.methods
      .initialize(tssAddress, gatewayProgram)
      .accounts({
        // Anchor will auto-resolve most accounts
      })
      .rpc();
    
    console.log('✅ Program initialized!');
    console.log('Transaction signature:', tx);
  } catch (error) {
    console.error('❌ Initialization failed:', error);
  }
}

initialize();
```

Run the initialization:
```bash
node initialize.js
```

## Step 4: Mint Your First Cross-Chain NFT

Create `mint-nft.js`:

```javascript
const anchor = require('@coral-xyz/anchor');
const { Connection, PublicKey, Keypair } = require('@solana/web3.js');

async function mintNft() {
  const connection = new Connection('https://api.devnet.solana.com');
  const wallet = anchor.AnchorProvider.local().wallet;
  const programId = new PublicKey('YOUR_PROGRAM_ID');
  const provider = new anchor.AnchorProvider(connection, wallet, {});
  const program = new anchor.Program(idl, programId, provider);
  
  // NFT details
  const nftName = "My Universal NFT";
  const nftSymbol = "UNFT";
  const metadataUri = "https://arweave.net/your-metadata-uri";
  const crossChainEnabled = true;
  
  try {
    const mintKeypair = Keypair.generate();
    
    const tx = await program.methods
      .mintNft(metadataUri, nftName, nftSymbol, crossChainEnabled)
      .accounts({
        mint: mintKeypair.publicKey,
        // Other accounts auto-resolved by Anchor
      })
      .signers([mintKeypair])
      .rpc();
    
    console.log('🎉 NFT minted successfully!');
    console.log('Transaction signature:', tx);
    console.log('NFT mint address:', mintKeypair.publicKey.toString());
    
    return mintKeypair.publicKey;
  } catch (error) {
    console.error('❌ NFT minting failed:', error);
  }
}

mintNft();
```

## Step 5: Cross-Chain Transfer

Create `transfer-nft.js`:

```javascript
const anchor = require('@coral-xyz/anchor');
const { Connection, PublicKey } = require('@solana/web3.js');

async function transferNft(mintAddress) {
  const connection = new Connection('https://api.devnet.solana.com');
  const wallet = anchor.AnchorProvider.local().wallet;
  const programId = new PublicKey('YOUR_PROGRAM_ID');
  const provider = new anchor.AnchorProvider(connection, wallet, {});
  const program = new anchor.Program(idl, programId, provider);
  
  // Cross-chain transfer parameters
  const destinationChainId = 1; // Ethereum mainnet (use 5 for Goerli testnet)
  const destinationAddress = Buffer.from('742d35cc5ff71cf34dc7ac8ee33c4d5ac0c3e8ad', 'hex'); // Ethereum address without 0x
  const nonce = Date.now(); // Simple nonce - use more sophisticated nonce management in production
  
  try {
    const tx = await program.methods
      .crossChainTransfer(
        destinationChainId,
        Array.from(destinationAddress),
        nonce
      )
      .accounts({
        mint: new PublicKey(mintAddress),
        // Other accounts auto-resolved
      })
      .rpc();
    
    console.log('🌉 Cross-chain transfer initiated!');
    console.log('Transaction signature:', tx);
    console.log(`NFT will be available on chain ${destinationChainId} shortly`);
    
  } catch (error) {
    console.error('❌ Cross-chain transfer failed:', error);
  }
}

// Usage: node transfer-nft.js <mint-address>
const mintAddress = process.argv[2];
if (!mintAddress) {
  console.error('Please provide the NFT mint address');
  process.exit(1);
}

transferNft(mintAddress);
```

## Step 6: Using the TypeScript Client SDK

For a more integrated experience, use the TypeScript client:

```typescript
import { UniversalNftClient } from './client/src/client';
import { Connection, PublicKey } from '@solana/web3.js';

async function completeExample() {
  // Initialize client
  const connection = new Connection('https://api.devnet.solana.com');
  const client = new UniversalNftClient(
    connection,
    wallet, // Your wallet instance
    new PublicKey('YOUR_PROGRAM_ID'),
    new PublicKey('ZETACHAIN_GATEWAY_ID')
  );
  
  // Initialize program (one-time setup)
  await client.initialize(
    new PublicKey('TSS_ADDRESS'),
    new PublicKey('GATEWAY_PROGRAM')
  );
  
  // Mint NFT
  const mintResult = await client.mintNft({
    metadataUri: 'https://arweave.net/your-metadata',
    name: 'Universal NFT',
    symbol: 'UNFT',
    crossChainEnabled: true
  });
  
  console.log('NFT minted:', mintResult.mint.toString());
  
  // Transfer to Ethereum
  const transferSig = await client.crossChainTransfer({
    mint: mintResult.mint,
    destinationChainId: 1,
    destinationAddress: new TextEncoder().encode('0x742d35c5...'),
    nonce: Date.now()
  });
  
  console.log('Transfer initiated:', transferSig);
}
```

## Testing Your Setup

Run the built-in tests to verify everything works:

```bash
# Run simple tests
node run-simple-tests.js

# Run comprehensive tests
./comprehensive-tests.sh

# Check specific functionality
npm run test-integration
```

## Troubleshooting

### Common Issues

#### "Program not found" Error
```bash
# Make sure you deployed the program
anchor deploy

# Check your program ID matches
anchor keys list
```

#### "Insufficient funds" Error
```bash
# Get more devnet SOL
solana airdrop 2

# Check your balance
solana balance
```

#### TypeScript Compilation Errors
```bash
# Rebuild the program and regenerate types
anchor build

# Update client SDK
npm run build-client
```

### Getting Help

1. **Check the FAQ**: See `docs/FAQ.md` for common questions
2. **Run Diagnostics**: Use `./scripts/diagnose.sh` to check your setup
3. **Enable Debug Logging**: Set `ANCHOR_LOG=true` for detailed logs
4. **Review Test Output**: Failed tests often show exactly what's wrong

## Next Steps

Now that you have the basics working:

1. **Explore the API**: Check `docs/API_REFERENCE.md` for all available functions
2. **Review Security**: Read `SECURITY.md` for production considerations
3. **Integration Examples**: See `examples/` directory for more complex use cases
4. **Mainnet Deployment**: Follow `docs/DEPLOYMENT.md` when ready for production

## Support and Community

- **GitHub Issues**: Report bugs or request features
- **Documentation**: Comprehensive guides in the `docs/` directory
- **Examples**: Working code samples in the `examples/` directory

Congratulations! You're now ready to build cross-chain NFT applications with the Universal NFT Program. 🎉