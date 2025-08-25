// Performance Benchmarks for Universal NFT Program
// Measures throughput, latency, and resource usage

const anchor = require('@coral-xyz/anchor');
const { Connection, PublicKey, Keypair, Transaction, sendAndConfirmTransaction } = require('@solana/web3.js');
const fs = require('fs');

class PerformanceBenchmarks {
  constructor() {
    this.connection = new Connection('https://api.devnet.solana.com', 'confirmed');
    this.wallet = anchor.AnchorProvider.local().wallet;
    
    const idl = JSON.parse(fs.readFileSync('target/idl/universal_nft.json', 'utf8'));
    this.programId = new PublicKey(idl.metadata.address);
    this.provider = new anchor.AnchorProvider(this.connection, this.wallet, {});
    this.program = new anchor.Program(idl, this.programId, this.provider);
    
    this.metrics = {
      latency: {},
      throughput: {},
      resources: {},
      errors: []
    };
  }

  async measureLatency(operationName, operationFn, iterations = 5) {
    console.log(`\n⏱️  Measuring latency for ${operationName}...`);
    
    const times = [];
    let successCount = 0;
    
    for (let i = 0; i < iterations; i++) {
      try {
        const start = performance.now();
        await operationFn();
        const end = performance.now();
        
        const duration = end - start;
        times.push(duration);
        successCount++;
        
        console.log(`  Iteration ${i + 1}: ${duration.toFixed(2)}ms`);
        
      } catch (error) {
        console.log(`  Iteration ${i + 1}: Failed - ${error.message}`);
        this.metrics.errors.push({
          operation: operationName,
          iteration: i + 1,
          error: error.message
        });
      }
    }
    
    if (times.length > 0) {
      const avgLatency = times.reduce((sum, time) => sum + time, 0) / times.length;
      const minLatency = Math.min(...times);
      const maxLatency = Math.max(...times);
      
      this.metrics.latency[operationName] = {
        average: avgLatency.toFixed(2),
        min: minLatency.toFixed(2),
        max: maxLatency.toFixed(2),
        successRate: ((successCount / iterations) * 100).toFixed(1)
      };
      
      console.log(`  Results: Avg ${avgLatency.toFixed(2)}ms, Min ${minLatency.toFixed(2)}ms, Max ${maxLatency.toFixed(2)}ms`);
      console.log(`  Success Rate: ${((successCount / iterations) * 100).toFixed(1)}%`);
    }
  }

  async measureThroughput(operationName, operationFn, duration = 30000) {
    console.log(`\n🚀 Measuring throughput for ${operationName} (${duration/1000}s window)...`);
    
    const startTime = Date.now();
    const endTime = startTime + duration;
    let operationCount = 0;
    let successCount = 0;
    
    while (Date.now() < endTime) {
      try {
        await operationFn();
        successCount++;
      } catch (error) {
        this.metrics.errors.push({
          operation: operationName,
          timestamp: Date.now(),
          error: error.message
        });
      }
      operationCount++;
      
      // Progress indicator
      const elapsed = Date.now() - startTime;
      const progress = ((elapsed / duration) * 100).toFixed(0);
      if (operationCount % 10 === 0) {
        process.stdout.write(`\r  Progress: ${progress}% (${operationCount} ops, ${successCount} successful)`);
      }
    }
    
    const actualDuration = (Date.now() - startTime) / 1000;
    const throughput = successCount / actualDuration;
    
    this.metrics.throughput[operationName] = {
      operations: operationCount,
      successful: successCount,
      duration: actualDuration.toFixed(2),
      throughput: throughput.toFixed(2),
      successRate: ((successCount / operationCount) * 100).toFixed(1)
    };
    
    console.log(`\n  Results: ${throughput.toFixed(2)} successful ops/second`);
    console.log(`  Total: ${operationCount} attempts, ${successCount} successful`);
  }

