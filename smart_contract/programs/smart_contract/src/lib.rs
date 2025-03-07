use anchor_lang::prelude::*;
use anchor_spl::{
    token::{self, Token, Transfer},
    associated_token::AssociatedToken,
};

declare_id!("71p7sfU3FKyP2hv9aVqZV1ha6ZzJ2VkReNjsGDoqtdRQ");

#[program]
pub mod bijlee_transaction {
    use super::*;

    pub fn initialize_listing(
        ctx: Context<InitializeListing>,
        listing_id: String,
        price_per_unit: u64,
        total_units: u64,
        available_units: u64,
        min_purchase: u64,
        max_purchase: u64,
        expiry_timestamp: i64,
    ) -> Result<()> {
        let listing = &mut ctx.accounts.listing;
        listing.seller = ctx.accounts.seller.key();
        listing.listing_id = listing_id.clone();
        listing.price_per_unit = price_per_unit;
        listing.total_units = total_units;
        listing.available_units = available_units;
        listing.min_purchase = min_purchase;
        listing.max_purchase = max_purchase;
        listing.is_active = true;
        listing.created_at = Clock::get()?.unix_timestamp;
        listing.expiry_timestamp = expiry_timestamp;
        listing.bump = ctx.bumps.listing;

        emit!(ListingCreated {
            listing_id,
            seller: listing.seller,
            price_per_unit,
            total_units,
            available_units,
        });

        Ok(())
    }

    pub fn process_purchase(
        ctx: Context<ProcessPurchase>,
        units: u64,
    ) -> Result<()> {
        let listing = &mut ctx.accounts.listing;
        let transaction = &mut ctx.accounts.transaction;
        
        // Validate purchase amount
        require!(units >= listing.min_purchase, BijleeError::InvalidPurchaseAmount);
        require!(units <= listing.max_purchase, BijleeError::InvalidPurchaseAmount);
        require!(units <= listing.available_units, BijleeError::InsufficientUnits);
        
        // Calculate total amount
        let total_amount = units * listing.price_per_unit;
        
        // Transfer tokens directly from buyer to seller
        let transfer_instruction = Transfer {
            from: ctx.accounts.buyer_token_account.to_account_info(),
            to: ctx.accounts.seller_token_account.to_account_info(),
            authority: ctx.accounts.buyer.to_account_info(),
        };

        let cpi_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            transfer_instruction,
        );

        token::transfer(cpi_ctx, total_amount)?;
        
        // Update listing's available units
        listing.available_units = listing.available_units.checked_sub(units)
            .ok_or(BijleeError::InsufficientUnits)?;
        
        // Record transaction details
        transaction.buyer = ctx.accounts.buyer.key();
        transaction.seller = listing.seller;
        transaction.amount = total_amount;
        transaction.units = units;
        transaction.is_completed = true;
        transaction.bump = ctx.bumps.transaction;

        emit!(PurchaseCompletedEvent {
            listing_id: listing.listing_id.clone(),
            buyer: transaction.buyer,
            seller: transaction.seller,
            units_purchased: units,
            total_amount,
            network_fee: 0, // No network fee for direct transfers
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    pub fn cancel_transaction(ctx: Context<CancelTransaction>) -> Result<()> {
        let escrow_bump = ctx.accounts.transaction.bump;
        let transaction_id = ctx.accounts.transaction.transaction_id.clone();
        let transfer_amount = ctx.accounts.transaction.amount;

        let seeds = &[
            b"transaction",
            transaction_id.as_bytes(),
            &[escrow_bump],
        ];
        let signer_seeds = &[&seeds[..]];

        let transfer_instruction = Transfer {
            from: ctx.accounts.escrow_wallet.to_account_info(),
            to: ctx.accounts.buyer_token_account.to_account_info(),
            authority: ctx.accounts.transaction.to_account_info(),
        };

        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            transfer_instruction,
            signer_seeds,
        );

        token::transfer(cpi_ctx, transfer_amount)?;

        let transaction = &mut ctx.accounts.transaction;
        transaction.is_canceled = true;

        emit!(TransactionCanceled {
            transaction_id,
            buyer: transaction.buyer,
            seller: transaction.seller,
            amount: transfer_amount,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(listing_id: String)]
pub struct InitializeListing<'info> {
    #[account(mut)]
    pub seller: Signer<'info>,
    
    #[account(
        init,
        payer = seller,
        space = 8 + ListingAccount::space(),
        seeds = [b"listing", seller.key().as_ref(), listing_id.as_bytes()],
        bump
    )]
    pub listing: Account<'info, ListingAccount>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(units: u64)]
pub struct ProcessPurchase<'info> {
    #[account(mut)]
    pub buyer: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"listing", listing.seller.as_ref(), listing.listing_id.as_bytes()],
        bump = listing.bump,
        constraint = listing.is_active @ BijleeError::ListingInactive,
        constraint = listing.available_units >= units @ BijleeError::InsufficientUnits,
    )]
    pub listing: Account<'info, ListingAccount>,
    
    #[account(
        init,
        payer = buyer,
        space = 8 + TransactionAccount::space(),
        seeds = [b"transaction", buyer.key().as_ref(), listing.listing_id.as_bytes()],
        bump
    )]
    pub transaction: Account<'info, TransactionAccount>,
    
    /// CHECK: Token account verified by token program
    #[account(mut)]
    pub buyer_token_account: UncheckedAccount<'info>,
    
    /// CHECK: Token account verified by token program
    #[account(mut)]
    pub seller_token_account: UncheckedAccount<'info>,
    
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CancelTransaction<'info> {
    #[account(mut)]
    pub buyer: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"transaction", transaction.transaction_id.as_bytes()],
        bump = transaction.bump,
        constraint = !transaction.is_completed @ BijleeError::AlreadyCompleted,
        constraint = !transaction.is_canceled @ BijleeError::AlreadyCanceled,
        constraint = buyer.key() == transaction.buyer @ BijleeError::UnauthorizedBuyer
    )]
    pub transaction: Account<'info, TransactionAccount>,
    
    /// CHECK: Token account verified by token program
    #[account(mut)]
    pub escrow_wallet: UncheckedAccount<'info>,
    
    /// CHECK: Token account verified by token program
    #[account(mut)]
    pub buyer_token_account: UncheckedAccount<'info>,
    
    pub token_program: Program<'info, Token>,
}

