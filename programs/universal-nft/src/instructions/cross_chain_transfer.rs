use anchor_lang::prelude::*;
use anchor_spl::token::{Token, TokenAccount};
use crate::state::{ProgramState, CrossChainConfig, NftMetadata, CrossChainTransfer};
use crate::error::UniversalNftError;

#[derive(Accounts)]
#[instruction(destination_chain_id: u64, recipient_address: Vec<u8>, nonce: u64)]
pub struct InitiateCrossChainTransfer<'info> {
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
        mut,
        seeds = [b"nft_metadata", mint.key().as_ref()],
        bump = nft_metadata.bump,
        constraint = nft_metadata.cross_chain_enabled @ UniversalNftError::CrossChainNotEnabled,
        constraint = !nft_metadata.is_locked @ UniversalNftError::NftLocked
    )]
    pub nft_metadata: Account<'info, NftMetadata>,

    #[account(
        init,
        payer = owner,
        space = 8 + CrossChainTransfer::INIT_SPACE,
        seeds = [b"cross_chain_transfer", mint.key().as_ref(), nonce.to_le_bytes().as_ref()],
        bump
    )]
    pub transfer_record: Account<'info, CrossChainTransfer>,

    /// CHECK: Mint account validated by token account constraint
    pub mint: UncheckedAccount<'info>,

    #[account(
        constraint = token_account.mint == mint.key(),
        constraint = token_account.owner == owner.key(),
        constraint = token_account.amount >= 1 @ UniversalNftError::InsufficientTokens
    )]
    pub token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub owner: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<InitiateCrossChainTransfer>,
    destination_chain_id: u64,
    recipient_address: Vec<u8>,
    nonce: u64,
) -> Result<()> {
    let program_state = &mut ctx.accounts.program_state;
    let cross_chain_config = &ctx.accounts.cross_chain_config;
    let nft_metadata = &mut ctx.accounts.nft_metadata;
    let transfer_record = &mut ctx.accounts.transfer_record;

    // Validate nonce
    require!(
        nonce > cross_chain_config.nonce_counter,
        UniversalNftError::InvalidNonce
    );

    // Validate recipient address length
    require!(
        recipient_address.len() <= 64 && !recipient_address.is_empty(),
        UniversalNftError::InvalidRecipientAddress
    );

    // Validate destination chain (simplified - in production, maintain a list)
    require!(
        destination_chain_id > 0 && destination_chain_id != 7565164, // Not Solana
        UniversalNftError::UnsupportedChain
    );

    // Lock the NFT
    nft_metadata.is_locked = true;
    nft_metadata.current_owner = ctx.accounts.owner.key();

    // Create transfer record
    transfer_record.mint = ctx.accounts.mint.key();
    transfer_record.original_owner = ctx.accounts.owner.key();
    transfer_record.destination_chain_id = destination_chain_id;
    transfer_record.recipient_address = recipient_address.clone();
    transfer_record.nonce = nonce;
    transfer_record.timestamp = Clock::get()?.unix_timestamp;
    transfer_record.status = 0; // Pending
    transfer_record.bump = ctx.bumps.transfer_record;

    // Update program statistics
    program_state.cross_chain_transfers = program_state
        .cross_chain_transfers
        .checked_add(1)
        .ok_or(UniversalNftError::ArithmeticOverflow)?;

    // Emit event for ZetaChain gateway to pick up
    emit!(CrossChainTransferEvent {
        mint: ctx.accounts.mint.key(),
        owner: ctx.accounts.owner.key(),
        destination_chain_id,
        recipient_address,
        nonce,
        timestamp: Clock::get()?.unix_timestamp,
    });

    msg!("Cross-chain transfer initiated for mint: {}", ctx.accounts.mint.key());
    msg!("Destination chain: {}, nonce: {}", destination_chain_id, nonce);

    Ok(())
}

#[event]
pub struct CrossChainTransferEvent {
    pub mint: Pubkey,
    pub owner: Pubkey,
    pub destination_chain_id: u64,
    pub recipient_address: Vec<u8>,
    pub nonce: u64,
    pub timestamp: i64,
}