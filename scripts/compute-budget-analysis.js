// Compute Budget Analysis for Universal NFT Program
// This script analyzes and optimizes compute unit usage for all program instructions

const anchor = require('@coral-xyz/anchor');
const { Connection, PublicKey, Keypair, ComputeBudgetProgram } = require('@solana/web3.js');
const fs = require('fs');

class ComputeBudgetAnalyzer {
  constructor() {
    this.connection = new Connection('https://api.devnet.solana.com', 'confirmed');
    this.wallet = anchor.AnchorProvider.local().wallet;
    
    // Load program
    const idl = JSON.parse(fs.readFileSync('target/idl/universal_nft.json', 'utf8'));
    this.programId = new PublicKey(idl.metadata.address);
    this.provider = new anchor.AnchorProvider(this.connection, this.wallet, {});
    this.program = new anchor.Program(idl, this.programId, this.provider);
    
    this.results = {};
  }

  async analyzeInstruction(instructionName, setupFn, instructionFn) {
    console.log(`\n🔍 Analyzing ${instructionName}...`);
    
    try {
      // Setup any required accounts
      const setup = await setupFn();
      
      // Create transaction with compute budget instruction
      const computeUnits = 300_000; // Start with high limit
      const computeUnitInstruction = ComputeBudgetProgram.setComputeUnitLimit({
        units: computeUnits
      });
      
      // Build the main instruction
      const instruction = await instructionFn(setup);
      
      // Simulate transaction to get actual compute usage
      const transaction = new anchor.web3.Transaction()
        .add(computeUnitInstruction)
        .add(instruction);
      
      // Get recent blockhash
      const { blockhash } = await this.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = this.wallet.publicKey;
      
      // Simulate the transaction
      const simulation = await this.connection.simulateTransaction(transaction);
      
      if (simulation.value.err) {
        console.log(`❌ Simulation failed:`, simulation.value.err);
        return null;
      }
      
      const unitsConsumed = simulation.value.unitsConsumed || 'N/A';
      const logs = simulation.value.logs || [];
      
      console.log(`✅ ${instructionName}:`);
      console.log(`   Compute Units Used: ${unitsConsumed}`);
      console.log(`   Compute Units Limit: ${computeUnits}`);
      
      if (typeof unitsConsumed === 'number') {
        const efficiency = ((computeUnits - unitsConsumed) / computeUnits * 100).toFixed(1);
        console.log(`   Efficiency: ${efficiency}% unused capacity`);
        
        // Suggest optimal compute unit limit
        const optimal = Math.ceil(unitsConsumed * 1.1); // 10% buffer
        console.log(`   Suggested Limit: ${optimal} CU`);
        
        this.results[instructionName] = {
          consumed: unitsConsumed,
          limit: computeUnits,
          optimal: optimal,
          efficiency: parseFloat(efficiency)
        };
      }
      
      // Look for compute budget warnings in logs
      const computeWarnings = logs.filter(log => 
        log.includes('exceeded') || 
        log.includes('compute') ||
        log.includes('budget')
      );
      
      if (computeWarnings.length > 0) {
        console.log(`⚠️  Compute warnings:`);
        computeWarnings.forEach(warning => {
          console.log(`   ${warning}`);
        });
      }
      
      return unitsConsumed;
      
    } catch (error) {
      console.log(`❌ Analysis failed for ${instructionName}:`, error.message);
      return null;
    }
  }

  async runCompleteAnalysis() {
    console.log('🧮 Universal NFT Program - Compute Budget Analysis');
    console.log('==================================================');
    
    // Analyze Initialize instruction
    await this.analyzeInstruction(
      'Initialize',
      async () => ({
        tssAddress: new PublicKey('11111111111111111111111111111112'),
        gatewayProgram: new PublicKey('11111111111111111111111111111113')
      }),
      async (setup) => {
        return await this.program.methods
          .initialize(setup.tssAddress, setup.gatewayProgram)
          .instruction();
      }
    );

    // Analyze Mint NFT instruction
    await this.analyzeInstruction(
      'Mint NFT',
      async () => ({
        mintKeypair: Keypair.generate(),
        metadata: {
          uri: 'https://arweave.net/test-metadata',
          name: 'Test NFT',
          symbol: 'TEST'
        }
      }),
      async (setup) => {
        return await this.program.methods
          .mintNft(
            setup.metadata.uri,
            setup.metadata.name,
            setup.metadata.symbol,
            true
          )
          .accounts({
            mint: setup.mintKeypair.publicKey,
          })
          .instruction();
      }
    );

    // Analyze Cross Chain Transfer instruction
    await this.analyzeInstruction(
      'Cross Chain Transfer',
      async () => {
        const mintKeypair = Keypair.generate();
        return {
          mint: mintKeypair.publicKey,
          destinationChain: 1,
          destinationAddress: Buffer.from('742d35cc5ff71cf34dc7ac8ee33c4d5ac0c3e8ad', 'hex'),
          nonce: Date.now()
        };
      },
      async (setup) => {
        return await this.program.methods
          .crossChainTransfer(
            setup.destinationChain,
            Array.from(setup.destinationAddress),
            setup.nonce
          )
          .accounts({
            mint: setup.mint,
          })
          .instruction();
      }
    );

    // Analyze Verify Ownership instruction
    await this.analyzeInstruction(
      'Verify Ownership',
      async () => ({
        mint: Keypair.generate().publicKey
      }),
      async (setup) => {
        return await this.program.methods
          .verifyOwnership(setup.mint)
          .instruction();
      }
    );

    // Generate optimization report
    this.generateOptimizationReport();
  }

