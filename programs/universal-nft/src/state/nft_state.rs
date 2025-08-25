use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct ProgramState {
    pub authority: Pubkey,
    pub is_initialized: bool,
    pub total_nfts_minted: u64,
    pub cross_chain_transfers: u64,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct NftMetadata {
    pub mint: Pubkey,
    pub original_owner: Pubkey,
    pub current_owner: Pubkey,
    #[max_len(200)]
    pub metadata_uri: String,
    #[max_len(32)]
    pub name: String,
    #[max_len(10)]
    pub symbol: String,
    pub cross_chain_enabled: bool,
    pub is_locked: bool,
    pub origin_chain_id: u64,
    pub creation_timestamp: i64,
    pub bump: u8,
}
