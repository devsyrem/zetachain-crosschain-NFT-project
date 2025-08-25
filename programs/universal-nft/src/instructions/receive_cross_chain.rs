use anchor_lang::prelude::*;
use anchor_spl::token::{Token, TokenAccount, Mint, MintTo, mint_to};
use crate::state::{ProgramState, CrossChainConfig, NftMetadata, CrossChainReceipt};
use crate::error::UniversalNftError;
use crate::utils::security::verify_tss_signature;

#[derive(Accounts)]
#[instruction(origin_chain_id: u64, origin_tx_hash: Vec<u8>, metadata_uri: String, name: String, symbol: String, original_owner: Vec<u8>, tss_signature: Vec<u8>, nonce: u64)]
pub struct ReceiveCrossChain<'info> {
    #[account(
        mut,
        seeds = [b"program_state"],
        bump = program_state.bump,
        constraint = program_state.is_initialized @ UniversalNftError::ProgramNotInitialized
    )]
    pub program_state: Account<'info, ProgramState>,

    #[account(
        seeds = [b"cross_chain_config"],
        bump = cross_chain_config.bump,
        constraint = !cross_chain_config.is_paused @ UniversalNftError::CrossChainPaused
    )]
    pub cross_chain_config: Account<'info, CrossChainConfig>,

    #[account(
        init,
        payer = authority,
        mint::decimals = 0,
        mint::authority = authority,
    )]
    pub mint: Account<'info, Mint>,

    #[account(
        init,
        payer = authority,
        associated_token::mint = mint,
        associated_token::authority = recipient,
    )]
    pub token_account: Account<'info, TokenAccount>,

    #[account(
        init,
        payer = authority,
        space = 8 + NftMetadata::INIT_SPACE,
        seeds = [b"nft_metadata", mint.key().as_ref()],
        bump
    )]
    pub nft_metadata: Account<'info, NftMetadata>,

    #[account(
        init,
        payer = authority,
        space = 8 + CrossChainReceipt::INIT_SPACE,
        seeds = [b"cross_chain_receipt", origin_tx_hash.as_slice(), nonce.to_le_bytes().as_ref()],
        bump
    )]
    pub receipt: Account<'info, CrossChainReceipt>,

    /// CHECK: Recipient validated by token account
    pub recipient: UncheckedAccount<'info>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, anchor_spl::associated_token::AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn handler(
    ctx: Context<ReceiveCrossChain>,
    origin_chain_id: u64,
    origin_tx_hash: Vec<u8>,
    metadata_uri: String,
    name: String,
    symbol: String,
    original_owner: Vec<u8>,
    tss_signature: Vec<u8>,
    nonce: u64,
) -> Result<()> {
    let program_state = &mut ctx.accounts.program_state;
    let cross_chain_config = &ctx.accounts.cross_chain_config;
    let nft_metadata = &mut ctx.accounts.nft_metadata;
    let receipt = &mut ctx.accounts.receipt;

    // Validate inputs
    require!(metadata_uri.len() <= 200, UniversalNftError::InvalidMetadataUri);
    require!(name.len() <= 32, UniversalNftError::InvalidMetadataUri);
    require!(symbol.len() <= 10, UniversalNftError::InvalidMetadataUri);
    require!(!origin_tx_hash.is_empty() && origin_tx_hash.len() <= 64, UniversalNftError::InvalidMetadataUri);
    require!(!original_owner.is_empty() && original_owner.len() <= 64, UniversalNftError::InvalidMetadataUri);
    require!(!tss_signature.is_empty() && tss_signature.len() <= 128, UniversalNftError::InvalidTssSignature);

    // Construct message for TSS verification
    let mut message = Vec::new();
    message.extend_from_slice(&origin_chain_id.to_le_bytes());
    message.extend_from_slice(&origin_tx_hash);
    message.extend_from_slice(metadata_uri.as_bytes());
    message.extend_from_slice(name.as_bytes());
    message.extend_from_slice(symbol.as_bytes());
    message.extend_from_slice(&original_owner);
    message.extend_from_slice(&nonce.to_le_bytes());

    // Verify TSS signature (simplified for demo - in production use proper crypto)
    let is_valid = verify_tss_signature(
        &message,
        &tss_signature,
        &cross_chain_config.tss_address,
    )?;
    require!(is_valid, UniversalNftError::InvalidTssSignature);

    // Mint the NFT to recipient
    let cpi_accounts = MintTo {
        mint: ctx.accounts.mint.to_account_info(),
        to: ctx.accounts.token_account.to_account_info(),
        authority: ctx.accounts.authority.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
    mint_to(cpi_ctx, 1)?;

    // Initialize NFT metadata
    nft_metadata.mint = ctx.accounts.mint.key();
    nft_metadata.original_owner = ctx.accounts.recipient.key(); // Recipient becomes owner on Solana
    nft_metadata.current_owner = ctx.accounts.recipient.key();
    nft_metadata.metadata_uri = metadata_uri;
    nft_metadata.name = name;
    nft_metadata.symbol = symbol;
    nft_metadata.cross_chain_enabled = true; // Cross-chain NFTs are always transferable
    nft_metadata.is_locked = false;
    nft_metadata.origin_chain_id = origin_chain_id;
    nft_metadata.creation_timestamp = Clock::get()?.unix_timestamp;
    nft_metadata.bump = ctx.bumps.nft_metadata;

    // Create receipt
    receipt.origin_chain_id = origin_chain_id;
    receipt.origin_tx_hash = origin_tx_hash;
    receipt.mint = ctx.accounts.mint.key();
    receipt.recipient = ctx.accounts.recipient.key();
    receipt.original_owner = original_owner;
    receipt.nonce = nonce;
    receipt.timestamp = Clock::get()?.unix_timestamp;
    receipt.tss_signature = tss_signature;
    receipt.bump = ctx.bumps.receipt;

    // Update program state
    program_state.total_nfts_minted = program_state
        .total_nfts_minted
        .checked_add(1)
        .ok_or(UniversalNftError::ArithmeticOverflow)?;

    // Emit event
    emit!(CrossChainReceiveEvent {
        mint: ctx.accounts.mint.key(),
        recipient: ctx.accounts.recipient.key(),
        origin_chain_id,
        nonce,
        timestamp: Clock::get()?.unix_timestamp,
    });

    msg!("Successfully received cross-chain NFT: {}", ctx.accounts.mint.key());
    msg!("From chain: {}, nonce: {}", origin_chain_id, nonce);

    Ok(())
}

#[event]
pub struct CrossChainReceiveEvent {
    pub mint: Pubkey,
    pub recipient: Pubkey,
    pub origin_chain_id: u64,
    pub nonce: u64,
    pub timestamp: i64,
}