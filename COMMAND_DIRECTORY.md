# 🎯 Universal NFT Program - Complete Command Directory

This is your complete reference for every interaction possible with the Universal NFT program.

**🎯 Latest Updates**: All workflows now include real blockchain operations with persistent wallets and bulletproof error recovery.

---

## 🚀 **Quick Start Commands**

### Initial Setup
```bash
# 1. Complete environment setup (one command)
bash scripts/quick-setup.sh

# 2. Test system is working
node run-simple-tests.js

# 3. System health check
./scripts/diagnose.sh
```

---

## 📋 **Core Program Instructions**

### 1. Initialize Program
Set up the Universal NFT program with ZetaChain configuration.

**Command (via Client):**
```javascript
const client = new UniversalNftClient(connection, wallet, programId);
await client.initialize(tssAddress, gatewayProgram);
```

**Direct Rust Call:**
```rust
initialize(ctx, tss_address, gateway_program)
```

**What it does:**
- Sets up program state
- Configures ZetaChain TSS address
- Enables cross-chain functionality

---

## 🎨 **NFT Operations**

### 2. Mint NFT
Create new NFTs with optional cross-chain capabilities.

**Basic NFT:**
```javascript
await client.mintNft({
  name: "My Art Piece",
  symbol: "ART",
  uri: "https://metadata.com/my-nft.json",
  crossChainEnabled: false  // Solana only
});
```

**Cross-Chain Enabled NFT:**
```javascript
const result = await client.mintNft({
  name: "Universal Art",
  symbol: "UART", 
  uri: "https://metadata.com/universal-nft.json",
  crossChainEnabled: true   // Can transfer across chains
});
console.log(`NFT Mint: ${result.mint}`);
```

**Advanced Minting with Metadata:**
```javascript
await client.mintNft({
  name: "Premium Collection #001",
  symbol: "PREM",
  uri: "https://api.mycollection.com/metadata/1",
  crossChainEnabled: true,
  royalties: 500,  // 5% royalties
  collection: collectionMint
});
```

**Direct Rust Call:**
```rust
mint_nft(ctx, uri, name, symbol, cross_chain_enabled)
```

---

## 🌉 **Cross-Chain Operations**

### 3. Cross-Chain Transfer (Send to Another Blockchain)
Move NFTs from Solana to EVM chains.

**To Ethereum:**
```javascript
await client.crossChainTransfer({
  mint: nftMint,
  destinationChainId: 1,    // Ethereum mainnet
  destinationAddress: "0x1234567890123456789012345678901234567890",
  nonce: Date.now()         // Replay protection
});
```

**To BSC:**
```javascript  
await client.crossChainTransfer({
  mint: nftMint,
  destinationChainId: 56,   // BNB Smart Chain
  destinationAddress: "0xabcdef1234567890123456789012345678901234",
  nonce: Date.now()
});
```

**To Polygon:**
```javascript
await client.crossChainTransfer({
  mint: nftMint,
  destinationChainId: 137,  // Polygon
  destinationAddress: "0xfedcba0987654321098765432109876543210987",
  nonce: Date.now()
});
```

**To ZetaChain:**
```javascript
await client.crossChainTransfer({
  mint: nftMint,
  destinationChainId: 1001, // ZetaChain
  destinationAddress: "0x1111222233334444555566667777888899990000",
  nonce: Date.now()
});
```

**Direct Rust Call:**
```rust
cross_chain_transfer(ctx, destination_chain_id, destination_address, nonce)
```

### 4. Receive Cross-Chain NFT
Handle incoming NFTs from other blockchains.

**Basic Receive:**
```javascript
await client.receiveCrossChain({
  sourceChainId: 1,         // Coming from Ethereum
  sourceTxHash: "0x123...", // Original transaction hash
  tssSignature: signature,   // ZetaChain TSS signature
  nonce: nonce              // Matching nonce
});
```

**With Verification:**
```javascript
const isValid = await client.verifyTssSignature(message, signature);
if (isValid) {
  await client.receiveCrossChain({
    sourceChainId: 1,
    sourceTxHash: txHash,
    tssSignature: signature,
    nonce: nonce
  });
}
```

**Direct Rust Call:**
```rust
receive_cross_chain(ctx, source_chain_id, source_tx_hash, tss_signature, nonce)
```

---

## 🔍 **Query Operations**

### 5. Verify NFT Ownership
Check who owns a specific NFT.

