// Complete NFT Cross-Chain Example
// This demonstrates a full end-to-end NFT creation and cross-chain transfer

const anchor = require('@coral-xyz/anchor');
const { Connection, Keypair, PublicKey } = require('@solana/web3.js');
const fs = require('fs');

class UniversalNftExample {
  constructor() {
    this.connection = new Connection('https://api.devnet.solana.com', 'confirmed');
    this.wallet = anchor.AnchorProvider.local().wallet;
    
    // Load the IDL and program
    const idl = JSON.parse(fs.readFileSync('target/idl/universal_nft.json', 'utf8'));
    this.programId = new PublicKey(idl.metadata.address);
    this.provider = new anchor.AnchorProvider(this.connection, this.wallet, {});
    this.program = new anchor.Program(idl, this.programId, this.provider);
    
    console.log('🎯 Universal NFT Example Initialized');
    console.log(`Program ID: ${this.programId.toString()}`);
    console.log(`Wallet: ${this.wallet.publicKey.toString()}`);
  }

  async initializeProgram() {
    console.log('\n📋 Step 1: Initializing Program...');
    
    try {
      // ZetaChain configuration (using placeholder addresses for demo)
      const tssAddress = new PublicKey('11111111111111111111111111111112');
      const gatewayProgram = new PublicKey('11111111111111111111111111111113');
      
      const tx = await this.program.methods
        .initialize(tssAddress, gatewayProgram)
        .rpc();
      
      console.log('✅ Program initialized successfully!');
      console.log(`Transaction: ${tx}`);
      
      return tx;
    } catch (error) {
      if (error.message.includes('already initialized')) {
        console.log('✅ Program already initialized');
        return 'already_initialized';
      }
      throw error;
    }
  }

  async mintCrossChainNft(metadata) {
    console.log('\n🎨 Step 2: Minting Cross-Chain NFT...');
    
    const mintKeypair = Keypair.generate();
    
    try {
      const tx = await this.program.methods
        .mintNft(
          metadata.uri,
          metadata.name,
          metadata.symbol,
          true // Enable cross-chain transfers
        )
        .accounts({
          mint: mintKeypair.publicKey,
        })
        .signers([mintKeypair])
        .rpc();
      
      console.log('✅ NFT minted successfully!');
      console.log(`Mint Address: ${mintKeypair.publicKey.toString()}`);
      console.log(`Transaction: ${tx}`);
      
      return {
        mint: mintKeypair.publicKey,
        transaction: tx
      };
    } catch (error) {
      console.error('❌ NFT minting failed:', error);
      throw error;
    }
  }

  async verifyNftOwnership(mintAddress) {
    console.log('\n🔍 Step 3: Verifying NFT Ownership...');
    
    try {
      const tx = await this.program.methods
        .verifyOwnership(mintAddress)
        .rpc();
      
      console.log('✅ Ownership verified successfully!');
      console.log(`Transaction: ${tx}`);
      
      return true;
    } catch (error) {
      console.error('❌ Ownership verification failed:', error);
      return false;
    }
  }

  async initiateCrossChainTransfer(mintAddress, destinationChain, destinationAddress) {
    console.log('\n🌉 Step 4: Initiating Cross-Chain Transfer...');
    
    // Generate unique nonce for replay protection
    const nonce = Date.now() + Math.floor(Math.random() * 1000);
    
    try {
      const tx = await this.program.methods
        .crossChainTransfer(
          destinationChain,
          Array.from(destinationAddress),
          nonce
        )
        .accounts({
          mint: mintAddress,
        })
        .rpc();
      
      console.log('✅ Cross-chain transfer initiated!');
      console.log(`Destination Chain: ${this.getChainName(destinationChain)}`);
      console.log(`Nonce: ${nonce}`);
      console.log(`Transaction: ${tx}`);
      
      return {
        transaction: tx,
        nonce: nonce
      };
    } catch (error) {
      console.error('❌ Cross-chain transfer failed:', error);
      throw error;
    }
  }

