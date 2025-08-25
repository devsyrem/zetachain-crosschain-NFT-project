# Universal NFT Program - API Reference

## Table of Contents
- [Rust Program API](#rust-program-api)
- [TypeScript Client SDK](#typescript-client-sdk)
- [Cross-Chain Integration](#cross-chain-integration)
- [Error Codes](#error-codes)

## Rust Program API

### Program Instructions

#### `initialize`
Initialize the Universal NFT program with cross-chain configuration.

**📍 Implementation**: [`programs/universal-nft/src/instructions/initialize.rs`](../programs/universal-nft/src/instructions/initialize.rs)

**Accounts:**
- `program_state` (mut): Program state PDA
- `cross_chain_config` (mut): Cross-chain configuration PDA  
- `authority` (mut, signer): Program authority
- `system_program`: Solana system program

**Parameters:**
- `tss_address`: PublicKey - ZetaChain TSS address
- `gateway_program`: PublicKey - ZetaChain gateway program ID

**🔍 Code Proof** (initialize.rs:15-35):
```rust
pub fn initialize(
    ctx: Context<Initialize>,
    tss_address: Pubkey,
    gateway_program: Pubkey,
) -> Result<()> {
    let program_state = &mut ctx.accounts.program_state;
    program_state.authority = ctx.accounts.authority.key();
    program_state.tss_address = tss_address;
    program_state.gateway_program = gateway_program;
    program_state.initialized = true;
    
    msg!("Universal NFT Program initialized with TSS: {}", tss_address);
    Ok(())
}
```

**✅ Testing**: Validated in [`run-simple-tests.js:25-35`](../run-simple-tests.js)

#### `mint_nft`
Mint a new NFT with optional cross-chain capabilities.

**Accounts:**
- `nft_metadata` (mut): NFT metadata PDA
- `mint` (mut): Token mint account
- `token_account` (mut): Token account for the NFT
- `authority` (mut, signer): Minting authority
- `token_program`: SPL Token program
- `associated_token_program`: Associated Token program
- `system_program`: System program
- `rent`: Rent sysvar

**Parameters:**
- `metadata_uri`: String - URI for NFT metadata
- `name`: String - NFT name
- `symbol`: String - NFT symbol
- `cross_chain_enabled`: bool - Enable cross-chain transfers

#### `cross_chain_transfer`
Transfer NFT to another blockchain via ZetaChain.

**Accounts:**
- `nft_metadata` (mut): NFT metadata PDA
- `transfer_record` (mut): Cross-chain transfer record PDA
- `mint`: Token mint account
- `from_token_account` (mut): Source token account
- `authority` (signer): NFT owner
- `cross_chain_config`: Cross-chain configuration
- `token_program`: SPL Token program

**Parameters:**
- `destination_chain_id`: u64 - Target blockchain ID
- `destination_address`: Vec<u8> - Target address on destination chain
- `nonce`: u64 - Unique nonce for replay protection

#### `receive_cross_chain`
Receive NFT from another blockchain via ZetaChain.

**Accounts:**
- `nft_metadata` (mut): NFT metadata PDA
- `mint` (mut): Token mint account
- `to_token_account` (mut): Destination token account
- `cross_chain_config`: Cross-chain configuration
- `authority` (signer): ZetaChain gateway authority

**Parameters:**
- `source_chain_id`: u64 - Source blockchain ID
- `source_tx_hash`: Vec<u8> - Source transaction hash
- `tss_signature`: Vec<u8> - TSS signature for verification
- `nonce`: u64 - Transfer nonce

#### `verify_ownership`
Verify NFT ownership for cross-chain operations.

**Accounts:**
- `nft_metadata`: NFT metadata PDA
- `mint`: Token mint account
- `token_account`: Token account to verify
- `owner` (signer): Account claiming ownership

**Returns:** `bool` - Ownership verification result

### Program State Accounts

#### `ProgramState`
```rust
pub struct ProgramState {
    pub authority: Pubkey,           // Program authority
    pub tss_address: Pubkey,         // ZetaChain TSS address
    pub gateway_program: Pubkey,     // Gateway program ID
    pub nft_count: u64,              // Total NFTs minted
    pub cross_chain_transfers: u64,  // Total cross-chain transfers
    pub initialized: bool,           // Initialization status
}
```

#### `CrossChainConfig`
```rust
pub struct CrossChainConfig {
    pub supported_chains: Vec<u64>,  // Supported chain IDs
    pub min_confirmations: u8,       // Required confirmations
    pub fee_collector: Pubkey,       // Fee collection account
    pub enabled: bool,               // Cross-chain enabled status
}
```

#### `NftMetadata`
```rust
pub struct NftMetadata {
    pub mint: Pubkey,               // NFT mint address
    pub name: String,               // NFT name
    pub symbol: String,             // NFT symbol
    pub uri: String,                // Metadata URI
    pub cross_chain_enabled: bool,  // Cross-chain capability
    pub current_chain: u64,         // Current blockchain ID
    pub original_chain: u64,        // Original blockchain ID
    pub transfer_count: u32,        // Number of transfers
}
```

## TypeScript Client SDK

### UniversalNftClient Class

#### Constructor
```typescript
constructor(
  connection: Connection,
  wallet: AnchorWallet,
  programId: PublicKey,
  gatewayAddress: PublicKey
)
```

#### Methods

##### `initialize(tssAddress: PublicKey, gatewayProgram: PublicKey)`
Initialize the program with cross-chain configuration.

**Returns:** `Promise<string>` - Transaction signature

##### `mintNft(params: MintNftParams)`
Mint a new NFT with optional cross-chain capabilities.

**Parameters:**
```typescript
interface MintNftParams {
  metadataUri: string;
  name: string;
  symbol: string;
  crossChainEnabled: boolean;
  recipient?: PublicKey; // Optional recipient (defaults to wallet)
}
```

**Returns:** `Promise<MintNftResult>`
```typescript
interface MintNftResult {
  signature: string;
  mint: PublicKey;
  tokenAccount: PublicKey;
  metadataPda: PublicKey;
}
```

##### `crossChainTransfer(params: CrossChainTransferParams)`
Transfer NFT to another blockchain.

**Parameters:**
```typescript
interface CrossChainTransferParams {
  mint: PublicKey;
  destinationChainId: number;
  destinationAddress: Uint8Array;
  nonce: number;
}
```

**Returns:** `Promise<string>` - Transaction signature

##### `verifyOwnership(mint: PublicKey, owner?: PublicKey)`
Verify NFT ownership.

**Returns:** `Promise<boolean>` - Ownership status

##### `getNftMetadata(mint: PublicKey)`
Retrieve NFT metadata.

**Returns:** `Promise<NftMetadata>` - NFT metadata object

## Cross-Chain Integration

### ZetaChain TSS Integration

#### Message Format
```typescript
interface CrossChainMessage {
  sourceChain: number;
  destinationChain: number;
  nftData: {
    mint: string;
    metadata: NftMetadata;
  };
  nonce: number;
  timestamp: number;
}
```

#### TSS Signature Verification
```rust
pub fn verify_tss_signature(
    message: &[u8],
    signature: &[u8],
    tss_address: &Pubkey,
) -> Result<bool>
```

### Supported Blockchain Networks
- **Ethereum** (Chain ID: 1)
- **BNB Smart Chain** (Chain ID: 56)
- **Polygon** (Chain ID: 137)
- **ZetaChain** (Chain ID: 1001)

## Error Codes

### Program Errors
```rust
pub enum UniversalNftError {
    #[msg("Program not initialized")]
    NotInitialized = 6000,
    
    #[msg("Unauthorized access")]
    Unauthorized = 6001,
    
    #[msg("Invalid TSS signature")]
    InvalidTssSignature = 6002,
    
    #[msg("Cross-chain transfer not enabled")]
    CrossChainDisabled = 6003,
    
    #[msg("Invalid destination chain")]
    InvalidDestinationChain = 6004,
    
    #[msg("Nonce already used (replay protection)")]
    NonceAlreadyUsed = 6005,
    
    #[msg("Insufficient compute budget")]
    InsufficientComputeBudget = 6006,
}
```

### Client SDK Errors
- `CONNECTION_ERROR`: Failed to connect to Solana network
- `WALLET_NOT_CONNECTED`: Wallet not connected or available
- `TRANSACTION_FAILED`: Transaction execution failed
- `ACCOUNT_NOT_FOUND`: Required account not found
- `INSUFFICIENT_BALANCE`: Insufficient SOL balance for transaction

## Usage Examples

### Complete NFT Cross-Chain Transfer
```typescript
import { UniversalNftClient } from './client';
import { Connection, PublicKey } from '@solana/web3.js';

// Initialize client
const connection = new Connection('https://api.devnet.solana.com');
const client = new UniversalNftClient(
  connection,
  wallet,
  new PublicKey('YourProgramId...'),
  new PublicKey('ZetaChainGateway...')
);

// Mint NFT with cross-chain capability
const mintResult = await client.mintNft({
  metadataUri: 'https://example.com/metadata.json',
  name: 'Universal NFT',
  symbol: 'UNFT',
  crossChainEnabled: true
});

// Transfer to Ethereum
const transferSig = await client.crossChainTransfer({
  mint: mintResult.mint,
  destinationChainId: 1, // Ethereum
  destinationAddress: new TextEncoder().encode('0x742d35c5...'),
  nonce: Date.now()
});

console.log('Cross-chain transfer initiated:', transferSig);
```

## Security Considerations

1. **Replay Protection**: All cross-chain operations use unique nonces
2. **TSS Verification**: All incoming messages verified via ZetaChain TSS
3. **Authority Management**: Program authority required for critical operations
4. **Compute Budget**: All instructions optimized for Solana compute limits
5. **Account Validation**: Strict account ownership and signature verification

## Testing

Run the complete test suite:
```bash
npm test
# or
node run-simple-tests.js
```

For integration testing with actual cross-chain transfers, see `/docs/INTEGRATION_TESTING.md`.