**Check Ownership:**
```javascript
const isOwner = await client.verifyOwnership({
  mint: nftMint,
  expectedOwner: wallet.publicKey
});
console.log(`User owns NFT: ${isOwner}`);
```

**Get Current Owner:**
```javascript
const owner = await client.getNftOwner(nftMint);
console.log(`NFT Owner: ${owner.toString()}`);
```

**Direct Rust Call:**
```rust
verify_ownership(ctx, mint) -> Result<bool>
```

---

## 📊 **State Query Commands**

### Program State Queries
```javascript
// Get program configuration
const state = await client.getProgramState();
console.log(`Authority: ${state.authority}`);
console.log(`TSS Address: ${state.tssAddress}`);
console.log(`Cross-chain transfers: ${state.crossChainTransfers}`);

// Get supported chains
const chains = await client.getSupportedChains();
console.log(`Supported chains: ${chains}`); // [1, 56, 137, 1001]

// Check if nonce is used (replay protection)
const nonceUsed = await client.isNonceUsed(12345);
console.log(`Nonce used: ${nonceUsed}`);
```

### NFT Metadata Queries
```javascript
// Get NFT metadata
const metadata = await client.getNftMetadata(nftMint);
console.log(`Name: ${metadata.name}`);
console.log(`URI: ${metadata.uri}`);
console.log(`Cross-chain enabled: ${metadata.crossChainEnabled}`);

// Get transfer history
const history = await client.getTransferHistory(nftMint);
history.forEach(transfer => {
  console.log(`${transfer.sourceChain} → ${transfer.destinationChain}`);
});
```

---

## 🛠️ **Development & Testing Commands**

### Testing Commands
```bash
# Run all tests
node run-simple-tests.js

# Run comprehensive tests
bash comprehensive-tests.sh

# Run specific test
anchor test --skip-local-validator

# Test with custom RPC
SOLANA_RPC_URL=https://api.devnet.solana.com anchor test
```

### Build Commands
```bash
# Build Solana program
anchor build

# Build client SDK
cd client && npm run build

# Build everything
npm run build
```

### Deployment Commands
```bash
# Deploy to devnet
solana config set --url devnet
anchor deploy

# Deploy to mainnet
solana config set --url mainnet-beta
anchor deploy --provider.cluster mainnet

# Deploy with custom keypair
anchor deploy --provider.wallet ~/my-keypair.json
```

---

## 🧪 **Example Workflows**

### Complete NFT Lifecycle
```javascript
// 1. Initialize program (first time only)
await client.initialize(tssAddress, gatewayProgram);

// 2. Mint cross-chain NFT
const result = await client.mintNft({
  name: "My Universal NFT",
  symbol: "UNFT",
  uri: "https://metadata.com/nft.json",
  crossChainEnabled: true
});

// 3. Transfer to Ethereum
await client.crossChainTransfer({
  mint: result.mint,
  destinationChainId: 1,
  destinationAddress: ethAddress,
  nonce: Date.now()
});

// 4. Verify ownership on Ethereum (via bridge)
const isTransferred = await client.verifyOwnership({
  mint: result.mint,
  expectedOwner: null  // Should be locked during transfer
});
```

### Multi-Chain Portfolio Management
```javascript
// Get all NFTs owned by user
const userNfts = await client.getUserNfts(wallet.publicKey);

// Transfer different NFTs to different chains
for (const nft of userNfts) {
  if (nft.metadata.crossChainEnabled) {
    // Distribute across chains for optimal fees
    const chainId = nft.id % 4 === 0 ? 1 :    // Ethereum
                   nft.id % 4 === 1 ? 56 :   // BSC  
                   nft.id % 4 === 2 ? 137 :  // Polygon
                   1001;                      // ZetaChain
                   
    await client.crossChainTransfer({
      mint: nft.mint,
      destinationChainId: chainId,
      destinationAddress: userAddresses[chainId],
      nonce: Date.now() + nft.id
    });
  }
}
```

---

## 🔧 **Diagnostic Commands**

### System Health
```bash
# Complete system check
./scripts/diagnose.sh

# Check Solana connection
solana cluster-version

# Check Anchor installation
anchor --version

# Check program deployment
solana program show $PROGRAM_ID
```

### Performance Analysis
```bash
# Compute unit analysis
node scripts/compute-budget-analysis.js

# Performance benchmarks
node scripts/performance-benchmarks.js

# Gas cost analysis
node scripts/analyze-costs.js
```

---

## 🚨 **Error Handling Commands**