  async getNftMetadata(mintAddress) {
    console.log('\n📊 Fetching NFT Metadata...');
    
    try {
      // Derive the metadata PDA
      const [metadataPda] = await PublicKey.findProgramAddress(
        [Buffer.from('nft_metadata'), mintAddress.toBuffer()],
        this.program.programId
      );
      
      const metadata = await this.program.account.nftMetadata.fetch(metadataPda);
      
      console.log('✅ NFT Metadata Retrieved:');
      console.log(`  Name: ${metadata.name}`);
      console.log(`  Symbol: ${metadata.symbol}`);
      console.log(`  URI: ${metadata.uri}`);
      console.log(`  Cross-chain enabled: ${metadata.crossChainEnabled}`);
      console.log(`  Transfer count: ${metadata.transferCount}`);
      
      return metadata;
    } catch (error) {
      console.error('❌ Failed to fetch metadata:', error);
      throw error;
    }
  }

  getChainName(chainId) {
    const chains = {
      1: 'Ethereum',
      56: 'BNB Smart Chain', 
      137: 'Polygon',
      1001: 'ZetaChain'
    };
    return chains[chainId] || `Chain ${chainId}`;
  }

  async runCompleteExample() {
    console.log('🚀 Starting Complete Universal NFT Example');
    console.log('===========================================');
    
    try {
      // Step 1: Initialize program
      await this.initializeProgram();
      
      // Step 2: Create NFT metadata
      const nftMetadata = {
        name: 'Universal Demo NFT',
        symbol: 'UDNFT',
        uri: 'https://arweave.net/demo-metadata.json'
      };
      
      // Step 3: Mint cross-chain NFT
      const mintResult = await this.mintCrossChainNft(nftMetadata);
      
      // Step 4: Verify ownership
      const isOwner = await this.verifyNftOwnership(mintResult.mint);
      
      if (!isOwner) {
        throw new Error('Ownership verification failed');
      }
      
      // Step 5: Get NFT metadata
      await this.getNftMetadata(mintResult.mint);
      
      // Step 6: Demonstrate cross-chain transfer to different chains
      const transfers = [
        { chain: 1, name: 'Ethereum', address: Buffer.from('742d35cc5ff71cf34dc7ac8ee33c4d5ac0c3e8ad', 'hex') },
        { chain: 56, name: 'BSC', address: Buffer.from('8ba1f109551bd432803012645hac136c3c9c3c9c', 'hex') },
        { chain: 137, name: 'Polygon', address: Buffer.from('9cb2f109551bd432803012645hac136c3c9c3c9c', 'hex') }
      ];
      
      // For demo, just show the first transfer
      const transfer = transfers[0];
      console.log(`\n🎯 Demonstrating transfer to ${transfer.name}...`);
      
      const transferResult = await this.initiateCrossChainTransfer(
        mintResult.mint,
        transfer.chain,
        transfer.address
      );
      
      console.log('\n🎉 Complete Example Finished Successfully!');
      console.log('==========================================');
      console.log('Summary:');
      console.log(`✅ Program initialized`);
      console.log(`✅ NFT minted: ${mintResult.mint.toString()}`);
      console.log(`✅ Ownership verified`);
      console.log(`✅ Cross-chain transfer initiated to ${transfer.name}`);
      console.log(`✅ Transaction: ${transferResult.transaction}`);
      
      return {
        programInitialized: true,
        nftMinted: mintResult.mint.toString(),
        ownershipVerified: true,
        crossChainTransfer: transferResult.transaction
      };
      
    } catch (error) {
      console.error('\n❌ Example failed:', error.message);
      throw error;
    }
  }
}

// Run the example if this file is executed directly
if (require.main === module) {
  const example = new UniversalNftExample();
  
  example.runCompleteExample()
    .then(result => {
      console.log('\n🏆 All operations completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Example failed:', error);
      process.exit(1);
    });
}

module.exports = UniversalNftExample;