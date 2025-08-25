#!/bin/bash

# Universal NFT System Diagnostic Script
echo "🔧 Universal NFT System Diagnostics"
echo "==================================="

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check command existence
check_command() {
    if command -v "$1" &> /dev/null; then
        echo -e "  ${GREEN}✅${NC} $1: $(which $1)"
        if [ "$1" = "rustc" ]; then
            echo "     Version: $(rustc --version)"
        elif [ "$1" = "solana" ]; then
            echo "     Version: $(solana --version)"
        elif [ "$1" = "anchor" ]; then
            echo "     Version: $(anchor --version)"
        elif [ "$1" = "node" ]; then
            echo "     Version: $(node --version)"
        elif [ "$1" = "npm" ]; then
            echo "     Version: $(npm --version)"
        fi
    else
        echo -e "  ${RED}❌${NC} $1: Not found"
        return 1
    fi
}

# Function to check file existence
check_file() {
    if [ -f "$1" ]; then
        echo -e "  ${GREEN}✅${NC} $1"
    else
        echo -e "  ${RED}❌${NC} $1: Missing"
        return 1
    fi
}

# Function to check directory existence
check_directory() {
    if [ -d "$1" ]; then
        echo -e "  ${GREEN}✅${NC} $1/"
        if [ "$2" ]; then
            local count=$(find "$1" -name "$2" | wc -l)
            echo "     Files: $count"
        fi
    else
        echo -e "  ${RED}❌${NC} $1/: Missing"
        return 1
    fi
}

echo ""
echo "🔍 Checking System Dependencies..."
echo "--------------------------------"

deps_ok=true

# Check required system tools
echo "System Tools:"
check_command "curl" || deps_ok=false
check_command "git" || deps_ok=false
check_command "bash" || deps_ok=false

echo ""
echo "Development Tools:"
check_command "rustc" || deps_ok=false
check_command "cargo" || deps_ok=false
check_command "solana" || deps_ok=false
check_command "anchor" || deps_ok=false
check_command "node" || deps_ok=false
check_command "npm" || deps_ok=false

echo ""
echo "🏗️ Checking Project Structure..."
echo "--------------------------------"

structure_ok=true

# Check core files
echo "Configuration Files:"
check_file "Anchor.toml" || structure_ok=false
check_file "package.json" || structure_ok=false
check_file "tsconfig.json" || structure_ok=false
check_file "Cargo.toml" || structure_ok=false

echo ""
echo "Program Files:"
check_directory "programs/universal-nft/src" "*.rs" || structure_ok=false
check_file "programs/universal-nft/src/lib.rs" || structure_ok=false
check_file "programs/universal-nft/Cargo.toml" || structure_ok=false

echo ""
echo "Client Files:"
check_directory "client/src" || structure_ok=false
check_file "client/src/client.ts" || structure_ok=false

echo ""
echo "Scripts:"
check_directory "scripts" "*.sh" || structure_ok=false
check_file "scripts/quick-setup.sh" || structure_ok=false

echo ""
echo "📊 Checking Build Artifacts..."
echo "------------------------------"

build_ok=true

echo "Build Outputs:"
if [ -f "target/idl/universal_nft.json" ]; then
    echo -e "  ${GREEN}✅${NC} IDL file generated"
    # Validate IDL structure
    if node -e "
        const fs = require('fs');
        try {
            const idl = JSON.parse(fs.readFileSync('target/idl/universal_nft.json', 'utf8'));
            if (idl.name === 'universal_nft' && idl.instructions && idl.instructions.length > 0) {
                console.log('     Valid IDL with', idl.instructions.length, 'instructions');
            } else {
                console.log('     Invalid IDL structure');
                process.exit(1);
            }
        } catch (error) {
            console.log('     IDL validation failed:', error.message);
            process.exit(1);
        }
    " 2>/dev/null; then
        echo -e "     ${GREEN}✅${NC} IDL structure valid"
    else
        echo -e "     ${RED}❌${NC} IDL structure invalid"
        build_ok=false
    fi
else
    echo -e "  ${RED}❌${NC} IDL file missing (run 'anchor build')"
    build_ok=false
fi

# Check target directory
check_directory "target" || build_ok=false

# Check node modules
if [ -d "node_modules" ]; then
    echo -e "  ${GREEN}✅${NC} Node dependencies installed"
