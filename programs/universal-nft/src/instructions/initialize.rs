use anchor_lang::prelude::*;
use crate::state::{ProgramState, CrossChainConfig};
use crate::error::UniversalNftError;

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + ProgramState::INIT_SPACE,
        seeds = [b"program_state"],
        bump
    )]
    pub program_state: Account<'info, ProgramState>,

    #[account(
        init,
        payer = authority,
        space = 8 + CrossChainConfig::INIT_SPACE,
        seeds = [b"cross_chain_config"],
        bump
    )]
    pub cross_chain_config: Account<'info, CrossChainConfig>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<Initialize>,
    gateway_address: Pubkey,
    tss_address: Pubkey,
    chain_id: u64,
) -> Result<()> {
    let program_state = &mut ctx.accounts.program_state;
    let cross_chain_config = &mut ctx.accounts.cross_chain_config;

    // Initialize program state
    program_state.authority = ctx.accounts.authority.key();
    program_state.is_initialized = true;
    program_state.total_nfts_minted = 0;
    program_state.cross_chain_transfers = 0;
    program_state.bump = ctx.bumps.program_state;

    // Initialize cross-chain configuration
    cross_chain_config.gateway_address = gateway_address;
    cross_chain_config.tss_address = tss_address;
    cross_chain_config.chain_id = chain_id;
    cross_chain_config.is_paused = false;
    cross_chain_config.nonce_counter = 0;
    cross_chain_config.bump = ctx.bumps.cross_chain_config;

    msg!("Universal NFT Program initialized with ZetaChain gateway: {}", gateway_address);
    msg!("TSS address: {}, Chain ID: {}", tss_address, chain_id);

    Ok(())
}
