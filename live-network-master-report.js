const { Connection, Keypair, PublicKey, LAMPORTS_PER_SOL } = require('@solana/web3.js');
const { ethers } = require('ethers');
const fs = require('fs');

class LiveNetworkMasterReport {
    constructor() {
        this.walletFile = './cross-chain-wallets.json';
        this.networks = {};
        this.liveData = {
            timestamp: new Date().toISOString(),
            networks: {},
            transactions: {},
            transferHistory: {},
            errors: []
        };
    }

    async generateLiveReport() {
        console.log('🌐 LIVE NETWORK MASTER REPORT - REAL BLOCKCHAIN DATA');
        console.log('===================================================');
        console.log(`Generated: ${this.liveData.timestamp}`);
        console.log('');

        try {
            await this.loadWallets();
            await this.fetchLiveNetworkData();
            await this.fetchTransactionHistory();
            await this.displayLiveResults();
        } catch (error) {
            console.error('❌ Live report failed:', error.message);
            this.liveData.errors.push(error.message);
        }
    }

    loadWallets() {
        console.log('🔑 LOADING LIVE WALLET DATA');
        console.log('===========================');
        
        if (!fs.existsSync(this.walletFile)) {
            throw new Error('Wallet file not found');
        }

        const walletData = JSON.parse(fs.readFileSync(this.walletFile, 'utf8'));
        
        // Setup live connections
        this.networks.solana = {
            name: 'Solana Devnet',
            wallet: Keypair.fromSecretKey(Uint8Array.from(walletData.solana.secretKey)),
            address: walletData.solana.address,
            connection: new Connection('https://api.devnet.solana.com', 'confirmed'),
            explorer: 'https://explorer.solana.com',
            type: 'solana'
        };

        this.networks.zetachain = {
            name: 'ZetaChain Athens',
            address: walletData.zetachain.address,
            privateKey: walletData.zetachain.privateKey,
            gateway: walletData.zetachain.gateway,
            provider: new ethers.JsonRpcProvider('https://zetachain-athens-evm.blockpi.network/v1/rpc/public'),
            explorer: 'https://athens3.explorer.zetachain.com',
            type: 'evm'
        };

        this.networks.bsc = {
            name: 'BSC Testnet',
            address: walletData.bsc.address,
            privateKey: walletData.bsc.privateKey,
            provider: new ethers.JsonRpcProvider('https://data-seed-prebsc-1-s1.binance.org:8545'),
            explorer: 'https://testnet.bscscan.com',
            type: 'evm'
        };

        this.networks.ethereum = {
            name: 'Ethereum Sepolia',
            address: walletData.ethereum.address,
            privateKey: walletData.ethereum.privateKey,
            provider: new ethers.JsonRpcProvider('https://rpc.sepolia.org'),
            explorer: 'https://sepolia.etherscan.io',
            type: 'evm'
        };

        console.log('✅ All live network connections established');
        console.log('');
    }

    async fetchLiveNetworkData() {
        console.log('📡 FETCHING LIVE BLOCKCHAIN DATA');
        console.log('================================');

        for (const [networkName, network] of Object.entries(this.networks)) {
            console.log(`🔍 Fetching live data from ${network.name}...`);
            
            try {
                if (network.type === 'solana') {
                    await this.fetchSolanaLiveData(networkName, network);
                } else {
                    await this.fetchEVMLiveData(networkName, network);
                }
            } catch (error) {
                console.log(`⚠️  ${network.name}: ${error.message}`);
                this.liveData.errors.push(`${networkName}: ${error.message}`);
                
                // Set minimal data for failed connections
                this.liveData.networks[networkName] = {
                    status: 'error',
                    address: network.address,
                    error: error.message
                };
            }
        }
    }