else
    echo -e "  ${YELLOW}⚠️${NC} Node dependencies missing (run 'npm install')"
fi

echo ""
echo "🌐 Checking Network Configuration..."
echo "-----------------------------------"

network_ok=true

echo "Solana Configuration:"
if solana config get &> /dev/null; then
    echo -e "  ${GREEN}✅${NC} Solana CLI configured"
    echo "     RPC URL: $(solana config get | grep 'RPC URL' | cut -d: -f2- | xargs)"
    echo "     Keypair: $(solana config get | grep 'Keypair Path' | cut -d: -f2- | xargs)"
    
    # Check balance
    if balance=$(solana balance 2>/dev/null); then
        echo "     Balance: $balance"
        # Parse balance number and check if > 0
        balance_num=$(echo "$balance" | grep -o '[0-9]\+\.[0-9]\+' | head -1)
        if (( $(echo "$balance_num > 0" | bc -l 2>/dev/null || echo "0") )); then
            echo -e "     ${GREEN}✅${NC} Sufficient balance for testing"
        else
            echo -e "     ${YELLOW}⚠️${NC} Low balance (run 'solana airdrop 2' for devnet)"
        fi
    else
        echo -e "     ${YELLOW}⚠️${NC} Could not check balance"
    fi
else
    echo -e "  ${RED}❌${NC} Solana CLI not configured"
    network_ok=false
fi

echo ""
echo "Network Connectivity:"
if ping -c 1 api.devnet.solana.com &> /dev/null; then
    echo -e "  ${GREEN}✅${NC} Solana devnet reachable"
else
    echo -e "  ${RED}❌${NC} Solana devnet not reachable"
    network_ok=false
fi

echo ""
echo "🧪 Running Quick Tests..."
echo "-------------------------"

test_ok=true

# Test basic imports
echo "Testing Node.js imports:"
if node -e "
    try {
        require('@coral-xyz/anchor');
        require('@solana/web3.js');
        console.log('✅ Core dependencies imported successfully');
    } catch (error) {
        console.log('❌ Import test failed:', error.message);
        process.exit(1);
    }
" 2>/dev/null; then
    echo -e "  ${GREEN}✅${NC} Node.js imports working"
else
    echo -e "  ${RED}❌${NC} Node.js import issues detected"
    test_ok=false
fi

# Test TypeScript compilation (if possible)
if command -v tsc &> /dev/null; then
    echo "Testing TypeScript compilation:"
    if tsc --noEmit --skipLibCheck client/src/client.ts &> /dev/null; then
        echo -e "  ${GREEN}✅${NC} TypeScript compilation successful"
    else
        echo -e "  ${YELLOW}⚠️${NC} TypeScript compilation issues (non-critical)"
    fi
fi

echo ""
echo "📋 Diagnostic Summary"
echo "===================="

# Overall assessment
if $deps_ok && $structure_ok && $build_ok && $network_ok && $test_ok; then
    echo -e "${GREEN}🎉 All systems operational! Ready for development.${NC}"
    exit_code=0
elif $deps_ok && $structure_ok; then
    echo -e "${YELLOW}⚠️ Mostly operational. Some issues detected but system should work.${NC}"
    exit_code=0
else
    echo -e "${RED}❌ Critical issues detected. Setup required.${NC}"
    exit_code=1
fi

echo ""
echo "Issue Resolution:"
if ! $deps_ok; then
    echo -e "${YELLOW}🔧 To fix dependencies:${NC}"
    echo "   bash scripts/quick-setup.sh"
fi

if ! $structure_ok; then
    echo -e "${YELLOW}🔧 To fix structure:${NC}"
    echo "   git clone the complete repository"
fi

if ! $build_ok; then
    echo -e "${YELLOW}🔧 To fix build:${NC}"
    echo "   anchor build"
    echo "   npm install"
fi

if ! $network_ok; then
    echo -e "${YELLOW}🔧 To fix network:${NC}"
    echo "   solana config set --url https://api.devnet.solana.com"
    echo "   solana airdrop 2"
fi

echo ""
echo "📞 For additional help:"
echo "   - Check docs/FAQ.md"
echo "   - Run: node run-simple-tests.js"
echo "   - Report issues on GitHub"

exit $exit_code