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
import * as crypto from 'crypto';

describe('cross-chain functionality', () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.UniversalNft as Program<UniversalNft>;
  const authority = provider.wallet as anchor.Wallet;

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

    // Use existing or create mock addresses
    gatewayAddress = Keypair.generate().publicKey;
    tssAddress = Keypair.generate().publicKey;

    // Try to fetch existing state, or initialize if needed
    try {
      await program.account.programState.fetch(programStatePda);
      await program.account.crossChainConfig.fetch(crossChainConfigPda);
    } catch (error) {
      // Initialize if not already done
      await program.methods
        .initialize(gatewayAddress, tssAddress, new anchor.BN(1001))
        .accounts({
          programState: programStatePda,
          crossChainConfig: crossChainConfigPda,
          authority: authority.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
    }
  });

  it('Receives cross-chain NFT with valid TSS signature', async () => {
    const mintKeypair = Keypair.generate();
    const recipient = Keypair.generate();

    // Fund recipient account
    const fundTx = await provider.connection.requestAirdrop(
      recipient.publicKey,
      2 * anchor.web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(fundTx);

    // Cross-chain transfer parameters
    const originChainId = 1; // Ethereum
    const originTxHash = crypto.randomBytes(32);
    const metadataUri = "https://ethereum.example.com/metadata.json";
    const name = "Ethereum NFT";
    const symbol = "ETH-NFT";
    const originalOwner = crypto.randomBytes(20); // Ethereum address
    const nonce = Date.now();

    // Generate mock TSS signature (64 bytes)
    const tssSignature = crypto.randomBytes(64);

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

    // Get cross-chain receipt PDA
    const [receiptPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("cross_chain_receipt"),
        originTxHash,
        Buffer.from(nonce.toString().padStart(8, '0'))
      ],
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

    // Receive cross-chain NFT
    const receiveTx = await program.methods
      .receiveCrossChain(
        new anchor.BN(originChainId),
        Array.from(originTxHash),
        metadataUri,
        name,
        symbol,
        Array.from(originalOwner),
        Array.from(tssSignature),
        new anchor.BN(nonce)
      )
      .accounts({
        programState: programStatePda,
        crossChainConfig: crossChainConfigPda,
        mint: mintKeypair.publicKey,
        tokenAccount: tokenAccount,
        nftMetadata: nftMetadataPda,
        receipt: receiptPda,
        metadataAccount: metadataAccount,
        payer: authority.publicKey,
        recipient: recipient.publicKey,
        tssAuthority: tssAddress,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
        metadataProgram: new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"),
      })
      .signers([mintKeypair])
      .rpc();

    console.log("Receive cross-chain NFT tx:", receiveTx);

    // Verify NFT metadata
    const nftMetadata = await program.account.nftMetadata.fetch(nftMetadataPda);
    expect(nftMetadata.mint.toString()).to.equal(mintKeypair.publicKey.toString());
    expect(nftMetadata.currentOwner.toString()).to.equal(recipient.publicKey.toString());
    expect(nftMetadata.metadataUri).to.equal(metadataUri);
    expect(nftMetadata.name).to.equal(name);
    expect(nftMetadata.symbol).to.equal(symbol);
    expect(nftMetadata.crossChainEnabled).to.be.true;
    expect(nftMetadata.isLocked).to.be.false;
    expect(nftMetadata.originChainId.toString()).to.equal(originChainId.toString());

    // Verify cross-chain receipt
    const receipt = await program.account.crossChainReceipt.fetch(receiptPda);
    expect(receipt.originChainId.toString()).to.equal(originChainId.toString());
    expect(receipt.mint.toString()).to.equal(mintKeypair.publicKey.toString());
    expect(receipt.recipient.toString()).to.equal(recipient.publicKey.toString());
    expect(receipt.nonce.toString()).to.equal(nonce.toString());
    expect(Buffer.from(receipt.tssSignature)).to.deep.equal(Buffer.from(tssSignature));

    // Verify program state updated
    const programState = await program.account.programState.fetch(programStatePda);
    expect(Number(programState.totalNftsMinted)).to.be.greaterThan(0);
  });

  it('Prevents replay attacks with duplicate nonces', async () => {
    const mintKeypair = Keypair.generate();
    const recipient = Keypair.generate();

    // Fund recipient account
    const fundTx = await provider.connection.requestAirdrop(
      recipient.publicKey,
      2 * anchor.web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(fundTx);

    // Use a nonce that's already been used (should be less than current nonce)
    const duplicateNonce = 1;

    const originTxHash = crypto.randomBytes(32);
    const tssSignature = crypto.randomBytes(64);

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

    // Get cross-chain receipt PDA
    const [receiptPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("cross_chain_receipt"),
        originTxHash,
        Buffer.from(duplicateNonce.toString().padStart(8, '0'))
      ],
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

    // Attempt to receive cross-chain NFT with duplicate nonce (should fail)
    try {
      await program.methods
        .receiveCrossChain(
          new anchor.BN(1),
          Array.from(originTxHash),
          "https://duplicate.example.com/metadata.json",
          "Duplicate NFT",
          "DUP",
          Array.from(crypto.randomBytes(20)),
          Array.from(tssSignature),
          new anchor.BN(duplicateNonce)
        )
        .accounts({
          programState: programStatePda,
          crossChainConfig: crossChainConfigPda,
          mint: mintKeypair.publicKey,
          tokenAccount: tokenAccount,
          nftMetadata: nftMetadataPda,
          receipt: receiptPda,
          metadataAccount: metadataAccount,
          payer: authority.publicKey,
          recipient: recipient.publicKey,
          tssAuthority: tssAddress,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY,
          metadataProgram: new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"),
        })
        .signers([mintKeypair])
        .rpc();

      // If we reach here, the test failed
      expect.fail("Should have thrown an error for duplicate nonce");
    } catch (error) {
      // Verify it's the correct error
      expect(error.message).to.include("Invalid nonce");
    }
  });

  it('Validates recipient address format for different chains', async () => {
    const mintKeypair = Keypair.generate();
    const owner = Keypair.generate();

    // Fund owner account
    const fundTx = await provider.connection.requestAirdrop(
      owner.publicKey,
      2 * anchor.web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(fundTx);

    // First mint an NFT
    const metadataUri = "https://example.com/validation-test.json";
    const name = "Validation Test NFT";
    const symbol = "VALID";

    const tokenAccount = await getAssociatedTokenAddress(
      mintKeypair.publicKey,
      owner.publicKey
    );

    const [nftMetadataPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("nft_metadata"), mintKeypair.publicKey.toBytes()],
      program.programId
    );

    const [metadataAccount] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("metadata"),
        new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s").toBytes(),
        mintKeypair.publicKey.toBytes(),
      ],
      new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s")
    );

    await program.methods
      .mintNft(metadataUri, name, symbol, true)
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

    // Test with invalid recipient address length for Ethereum
    const nonce = Date.now();
    const [transferRecordPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("cross_chain_transfer"),
        mintKeypair.publicKey.toBytes(),
        Buffer.from(nonce.toString().padStart(8, '0'))
      ],
      program.programId
    );

    try {
      // Invalid address (too short for Ethereum)
      const invalidRecipientAddress = Buffer.from("123456789012345678", 'hex'); // 18 bytes instead of 20

      await program.methods
        .crossChainTransfer(
          new anchor.BN(1), // Ethereum
          Array.from(invalidRecipientAddress),
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

      expect.fail("Should have thrown an error for invalid recipient address");
    } catch (error) {
      expect(error.message).to.include("Invalid recipient address");
    }
  });
});