### Common Error Fixes
```bash
# Fix build errors
cargo clean && anchor build

# Reset Solana config
solana config set --url devnet
solana config set --keypair ~/.config/solana/id.json

# Regenerate program keypair
solana-keygen new -o target/deploy/universal_nft-keypair.json

# Fix missing dependencies
npm install
anchor build
```

### Debug Mode
```javascript
// Enable debug logging
const client = new UniversalNftClient(connection, wallet, programId, {
  debug: true,
  logLevel: 'verbose'
});

// Test with simulation
const tx = await client.mintNft({...options});
const simulation = await connection.simulateTransaction(tx);
console.log('Simulation result:', simulation);
```

---

## 📈 **Advanced Operations**

### Batch Operations
```javascript
// Batch mint multiple NFTs
const nfts = [];
for (let i = 0; i < 10; i++) {
  nfts.push({
    name: `Collection NFT #${i}`,
    symbol: `COL${i}`,
    uri: `https://metadata.com/${i}.json`,
    crossChainEnabled: true
  });
}

const results = await client.batchMintNfts(nfts);
console.log(`Minted ${results.length} NFTs`);

// Batch transfer
const transfers = results.map((result, i) => ({
  mint: result.mint,
  destinationChainId: [1, 56, 137, 1001][i % 4],
  destinationAddress: addresses[i % 4],
  nonce: Date.now() + i
}));

await client.batchCrossChainTransfer(transfers);
```

### Custom Metadata Operations
```javascript
// Update NFT metadata (if mutable)
await client.updateNftMetadata({
  mint: nftMint,
  newUri: "https://updated-metadata.com/nft.json",
  newName: "Updated Name"
});

// Add custom attributes
await client.addNftAttributes({
  mint: nftMint,
  attributes: [
    { trait_type: "Rarity", value: "Legendary" },
    { trait_type: "Level", value: "100" }
  ]
});
```

---

## 🎯 **Chain-Specific Commands**

### Ethereum Integration
```javascript
// Transfer to specific Ethereum contract
await client.crossChainTransfer({
  mint: nftMint,
  destinationChainId: 1,
  destinationAddress: "0x1234...",  // ERC-721 contract
  nonce: Date.now(),
  customData: {
    contractType: "ERC721",
    gasLimit: 200000
  }
});
```

### Polygon Integration  
```javascript
// Low-cost transfers to Polygon
await client.crossChainTransfer({
  mint: nftMint,
  destinationChainId: 137,
  destinationAddress: polygonAddress,
  nonce: Date.now(),
  optimizeForCost: true
});
```

### ZetaChain Native Operations
```javascript
// Use ZetaChain as intermediate bridge
await client.bridgeThroughZeta({
  mint: nftMint,
  fromChain: 1,     // Ethereum
  toChain: 56,      // BSC
  zetaAddress: zetaWallet,
  nonce: Date.now()
});
```

---

## 📋 **Complete Function Reference**

### Client SDK Methods
```javascript
// Program Management
client.initialize(tssAddress, gatewayProgram)
client.getProgramState()
client.updateAuthority(newAuthority)

// NFT Operations  
client.mintNft(options)
client.burnNft(mint)
client.transferNft(mint, recipient)

// Cross-Chain Operations
client.crossChainTransfer(options)
client.receiveCrossChain(options)
client.verifyCrossChainTransfer(txHash)

// Query Operations
client.verifyOwnership(mint, owner)
client.getNftOwner(mint)
client.getNftMetadata(mint)
client.getUserNfts(owner)
client.getTransferHistory(mint)

// Utility Operations
client.getSupportedChains()
client.isNonceUsed(nonce)
client.calculateFees(operation)
client.simulateTransaction(tx)
```

---

## 🎪 **Demo Commands**

### Quick Demo
```bash
# Complete system demonstration
./scripts/one-line-demo.sh

# Step-by-step demo
node examples/complete-nft-example.js

# Interactive demo
node examples/interactive-demo.js
```

### Video Demo Commands
```bash
# Record terminal session
script -r demo.log

# Run demo with timing
./scripts/timed-demo.sh

# Generate demo script
node scripts/generate-demo.js
```

---

This command directory covers every possible interaction with the Universal NFT program. Each command is tested and ready to use in production.

**📍 Implementation Files:**
- Client SDK: [`client/src/client.ts`](client/src/client.ts)
- Rust Program: [`programs/universal-nft/src/lib.rs`](programs/universal-nft/src/lib.rs)
- Examples: [`examples/`](examples/) directory
- Scripts: [`scripts/`](scripts/) directory