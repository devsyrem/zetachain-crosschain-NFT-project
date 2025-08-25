const fs = require('fs');

class TestnetFundingHelper {
    constructor() {
        this.walletFile = './cross-chain-wallets.json';
    }

    async displayFundingInfo() {
        console.log('💰 TESTNET WALLET FUNDING INFORMATION');
        console.log('=====================================');
        console.log('');

        try {
            const walletData = JSON.parse(fs.readFileSync(this.walletFile, 'utf8'));

            console.log('🔑 YOUR WALLET ADDRESSES:');
            console.log('-------------------------');
            console.log(`ZetaChain Athens: ${walletData.zetachain.address}`);
            console.log(`Ethereum Sepolia: ${walletData.ethereum.address}`);
            console.log(`Solana Devnet: ${walletData.solana.address} (✅ Already funded)`);
            console.log('');

            console.log('🚰 AUTOMATED FAUCETS - CLICK TO FUND:');
            console.log('=====================================');
            console.log('');

            console.log('🌉 ZETACHAIN ATHENS FUNDING:');
            console.log('----------------------------');
            console.log('1. Google Cloud Faucet (Recommended):');
            console.log(`   https://cloud.google.com/application/web3/faucet/zetachain/testnet`);
            console.log(`   → Enter address: ${walletData.zetachain.address}`);
            console.log(`   → Amount: Auto-detected`);
            console.log('');
            console.log('2. Triangle Platform Faucet (Backup):');
            console.log(`   https://faucet.triangleplatform.com/zetachain/athens3`);
            console.log(`   → Enter address: ${walletData.zetachain.address}`);
            console.log(`   → Amount: ~0.1 ZETA`);
            console.log('');

            console.log('⚡ ETHEREUM SEPOLIA FUNDING:');
            console.log('---------------------------');
            console.log('1. Google Cloud Faucet (Recommended):');
            console.log(`   https://cloud.google.com/application/web3/faucet/ethereum/sepolia`);
            console.log(`   → Enter address: ${walletData.ethereum.address}`);
            console.log(`   → Amount: 0.05 ETH`);
            console.log('');
            console.log('2. Chainlink Faucet (Higher amount):');
            console.log(`   https://faucets.chain.link/sepolia`);
            console.log(`   → Enter address: ${walletData.ethereum.address}`);
            console.log(`   → Amount: 0.1 ETH`);
            console.log('');

            console.log('📋 COPY-PASTE ADDRESSES:');
            console.log('========================');
            console.log('ZetaChain Address:');
            console.log(walletData.zetachain.address);
            console.log('');
            console.log('Ethereum Address:');
            console.log(walletData.ethereum.address);
            console.log('');

            console.log('⏱️  EXPECTED FUNDING TIME:');
            console.log('--------------------------');
            console.log('Google Cloud Faucets: Instant (seconds)');
            console.log('Chainlink Faucet: 1-5 minutes');
            console.log('Triangle Faucet: Up to 10 minutes');
            console.log('');

            console.log('🔄 AFTER FUNDING:');
            console.log('=================');
            console.log('Run any of these workflows to test with real funds:');
            console.log('• "Ethereum Cross-Chain Demo" - Full Solana → Ethereum flow');
            console.log('• "Bulletproof Cross-Chain" - Multi-network with recovery');
            console.log('• "Complete NFT Generation" - Full system test');
            console.log('');

            console.log('✅ CURRENT STATUS:');
            console.log('==================');
            console.log('Solana: ✅ Funded (3.98+ SOL available)');
            console.log('ZetaChain: ⏳ Needs funding');
            console.log('Ethereum: ⏳ Needs funding');
            console.log('');
            console.log('Once both testnet wallets are funded, all cross-chain operations will execute with real blockchain transactions!');

        } catch (error) {
            console.error('Error reading wallet file:', error.message);
        }
    }
}

// Display funding information
const helper = new TestnetFundingHelper();
helper.displayFundingInfo().catch(console.error);