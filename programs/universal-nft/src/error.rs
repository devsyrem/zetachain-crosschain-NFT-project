use anchor_lang::prelude::*;

#[error_code]
pub enum UniversalNftError {
    #[msg("Program not initialized")]
    ProgramNotInitialized,

    #[msg("Cross-chain functionality is paused")]
    CrossChainPaused,

    #[msg("Cross-chain transfers not enabled for this NFT")]
    CrossChainNotEnabled,

    #[msg("NFT is locked for cross-chain transfer")]
    NftLocked,

    #[msg("Insufficient token balance")]
    InsufficientTokens,

    #[msg("Invalid gateway address")]
    InvalidGateway,

    #[msg("Invalid TSS authority")]
    InvalidTssAuthority,

    #[msg("Invalid nonce - must be greater than current nonce")]
    InvalidNonce,

    #[msg("Invalid recipient address format")]
    InvalidRecipientAddress,

    #[msg("Unsupported destination chain")]
    UnsupportedChain,

    #[msg("Invalid mint account")]
    InvalidMint,

    #[msg("TSS signature verification failed")]
    InvalidTssSignature,

    #[msg("Arithmetic overflow")]
    ArithmeticOverflow,

    #[msg("Unauthorized access")]
    Unauthorized,

    #[msg("Invalid metadata URI")]
    InvalidMetadataUri,

    #[msg("Compute budget exceeded")]
    ComputeBudgetExceeded,
}
