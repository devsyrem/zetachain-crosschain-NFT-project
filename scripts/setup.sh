#!/bin/bash

# Universal NFT Program Setup Script
echo "Setting up Universal NFT Program development environment..."

# Check if Rust is installed
if ! command -v rustc &> /dev/null; then
    echo "Rust is not installed. Installing Rust..."
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
    source ~/.cargo/env
else
    echo "Rust is already installed"
fi

# Check if Solana CLI is installed
if ! command -v solana &> /dev/null; then
    echo "Solana CLI is not installed. Installing..."
    curl -sSf https://release.solana.com/v1.18.17/install | sh
    export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
    
    # Add to PATH permanently
    echo 'export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"' >> ~/.bashrc
    echo 'export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"' >> ~/.profile
else
    echo "Solana CLI is already installed"
fi

# Check if Anchor is installed
if ! command -v anchor &> /dev/null; then
    echo "Anchor is not installed. Installing..."
    npm install -g @coral-xyz/anchor-cli@0.30.0
else
    echo "Anchor is already installed"
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Node.js is not installed. Installing..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    echo "Node.js is already installed"
fi

# Set Solana config to devnet for development
echo "Configuring Solana CLI for devnet..."
solana config set --url devnet

# Generate a new keypair if one doesn't exist
if [ ! -f ~/.config/solana/id.json ]; then
    echo "Generating new Solana keypair..."
    solana-keygen new --no-bip39-passphrase
else
    echo "Solana keypair already exists"
fi

# Fund the wallet for development
echo "Requesting airdrop for development..."
solana airdrop 2 --url devnet || echo "Airdrop failed - wallet may already be funded"

# Install Node.js dependencies
if [ -f "package.json" ]; then
    echo "Installing Node.js dependencies..."
    npm install
else
    echo "No package.json found - skipping npm install"
fi

# Build the Anchor project
if [ -f "Anchor.toml" ]; then
    echo "Building Anchor project..."
    anchor build
    
    # Update the program ID in lib.rs if needed
    PROGRAM_ID=$(anchor keys list | grep "universal_nft" | awk '{print $2}')
    if [ ! -z "$PROGRAM_ID" ]; then
        echo "Program ID: $PROGRAM_ID"
        sed -i.bak "s/declare_id!(\".*\")/declare_id!(\"$PROGRAM_ID\")/" programs/universal-nft/src/lib.rs
        echo "Updated program ID in lib.rs"
    fi
else
    echo "No Anchor.toml found - this may not be an Anchor project"
fi

# Create necessary directories
mkdir -p logs
mkdir -p deployments

echo ""
echo "Setup complete! ✅"
echo ""
echo "Development environment ready:"
echo "- Rust: $(rustc --version)"
echo "- Solana CLI: $(solana --version)"
echo "- Anchor: $(anchor --version)"
echo "- Node.js: $(node --version)"
echo ""
echo "Solana wallet address: $(solana address)"
echo "Solana RPC URL: $(solana config get | grep 'RPC URL' | awk '{print $3}')"
echo ""
echo "Next steps:"
echo "1. Run 'anchor test' to execute tests"
echo "2. Run 'anchor deploy' to deploy to devnet"
echo "3. Check the client example with 'npx ts-node client/example.ts'"
echo ""
