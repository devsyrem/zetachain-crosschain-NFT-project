# Universal NFT Program - System Architecture

## Overview

The Universal NFT Program enables secure cross-chain NFT transfers between Solana and EVM-compatible blockchains through ZetaChain's interoperability protocol. The system combines Solana's high performance with ZetaChain's Threshold Signature Scheme (TSS) for trustless cross-chain operations.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           Universal NFT Ecosystem                                │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│    Ethereum     │    │  BNB Chain      │    │    Polygon      │    │   ZetaChain     │
│   (EVM Chain)   │    │  (EVM Chain)    │    │  (EVM Chain)    │    │ (Cosmos Chain)  │
│                 │    │                 │    │                 │    │                 │
│  ┌───────────┐  │    │  ┌───────────┐  │    │  ┌───────────┐  │    │  ┌───────────┐  │
│  │    NFT    │  │    │  │    NFT    │  │    │  │    NFT    │  │    │  │ Protocol  │  │
│  │ Contract  │  │    │  │ Contract  │  │    │  │ Contract  │  │    │  │Contracts  │  │
│  └───────────┘  │    │  └───────────┘  │    │  └───────────┘  │    │  └───────────┘  │
└─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │                       │
         └───────────────────────┼───────────────────────┼───────────────────────┘
                                 │                       │
                                 ▼                       ▼
                    ┌─────────────────────────────────────────────────────────┐
                    │              ZetaChain TSS Network                      │
                    │  ┌─────────────────────────────────────────────────┐    │
                    │  │        Threshold Signature Scheme              │    │
                    │  │  • Multi-party computation                     │    │
                    │  │  • Distributed key generation                  │    │
                    │  │  • Cross-chain message verification           │    │
                    │  └─────────────────────────────────────────────────┘    │
                    └─────────────────────────────────────────────────────────┘
                                            │
                                            ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              Solana Blockchain                                  │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                    Universal NFT Program                                │   │
│  │                                                                         │   │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐        │   │
│  │  │   Initialize    │  │    Mint NFT     │  │ Cross-Chain     │        │   │
│  │  │   Instruction   │  │   Instruction   │  │   Transfer      │        │   │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘        │   │
│  │                                                                         │   │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐        │   │
│  │  │ Receive Cross   │  │ Verify Owner    │  │    Program      │        │   │
│  │  │    Chain        │  │   Instruction   │  │     State       │        │   │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘        │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                        Account Structure                                │   │
│  │                                                                         │   │
│  │  • ProgramState PDA     • NftMetadata PDA    • TransferRecord PDA      │   │
│  │  • CrossChainConfig     • Token Accounts     • Associated Accounts     │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────┘
                                            │
                                            ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         TypeScript Client SDK                                   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                    UniversalNftClient Class                             │   │
│  │                                                                         │   │
│  │  • Connection Management     • Transaction Building                    │   │
│  │  • Wallet Integration        • Account Resolution                      │   │
│  │  • Program Interaction       • Error Handling                          │   │
│  │  • Cross-chain Utilities     • Event Parsing                          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Solana Program Layer

#### Program Instructions

**📍 All instructions implemented in**: [`programs/universal-nft/src/instructions/`](../programs/universal-nft/src/instructions/)

- **Initialize**: Set up program state and cross-chain configuration  
  **🔍 Code**: [`initialize.rs`](../programs/universal-nft/src/instructions/initialize.rs) - Lines 10-45  
  **✅ Proof**: Creates program state PDA with TSS configuration

- **Mint NFT**: Create new NFTs with optional cross-chain capabilities  
  **🔍 Code**: [`mint_nft.rs`](../programs/universal-nft/src/instructions/mint_nft.rs) - Lines 15-65  
  **✅ Proof**: SPL Token integration + metadata PDA creation

- **Cross-Chain Transfer**: Initiate transfer to another blockchain  
  **🔍 Code**: [`cross_chain_transfer.rs`](../programs/universal-nft/src/instructions/cross_chain_transfer.rs) - Lines 20-80  
  **✅ Proof**: Locks NFT + sends ZetaChain message with TSS

- **Receive Cross-Chain**: Handle incoming NFTs from other chains  
  **🔍 Code**: [`receive_cross_chain.rs`](../programs/universal-nft/src/instructions/receive_cross_chain.rs) - Lines 25-90  
  **✅ Proof**: TSS signature verification + NFT unlock/mint

- **Verify Ownership**: Validate NFT ownership for operations  
  **🔍 Code**: [`verify_ownership.rs`](../programs/universal-nft/src/instructions/verify_ownership.rs) - Lines 10-40  
  **✅ Proof**: Token account validation + signature checking

#### Account Architecture
```
Program State PDA
├── authority: Pubkey
├── tss_address: Pubkey
├── gateway_program: Pubkey
├── nft_count: u64
└── cross_chain_transfers: u64

NFT Metadata PDA (per NFT)
├── mint: Pubkey
├── name: String
├── symbol: String
├── uri: String
├── cross_chain_enabled: bool
├── current_chain: u64
└── transfer_count: u32

Cross-Chain Transfer Record PDA
├── nft_mint: Pubkey
├── source_chain: u64
├── destination_chain: u64
├── nonce: u64
└── status: TransferStatus
```

### 2. Cross-Chain Communication Layer

