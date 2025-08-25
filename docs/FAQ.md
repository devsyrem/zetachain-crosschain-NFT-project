# Universal NFT Program - Frequently Asked Questions

## General Questions

### What is the Universal NFT Program?
The Universal NFT Program is a Solana-based smart contract that enables secure cross-chain NFT transfers between Solana and EVM-compatible blockchains (Ethereum, BSC, Polygon) through ZetaChain's interoperability protocol.

### How does cross-chain NFT transfer work?
1. NFT is locked on the source chain (e.g., Solana)
2. A message is sent to ZetaChain's TSS network
3. ZetaChain validators verify and sign the transfer
4. The NFT is minted/unlocked on the destination chain
5. Original NFT remains locked until returned

### Is this secure?
Yes, the system uses multiple security layers:
- ZetaChain's Threshold Signature Scheme (TSS) for distributed security
- Nonce-based replay protection
- Program authority controls
- Strict account validation on Solana

## Setup and Installation

### Why is the automatic setup failing?
Common causes and solutions:

**Rust Installation Issues:**
```bash
# If rustup fails, try manual installation
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env
rustup update
```

**Solana CLI Issues:**
```bash
# Use the stable version
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
```

**Anchor Installation Issues:**
```bash
# Install via cargo instead of npm
cargo install --git https://github.com/coral-xyz/anchor anchor-cli --locked
```

### How do I know if my environment is set up correctly?
Run our diagnostic script:
```bash
./scripts/diagnose.sh
```

Or check manually:
```bash
rustc --version    # Should show 1.70+
solana --version   # Should show 1.16+
anchor --version   # Should show 0.30+
node --version     # Should show 18+
```

### "Permission denied" when running scripts
```bash
chmod +x scripts/*.sh
chmod +x *.sh
```

## Development Issues

### Program deployment fails with "Insufficient funds"
```bash
# Get devnet SOL
solana config set --url https://api.devnet.solana.com
solana airdrop 5

# Check balance
solana balance
```

### "Program not found" error when testing
1. Make sure you deployed the program: `anchor deploy`
2. Check your program ID: `anchor keys list`
3. Update the program ID in your test files

### TypeScript compilation errors in client SDK
```bash
# Rebuild everything
anchor build
npm run build

# Clear cache if needed
rm -rf node_modules target
npm install
anchor build
```

### Tests are failing
1. **Check devnet connection**: `solana ping`
2. **Verify program deployment**: `solana program show <PROGRAM_ID>`
3. **Run simple tests first**: `node run-simple-tests.js`
4. **Check error logs**: Enable debug with `ANCHOR_LOG=true`

## Cross-Chain Operations

### Which blockchains are supported?
Currently supported:
- **Ethereum** (Chain ID: 1)
- **BNB Smart Chain** (Chain ID: 56) 
- **Polygon** (Chain ID: 137)
- **ZetaChain** (Chain ID: 1001)

Additional EVM chains can be added through configuration updates.

### How long do cross-chain transfers take?
- **Solana to EVM**: ~30-60 seconds
- **EVM to Solana**: ~1-2 minutes
- **Between EVM chains**: ~30-60 seconds

Times depend on network congestion and finality requirements.

### Can I transfer the same NFT multiple times?
Yes, but the NFT can only exist on one chain at a time. Each transfer locks it on the source chain and unlocks/mints it on the destination chain.

### What happens if a cross-chain transfer fails?
- The NFT remains locked on the source chain
- Transfer can be retried with a new nonce
- Failed transfers don't lose your NFT
- Check the transfer record for status

### How do I track cross-chain transfer status?
```javascript
// Get transfer record
const transferRecord = await program.account.crossChainTransferRecord.fetch(transferRecordPda);
console.log('Status:', transferRecord.status);
console.log('Destination chain:', transferRecord.destinationChain);
```

## Cost and Performance

### How much does it cost to use?
**Solana costs (devnet):**
- Program initialization: ~0.01 SOL
- Mint NFT: ~0.002 SOL
- Cross-chain transfer: ~0.003 SOL

**Mainnet costs are similar but may vary with network congestion.**

**Destination chain costs:**
- Ethereum: Variable gas fees
- BSC: ~$0.20-1.00
- Polygon: ~$0.01-0.10

### Is there a limit on NFT metadata size?
- **Solana account size**: 10KB max per account
- **Metadata URI**: Use external storage (IPFS, Arweave) for large metadata
- **On-chain data**: Keep to essential fields only