    async fetchSolanaLiveData(networkName, network) {
        const publicKey = new PublicKey(network.address);
        
        // Fetch live balance
        const balance = await network.connection.getBalance(publicKey);
        const balanceSOL = balance / LAMPORTS_PER_SOL;
        
        // Fetch current slot (block height)
        const slot = await network.connection.getSlot();
        
        // Fetch recent signatures for this wallet
        const signatures = await network.connection.getSignaturesForAddress(publicKey, { limit: 10 });
        
        // Get account info for token accounts
        const tokenAccounts = await network.connection.getTokenAccountsByOwner(publicKey, {
            programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')
        });

        this.liveData.networks[networkName] = {
            status: 'online',
            balance: `${balanceSOL.toFixed(6)} SOL`,
            balanceRaw: balance,
            currentSlot: slot,
            address: network.address,
            explorer: network.explorer,
            recentTransactions: signatures.length,
            tokenAccounts: tokenAccounts.value.length,
            lastActivity: signatures.length > 0 ? new Date(signatures[0].blockTime * 1000).toISOString() : 'No activity'
        };

        this.liveData.transactions[networkName] = signatures.map(sig => ({
            signature: sig.signature,
            slot: sig.slot,
            blockTime: sig.blockTime ? new Date(sig.blockTime * 1000).toISOString() : null,
            confirmationStatus: sig.confirmationStatus,
            err: sig.err
        }));

        console.log(`  ✅ Balance: ${balanceSOL.toFixed(6)} SOL`);
        console.log(`  ✅ Current Slot: ${slot}`);
        console.log(`  ✅ Recent Transactions: ${signatures.length}`);
        console.log(`  ✅ Token Accounts: ${tokenAccounts.value.length}`);
    }

    async fetchEVMLiveData(networkName, network) {
        try {
            // Fetch live balance with timeout
            const balance = await Promise.race([
                network.provider.getBalance(network.address),
                new Promise((_, reject) => setTimeout(() => reject(new Error('RPC timeout')), 10000))
            ]);
            
            const balanceEther = parseFloat(ethers.formatEther(balance));
            
            // Fetch current block number
            const blockNumber = await network.provider.getBlockNumber();
            
            // Fetch transaction count (nonce)
            const transactionCount = await network.provider.getTransactionCount(network.address);

            let recentTxs = [];
            try {
                // Try to fetch recent transactions (this varies by network)
                const latestBlock = await network.provider.getBlock(blockNumber);
                recentTxs = latestBlock.transactions.slice(0, 5); // Get first 5 transactions from latest block
            } catch (e) {
                // Not all RPCs support this, continue without error
            }

            const nativeToken = networkName === 'zetachain' ? 'ZETA' : 
                              networkName === 'bsc' ? 'BNB' : 'ETH';

            this.liveData.networks[networkName] = {
                status: 'online',
                balance: `${balanceEther.toFixed(6)} ${nativeToken}`,
                balanceRaw: balance.toString(),
                currentBlock: blockNumber,
                address: network.address,
                explorer: network.explorer,
                transactionCount: transactionCount,
                recentTransactions: recentTxs.length,
                lastChecked: new Date().toISOString()
            };

            this.liveData.transactions[networkName] = recentTxs.map(txHash => ({
                hash: txHash,
                block: blockNumber,
                network: networkName
            }));

            console.log(`  ✅ Balance: ${balanceEther.toFixed(6)} ${nativeToken}`);
            console.log(`  ✅ Current Block: ${blockNumber}`);
            console.log(`  ✅ Transaction Count: ${transactionCount}`);

        } catch (error) {
            // For networks with RPC issues, still try to get basic info
            const nativeToken = networkName === 'zetachain' ? 'ZETA' : 
                              networkName === 'bsc' ? 'BNB' : 'ETH';
            
            this.liveData.networks[networkName] = {
                status: 'limited',
                balance: `0.000000 ${nativeToken}`,
                address: network.address,
                explorer: network.explorer,
                error: 'RPC connection issues',
                lastChecked: new Date().toISOString()
            };
            
            console.log(`  ⚠️  Limited data due to RPC issues`);
            throw error;
        }
    }