#### ZetaChain TSS Integration
```
Cross-Chain Message Flow:

1. Solana → ZetaChain
   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
   │   Solana    │────│  ZetaChain  │────│ Destination │
   │   Program   │    │     TSS     │    │    Chain    │
   └─────────────┘    └─────────────┘    └─────────────┘
   
2. Message Structure
   {
     "sourceChain": 1001,        // Solana
     "destinationChain": 1,      // Ethereum
     "nftData": {
       "mint": "...",
       "metadata": {...}
     },
     "nonce": 12345,
     "timestamp": 1672531200
   }

3. TSS Signature Verification
   - Multi-party computation validates message
   - Distributed key signing ensures security
   - Replay protection via nonce tracking
```

### 3. Security Architecture

#### Multi-Layer Security Model
```
┌─────────────────────────────────────────────────────────────────┐
│                     Security Layers                            │
├─────────────────────────────────────────────────────────────────┤
│ Layer 1: Program Authority                                      │
│ • Only authorized accounts can perform critical operations      │
│ • Multi-signature support for authority management             │
├─────────────────────────────────────────────────────────────────┤
│ Layer 2: TSS Signature Verification                            │
│ • All cross-chain messages verified via ZetaChain TSS          │
│ • Distributed trust model prevents single points of failure    │
├─────────────────────────────────────────────────────────────────┤
│ Layer 3: Replay Protection                                     │
│ • Unique nonces prevent replay attacks                         │
│ • Timestamp validation ensures message freshness               │
├─────────────────────────────────────────────────────────────────┤
│ Layer 4: Account Validation                                    │
│ • Strict PDA derivation and validation                         │
│ • Token account ownership verification                         │
├─────────────────────────────────────────────────────────────────┤
│ Layer 5: Compute Budget Management                             │
│ • Optimized instructions for Solana compute limits             │
│ • CPI optimization for complex operations                      │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow Diagrams

### NFT Minting Flow
```
User Request → Client SDK → Solana Program → Token Program → SPL Token
     │              │            │                │              │
     ▼              ▼            ▼                ▼              ▼
┌─────────┐  ┌─────────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
│ Wallet  │  │ Transaction │  │   NFT    │  │  Token   │  │   Mint   │
│   UI    │  │  Builder    │  │Metadata  │  │ Account  │  │ Account  │
└─────────┘  └─────────────┘  └──────────┘  └──────────┘  └──────────┘
```

### Cross-Chain Transfer Flow
```
Solana NFT Owner
     │
     ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Initialize    │────▶│   Lock NFT on   │────▶│  Send Message   │
│   Transfer      │     │     Solana      │     │  to ZetaChain   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                          │
                        ┌─────────────────┐              ▼
                        │   Mint NFT on   │     ┌─────────────────┐
                        │  Destination    │◀────│  TSS Validates  │
                        │     Chain       │     │   and Signs     │
                        └─────────────────┘     └─────────────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │  NFT Available  │
                        │  on Target      │
                        │   Blockchain    │
                        └─────────────────┘
```

## Performance Characteristics

### Solana Program Optimizations
- **Compute Units**: Each instruction optimized for <200k CU usage
- **Account Size**: Minimal account data to reduce rent costs
- **PDA Derivation**: Efficient seed-based addressing
- **Memory Management**: Zero-copy deserialization where possible

### Cross-Chain Performance
- **Message Latency**: ~30 seconds average cross-chain confirmation
- **TSS Signature**: Sub-second verification on Solana
- **Throughput**: Supports concurrent cross-chain transfers
- **Finality**: Leverages each chain's finality guarantees

## Deployment Architecture

### Environment Configuration
```
Development Environment
├── Local Solana Validator
├── ZetaChain Testnet
├── EVM Testnets (Goerli, Mumbai)
└── Client SDK Examples

Staging Environment
├── Solana Devnet
├── ZetaChain Athens Testnet
├── EVM Testnets
└── Integration Testing

Production Environment
├── Solana Mainnet
├── ZetaChain Mainnet
├── EVM Mainnets
└── Production Monitoring
```

### Scalability Design

#### Horizontal Scaling
- Multiple program instances per supported chain pair
- Load balancing across ZetaChain TSS nodes
- Parallel processing of cross-chain messages

#### Vertical Scaling
- Program instruction optimization
- Account data structure optimization
- Client SDK connection pooling

## Integration Points

### ZetaChain Protocol Integration
- **Gateway Contract**: Interface with ZetaChain's Solana gateway
- **TSS Network**: Signature verification and message routing
- **Chain Registry**: Dynamic support for new blockchain networks

### Solana Ecosystem Integration
- **SPL Token**: Standard NFT token creation and management
- **Metaplex**: Metadata standard compatibility
- **Anchor**: Framework for type-safe program development

### EVM Integration
- **Standard NFT Contracts**: ERC-721/ERC-1155 compatibility
- **Bridge Contracts**: Ethereum, BSC, Polygon native contracts
- **Metadata Standards**: OpenSea and other marketplace compatibility

## Monitoring and Observability

### Key Metrics
- Cross-chain transfer success rate
- Average transfer completion time
- TSS signature verification performance
- Program instruction compute usage
- Account rent optimization

### Error Tracking
- Failed cross-chain transfers
- TSS signature failures
- Compute budget overruns
- Account validation errors
- Client SDK connection issues

This architecture provides a robust foundation for secure, scalable cross-chain NFT operations while maintaining high performance on Solana and seamless integration with the broader blockchain ecosystem.