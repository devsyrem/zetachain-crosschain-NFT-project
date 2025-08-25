# ⚡ Universal NFT - Essential Commands Cheat Sheet

## 🚀 **Setup & Testing (Start Here)**

```bash
# 1. Complete setup in 5 minutes
bash scripts/quick-setup.sh

# 2. Verify everything works
node run-simple-tests.js
```

---

## 🎨 **Core NFT Operations**

### Mint NFT
```javascript
// Regular NFT
await client.mintNft({
  name: "My Art",
  symbol: "ART", 
  uri: "https://metadata.com/nft.json"
});

// Cross-chain enabled NFT
await client.mintNft({
  name: "Universal NFT",
  symbol: "UNFT",
  uri: "https://metadata.com/nft.json",
  crossChainEnabled: true  // Can transfer across chains
});
```

### Transfer Across Chains
```javascript
// Send to Ethereum
await client.crossChainTransfer({
  mint: nftMint,
  destinationChainId: 1,    // Ethereum
  destinationAddress: "0x1234...",
  nonce: Date.now()
});

// Send to BSC
await client.crossChainTransfer({
  mint: nftMint,
  destinationChainId: 56,   // BSC
  destinationAddress: "0x1234...", 
  nonce: Date.now()
});

// Send to Polygon
await client.crossChainTransfer({
  mint: nftMint,
  destinationChainId: 137,  // Polygon
  destinationAddress: "0x1234...",
  nonce: Date.now()
});
```

### Receive NFT from Other Chain
```javascript
await client.receiveCrossChain({
  sourceChainId: 1,           // Coming from Ethereum
  sourceTxHash: "0x123...",   // Original transaction
  tssSignature: signature,    // ZetaChain signature
  nonce: nonce
});
```

---

## 🔍 **Query Commands**

```javascript
// Check NFT ownership
const isOwner = await client.verifyOwnership(nftMint, wallet.publicKey);

// Get NFT metadata
const metadata = await client.getNftMetadata(nftMint);

// Get user's NFTs
const userNfts = await client.getUserNfts(wallet.publicKey);

// Check supported chains
const chains = await client.getSupportedChains(); // [1, 56, 137, 1001]
```

---

## 🛠️ **Development Commands**

```bash
# Build program
anchor build

# Deploy to devnet
anchor deploy

# Run all tests
anchor test
```

---

## 📊 **System Commands**

```bash
# Health check
./scripts/diagnose.sh

# Performance analysis
node scripts/performance-benchmarks.js

# Complete demo
./scripts/one-line-demo.sh
```

---

## 🎯 **Chain IDs Reference**

| Chain | ID | Example Address |
|-------|----|----|
| Ethereum | 1 | 0x1234... |
| BSC | 56 | 0x1234... |
| Polygon | 137 | 0x1234... |
| ZetaChain | 1001 | 0x1234... |

---

**📍 Full Command Directory**: [`COMMAND_DIRECTORY.md`](COMMAND_DIRECTORY.md)