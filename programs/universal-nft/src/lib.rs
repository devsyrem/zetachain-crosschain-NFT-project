use anchor_lang::prelude::*;

pub mod instructions;
pub mod state;
pub mod error;
pub mod utils;

use instructions::*;

declare_id!("UnivNFT111111111111111111111111111111111111");

#[program]
pub mod universal_nft {
    use super::*;

    /// Initialize the universal NFT program with ZetaChain gateway integration
    pub fn initialize(
        ctx: Context<Initialize>,
        gateway_address: Pubkey,
        tss_address: Pubkey,
        chain_id: u64,
    ) -> Result<()> {
        instructions::initialize::handler(ctx, gateway_address, tss_address, chain_id)
    }

    /// Mint a new NFT that can be transferred cross-chain
    pub fn mint_nft(
        ctx: Context<MintNft>,
        metadata_uri: String,
        name: String,
        symbol: String,
        cross_chain_enabled: bool,
    ) -> Result<()> {
        instructions::mint_nft::handler(ctx, metadata_uri, name, symbol, cross_chain_enabled)
    }

    /// Initiate a cross-chain transfer to ZetaChain or other supported chains
    pub fn cross_chain_transfer(
        ctx: Context<InitiateCrossChainTransfer>,
        destination_chain_id: u64,
        recipient_address: Vec<u8>,
        nonce: u64,
    ) -> Result<()> {
        instructions::cross_chain_transfer::handler(ctx, destination_chain_id, recipient_address, nonce)
    }

    /// Receive an NFT from another chain via ZetaChain gateway
    pub fn receive_cross_chain(
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
        instructions::receive_cross_chain::handler(
            ctx,
            origin_chain_id,
            origin_tx_hash,
            metadata_uri,
            name,
            symbol,
            original_owner,
            tss_signature,
            nonce,
        )
    }

    /// Verify NFT ownership for cross-chain operations
    pub fn verify_ownership(
        ctx: Context<VerifyOwnership>,
        token_mint: Pubkey,
    ) -> Result<()> {
        instructions::verify_ownership::handler(ctx, token_mint)
    }
}
