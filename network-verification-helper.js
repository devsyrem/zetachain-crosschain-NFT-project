const fs = require('fs');

class NetworkVerificationHelper {
    constructor() {
        this.walletFile = './cross-chain-wallets.json';
    }

    async generateVerificationLinks() {
        console.log('🔍 NETWORK VERIFICATION HELPER');
        console.log('==============================');
        console.log('Direct links to check your cross-chain wallets on testnet scanners');
        console.log('');

        try {
            const walletData = JSON.parse(fs.readFileSync(this.walletFile, 'utf8'));
            
            console.log('📋 YOUR WALLET ADDRESSES:');
            console.log('=========================');
            console.log(`Solana Devnet: ${walletData.solana.publicKey}`);
            console.log(`Ethereum Sepolia: ${walletData.ethereum.address}`);
            console.log(`BSC Testnet: ${walletData.bsc.address}`);
            console.log(`ZetaChain Athens: ${walletData.zetachain.address}`);
            console.log('');

            console.log('🔗 VERIFICATION LINKS:');
            console.log('======================');
            
            // Solana Devnet
            console.log('1. SOLANA DEVNET (Source Chain):');
            console.log(`   Address: https://explorer.solana.com/address/${walletData.solana.publicKey}?cluster=devnet`);
            console.log(`   Transactions: https://explorer.solana.com/address/${walletData.solana.publicKey}/transactions?cluster=devnet`);
            console.log(`   Tokens: https://explorer.solana.com/address/${walletData.solana.publicKey}/tokens?cluster=devnet`);
            console.log('');

            // Ethereum Sepolia
            console.log('2. ETHEREUM SEPOLIA TESTNET (Destination):');
            console.log(`   Address Overview: https://sepolia.etherscan.io/address/${walletData.ethereum.address}`);
            console.log(`   All Transactions: https://sepolia.etherscan.io/address/${walletData.ethereum.address}#transactions`);
            console.log(`   Token Transfers (ERC-20): https://sepolia.etherscan.io/address/${walletData.ethereum.address}#tokentxns`);
            console.log(`   NFT Transfers (ERC-721): https://sepolia.etherscan.io/address/${walletData.ethereum.address}#tokentxnsErc721`);
            console.log(`   Internal Transactions: https://sepolia.etherscan.io/address/${walletData.ethereum.address}#internaltx`);
            console.log('');

            // BSC Testnet
            console.log('3. BSC TESTNET (Destination):');
            console.log(`   Address Overview: https://testnet.bscscan.com/address/${walletData.bsc.address}`);
            console.log(`   All Transactions: https://testnet.bscscan.com/address/${walletData.bsc.address}#transactions`);
            console.log(`   Token Transfers (BEP-20): https://testnet.bscscan.com/address/${walletData.bsc.address}#tokentxns`);
            console.log(`   NFT Transfers (BEP-721): https://testnet.bscscan.com/address/${walletData.bsc.address}#tokentxnsErc721`);
            console.log(`   Internal Transactions: https://testnet.bscscan.com/address/${walletData.bsc.address}#internaltx`);
            console.log('');

            // ZetaChain Athens
            console.log('4. ZETACHAIN ATHENS TESTNET (Bridge):');
            console.log(`   Wallet Address: https://athens3.explorer.zetachain.com/address/${walletData.zetachain.address}`);
            console.log(`   Gateway Address: https://athens3.explorer.zetachain.com/address/${walletData.zetachain.gateway}`);
            console.log(`   Cross-Chain CCTXs: https://athens3.explorer.zetachain.com/cc-tx`);
            console.log(`   Recent Blocks: https://athens3.explorer.zetachain.com/blocks`);
            console.log('');

            console.log('📱 QUICK ACCESS BOOKMARKS:');
            console.log('==========================');
            console.log('Save these links for easy verification:');
            console.log('');
            console.log(`• Ethereum NFTs: https://sepolia.etherscan.io/address/${walletData.ethereum.address}#tokentxnsErc721`);
            console.log(`• BSC NFTs: https://testnet.bscscan.com/address/${walletData.bsc.address}#tokentxnsErc721`);
            console.log(`• Solana Tokens: https://explorer.solana.com/address/${walletData.solana.publicKey}/tokens?cluster=devnet`);
            console.log(`• ZetaChain Bridge: https://athens3.explorer.zetachain.com/address/${walletData.zetachain.gateway}`);
            console.log('');

            console.log('💡 HOW TO VERIFY CROSS-CHAIN TRANSFERS:');
            console.log('=======================================');
            console.log('1. Check Solana Explorer for outbound transactions (✅ Already working)');
            console.log('2. Monitor Ethereum Sepolia for incoming NFT transfers');
            console.log('3. Monitor BSC Testnet for incoming NFT transfers');  
            console.log('4. Check ZetaChain Athens for bridge message processing');
            console.log('5. Cross-chain transfers may take 5-15 minutes to complete');
            console.log('');

            console.log('⚡ TESTNET FAUCETS (If Needed):');
            console.log('===============================');
            console.log('Get testnet tokens for transaction fees:');
            console.log('• Ethereum Sepolia: https://cloud.google.com/application/web3/faucet/ethereum/sepolia');
            console.log('• BSC Testnet: https://testnet.bnbchain.org/faucet-smart');
            console.log('• ZetaChain Athens: https://labs.zetachain.com/get-zeta');
            console.log('');

        } catch (error) {
            console.error('Error reading wallet data:', error.message);
        }
    }
}

// Generate verification links
const helper = new NetworkVerificationHelper();
helper.generateVerificationLinks().catch(console.error);