use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Mint};
use crate::state::{ProgramState, NftMetadata};
use crate::error::UniversalNftError;

#[derive(Accounts)]
#[instruction(metadata_uri: String, name: String, symbol: String)]
pub struct MintNft<'info> {
    #[account(
        mut,
        seeds = [b"program_state"],
        bump = program_state.bump,
        constraint = program_state.is_initialized @ UniversalNftError::ProgramNotInitialized
    )]
    pub program_state: Account<'info, ProgramState>,

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
        associated_token::authority = authority,
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

    #[account(mut)]
    pub authority: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, anchor_spl::associated_token::AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn handler(
    ctx: Context<MintNft>,
    metadata_uri: String,
    name: String,
    symbol: String,
    cross_chain_enabled: bool,
) -> Result<()> {
    let program_state = &mut ctx.accounts.program_state;
    let nft_metadata = &mut ctx.accounts.nft_metadata;

    // Validate inputs
    require!(metadata_uri.len() <= 200, UniversalNftError::InvalidMetadataUri);
    require!(name.len() <= 32, UniversalNftError::InvalidMetadataUri);
    require!(symbol.len() <= 10, UniversalNftError::InvalidMetadataUri);

    // Mint 1 NFT token to the authority
    let cpi_accounts = token::MintTo {
        mint: ctx.accounts.mint.to_account_info(),
        to: ctx.accounts.token_account.to_account_info(),
        authority: ctx.accounts.authority.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
    token::mint_to(cpi_ctx, 1)?;

    // Initialize NFT metadata
    nft_metadata.mint = ctx.accounts.mint.key();
    nft_metadata.original_owner = ctx.accounts.authority.key();
    nft_metadata.current_owner = ctx.accounts.authority.key();
    nft_metadata.metadata_uri = metadata_uri;
    nft_metadata.name = name;
    nft_metadata.symbol = symbol;
    nft_metadata.cross_chain_enabled = cross_chain_enabled;
    nft_metadata.is_locked = false;
    nft_metadata.origin_chain_id = 7565164; // Solana chain ID
    nft_metadata.creation_timestamp = Clock::get()?.unix_timestamp;
    nft_metadata.bump = ctx.bumps.nft_metadata;

    // Update program state
    program_state.total_nfts_minted = program_state
        .total_nfts_minted
        .checked_add(1)
        .ok_or(UniversalNftError::ArithmeticOverflow)?;

    msg!("Successfully minted NFT: {}", ctx.accounts.mint.key());
    msg!("Cross-chain enabled: {}", cross_chain_enabled);

    Ok(())
}