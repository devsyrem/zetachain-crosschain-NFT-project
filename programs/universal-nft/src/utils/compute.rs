use anchor_lang::prelude::*;
use crate::error::UniversalNftError;

/// Increase compute budget for complex operations
pub fn increase_compute_budget(units: u32) -> Result<()> {
    msg!("Requesting {} compute units", units);
    
    // Note: Compute budget is managed by the client through
    // ComputeBudgetProgram instructions in the transaction
    Ok(())
}

/// Calculate optimal compute budget based on operation type
pub fn calculate_compute_budget(operation: &str) -> u32 {
    match operation {
        "mint" => 200_000,
        "cross_chain_transfer" => 300_000,
        "receive_cross_chain" => 400_000,
        "verify_ownership" => 50_000,
        _ => 100_000,
    }
}

/// Check if compute budget is sufficient for operation
pub fn check_compute_budget(required: u32, available: u32) -> Result<()> {
    if available < required {
        return Err(UniversalNftError::ComputeBudgetExceeded.into());
    }
    Ok(())
}
