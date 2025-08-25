import * as anchor from '@coral-xyz/anchor';
import { 
  Connection, 
  PublicKey, 
  Keypair, 
  SystemProgram,
  Transaction,
  SYSVAR_RENT_PUBKEY 
} from '@solana/web3.js';
import { 
  TOKEN_PROGRAM_ID, 
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
} from '@solana/spl-token';
import { Program } from '@coral-xyz/anchor';
import { UniversalNft, IDL } from '../../target/types/universal_nft';
import { NftMetadata, CrossChainTransfer, CrossChainReceipt } from './types';

export class UniversalNftClient {
  public program: Program<UniversalNft>;
  public provider: anchor.AnchorProvider;
  public programId: PublicKey;

  constructor(
    connection: Connection,
    wallet: anchor.Wallet,
    programId: string = "UnivNFT111111111111111111111111111111111111"
  ) {
    this.provider = new anchor.AnchorProvider(connection, wallet, {});
    anchor.setProvider(this.provider);
    
    this.programId = new PublicKey(programId);
    this.program = new Program<UniversalNft>(IDL, this.programId, this.provider);
  }

  /**
   * Initialize the Universal NFT program
   */
  async initialize(
    gatewayAddress: string,
    tssAddress: string,
    chainId: number
  ): Promise<string> {
    const [programStatePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("program_state")],
      this.programId
    );

