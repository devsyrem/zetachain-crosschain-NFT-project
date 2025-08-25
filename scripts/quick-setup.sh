#!/bin/bash

# Quick Setup for Universal NFT Program - Production Ready
set -e

echo "🚀 Universal NFT Program - Quick Production Setup"
echo "=================================================="

# Install Rust if not present  
if ! command -v rustc &> /dev/null; then
    echo "📦 Installing Rust..."
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --default-toolchain stable --no-modify-path
    export PATH="$HOME/.cargo/bin:$PATH"
    source ~/.cargo/env 2>/dev/null || true
    rustup component add rustfmt clippy 2>/dev/null || echo "Components will be added after restart"
fi

# Install Solana CLI if not present
if ! command -v solana &> /dev/null; then
    echo "📦 Installing Solana CLI..."
    sh -c "$(curl -sSfL https://release.anza.xyz/stable/install)"
    export PATH="~/.local/share/solana/install/active_release/bin:$PATH"
fi

# Install Anchor if not present
if ! command -v anchor &> /dev/null; then
    echo "📦 Installing Anchor..."
    # Set OpenSSL environment variables for compilation
    export PKG_CONFIG_PATH="/usr/lib/x86_64-linux-gnu/pkgconfig:/usr/share/pkgconfig"
    export OPENSSL_DIR="/usr"
    export OPENSSL_LIB_DIR="/usr/lib/x86_64-linux-gnu"
    export OPENSSL_INCLUDE_DIR="/usr/include/openssl"
    
    cargo install --git https://github.com/coral-xyz/anchor avm --locked --force || {
        echo "⚠️ AVM installation failed, trying alternative approach..."
        curl -sSfL https://release.anza.xyz/stable/install | sh
        export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
        npm install -g @coral-xyz/anchor-cli || echo "Using system Anchor if available"
    }
    
    # Try to set up AVM if it was installed successfully
    if command -v avm &> /dev/null; then
        avm install 0.31.1 || echo "Version 0.31.1 may already be installed"
        avm use 0.31.1
        # Add avm's anchor to PATH
        export PATH="$HOME/.avm/bin:$PATH"
    fi
fi

# Configure Solana for development
echo "🔧 Configuring Solana..."
solana config set --url devnet
solana-keygen new --no-bip39-passphrase --silent --outfile ~/.config/solana/id.json --force || true

# Check if wallet has SOL, if not request airdrop
balance=$(solana balance ~/.config/solana/id.json | cut -d' ' -f1)
# Use awk instead of bc for floating point comparison
if awk "BEGIN {exit !($balance < 2)}"; then
    echo "💰 Requesting SOL airdrop for testing..."
    solana airdrop 2 ~/.config/solana/id.json || echo "Airdrop may have failed, continuing..."
fi

# Set up PATH for anchor and all tools
export PATH="$HOME/.avm/bin:$HOME/.cargo/bin:$HOME/.local/share/solana/install/active_release/bin:$PATH"

# Build the program
echo "🔨 Building Universal NFT Program..."
if command -v anchor &> /dev/null; then
    anchor build
else
    echo "⚠️ Anchor not found in PATH, trying alternative build..."
    # Try using cargo to build the Rust program directly (updated command)
    cd programs/universal-nft && cargo build-sbf --manifest-path=Cargo.toml --sbf-out-dir=../../target/deploy
    cd ../..
fi

# Generate TypeScript types (if anchor is available)
if command -v anchor &> /dev/null; then
    echo "📋 Generating TypeScript client types..."
    anchor build --idl target/idl || echo "IDL generation skipped"
    mkdir -p client/src/idl/
    [ -f target/idl/universal_nft.json ] && cp target/idl/universal_nft.json client/src/idl/ || echo "IDL copy skipped"
else
    echo "📋 Skipping TypeScript generation (Anchor not available)"
fi

echo "✅ Production setup complete!"
echo ""
echo "🎯 Next steps:"
echo "  1. Run 'anchor test' to verify everything works"
echo "  2. Deploy with 'anchor deploy' when ready"
echo "  3. Use the TypeScript client in client/src/"
echo ""
echo "💡 Environment configured for:"
echo "  - Solana Devnet"
echo "  - Cross-chain NFT operations"
echo "  - ZetaChain interoperability"