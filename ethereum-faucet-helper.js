const fs = require('fs');

class EthereumFaucetHelper {
    constructor() {
        this.walletFile = './cross-chain-wallets.json';
    }

    async generateFaucetInstructions() {
        console.log('💰 ETHEREUM SEPOLIA FAUCET HELPER');
        console.log('=================================');
        
        try {
            const walletData = JSON.parse(fs.readFileSync(this.walletFile, 'utf8'));
            const ethAddress = walletData.ethereum.address;
            
            console.log(`Target Address: ${ethAddress}`);
            console.log('');
            
            console.log('🚰 RECOMMENDED FAUCETS (Try in order):');
            console.log('=====================================');
            
            console.log('1. GOOGLE CLOUD FAUCET (Most Reliable):');
            console.log('   https://cloud.google.com/application/web3/faucet/ethereum/sepolia');
            console.log('   - Requires Google account');
            console.log('   - Gives 0.05 ETH instantly');
            console.log('   - Most successful rate');
            console.log('');
            
            console.log('2. SEPOLIA FAUCET (Community):');
            console.log('   https://sepoliafaucet.com/');
            console.log('   - No login required');
            console.log('   - Gives 0.5 ETH per day');
            console.log('   - Sometimes has queue');
            console.log('');
            
            console.log('3. CHAINLINK FAUCET:');
            console.log('   https://faucets.chain.link/sepolia');
            console.log('   - Requires Twitter/GitHub login');
            console.log('   - Gives 0.1 ETH');
            console.log('   - Very reliable');
            console.log('');
            
            console.log('4. ETHEREUM FOUNDATION FAUCET:');
            console.log('   https://sepolia-faucet.pk910.de/');
            console.log('   - Mining-based faucet');
            console.log('   - No limits but slower');
            console.log('   - Runs in browser');
            console.log('');
            
            console.log('🎯 QUICK FUNDING STEPS:');
            console.log('=======================');
            console.log('1. Copy this address: ' + ethAddress);
            console.log('2. Visit: https://cloud.google.com/application/web3/faucet/ethereum/sepolia');
            console.log('3. Paste address and request ETH');
            console.log('4. Wait 1-2 minutes for confirmation');
            console.log('5. Re-run "Solana to Ethereum Live Test" workflow');
            console.log('');
            
            console.log('⚡ VERIFICATION:');
            console.log('===============');
            console.log('Check balance at:');
            console.log(`https://sepolia.etherscan.io/address/${ethAddress}`);
            console.log('');
            
            console.log('💡 FUNDING TARGET:');
            console.log('==================');
            console.log('Need: 0.01 ETH minimum (for gas fees)');
            console.log('Recommended: 0.05 ETH (for multiple transactions)');
            console.log('Current: Check the verification link above');
            console.log('');
            
        } catch (error) {
            console.error('Error reading wallet data:', error.message);
        }
    }
}

// Generate faucet instructions
const faucetHelper = new EthereumFaucetHelper();
faucetHelper.generateFaucetInstructions().catch(console.error);