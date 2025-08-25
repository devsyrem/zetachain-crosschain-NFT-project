use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct CrossChainConfig {
    pub gateway_address: Pubkey,
    pub tss_address: Pubkey,
    pub chain_id: u64,
    pub is_paused: bool,
    pub nonce_counter: u64,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct CrossChainTransfer {
    pub mint: Pubkey,
    pub original_owner: Pubkey,
    pub destination_chain_id: u64,
    #[max_len(64)]
    pub recipient_address: Vec<u8>,
    pub nonce: u64,
    pub timestamp: i64,
    pub status: u8, // 0: Pending, 1: Completed, 2: Failed
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct CrossChainReceipt {
    pub origin_chain_id: u64,
    #[max_len(64)]
    pub origin_tx_hash: Vec<u8>,
    pub mint: Pubkey,
    pub recipient: Pubkey,
    #[max_len(64)]
    pub original_owner: Vec<u8>,
    pub nonce: u64,
    pub timestamp: i64,
    #[max_len(128)]
    pub tss_signature: Vec<u8>,
    pub bump: u8,
}