    async fetchTransactionHistory() {
        console.log('');
        console.log('🔍 ANALYZING TRANSFER HISTORY ACROSS ALL NETWORKS');
        console.log('=================================================');

        for (const [networkName, network] of Object.entries(this.networks)) {
            if (this.liveData.networks[networkName]?.status === 'online') {
                try {
                    if (network.type === 'solana') {
                        await this.analyzeSolanaTransfers(networkName, network);
                    } else {
                        await this.analyzeEVMTransfers(networkName, network);
                    }
                } catch (error) {
                    console.log(`⚠️  ${network.name}: Transfer analysis failed - ${error.message}`);
                }
            }
        }
    }

    async analyzeSolanaTransfers(networkName, network) {
        const publicKey = new PublicKey(network.address);
        const signatures = await network.connection.getSignaturesForAddress(publicKey, { limit: 20 });
        
        const transfers = [];
        for (const sig of signatures.slice(0, 5)) { // Analyze last 5 transactions
            try {
                const transaction = await network.connection.getTransaction(sig.signature, {
                    maxSupportedTransactionVersion: 0
                });
                
                if (transaction) {
                    const transfer = {
                        signature: sig.signature,
                        slot: sig.slot,
                        blockTime: sig.blockTime ? new Date(sig.blockTime * 1000).toISOString() : null,
                        type: this.determineSolanaTransactionType(transaction),
                        status: sig.err ? 'failed' : 'success',
                        explorerLink: `${network.explorer}/tx/${sig.signature}?cluster=devnet`
                    };
                    transfers.push(transfer);
                }
            } catch (e) {
                // Skip transactions that can't be parsed
            }
        }

        this.liveData.transferHistory[networkName] = {
            totalAnalyzed: signatures.length,
            recentTransfers: transfers,
            network: network.name
        };

        console.log(`  📊 ${network.name}: Analyzed ${transfers.length} recent transfers`);
        if (transfers.length > 0) {
            console.log(`     Latest: ${transfers[0].signature}`);
        }
    }

    async analyzeEVMTransfers(networkName, network) {
        try {
            const transactionCount = await network.provider.getTransactionCount(network.address);
            const currentBlock = await network.provider.getBlockNumber();
            
            // For EVM chains, we'll look at recent blocks for transactions
            const transfers = [];
            const blocksToCheck = Math.min(5, currentBlock);
            
            for (let i = 0; i < blocksToCheck; i++) {
                try {
                    const block = await network.provider.getBlock(currentBlock - i, true);
                    if (block && block.transactions) {
                        // Look for transactions involving our address
                        const relevantTxs = block.transactions.filter(tx => 
                            typeof tx === 'object' && 
                            (tx.to?.toLowerCase() === network.address.toLowerCase() || 
                             tx.from?.toLowerCase() === network.address.toLowerCase())
                        );

                        for (const tx of relevantTxs.slice(0, 3)) {
                            transfers.push({
                                hash: tx.hash,
                                blockNumber: tx.blockNumber,
                                from: tx.from,
                                to: tx.to,
                                value: ethers.formatEther(tx.value || 0),
                                type: tx.to?.toLowerCase() === network.address.toLowerCase() ? 'received' : 'sent',
                                explorerLink: `${network.explorer}/tx/${tx.hash}`
                            });
                        }
                    }
                } catch (e) {
                    // Skip blocks that can't be fetched
                }
            }

            this.liveData.transferHistory[networkName] = {
                totalTransactionCount: transactionCount,
                recentTransfers: transfers,
                network: network.name,
                blocksAnalyzed: blocksToCheck
            };

            console.log(`  📊 ${network.name}: Found ${transfers.length} relevant transfers`);
            console.log(`     Total transaction count: ${transactionCount}`);

        } catch (error) {
            this.liveData.transferHistory[networkName] = {
                error: error.message,
                network: network.name
            };
            console.log(`  ⚠️  ${network.name}: Transfer analysis limited`);
        }
    }

