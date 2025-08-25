import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
// @ts-ignore - Type will be available after build
import { UniversalNft } from '../target/types/universal_nft';
import { 
  PublicKey, 
  Keypair, 
  SystemProgram,
  SYSVAR_RENT_PUBKEY 
} from '@solana/web3.js';
import { 
  TOKEN_PROGRAM_ID, 
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
} from '@solana/spl-token';
import { expect } from 'chai';

describe('universal-nft', () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.UniversalNft as Program<UniversalNft>;
  const authority = provider.wallet as anchor.Wallet;

  // Test accounts
  let programStatePda: PublicKey;
  let crossChainConfigPda: PublicKey;
  let gatewayAddress: PublicKey;
  let tssAddress: PublicKey;

  before(async () => {
    // Find PDAs
    [programStatePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("program_state")],
      program.programId
    );

    [crossChainConfigPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("cross_chain_config")],
      program.programId
    );

    // Mock addresses for testing
    gatewayAddress = Keypair.generate().publicKey;
    tssAddress = Keypair.generate().publicKey;
  });

  it('Initializes the program', async () => {
    const chainId = 1001;

    const tx = await program.methods
      .initialize(gatewayAddress, tssAddress, new anchor.BN(chainId))
      .accounts({
        programState: programStatePda,
        crossChainConfig: crossChainConfigPda,
        authority: authority.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log("Initialize tx:", tx);

    // Verify program state
    const programState = await program.account.programState.fetch(programStatePda);
    expect(programState.authority.toString()).to.equal(authority.publicKey.toString());
    expect(programState.isInitialized).to.be.true;
    expect(programState.totalNftsMinted.toString()).to.equal('0');

    // Verify cross-chain config
    const crossChainConfig = await program.account.crossChainConfig.fetch(crossChainConfigPda);
    expect(crossChainConfig.gatewayAddress.toString()).to.equal(gatewayAddress.toString());
    expect(crossChainConfig.tssAddress.toString()).to.equal(tssAddress.toString());
    expect(crossChainConfig.chainId.toString()).to.equal(chainId.toString());
    expect(crossChainConfig.isPaused).to.be.false;
  });

  it('Mints an NFT', async () => {
    const mintKeypair = Keypair.generate();
    const recipient = Keypair.generate();
    
    const metadataUri = "https://example.com/metadata.json";
    const name = "Test NFT";
    const symbol = "TEST";
    const crossChainEnabled = true;

    // Get associated token account
    const tokenAccount = await getAssociatedTokenAddress(
      mintKeypair.publicKey,
      recipient.publicKey
    );

    // Get NFT metadata PDA
    const [nftMetadataPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("nft_metadata"), mintKeypair.publicKey.toBytes()],
      program.programId
    );

    // Get Metaplex metadata account
    const [metadataAccount] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("metadata"),
        new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s").toBytes(),
        mintKeypair.publicKey.toBytes(),
      ],
      new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s")
    );

    const tx = await program.methods
      .mintNft(metadataUri, name, symbol, crossChainEnabled)
      .accounts({
        programState: programStatePda,
        mint: mintKeypair.publicKey,
        tokenAccount: tokenAccount,
        nftMetadata: nftMetadataPda,
        metadataAccount: metadataAccount,
        payer: authority.publicKey,
        recipient: recipient.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
        metadataProgram: new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"),
      })
      .signers([mintKeypair])
      .rpc();

    console.log("Mint NFT tx:", tx);

    // Verify NFT metadata
    const nftMetadata = await program.account.nftMetadata.fetch(nftMetadataPda);
    expect(nftMetadata.mint.toString()).to.equal(mintKeypair.publicKey.toString());
    expect(nftMetadata.metadataUri).to.equal(metadataUri);
    expect(nftMetadata.name).to.equal(name);
    expect(nftMetadata.symbol).to.equal(symbol);
    expect(nftMetadata.crossChainEnabled).to.equal(crossChainEnabled);
    expect(nftMetadata.isLocked).to.be.false;
    expect(nftMetadata.originChainId.toString()).to.equal('0');

    // Verify program state updated
    const programState = await program.account.programState.fetch(programStatePda);
    expect(programState.totalNftsMinted.toString()).to.equal('1');
  });

  it('Verifies NFT ownership', async () => {
    // Create a new NFT for ownership verification
    const mintKeypair = Keypair.generate();
    const owner = Keypair.generate();
    
    // Fund the owner account
    const fundTx = await provider.connection.requestAirdrop(
      owner.publicKey,
      2 * anchor.web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(fundTx);

    const metadataUri = "https://example.com/verify-metadata.json";
    const name = "Verify NFT";
    const symbol = "VERIFY";
    const crossChainEnabled = true;

    // Get associated token account
    const tokenAccount = await getAssociatedTokenAddress(
      mintKeypair.publicKey,
      owner.publicKey
    );

    // Get NFT metadata PDA
    const [nftMetadataPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("nft_metadata"), mintKeypair.publicKey.toBytes()],
      program.programId
    );

    // Get Metaplex metadata account
    const [metadataAccount] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("metadata"),
        new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s").toBytes(),
        mintKeypair.publicKey.toBytes(),
      ],
      new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s")
    );

    // First mint the NFT
    await program.methods
      .mintNft(metadataUri, name, symbol, crossChainEnabled)
      .accounts({
        programState: programStatePda,
        mint: mintKeypair.publicKey,
        tokenAccount: tokenAccount,
        nftMetadata: nftMetadataPda,
        metadataAccount: metadataAccount,
        payer: authority.publicKey,
        recipient: owner.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
        metadataProgram: new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"),
      })
      .signers([mintKeypair])
      .rpc();

    // Now verify ownership
    const verifyTx = await program.methods
      .verifyOwnership(mintKeypair.publicKey)
      .accounts({
        programState: programStatePda,
        nftMetadata: nftMetadataPda,
        tokenAccount: tokenAccount,
        owner: owner.publicKey,
      })
      .signers([owner])
      .rpc();

    console.log("Verify ownership tx:", verifyTx);

    // The transaction completing successfully means ownership was verified
    expect(verifyTx).to.be.a('string');
  });

  it('Handles cross-chain transfer initiation', async () => {
    // Create NFT for cross-chain transfer
    const mintKeypair = Keypair.generate();
    const owner = Keypair.generate();
    
    // Fund the owner account
    const fundTx = await provider.connection.requestAirdrop(
      owner.publicKey,
      2 * anchor.web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(fundTx);

    const metadataUri = "https://example.com/cross-chain-metadata.json";
    const name = "Cross Chain NFT";
    const symbol = "XCN";
    const crossChainEnabled = true;

    // Get associated token account
    const tokenAccount = await getAssociatedTokenAddress(
      mintKeypair.publicKey,
      owner.publicKey
    );

    // Get NFT metadata PDA
    const [nftMetadataPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("nft_metadata"), mintKeypair.publicKey.toBytes()],
      program.programId
    );

    // Get Metaplex metadata account
    const [metadataAccount] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("metadata"),
        new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s").toBytes(),
        mintKeypair.publicKey.toBytes(),
      ],
      new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s")
    );

    // First mint the NFT
    await program.methods
      .mintNft(metadataUri, name, symbol, crossChainEnabled)
      .accounts({
        programState: programStatePda,
        mint: mintKeypair.publicKey,
        tokenAccount: tokenAccount,
        nftMetadata: nftMetadataPda,
        metadataAccount: metadataAccount,
        payer: authority.publicKey,
        recipient: owner.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
        metadataProgram: new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"),
      })
      .signers([mintKeypair])
      .rpc();

    // Prepare cross-chain transfer
    const destinationChainId = 1; // Ethereum
    const recipientAddress = Buffer.from("1234567890123456789012345678901234567890", 'hex'); // 20 bytes for Ethereum
    const nonce = 1;

    // Get transfer record PDA
    const [transferRecordPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("cross_chain_transfer"),
        mintKeypair.publicKey.toBytes(),
        Buffer.from(nonce.toString().padStart(8, '0'))
      ],
      program.programId
    );

    // Initiate cross-chain transfer
    const transferTx = await program.methods
      .crossChainTransfer(
        new anchor.BN(destinationChainId),
        Array.from(recipientAddress),
        new anchor.BN(nonce)
      )
      .accounts({
        programState: programStatePda,
        crossChainConfig: crossChainConfigPda,
        nftMetadata: nftMetadataPda,
        transferRecord: transferRecordPda,
        mint: mintKeypair.publicKey,
        tokenAccount: tokenAccount,
        owner: owner.publicKey,
        gatewayProgram: gatewayAddress,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([owner])
      .rpc();

    console.log("Cross-chain transfer tx:", transferTx);

    // Verify transfer record
    const transferRecord = await program.account.crossChainTransfer.fetch(transferRecordPda);
    expect(transferRecord.mint.toString()).to.equal(mintKeypair.publicKey.toString());
    expect(transferRecord.originalOwner.toString()).to.equal(owner.publicKey.toString());
    expect(transferRecord.destinationChainId.toString()).to.equal(destinationChainId.toString());
    expect(transferRecord.nonce.toString()).to.equal(nonce.toString());
    expect(transferRecord.status).to.equal(0); // Pending

    // Verify NFT is locked
    const updatedNftMetadata = await program.account.nftMetadata.fetch(nftMetadataPda);
    expect(updatedNftMetadata.isLocked).to.be.true;
  });
});
