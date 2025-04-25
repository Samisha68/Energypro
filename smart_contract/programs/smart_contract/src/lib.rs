use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, Transfer};
use std::str::FromStr;

declare_id!("2AR9XUwfsHxnNQkQU3jzMcqct55X9TUiK5TBCAxDNygB");

#[program]
pub mod energy_trading {
    use super::*;

    pub fn process_purchase(
        ctx: Context<ProcessPurchase>,
        listing_id: String,
        units: u64,
        price_per_unit: u64,
    ) -> Result<()> {
        // Calculate the payment amount
        let payment_amount = units
            .checked_mul(price_per_unit)
            .ok_or(ErrorCode::CalculationError)?;

        // Transfer tokens from buyer to the fixed payment receiver
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.buyer_token_account.to_account_info(),
                    to: ctx.accounts.payment_receiver_token_account.to_account_info(),
                    authority: ctx.accounts.buyer.to_account_info(),
                },
            ),
            payment_amount,
        )?;

        // Emit an event with the purchase details
        emit!(PurchaseEvent {
            listing_id,
            buyer: ctx.accounts.buyer.key(),
            payment_receiver: ctx.accounts.payment_receiver.key(),
            units,
            price_per_unit,
            total_amount: payment_amount,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }
}

#[derive(Accounts)]
pub struct ProcessPurchase<'info> {
    #[account(mut)]
    pub buyer: Signer<'info>,

    /// CHECK: Token account for the buyer
    #[account(mut)]
    pub buyer_token_account: UncheckedAccount<'info>,

    /// CHECK: Hardcoded payment receiver, validated below
    #[account(
        constraint = payment_receiver.key() == Pubkey::from_str("5PL4kXp3Ezz9uzn9jtLtjQfndKRNoQtgGPccM2kvvRad").unwrap() @ ErrorCode::InvalidPaymentReceiver
    )]
    pub payment_receiver: UncheckedAccount<'info>,

    /// CHECK: Token account for the payment receiver
    #[account(mut)]
    pub payment_receiver_token_account: UncheckedAccount<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Error in calculation")]
    CalculationError,

    #[msg("Invalid payment receiver")]
    InvalidPaymentReceiver,
}

#[event]
pub struct PurchaseEvent {
    pub listing_id: String,
    pub buyer: Pubkey,
    pub payment_receiver: Pubkey,
    pub units: u64,
    pub price_per_unit: u64,
    pub total_amount: u64,
    pub timestamp: i64,
}

// Dummy account to ensure non-empty accounts array in IDL
#[account]
pub struct Dummy {}