  async measureResourceUsage() {
    console.log(`\n💾 Measuring resource usage...`);
    
    // Measure account sizes
    const accountSizes = {};
    
    try {
      // Program state account
      const [programStatePda] = await PublicKey.findProgramAddress(
        [Buffer.from('program_state')],
        this.program.programId
      );
      
      const programStateInfo = await this.connection.getAccountInfo(programStatePda);
      if (programStateInfo) {
        accountSizes.programState = programStateInfo.data.length;
      }
      
      console.log(`  Program State Account: ${accountSizes.programState || 0} bytes`);
      
    } catch (error) {
      console.log(`  Could not measure account sizes: ${error.message}`);
    }
    
    // Measure transaction sizes
    const sampleMint = Keypair.generate();
    const instruction = await this.program.methods
      .mintNft('https://example.com/metadata', 'Test', 'TEST', true)
      .accounts({ mint: sampleMint.publicKey })
      .instruction();
    
    const transaction = new Transaction().add(instruction);
    const serialized = transaction.serialize({ requireAllSignatures: false });
    
    this.metrics.resources = {
      accountSizes,
      transactionSize: serialized.length,
      estimatedRentCosts: {
        nftMetadata: await this.connection.getMinimumBalanceForRentExemption(200), // Estimated size
        programState: await this.connection.getMinimumBalanceForRentExemption(128)
      }
    };
    
    console.log(`  Transaction Size: ${serialized.length} bytes`);
    console.log(`  Estimated Rent (NFT Metadata): ${this.metrics.resources.estimatedRentCosts.nftMetadata / 1e9} SOL`);
  }

  async runComprehensiveBenchmarks() {
    console.log('🏁 Universal NFT Program - Performance Benchmarks');
    console.log('=================================================');
    
    // Initialize program if needed
    try {
      const tssAddress = new PublicKey('11111111111111111111111111111112');
      const gatewayProgram = new PublicKey('11111111111111111111111111111113');
      
      await this.program.methods
        .initialize(tssAddress, gatewayProgram)
        .rpc();
      
      console.log('✅ Program initialized for benchmarks');
    } catch (error) {
      console.log('ℹ️  Program already initialized or initialization not needed');
    }
    
    // Benchmark 1: NFT Minting Latency
    await this.measureLatency(
      'NFT Minting',
      async () => {
        const mintKeypair = Keypair.generate();
        await this.program.methods
          .mintNft(
            `https://arweave.net/metadata-${Date.now()}`,
            `Benchmark NFT ${Math.random().toString(36).substr(2, 5)}`,
            'BENCH',
            true
          )
          .accounts({ mint: mintKeypair.publicKey })
          .signers([mintKeypair])
          .rpc();
      },
      3 // Reduced iterations for demo
    );
    
    // Benchmark 2: Ownership Verification Latency
    const testMint = Keypair.generate();
    try {
      await this.program.methods
        .mintNft('https://example.com/test', 'Test NFT', 'TEST', true)
        .accounts({ mint: testMint.publicKey })
        .signers([testMint])
        .rpc();
      
      await this.measureLatency(
        'Ownership Verification',
        async () => {
          await this.program.methods
            .verifyOwnership(testMint.publicKey)
            .rpc();
        },
        5
      );
    } catch (error) {
      console.log('⚠️  Could not benchmark ownership verification:', error.message);
    }
    
    // Benchmark 3: Cross-Chain Transfer Setup Latency
    await this.measureLatency(
      'Cross-Chain Transfer Setup',
      async () => {
        const mockMint = Keypair.generate();
        const destinationAddress = Buffer.from('742d35cc5ff71cf34dc7ac8ee33c4d5ac0c3e8ad', 'hex');
        const nonce = Date.now() + Math.random() * 1000;
        
        // This will likely fail due to missing NFT, but measures instruction setup time
        try {
          await this.program.methods
            .crossChainTransfer(1, Array.from(destinationAddress), nonce)
            .accounts({ mint: mockMint.publicKey })
            .rpc();
        } catch (error) {
          // Expected to fail, we're measuring setup time
          if (!error.message.includes('Account does not exist')) {
            throw error;
          }
        }
      },
      3
    );
    
    // Benchmark 4: Resource Usage
    await this.measureResourceUsage();
    
    // Generate performance report
    this.generatePerformanceReport();
  }

