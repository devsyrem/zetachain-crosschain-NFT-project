use anchor_lang::prelude::*;
use anchor_spl::token::{Token, TokenAccount};
use crate::state::NftMetadata;
use crate::error::UniversalNftError;

#[derive(Accounts)]
#[instruction(token_mint: Pubkey)]
pub struct VerifyOwnership<'info> {
    #[account(
        seeds = [b"nft_metadata", token_mint.as_ref()],
        bump = nft_metadata.bump
    )]
    pub nft_metadata: Account<'info, NftMetadata>,

    #[account(
        constraint = token_account.mint == token_mint,
        constraint = token_account.owner == owner.key(),
        constraint = token_account.amount >= 1 @ UniversalNftError::InsufficientTokens
    )]
    pub token_account: Account<'info, TokenAccount>,

    pub owner: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

pub fn handler(
    ctx: Context<VerifyOwnership>,
    token_mint: Pubkey,
) -> Result<()> {
    let nft_metadata = &ctx.accounts.nft_metadata;

    // Verify the mint matches
    require!(
        nft_metadata.mint == token_mint,
        UniversalNftError::InvalidMint
    );

    // Verify ownership through token account (already done in constraints)
    // The fact that we reached this point means the owner has the required tokens

    msg!("Ownership verified for mint: {}", token_mint);
    msg!("Owner: {}", ctx.accounts.owner.key());
    msg!("NFT is cross-chain enabled: {}", nft_metadata.cross_chain_enabled);
    msg!("NFT is locked: {}", nft_metadata.is_locked);

    // Emit verification event
    emit!(OwnershipVerifiedEvent {
        mint: token_mint,
        owner: ctx.accounts.owner.key(),
        cross_chain_enabled: nft_metadata.cross_chain_enabled,
        is_locked: nft_metadata.is_locked,
        timestamp: Clock::get()?.unix_timestamp,
    });

    Ok(())
}

#[event]
pub struct OwnershipVerifiedEvent {
    pub mint: Pubkey,
    pub owner: Pubkey,
    pub cross_chain_enabled: bool,
    pub is_locked: bool,
    pub timestamp: i64,
}