    determineSolanaTransactionType(transaction) {
        const instructions = transaction.transaction.message.instructions;
        if (instructions.some(ix => ix.programId?.toString().includes('Token'))) {
            return 'token_transfer';
        } else if (instructions.length === 1) {
            return 'sol_transfer';
        }
        return 'program_interaction';
    }

    async displayLiveResults() {
        console.log('');
        console.log('📊 LIVE BLOCKCHAIN DATA REPORT');
        console.log('==============================');
        console.log('');

        // Overall Status
        const onlineNetworks = Object.values(this.liveData.networks).filter(n => n.status === 'online').length;
        const totalNetworks = Object.keys(this.liveData.networks).length;
        
        console.log('🎯 LIVE SYSTEM STATUS');
        console.log('--------------------');
        console.log(`Networks Online: ${onlineNetworks}/${totalNetworks}`);
        console.log(`Data Freshness: Live (${this.liveData.timestamp})`);
        console.log(`Error Count: ${this.liveData.errors.length}`);
        console.log('');

        // Network Details with Live Data
        console.log('🌐 LIVE NETWORK STATUS');
        console.log('----------------------');
        for (const [name, data] of Object.entries(this.liveData.networks)) {
            console.log(`${name.toUpperCase()}:`);
            console.log(`  Address: ${data.address}`);
            console.log(`  Status: ${data.status.toUpperCase()}`);
            console.log(`  Balance: ${data.balance}`);
            
            if (data.currentSlot) console.log(`  Current Slot: ${data.currentSlot}`);
            if (data.currentBlock) console.log(`  Current Block: ${data.currentBlock}`);
            if (data.transactionCount !== undefined) console.log(`  Transaction Count: ${data.transactionCount}`);
            if (data.lastActivity) console.log(`  Last Activity: ${data.lastActivity}`);
            
            console.log(`  Explorer: ${data.explorer}/address/${data.address}`);
            console.log('');
        }

        // Live Transfer History
        console.log('💸 LIVE TRANSFER HISTORY');
        console.log('-----------------------');
        for (const [name, history] of Object.entries(this.liveData.transferHistory)) {
            if (history.recentTransfers && history.recentTransfers.length > 0) {
                console.log(`${name.toUpperCase()} TRANSFERS:`);
                
                for (const transfer of history.recentTransfers.slice(0, 3)) {
                    if (transfer.signature) {
                        // Solana transaction
                        console.log(`  📤 ${transfer.signature}`);
                        console.log(`     Type: ${transfer.type}`);
                        console.log(`     Status: ${transfer.status}`);
                        console.log(`     Time: ${transfer.blockTime || 'Unknown'}`);
                        console.log(`     Explorer: ${transfer.explorerLink}`);
                    } else if (transfer.hash) {
                        // EVM transaction
                        console.log(`  💰 ${transfer.hash}`);
                        console.log(`     Type: ${transfer.type}`);
                        console.log(`     Value: ${transfer.value} ${name === 'zetachain' ? 'ZETA' : name === 'bsc' ? 'BNB' : 'ETH'}`);
                        console.log(`     From: ${transfer.from}`);
                        console.log(`     To: ${transfer.to}`);
                        console.log(`     Explorer: ${transfer.explorerLink}`);
                    }
                    console.log('');
                }
            } else {
                console.log(`${name.toUpperCase()}: No recent transfers found`);
                console.log('');
            }
        }

        // Error Summary
        if (this.liveData.errors.length > 0) {
            console.log('⚠️  LIVE DATA LIMITATIONS');
            console.log('------------------------');
            this.liveData.errors.forEach(error => console.log(`- ${error}`));
            console.log('');
        }

        console.log('🎉 LIVE NETWORK MASTER REPORT COMPLETE');
        console.log('======================================');
        console.log('All data fetched directly from live blockchain networks');
        console.log(`Report generated at: ${this.liveData.timestamp}`);
    }
}

// Execute the live network report
const liveReport = new LiveNetworkMasterReport();
liveReport.generateLiveReport().catch(console.error);