  generatePerformanceReport() {
    console.log('\n📊 Performance Report');
    console.log('====================');
    
    // Latency Report
    if (Object.keys(this.metrics.latency).length > 0) {
      console.log('\n⏱️  Latency Metrics:');
      Object.entries(this.metrics.latency).forEach(([operation, metrics]) => {
        console.log(`\n  ${operation}:`);
        console.log(`    Average: ${metrics.average}ms`);
        console.log(`    Range: ${metrics.min}ms - ${metrics.max}ms`);
        console.log(`    Success Rate: ${metrics.successRate}%`);
        
        // Performance assessment
        const avgLatency = parseFloat(metrics.average);
        if (avgLatency < 1000) {
          console.log(`    Assessment: ✅ Excellent (<1s)`);
        } else if (avgLatency < 5000) {
          console.log(`    Assessment: ✅ Good (<5s)`);
        } else {
          console.log(`    Assessment: ⚠️  Needs optimization (>5s)`);
        }
      });
    }
    
    // Throughput Report
    if (Object.keys(this.metrics.throughput).length > 0) {
      console.log('\n🚀 Throughput Metrics:');
      Object.entries(this.metrics.throughput).forEach(([operation, metrics]) => {
        console.log(`\n  ${operation}:`);
        console.log(`    Throughput: ${metrics.throughput} ops/second`);
        console.log(`    Total Operations: ${metrics.operations}`);
        console.log(`    Success Rate: ${metrics.successRate}%`);
        
        // Throughput assessment
        const throughput = parseFloat(metrics.throughput);
        if (throughput > 10) {
          console.log(`    Assessment: ✅ High throughput`);
        } else if (throughput > 1) {
          console.log(`    Assessment: ✅ Moderate throughput`);
        } else {
          console.log(`    Assessment: ⚠️  Low throughput`);
        }
      });
    }
    
    // Resource Usage Report
    if (this.metrics.resources) {
      console.log('\n💾 Resource Usage:');
      console.log(`    Transaction Size: ${this.metrics.resources.transactionSize} bytes`);
      
      if (this.metrics.resources.accountSizes) {
        Object.entries(this.metrics.resources.accountSizes).forEach(([account, size]) => {
          console.log(`    ${account}: ${size} bytes`);
        });
      }
      
      console.log(`    Estimated Rent Costs:`);
      Object.entries(this.metrics.resources.estimatedRentCosts).forEach(([account, cost]) => {
        console.log(`      ${account}: ${(cost / 1e9).toFixed(6)} SOL`);
      });
    }
    
    // Error Analysis
    if (this.metrics.errors.length > 0) {
      console.log('\n❌ Error Analysis:');
      console.log(`    Total Errors: ${this.metrics.errors.length}`);
      
      // Group errors by type
      const errorGroups = {};
      this.metrics.errors.forEach(error => {
        const key = error.error.split(':')[0];
        if (!errorGroups[key]) errorGroups[key] = 0;
        errorGroups[key]++;
      });
      
      Object.entries(errorGroups).forEach(([errorType, count]) => {
        console.log(`    ${errorType}: ${count} occurrences`);
      });
    }
    
    // Overall Assessment
    console.log('\n🏆 Overall Performance Assessment:');
    const hasGoodLatency = Object.values(this.metrics.latency).every(m => parseFloat(m.average) < 5000);
    const hasGoodSuccessRate = Object.values(this.metrics.latency).every(m => parseFloat(m.successRate) > 80);
    
    if (hasGoodLatency && hasGoodSuccessRate) {
      console.log('    ✅ Excellent - Ready for production deployment');
    } else if (hasGoodSuccessRate) {
      console.log('    ✅ Good - Consider latency optimizations');
    } else {
      console.log('    ⚠️  Needs improvement - Check error logs');
    }
    
    // Performance Recommendations
    console.log('\n💡 Performance Recommendations:');
    console.log('    1. Use connection pooling for high-throughput applications');
    console.log('    2. Implement transaction batching where possible');
    console.log('    3. Cache account data to reduce RPC calls');
    console.log('    4. Use confirmed commitment for balance between speed and finality');
    console.log('    5. Monitor network congestion and adjust compute budgets accordingly');
    
    // Save detailed results
    this.saveResults();
  }

  saveResults() {
    const report = {
      timestamp: new Date().toISOString(),
      program_id: this.programId.toString(),
      network: 'devnet',
      metrics: this.metrics,
      environment: {
        node_version: process.version,
        platform: process.platform,
        arch: process.arch
      }
    };

    const filename = `performance-benchmarks-${Date.now()}.json`;
    fs.writeFileSync(filename, JSON.stringify(report, null, 2));
    console.log(`\n💾 Detailed results saved to: ${filename}`);
  }
}

// Run benchmarks if this file is executed directly
if (require.main === module) {
  const benchmarks = new PerformanceBenchmarks();
  
  benchmarks.runComprehensiveBenchmarks()
    .then(() => {
      console.log('\n✅ Performance benchmarking complete!');
    })
    .catch(error => {
      console.error('\n❌ Benchmarking failed:', error);
      process.exit(1);
    });
}

module.exports = PerformanceBenchmarks;