### How many cross-chain transfers can I do per second?
- **Solana throughput**: Up to 65,000 TPS theoretical
- **Cross-chain bottleneck**: ZetaChain TSS processing (~10-100 per second)
- **Practical limit**: ~50 transfers per second during peak times

## Security and Best Practices

### Is my NFT safe during cross-chain transfer?
Yes:
- NFTs are locked, not burned, on the source chain
- TSS provides cryptographic guarantees
- Failed transfers don't result in lost NFTs
- Multiple validators must agree on transfers

### What should I do for production deployment?
1. **Audit the code**: Consider professional security audit
2. **Use proper keys**: Generate new keypairs for mainnet
3. **Monitor operations**: Set up logging and alerting
4. **Test thoroughly**: Use testnets extensively first
5. **Backup important data**: Keep copies of program keys

### How do I protect against replay attacks?
The system automatically handles replay protection through:
- Unique nonces for each transfer
- Timestamp validation
- TSS signature verification

### Can the program authority change my NFTs?
The program authority can:
- Update cross-chain configuration
- Pause/unpause operations
- Upgrade program logic (if enabled)

The authority cannot:
- Steal or transfer your NFTs
- Modify NFT metadata without permission
- Access locked funds

## Integration and Development

### How do I integrate this into my existing NFT marketplace?
1. **Use the TypeScript SDK**: Import `UniversalNftClient`
2. **Add cross-chain buttons**: Enable transfer to other chains
3. **Handle async operations**: Cross-chain transfers aren't instant
4. **Update metadata display**: Show current chain location

Example integration:
```typescript
import { UniversalNftClient } from './path/to/client';

// In your marketplace component
const transferToEthereum = async (nftMint) => {
  await universalNftClient.crossChainTransfer({
    mint: nftMint,
    destinationChainId: 1,
    destinationAddress: userEthAddress,
    nonce: Date.now()
  });
};
```

### Can I customize the NFT metadata format?
Yes, but maintain compatibility:
```json
{
  "name": "Your NFT Name",
  "description": "Description",
  "image": "https://arweave.net/image-hash",
  "attributes": [...],
  "cross_chain_data": {
    "original_chain": 1001,
    "supported_chains": [1, 56, 137, 1001]
  }
}
```

### How do I add support for a new blockchain?
1. **Update cross-chain config**: Add new chain ID
2. **Deploy bridge contracts**: On the new chain
3. **Configure TSS**: Update ZetaChain configuration
4. **Test thoroughly**: Verify all operations work

### Can I fork this project for my own use?
Yes! The project is open source. Please:
- Keep security features intact
- Credit the original project
- Consider contributing improvements back
- Test thoroughly before production use

## Troubleshooting Common Errors

### "Account not found"
```bash
# Usually means program not deployed or wrong network
solana config get  # Check you're on the right network
anchor deploy      # Redeploy if needed
```

### "Signature verification failed"
```bash
# Check your wallet is connected and has permissions
solana address     # Verify wallet address
solana balance     # Ensure sufficient funds
```

### "Compute budget exceeded"
This is a Solana limitation. Try:
- Breaking complex operations into smaller transactions
- Using more efficient instruction combinations
- Updating to the latest version (we optimize for compute usage)

### "TSS signature invalid"
- Usually a testnet/mainnet mismatch
- Verify you're using correct ZetaChain endpoints
- Check that TSS address configuration is correct

### "Nonce already used"
```javascript
// Use a fresh nonce for each transfer
const nonce = Date.now() + Math.random() * 1000;
```

## Getting More Help

### Where can I find more examples?
- `examples/` directory in the repository
- `client/example.ts` for TypeScript usage
- Test files for advanced usage patterns

### How do I report bugs or request features?
1. **Check existing issues** on GitHub first
2. **Provide detailed information**:
   - Steps to reproduce
   - Error messages
   - Environment details (OS, Node version, etc.)
3. **Include relevant logs** when possible

### Is there a community or support channel?
- **GitHub Issues**: Primary support channel
- **GitHub Discussions**: Q&A and feature discussions  
- **Documentation**: Comprehensive guides in `docs/`

### How can I contribute to the project?
1. **Fork the repository**
2. **Create feature branches**
3. **Add tests** for new functionality
4. **Submit pull requests**
5. **Help with documentation**

We welcome contributions of all kinds!

---

**Still have questions?** Open an issue on GitHub with the tag `question` and we'll help you out!