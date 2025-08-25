import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { UniversalNftClient } from './src/client';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  console.log('🚀 Universal NFT Client Example');
  console.log('================================');

  // Connect to Solana devnet
  const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
  
  // Load or create a keypair for testing
  const walletPath = path.join(process.env.HOME || '~', '.config/solana/id.json');
  let payer: Keypair;
  
  try {
    const walletData = JSON.parse(fs.readFileSync(walletPath, 'utf8'));
    payer = Keypair.fromSecretKey(new Uint8Array(walletData));
    console.log(`📝 Loaded wallet: ${payer.publicKey.toBase58()}`);
  } catch (error) {
    console.log('⚠️  Creating new keypair for testing...');
    payer = Keypair.generate();
    console.log(`📝 Generated wallet: ${payer.publicKey.toBase58()}`);
  }

  // Check wallet balance
  const balance = await connection.getBalance(payer.publicKey);
  console.log(`💰 Wallet balance: ${balance / 1e9} SOL`);
  
  if (balance < 1e9) {
    console.log('⚠️  Low balance! Request SOL from faucet: https://faucet.solana.com/');
  }

  try {
    // Initialize Universal NFT Client
    console.log('\n🔧 Initializing Universal NFT Client...');
    
    // Mock ZetaChain addresses for example (replace with actual addresses)
    const gatewayAddress = new PublicKey('GatewayAddress111111111111111111111111111');
    const tssAddress = new PublicKey('TssAddress1111111111111111111111111111111');
    
    const client = new UniversalNftClient(
      connection,
      payer,
      gatewayAddress,
      tssAddress,
      1001 // ZetaChain ID
    );

    // Example 1: Initialize the program (run once)
    console.log('\n📋 Step 1: Initialize Program...');
    try {
      const initTx = await client.initialize();
      console.log(`✅ Program initialized: ${initTx}`);
    } catch (error) {
      console.log(`ℹ️  Program may already be initialized: ${error.message}`);
    }

    // Example 2: Mint an NFT
    console.log('\n🎨 Step 2: Mint NFT...');
    const tokenId = Date.now(); // Use timestamp as unique ID
    const mintTx = await client.mintNft(
      tokenId,
      'https://example.com/nft.json', // Replace with actual metadata URI
      'My Universal NFT',
      'UNFT'
    );
    console.log(`✅ NFT minted: ${mintTx}`);
    console.log(`🆔 Token ID: ${tokenId}`);

    // Example 3: Verify ownership
    console.log('\n🔍 Step 3: Verify Ownership...');
    const isOwner = await client.verifyOwnership(tokenId, payer.publicKey);
    console.log(`✅ Ownership verified: ${isOwner}`);

    // Example 4: Prepare cross-chain transfer (simulation)
    console.log('\n🌉 Step 4: Cross-chain Transfer Simulation...');
    console.log('Note: This would initiate a transfer to another blockchain');
    console.log(`Token ID ${tokenId} ready for cross-chain operations`);
    
    // In production, you would call:
    // const transferTx = await client.crossChainTransfer(
    //   tokenId,
    //   1, // Ethereum mainnet
    //   Buffer.from('0x1234567890123456789012345678901234567890', 'hex')
    // );

    console.log('\n🎉 Example completed successfully!');
    console.log('\n💡 Next steps:');
    console.log('  1. Replace mock addresses with real ZetaChain gateway addresses');
    console.log('  2. Deploy to mainnet for production use');
    console.log('  3. Integrate with your frontend application');

  } catch (error) {
    console.error('❌ Error running example:', error);
    
    if (error.message.includes('Program not found')) {
      console.log('\n🔧 Fix: Deploy the program first:');
      console.log('  anchor build && anchor deploy');
    } else if (error.message.includes('Insufficient funds')) {
      console.log('\n💰 Fix: Add SOL to your wallet:');
      console.log('  solana airdrop 2');
    }
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (error) => {
  console.error('Unhandled promise rejection:', error);
  process.exit(1);
});

if (require.main === module) {
  main().catch(console.error);
}