  generateOptimizationReport() {
    console.log('\n📊 Optimization Report');
    console.log('======================');
    
    const instructions = Object.keys(this.results);
    
    if (instructions.length === 0) {
      console.log('No successful analyses to report.');
      return;
    }

    // Calculate statistics
    const totalConsumed = instructions.reduce((sum, inst) => sum + this.results[inst].consumed, 0);
    const avgConsumed = totalConsumed / instructions.length;
    const maxConsumed = Math.max(...instructions.map(inst => this.results[inst].consumed));
    const minConsumed = Math.min(...instructions.map(inst => this.results[inst].consumed));
    
    console.log(`\nCompute Usage Statistics:`);
    console.log(`  Total CU Consumed: ${totalConsumed.toLocaleString()}`);
    console.log(`  Average per Instruction: ${Math.round(avgConsumed).toLocaleString()}`);
    console.log(`  Most Expensive: ${maxConsumed.toLocaleString()} CU`);
    console.log(`  Most Efficient: ${minConsumed.toLocaleString()} CU`);
    
    console.log(`\nPer-Instruction Analysis:`);
    instructions.forEach(instruction => {
      const data = this.results[instruction];
      console.log(`\n  ${instruction}:`);
      console.log(`    Consumed: ${data.consumed.toLocaleString()} CU`);
      console.log(`    Optimal Limit: ${data.optimal.toLocaleString()} CU`);
      console.log(`    Efficiency: ${data.efficiency}%`);
      
      // Provide optimization suggestions
      if (data.consumed > 200000) {
        console.log(`    ⚠️  High compute usage - consider optimization`);
      } else if (data.consumed > 100000) {
        console.log(`    💡 Moderate usage - monitor in production`);
      } else {
        console.log(`    ✅ Efficient compute usage`);
      }
    });

    // Generate compute budget presets
    console.log(`\n🔧 Recommended Compute Budget Presets:`);
    console.log(`// Add these to your client transactions for optimal performance\n`);
    
    instructions.forEach(instruction => {
      const data = this.results[instruction];
      const kebabCase = instruction.toLowerCase().replace(/\s+/g, '-');
      console.log(`const ${kebabCase.replace(/-/g, '_')}_compute_units = ${data.optimal};`);
    });

    console.log(`\n// Usage example:`);
    console.log(`const computeBudgetIx = ComputeBudgetProgram.setComputeUnitLimit({`);
    console.log(`  units: mint_nft_compute_units`);
    console.log(`});`);
    console.log(`transaction.add(computeBudgetIx);`);

    // Performance comparison with Solana limits
    console.log(`\n📏 Solana Limits Comparison:`);
    console.log(`  Max CU per Transaction: 1,400,000`);
    console.log(`  Max CU per Instruction: 200,000 (recommended)`);
    console.log(`  Current Max Usage: ${maxConsumed.toLocaleString()} (${(maxConsumed/200000*100).toFixed(1)}% of limit)`);
    
    if (maxConsumed <= 200000) {
      console.log(`  ✅ All instructions within recommended limits`);
    } else {
      console.log(`  ⚠️  Some instructions exceed recommended limits`);
    }

    // Generate optimization tips
    console.log(`\n💡 Optimization Tips:`);
    console.log(`  1. Use smaller account data sizes where possible`);
    console.log(`  2. Minimize cross-program invocations (CPIs)`);
    console.log(`  3. Optimize string operations and Vec allocations`);
    console.log(`  4. Use zero-copy deserialization for large accounts`);
    console.log(`  5. Consider splitting complex operations across multiple instructions`);
    
    // Save results to file
    this.saveResults();
  }

  saveResults() {
    const report = {
      timestamp: new Date().toISOString(),
      program_id: this.programId.toString(),
      results: this.results,
      summary: {
        total_instructions_analyzed: Object.keys(this.results).length,
        average_compute_usage: Object.keys(this.results).length > 0 ? 
          Math.round(Object.values(this.results).reduce((sum, r) => sum + r.consumed, 0) / Object.keys(this.results).length) : 0,
        max_compute_usage: Object.keys(this.results).length > 0 ? 
          Math.max(...Object.values(this.results).map(r => r.consumed)) : 0
      }
    };

    const filename = `compute-budget-analysis-${Date.now()}.json`;
    fs.writeFileSync(filename, JSON.stringify(report, null, 2));
    console.log(`\n💾 Full report saved to: ${filename}`);
  }
}

// Run analysis if this file is executed directly
if (require.main === module) {
  const analyzer = new ComputeBudgetAnalyzer();
  
  analyzer.runCompleteAnalysis()
    .then(() => {
      console.log('\n✅ Compute budget analysis complete!');
    })
    .catch(error => {
      console.error('\n❌ Analysis failed:', error);
      process.exit(1);
    });
}

module.exports = ComputeBudgetAnalyzer;