#[account]
pub struct TransactionAccount {
    pub buyer: Pubkey,
    pub seller: Pubkey,
    pub amount: u64,
    pub units: u64,
    pub is_completed: bool,
    pub bump: u8,
}

impl TransactionAccount {
    pub fn space() -> usize {
        32 + // buyer pubkey
        32 + // seller pubkey
        8 +  // amount
        8 +  // units
        1 +  // is_completed
        1    // bump
    }
}

#[account]
pub struct ListingAccount {
    pub seller: Pubkey,
    pub listing_id: String,
    pub price_per_unit: u64,
    pub total_units: u64,
    pub available_units: u64,
    pub min_purchase: u64,
    pub max_purchase: u64,
    pub is_active: bool,
    pub created_at: i64,
    pub expiry_timestamp: i64,
    pub bump: u8,
}

impl ListingAccount {
    pub fn space() -> usize {
        32 + // seller pubkey
        36 + // listing_id (max 32 chars + 4 bytes for string length)
        8 +  // price_per_unit
        8 +  // total_units
        8 +  // available_units
        8 +  // min_purchase
        8 +  // max_purchase
        1 +  // is_active
        8 +  // created_at
        8 +  // expiry_timestamp
        1    // bump
    }
}

#[error_code]
pub enum BijleeError {
    #[msg("This transaction has already been completed")]
    AlreadyCompleted,
    
    #[msg("This transaction has already been canceled")]
    AlreadyCanceled,
    
    #[msg("Only the buyer can cancel this transaction")]
    UnauthorizedBuyer,
    
    #[msg("Only the seller can complete this transaction")]
    UnauthorizedSeller,
    
    #[msg("Purchase amount is less than minimum allowed")]
    InvalidPurchaseAmount,
    
    #[msg("Purchase amount exceeds maximum allowed")]
    PurchaseAmountExceeded,
    
    #[msg("Not enough units available")]
    InsufficientUnits,
    
    #[msg("Listing is not active")]
    ListingInactive,
}

#[event]
pub struct TransactionInitialized {
    pub transaction_id: String,
    pub buyer: Pubkey,
    pub seller: Pubkey,
    pub amount: u64,
    pub timestamp: i64,
}

#[event]
pub struct TransactionCompleted {
    pub transaction_id: String,
    pub buyer: Pubkey,
    pub seller: Pubkey,
    pub amount: u64,
    pub timestamp: i64,
}

#[event]
pub struct TransactionCanceled {
    pub transaction_id: String,
    pub buyer: Pubkey,
    pub seller: Pubkey,
    pub amount: u64,
    pub timestamp: i64,
}

#[event]
pub struct ListingCreated {
    pub listing_id: String,
    pub seller: Pubkey,
    pub price_per_unit: u64,
    pub total_units: u64,
    pub available_units: u64,
}

#[event]
pub struct PurchaseCompletedEvent {
    pub listing_id: String,
    pub buyer: Pubkey,
    pub seller: Pubkey,
    pub units_purchased: u64,
    pub total_amount: u64,
    pub network_fee: u64,
    pub timestamp: i64,
}