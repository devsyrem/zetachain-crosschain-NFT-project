#!/bin/bash

# Universal NFT Program Deployment Script
set -e

echo "🚀 Deploying Universal NFT Program..."

# Check if we're in the right directory
if [ ! -f "Anchor.toml" ]; then
    echo "❌ Error: Anchor.toml not found. Make sure you're in the project root directory."
    exit 1
fi

# Set deployment network (default to devnet)
NETWORK=${1:-devnet}
echo "📡 Deploying to: $NETWORK"

# Configure Solana CLI for the target network
case $NETWORK in
    "mainnet")
        solana config set --url mainnet-beta
        ;;
    "devnet")
        solana config set --url devnet
        ;;
    "testnet")
        solana config set --url testnet
        ;;
    "localnet")
        solana config set --url localhost
        ;;
    *)
        echo "❌ Error: Unsupported network '$NETWORK'. Use: mainnet, devnet, testnet, or localnet"
        exit 1
        ;;
esac

# Check wallet balance
BALANCE=$(solana balance --lamports)
MIN_BALANCE=2000000000  # 2 SOL in lamports

echo "💰 Current wallet balance: $(solana balance) SOL"

if [ "$BALANCE" -lt "$MIN_BALANCE" ]; then
    echo "⚠️  Warning: Low balance. You may need more SOL for deployment."
    
    if [ "$NETWORK" = "devnet" ] || [ "$NETWORK" = "testnet" ]; then
        echo "🪂 Requesting airdrop..."
        solana airdrop 2 --url $NETWORK || echo "❌ Airdrop failed"
    fi
fi

# Build the program
echo "🔨 Building program..."
anchor build

# Generate program keypair if it doesn't exist
PROGRAM_KEYPAIR="target/deploy/universal_nft-keypair.json"
if [ ! -f "$PROGRAM_KEYPAIR" ]; then
    echo "🔑 Generating program keypair..."
    solana-keygen new --outfile $PROGRAM_KEYPAIR --no-bip39-passphrase
fi

# Get program ID
PROGRAM_ID=$(solana address -k $PROGRAM_KEYPAIR)
echo "📋 Program ID: $PROGRAM_ID"

# Update program ID in code
echo "📝 Updating program ID in source code..."
sed -i.bak "s/declare_id!(\".*\")/declare_id!(\"$PROGRAM_ID\")/" programs/universal-nft/src/lib.rs

# Update Anchor.toml
sed -i.bak "s/universal_nft = \".*\"/universal_nft = \"$PROGRAM_ID\"/" Anchor.toml

# Rebuild with updated program ID
echo "🔨 Rebuilding with updated program ID..."
anchor build

# Deploy the program
echo "🚀 Deploying program to $NETWORK..."
anchor deploy --program-name universal_nft --program-keypair $PROGRAM_KEYPAIR

# Verify deployment
echo "✅ Verifying deployment..."
solana program show $PROGRAM_ID

# Save deployment info
DEPLOYMENT_FILE="deployments/$NETWORK-deployment.json"
mkdir -p deployments

cat > $DEPLOYMENT_FILE << EOF
{
  "network": "$NETWORK",
  "programId": "$PROGRAM_ID",
  "programKeypair": "$PROGRAM_KEYPAIR",
  "deployedAt": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "deployedBy": "$(solana address)",
  "rpcUrl": "$(solana config get | grep 'RPC URL' | awk '{print $3}')",
  "anchorVersion": "$(anchor --version)",
  "solanaVersion": "$(solana --version)"
}
EOF

echo "📁 Deployment info saved to: $DEPLOYMENT_FILE"

# Initialize the program if this is the first deployment
echo "🎯 Initializing program..."

# You may need to update these addresses with actual ZetaChain gateway and TSS addresses
GATEWAY_ADDRESS=${GATEWAY_ADDRESS:-"GatewayAddress111111111111111111111111111"}
TSS_ADDRESS=${TSS_ADDRESS:-"TssAddress1111111111111111111111111111111"}
CHAIN_ID=${CHAIN_ID:-"1001"}

echo "Gateway Address: $GATEWAY_ADDRESS"
echo "TSS Address: $TSS_ADDRESS"
echo "Chain ID: $CHAIN_ID"

# Run initialization (this might fail if already initialized)
anchor run initialize_program \
  --provider.cluster $NETWORK \
  -- \
  --gateway-address $GATEWAY_ADDRESS \
  --tss-address $TSS_ADDRESS \
  --chain-id $CHAIN_ID \
  || echo "⚠️  Program may already be initialized"

echo ""
echo "🎉 Deployment completed successfully!"
echo ""
echo "📋 Deployment Summary:"
echo "   Network: $NETWORK"
echo "   Program ID: $PROGRAM_ID"
echo "   Wallet: $(solana address)"
echo "   Balance After: $(solana balance) SOL"
echo ""
echo "🔗 Useful Commands:"
echo "   View program: solana program show $PROGRAM_ID"
echo "   View logs: solana logs $PROGRAM_ID"
echo "   Run tests: anchor test"
echo ""
echo "📝 Next Steps:"
echo "1. Update your client code with the new program ID"
echo "2. Test the deployed program with 'anchor test --skip-deploy'"
echo "3. Update frontend/client configurations with the program ID"
echo ""

# Log deployment to history
echo "$(date): Deployed to $NETWORK with ID $PROGRAM_ID" >> deployments/deployment-history.log
