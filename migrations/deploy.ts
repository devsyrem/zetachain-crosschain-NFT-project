import * as anchor from '@coral-xyz/anchor';
import { Program, AnchorProvider } from '@coral-xyz/anchor';
import { PublicKey, Keypair, SystemProgram } from '@solana/web3.js';

// Import the types once available
import { UniversalNft } from '../target/types/universal_nft';

module.exports = async function (provider: AnchorProvider) {
  anchor.setProvider(provider);

  const program = anchor.workspace.UniversalNft as Program<UniversalNft>;
  
  console.log("Deploying Universal NFT Program...");
  console.log("Program ID:", program.programId.toString());

  try {
    // Get program state PDA
    const [programStatePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("program_state")],
      program.programId
    );

    // Get cross-chain config PDA
    const [crossChainConfigPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("cross_chain_config")],
      program.programId
    );

    // Check if already initialized
    try {
      const programState = await program.account.programState.fetch(programStatePda);
      console.log("Program already initialized");
      console.log("Authority:", programState.authority.toString());
      console.log("Total NFTs minted:", programState.totalNftsMinted.toString());
      return;
    } catch (error) {
      console.log("Program not initialized, proceeding with initialization...");
    }

    // Initialize the program
    // These should be replaced with actual ZetaChain gateway addresses
    const gatewayAddress = new PublicKey("GatewayAddress111111111111111111111111111");
    const tssAddress = new PublicKey("TssAddress1111111111111111111111111111111");
    const chainId = 1001; // ZetaChain testnet

    const tx = await program.methods
      .initialize(gatewayAddress, tssAddress, new anchor.BN(chainId))
      .accounts({
        programState: programStatePda,
        crossChainConfig: crossChainConfigPda,
        authority: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log("Initialization transaction signature:", tx);
    console.log("Program State PDA:", programStatePda.toString());
    console.log("Cross-Chain Config PDA:", crossChainConfigPda.toString());
    console.log("Gateway Address:", gatewayAddress.toString());
    console.log("TSS Address:", tssAddress.toString());
    console.log("Chain ID:", chainId);

    // Verify initialization
    const programState = await program.account.programState.fetch(programStatePda);
    console.log("\nInitialization verified:");
    console.log("- Is Initialized:", programState.isInitialized);
    console.log("- Authority:", programState.authority.toString());
    console.log("- Total NFTs Minted:", programState.totalNftsMinted.toString());

    const crossChainConfig = await program.account.crossChainConfig.fetch(crossChainConfigPda);
    console.log("- Gateway Address:", crossChainConfig.gatewayAddress.toString());
    console.log("- TSS Address:", crossChainConfig.tssAddress.toString());
    console.log("- Chain ID:", crossChainConfig.chainId.toString());
    console.log("- Is Paused:", crossChainConfig.isPaused);

  } catch (error) {
    console.error("Deployment failed:", error);
    throw error;
  }
};