    const [crossChainConfigPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("cross_chain_config")],
      this.programId
    );

    const tx = await this.program.methods
      .initialize(
        new PublicKey(gatewayAddress),
        new PublicKey(tssAddress),
        new anchor.BN(chainId)
      )
      .accounts({
        programState: programStatePda,
        crossChainConfig: crossChainConfigPda,
        authority: this.provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    return tx;
  }

  /**
   * Mint a new NFT
   */
  async mintNft(
    mintKeypair: Keypair,
    recipient: PublicKey,
    metadataUri: string,
    name: string,
    symbol: string,
    crossChainEnabled: boolean = true
  ): Promise<string> {
    const [programStatePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("program_state")],
      this.programId
    );

    const tokenAccount = await getAssociatedTokenAddress(
      mintKeypair.publicKey,
      recipient
    );

    const [nftMetadataPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("nft_metadata"), mintKeypair.publicKey.toBytes()],
      this.programId
    );

    const [metadataAccount] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("metadata"),
        new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s").toBytes(),
        mintKeypair.publicKey.toBytes(),
      ],
      new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s")
    );

    const tx = await this.program.methods
      .mintNft(metadataUri, name, symbol, crossChainEnabled)
      .accounts({
        programState: programStatePda,
        mint: mintKeypair.publicKey,
        tokenAccount: tokenAccount,
        nftMetadata: nftMetadataPda,
        metadataAccount: metadataAccount,
        payer: this.provider.wallet.publicKey,
        recipient: recipient,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
        metadataProgram: new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"),
      })
      .signers([mintKeypair])
      .rpc();

    return tx;
  }

  /**
   * Initiate a cross-chain transfer
   */
  async crossChainTransfer(
    mint: PublicKey,
    owner: Keypair,
    destinationChainId: number,
    recipientAddress: string,
    gatewayAddress: string
  ): Promise<string> {
    const [programStatePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("program_state")],
      this.programId
    );

    const [crossChainConfigPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("cross_chain_config")],
      this.programId
    );

    const [nftMetadataPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("nft_metadata"), mint.toBytes()],
      this.programId
    );

    const nonce = Date.now();
    const [transferRecordPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("cross_chain_transfer"),
        mint.toBytes(),
        Buffer.from(nonce.toString().padStart(8, '0'))
      ],
      this.programId
    );

    const tokenAccount = await getAssociatedTokenAddress(mint, owner.publicKey);

    // Convert recipient address to bytes based on chain
    let recipientBytes: number[];
    if (destinationChainId === 1 || destinationChainId === 56 || destinationChainId === 137 || destinationChainId === 1001) {
      // EVM chains - expect hex address
      const cleanAddress = recipientAddress.startsWith('0x') ? recipientAddress.slice(2) : recipientAddress;
      recipientBytes = Array.from(Buffer.from(cleanAddress, 'hex'));
    } else {
      throw new Error(`Unsupported destination chain: ${destinationChainId}`);
    }

    const tx = await this.program.methods
      .crossChainTransfer(
        new anchor.BN(destinationChainId),
        recipientBytes,
        new anchor.BN(nonce)
      )
      .accounts({
        programState: programStatePda,
        crossChainConfig: crossChainConfigPda,
        nftMetadata: nftMetadataPda,
        transferRecord: transferRecordPda,
        mint: mint,
        tokenAccount: tokenAccount,
        owner: owner.publicKey,
        gatewayProgram: new PublicKey(gatewayAddress),
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([owner])
      .rpc();

    return tx;
  }

  /**
   * Receive a cross-chain NFT
   */
  async receiveCrossChainNft(
    mintKeypair: Keypair,
    recipient: PublicKey,
    originChainId: number,
    originTxHash: string,
    metadataUri: string,
    name: string,
    symbol: string,
    originalOwner: string,
    tssSignature: string,
    tssAddress: string
  ): Promise<string> {
    const [programStatePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("program_state")],
      this.programId
    );

    const [crossChainConfigPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("cross_chain_config")],
      this.programId
    );

    const tokenAccount = await getAssociatedTokenAddress(
      mintKeypair.publicKey,
      recipient
    );

    const [nftMetadataPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("nft_metadata"), mintKeypair.publicKey.toBytes()],
      this.programId
    );

    const nonce = Date.now();
    const originTxHashBytes = Buffer.from(originTxHash.startsWith('0x') ? originTxHash.slice(2) : originTxHash, 'hex');
    
    const [receiptPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("cross_chain_receipt"),
        originTxHashBytes,
        Buffer.from(nonce.toString().padStart(8, '0'))
      ],
      this.programId
    );

    const [metadataAccount] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("metadata"),
        new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s").toBytes(),
        mintKeypair.publicKey.toBytes(),
      ],
      new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s")
    );

    // Convert parameters to bytes
    const originalOwnerBytes = Array.from(Buffer.from(originalOwner.startsWith('0x') ? originalOwner.slice(2) : originalOwner, 'hex'));
    const tssSignatureBytes = Array.from(Buffer.from(tssSignature.startsWith('0x') ? tssSignature.slice(2) : tssSignature, 'hex'));

    const tx = await this.program.methods
      .receiveCrossChain(
        new anchor.BN(originChainId),
        Array.from(originTxHashBytes),
        metadataUri,
        name,
        symbol,
        originalOwnerBytes,
        tssSignatureBytes,
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
        payer: this.provider.wallet.publicKey,
        recipient: recipient,
        tssAuthority: new PublicKey(tssAddress),
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
        metadataProgram: new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"),
      })
      .signers([mintKeypair])
      .rpc();

    return tx;
  }

  /**
   * Verify NFT ownership
   */
  async verifyOwnership(mint: PublicKey, owner: Keypair): Promise<string> {
    const [programStatePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("program_state")],
      this.programId
    );

    const [nftMetadataPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("nft_metadata"), mint.toBytes()],
      this.programId
    );

    const tokenAccount = await getAssociatedTokenAddress(mint, owner.publicKey);

    const tx = await this.program.methods
      .verifyOwnership(mint)
      .accounts({
        programState: programStatePda,
        nftMetadata: nftMetadataPda,
        tokenAccount: tokenAccount,
        owner: owner.publicKey,
      })
      .signers([owner])
      .rpc();

    return tx;
  }

  /**
   * Get NFT metadata
   */
  async getNftMetadata(mint: PublicKey): Promise<NftMetadata | null> {
    try {
      const [nftMetadataPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("nft_metadata"), mint.toBytes()],
        this.programId
      );

      const metadata = await this.program.account.nftMetadata.fetch(nftMetadataPda);
      
      return {
        mint: metadata.mint.toString(),
        originalOwner: metadata.originalOwner.toString(),
        currentOwner: metadata.currentOwner.toString(),
        metadataUri: metadata.metadataUri,
        name: metadata.name,
        symbol: metadata.symbol,
        crossChainEnabled: metadata.crossChainEnabled,
        isLocked: metadata.isLocked,
        originChainId: metadata.originChainId.toString(),
        creationTimestamp: metadata.creationTimestamp.toString(),
      };
    } catch (error) {
      console.error("Error fetching NFT metadata:", error);
      return null;
    }
  }

  /**
   * Get cross-chain transfer record
   */
  async getCrossChainTransfer(mint: PublicKey, nonce: number): Promise<CrossChainTransfer | null> {
    try {
      const [transferRecordPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("cross_chain_transfer"),
          mint.toBytes(),
          Buffer.from(nonce.toString().padStart(8, '0'))
        ],
        this.programId
      );

      const transfer = await this.program.account.crossChainTransfer.fetch(transferRecordPda);
      
      return {
        mint: transfer.mint.toString(),
        originalOwner: transfer.originalOwner.toString(),
        destinationChainId: transfer.destinationChainId.toString(),
        recipientAddress: Buffer.from(transfer.recipientAddress).toString('hex'),
        nonce: transfer.nonce.toString(),
        timestamp: transfer.timestamp.toString(),
        status: transfer.status,
      };
    } catch (error) {
      console.error("Error fetching cross-chain transfer:", error);
      return null;
    }
  }

  /**
   * Get cross-chain receipt
   */
  async getCrossChainReceipt(originTxHash: string, nonce: number): Promise<CrossChainReceipt | null> {
    try {
      const originTxHashBytes = Buffer.from(originTxHash.startsWith('0x') ? originTxHash.slice(2) : originTxHash, 'hex');
      
      const [receiptPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("cross_chain_receipt"),
          originTxHashBytes,
          Buffer.from(nonce.toString().padStart(8, '0'))
        ],
        this.programId
      );

      const receipt = await this.program.account.crossChainReceipt.fetch(receiptPda);
      
      return {
        originChainId: receipt.originChainId.toString(),
        originTxHash: Buffer.from(receipt.originTxHash).toString('hex'),
        mint: receipt.mint.toString(),
        recipient: receipt.recipient.toString(),
        originalOwner: Buffer.from(receipt.originalOwner).toString('hex'),
        nonce: receipt.nonce.toString(),
        timestamp: receipt.timestamp.toString(),
        tssSignature: Buffer.from(receipt.tssSignature).toString('hex'),
      };
    } catch (error) {
      console.error("Error fetching cross-chain receipt:", error);
      return null;
    }
  }

  /**
   * Get program state
   */
  async getProgramState() {
    const [programStatePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("program_state")],
      this.programId
    );

    return await this.program.account.programState.fetch(programStatePda);
  }

  /**
   * Get cross-chain configuration
   */
  async getCrossChainConfig() {
    const [crossChainConfigPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("cross_chain_config")],
      this.programId
    );

    return await this.program.account.crossChainConfig.fetch(crossChainConfigPda);
  }
}
