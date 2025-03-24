// src/lib/bijlee-exchange.ts
import { Connection, PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress, createAssociatedTokenAccountInstruction } from '@solana/spl-token';
import * as anchor from '@project-serum/anchor';
import { Program, Idl } from '@project-serum/anchor';
import { BN } from 'bn.js';
import { WalletContextState } from '@solana/wallet-adapter-react';
// Constants
const BIJLEE_PROGRAM_ID = new PublicKey(process.env.NEXT_PUBLIC_BIJLEE_PROGRAM_ID || "71p7sfU3FKyP2hv9aVqZV1ha6ZzJ2VkReNjsGDoqtdRQ");
const BIJLEE_TOKEN_MINT = new PublicKey(process.env.NEXT_PUBLIC_BIJLEE_TOKEN_MINT || "HQbqWP4LSUYLySNXP8gRbXuKRy6bioH15CsrePQnfT86");

// Directly use your provided IDL
const BIJLEE_IDL: Idl = {
  "version": "0.1.0",
  "name": "bijlee_transaction",
  "instructions": [
    {
      "name": "initializeListing",
      "accounts": [
        {
          "name": "listing",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "seller",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "listingId",
          "type": "string"
        },
        {
          "name": "pricePerUnit",
          "type": "u64"
        },
        {
          "name": "totalUnits",
          "type": "u64"
        },
        {
          "name": "availableUnits",
          "type": "u64"
        },
        {
          "name": "minPurchase",
          "type": "u64"
        },
        {
          "name": "maxPurchase",
          "type": "u64"
        },
        {
          "name": "expiryTimestamp",
          "type": "i64"
        }
      ]
    },
    {
      "name": "initializeTransaction",
      "accounts": [
        {
          "name": "buyer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "seller",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "transaction",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "buyerTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "bijleeMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "escrowWallet",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "transactionId",
          "type": "string"
        }
      ]
    },
    {
      "name": "completeTransaction",
      "accounts": [
        {
          "name": "seller",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "transaction",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "escrowWallet",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "sellerTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "cancelTransaction",
      "accounts": [
        {
          "name": "buyer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "transaction",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "escrowWallet",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "buyerTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "processPurchase",
      "accounts": [
        {
          "name": "buyer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "listing",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "transaction",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "buyerTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "sellerTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "units",
          "type": "u64"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "ListingAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "seller",
            "type": "publicKey"
          },
          {
            "name": "listingId",
            "type": "string"
          },
          {
            "name": "pricePerUnit",
            "type": "u64"
          },
          {
            "name": "totalUnits",
            "type": "u64"
          },
          {
            "name": "availableUnits",
            "type": "u64"
          },
          {
            "name": "minPurchase",
            "type": "u64"
          },
          {
            "name": "maxPurchase",
            "type": "u64"
          },
          {
            "name": "isActive",
            "type": "bool"
          },
          {
            "name": "createdAt",
            "type": "i64"
          },
          {
            "name": "expiryTimestamp",
            "type": "i64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "TransactionAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "buyer",
            "type": "publicKey"
          },
          {
            "name": "seller",
            "type": "publicKey"
          },
          {
            "name": "escrowWallet",
            "type": "publicKey"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "transactionId",
            "type": "string"
          },
          {
            "name": "isCompleted",
            "type": "bool"
          },
          {
            "name": "isCanceled",
            "type": "bool"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "AlreadyCompleted",
      "msg": "This transaction has already been completed"
    },
    {
      "code": 6001,
      "name": "AlreadyCanceled",
      "msg": "This transaction has already been canceled"
    },
    {
      "code": 6002,
      "name": "UnauthorizedBuyer",
      "msg": "Only the buyer can cancel this transaction"
    },
    {
      "code": 6003,
      "name": "UnauthorizedSeller",
      "msg": "Only the seller can complete this transaction"
    }
  ],
  "events": [
    {
      "name": "ListingCreated",
      "fields": [
        {
          "name": "listingId",
          "type": "string",
          "index": false
        },
        {
          "name": "seller",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "pricePerUnit",
          "type": "u64",
          "index": false
        },
        {
          "name": "totalUnits",
          "type": "u64",
          "index": false
        },
        {
          "name": "availableUnits",
          "type": "u64",
          "index": false
        }
      ]
    },
    {
      "name": "TransactionInitialized",
      "fields": [
        {
          "name": "transactionId",
          "type": "string",
          "index": false
        },
        {
          "name": "buyer",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "seller",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "amount",
          "type": "u64",
          "index": false
        },
        {
          "name": "timestamp",
          "type": "i64",
          "index": false
        }
      ]
    },
    {
      "name": "TransactionCompleted",
      "fields": [
        {
          "name": "transactionId",
          "type": "string",
          "index": false
        },
        {
          "name": "buyer",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "seller",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "amount",
          "type": "u64",
          "index": false
        },
        {
          "name": "timestamp",
          "type": "i64",
          "index": false
        }
      ]
    },
    {
      "name": "TransactionCanceled",
      "fields": [
        {
          "name": "transactionId",
          "type": "string",
          "index": false
        },
        {
          "name": "buyer",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "seller",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "amount",
          "type": "u64",
          "index": false
        },
        {
          "name": "timestamp",
          "type": "i64",
          "index": false
        }
      ]
    }
  ]
};

// Types for function parameters
export interface WalletAdapter {
  publicKey: PublicKey | null;
  signTransaction: (transaction: Transaction) => Promise<Transaction>;
  signAllTransactions: (transactions: Transaction[]) => Promise<Transaction[]>;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  tx?: string;
  error?: string;
}

// Safe PublicKey creation helper function
function safePublicKey(address: string): PublicKey {
  try {
    // Check if the input is a valid public key format
    if (typeof address !== 'string') {
      console.error('Invalid public key input type:', typeof address);
      throw new Error('Invalid public key input type');
    }
    
    // Create the public key
    return new PublicKey(address);
  } catch (error) {
    console.error('Error creating PublicKey:', error);
    throw new Error(`Invalid public key: ${address}`);
  }
}

// Initialize Anchor provider and program
function getProvider(connection: Connection, wallet: WalletAdapter): anchor.AnchorProvider {
  const provider = new anchor.AnchorProvider(
    connection, 
    wallet as any, 
    { commitment: 'confirmed' }
  );
  return provider;
}

// Initialize the Bijlee Exchange Program
export function getProgram(connection: Connection, wallet: WalletAdapter): Program {
  const provider = getProvider(connection, wallet);
  return new Program(BIJLEE_IDL, BIJLEE_PROGRAM_ID, provider);
}

// Process a purchase transaction
export async function processPurchase(
  wallet: WalletContextState,
  connection: Connection,
  listingPubkey: string,
  listingId: string,
  sellerPubkey: string,
  units: number,
  pricePerUnit: number // Price in rupees
): Promise<ApiResponse<{ transactionAccount: string }>> {
  try {
    if (!wallet || !wallet.publicKey) {
      throw new Error("Wallet not connected");
    }

    // Add validation for buyer/seller being the same
    if (wallet.publicKey.toString() === sellerPubkey) {
      throw new Error("Buyer and seller cannot be the same wallet for this transaction");
    }

    console.log('Transaction Details:');
    console.log('- Buyer wallet:', wallet.publicKey.toString());
    console.log('- Seller wallet:', sellerPubkey);
    console.log('- Listing ID:', listingId);
    console.log('- Units:', units);
    console.log('- Price per unit:', pricePerUnit);
    
    // Validate seller public key
    let sellerPublicKey;
    try {
      sellerPublicKey = safePublicKey(sellerPubkey);
      console.log('Seller public key validated:', sellerPublicKey.toString());
    } catch (error) {
      throw new Error(`Invalid seller address: ${error instanceof Error ? error.message : String(error)}`);
    }
    
    const program = getProgram(connection, wallet as any);
    const buyer = wallet.publicKey;
    
    // Calculate PDA for transaction account
    const [transactionAccount] = await PublicKey.findProgramAddress(
      [
        Buffer.from('transaction'),
        buyer.toBuffer(),
        Buffer.from(listingId),
      ],
      program.programId
    );
    
    console.log('Transaction PDA:', transactionAccount.toString());
    
    // Calculate the amount in tokens (1 rupee = 1 token)
    const amount = new BN(units * pricePerUnit * 1_000_000_000); // Convert to lamports (9 decimal places)
    console.log('Amount in tokens:', units * pricePerUnit);
    
    // Get buyer's token account
    let buyerTokenAccount;
    try {
      buyerTokenAccount = await getAssociatedTokenAddress(
        BIJLEE_TOKEN_MINT,
        buyer
      );
      console.log('Buyer token account:', buyerTokenAccount.toString());

      // Check if buyer's token account exists
      const buyerTokenAccountInfo = await connection.getAccountInfo(buyerTokenAccount);
      if (!buyerTokenAccountInfo) {
        throw new Error('Buyer token account does not exist. Please create it first.');
      }

      // Check buyer's token balance
      const buyerTokenBalance = await connection.getTokenAccountBalance(buyerTokenAccount);
      const requiredBalance = amount.toNumber();
      if (buyerTokenBalance.value.uiAmount! < requiredBalance / 1_000_000_000) {
        throw new Error(`Insufficient token balance. Required: ${requiredBalance / 1_000_000_000}, Available: ${buyerTokenBalance.value.uiAmount}`);
      }
    } catch (error) {
      console.error('Error checking buyer token account:', error);
      throw new Error('Failed to validate buyer token account: ' + (error instanceof Error ? error.message : String(error)));
    }

    // Get seller's token account
    let sellerTokenAccount;
    try {
      sellerTokenAccount = await getAssociatedTokenAddress(
        BIJLEE_TOKEN_MINT,
        sellerPublicKey
      );
      console.log('Seller token account:', sellerTokenAccount.toString());

      // Check if seller's token account exists
      const sellerTokenAccountInfo = await connection.getAccountInfo(sellerTokenAccount);
      if (!sellerTokenAccountInfo) {
        throw new Error(
          'Seller has not set up their BIJLEE token account yet. ' +
          'Please ask the seller to create their token account before proceeding with the purchase.'
        );
      }
    } catch (error) {
      console.error('Error checking seller token account:', error);
      throw new Error('Failed to validate seller token account: ' + (error instanceof Error ? error.message : String(error)));
    }

    // Get listing account
    const [listingAccount] = await PublicKey.findProgramAddress(
      [
        Buffer.from('listing'),
        sellerPublicKey.toBuffer(),
        Buffer.from(listingId),
      ],
      program.programId
    );

    // Process the purchase
    try {
      console.log('Processing purchase on-chain...');
      
      const tx = await program.methods
        .processPurchase(new BN(units))
        .accounts({
          buyer,
          listing: listingAccount,
          transaction: transactionAccount,
          buyerTokenAccount,
          sellerTokenAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log('Purchase completed! Signature:', tx);
      return {
        success: true,
        data: { transactionAccount: transactionAccount.toString() },
        tx
      };
    } catch (error) {
      console.error('Error processing purchase:', error);
      throw new Error("Failed to process purchase: " + (error instanceof Error ? error.message : String(error)));
    }
  } catch (error) {
    console.error('Error in processPurchase:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

// Complete a transaction (for sellers)
export async function completeTransaction(
  wallet: WalletAdapter,
  connection: Connection,
  transactionAddress: string
): Promise<ApiResponse<object>> {
  try {
    if (!wallet || !wallet.publicKey) {
      throw new Error("Wallet not connected");
    }

    const program = getProgram(connection, wallet);
    const seller = wallet.publicKey;
    
    // Transaction account
    const transactionAccount = safePublicKey(transactionAddress);
    
    // Get seller's token account
    const sellerTokenAccount = await getAssociatedTokenAddress(
      BIJLEE_TOKEN_MINT,
      seller
    );
    
    // Get escrow token account
    const escrowWallet = await getAssociatedTokenAddress(
      BIJLEE_TOKEN_MINT,
      transactionAccount,
      true // allowOwnerOffCurve
    );
    
    try {
      // Try the camelCase version first
      try {
        // Call the complete_transaction instruction
        const tx = await program.methods
          .completeTransaction()
          .accounts({
            seller: seller,
            transaction: transactionAccount,
            escrowWallet: escrowWallet,
            sellerTokenAccount: sellerTokenAccount,
            tokenProgram: TOKEN_PROGRAM_ID,
          })
          .rpc();
        
        return {
          success: true,
          tx
        };
      } catch {
        // Try the snake_case version if camelCase fails
        console.log('Trying snake_case method name as fallback');
        
        const tx = await program.methods
          .complete_transaction()
          .accounts({
            seller: seller,
            transaction: transactionAccount,
            escrowWallet: escrowWallet,
            sellerTokenAccount: sellerTokenAccount,
            tokenProgram: TOKEN_PROGRAM_ID,
          })
          .rpc();
        
        return {
          success: true,
          tx
        };
      }
    } catch (error) {
      console.error('Error completing transaction:', error);
      throw new Error("Failed to complete transaction: " + (error instanceof Error ? error.message : String(error)));
    }
  } catch (error) {
    console.error('Error in completeTransaction:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

// Cancel a transaction (for buyers)
export async function cancelTransaction(
  wallet: WalletAdapter,
  connection: Connection,
  transactionAddress: string
): Promise<ApiResponse<object>> {
  try {
    if (!wallet || !wallet.publicKey) {
      throw new Error("Wallet not connected");
    }

    const program = getProgram(connection, wallet);
    const buyer = wallet.publicKey;
    
    // Transaction account
    const transactionAccount = safePublicKey(transactionAddress);
    
    // Get buyer's token account
    const buyerTokenAccount = await getAssociatedTokenAddress(
      BIJLEE_TOKEN_MINT,
      buyer
    );
    
    // Get escrow token account
    const escrowWallet = await getAssociatedTokenAddress(
      BIJLEE_TOKEN_MINT,
      transactionAccount,
      true // allowOwnerOffCurve
    );
    
    try {
      // Try the camelCase version first
      try {
        // Call the cancel_transaction instruction
        const tx = await program.methods
          .cancelTransaction()
          .accounts({
            buyer: buyer,
            transaction: transactionAccount,
            escrowWallet: escrowWallet,
            buyerTokenAccount: buyerTokenAccount,
            tokenProgram: TOKEN_PROGRAM_ID,
          })
          .rpc();
        
        return {
          success: true,
          tx
        };
      } catch {
        // Try the snake_case version if camelCase fails
        console.log('Trying snake_case method name as fallback');
        
        const tx = await program.methods
          .cancel_transaction()
          .accounts({
            buyer: buyer,
            transaction: transactionAccount,
            escrowWallet: escrowWallet,
            buyerTokenAccount: buyerTokenAccount,
            tokenProgram: TOKEN_PROGRAM_ID,
          })
          .rpc();
        
        return {
          success: true,
          tx
        };
      }
    } catch (error) {
      console.error('Error canceling transaction:', error);
      throw new Error("Failed to cancel transaction: " + (error instanceof Error ? error.message : String(error)));
    }
  } catch (error) {
    console.error('Error in cancelTransaction:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

// Create a token account for sellers
export async function createSellerTokenAccount(
  wallet: WalletAdapter,
  connection: Connection,
  sellerWalletAddress: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!wallet || !wallet.publicKey) {
      throw new Error('Wallet not connected');
    }

    // Validate seller wallet address
    let sellerPublicKey: PublicKey;
    try {
      sellerPublicKey = new PublicKey(sellerWalletAddress);
    } catch (error) {
      throw new Error(`Invalid seller address: ${error instanceof Error ? error.message : 'Invalid public key'}`);
    }

    // Get the seller's token account address
    const sellerTokenAccount = await getAssociatedTokenAddress(
      BIJLEE_TOKEN_MINT,
      sellerPublicKey
    );

    // Check if the token account already exists
    try {
      await connection.getTokenAccountBalance(sellerTokenAccount);
      return { success: true }; // Token account already exists
    } catch {
      // Token account doesn't exist, proceed with creation
    }

    // Create the transaction
    const transaction = new Transaction();

    // Add the createAssociatedTokenAccount instruction
    transaction.add(
      createAssociatedTokenAccountInstruction(
        wallet.publicKey, // payer
        sellerTokenAccount, // ata
        sellerPublicKey, // owner
        BIJLEE_TOKEN_MINT // mint
      )
    );

    // Get a recent blockhash with higher commitment level
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = wallet.publicKey;

    // Sign and send the transaction
    const signedTx = await wallet.signTransaction(transaction);
    const signature = await connection.sendRawTransaction(signedTx.serialize(), {
      skipPreflight: false,
      preflightCommitment: 'confirmed'
    });
    
    // Use a more reliable confirmation strategy
    const confirmation = await connection.confirmTransaction({
      blockhash,
      lastValidBlockHeight,
      signature
    }, 'confirmed');
    
    if (confirmation.value.err) {
      throw new Error(`Transaction failed: ${confirmation.value.err.toString()}`);
    }

    return { success: true };
  } catch (error) {
    console.error('Error creating seller token account:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error creating token account'
    };
  }
}

// Initialize a listing on the Solana blockchain
export async function initializeListingOnChain(
  wallet: WalletAdapter,
  connection: Connection,
  listingId: string,
  pricePerUnit: number,
  availableUnits: number
): Promise<ApiResponse<{ listingAccount: string; sellerAddress: string }>> {
  try {
    if (!wallet || !wallet.publicKey) {
      throw new Error("Wallet not connected");
    }

    const seller = wallet.publicKey;
    const program = getProgram(connection, wallet);
    
    // Calculate PDA for listing account
    const [listingAccount] = await PublicKey.findProgramAddress(
      [
        Buffer.from('listing'),
        seller.toBuffer(),
        Buffer.from(listingId),
      ],
      program.programId
    );
    
    console.log('Initializing listing account:', listingAccount.toString());
    console.log('Seller (connected wallet):', seller.toString());
    console.log('Listing ID:', listingId);
    console.log('Price per unit:', pricePerUnit);
    console.log('Available units:', availableUnits);
    
    // Convert price to lamports (9 decimal places)
    const price = new BN(pricePerUnit * 1_000_000_000);
    
    // Initialize the listing on-chain
    try {
      const tx = await program.methods
        .initializeListing(
          price,
          new BN(availableUnits)
        )
        .accounts({
          seller,
          listing: listingAccount,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();
      
      console.log('Listing initialized on-chain. Transaction signature:', tx);
      
      return {
        success: true,
        data: { 
          listingAccount: listingAccount.toString(),
          sellerAddress: seller.toString() // Return the seller address used
        },
        tx
      };
    } catch (error) {
      console.error('Error initializing listing on-chain:', error);
      throw new Error('Failed to initialize listing on blockchain: ' + (error instanceof Error ? error.message : String(error)));
    }
  } catch (error) {
    console.error('Error in initializeListingOnChain:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error initializing listing'
    };
  }
}

// Check if a listing is initialized on the blockchain
export async function checkListingInitialized(
  connection: Connection,
  listingId: string,
  sellerWalletAddress: string
): Promise<boolean> {
  try {
    // Validate seller public key
    let sellerPublicKey;
    try {
      sellerPublicKey = safePublicKey(sellerWalletAddress);
    } catch (error) {
      console.error('Invalid seller address:', error);
      return false;
    }
    
    // Calculate PDA for listing account
    const programId = new PublicKey(BIJLEE_PROGRAM_ID);
    const [listingAccount] = await PublicKey.findProgramAddress(
      [
        Buffer.from('listing'),
        sellerPublicKey.toBuffer(),
        Buffer.from(listingId),
      ],
      programId
    );
    
    // Check if the account exists
    const accountInfo = await connection.getAccountInfo(listingAccount);
    return accountInfo !== null;
  } catch (error) {
    console.error('Error checking if listing is initialized:', error);
    return false;
  }
}