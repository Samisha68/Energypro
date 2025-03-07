// src/lib/types/bijlee_exchange.ts
export type BijleeExchange = {
    "version": "0.1.0",
    "name": "bijlee_exchange",
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
        "name": "updateListing",
        "accounts": [
          {
            "name": "listing",
            "isMut": true,
            "isSigner": false
          },
          {
            "name": "seller",
            "isMut": false,
            "isSigner": true
          }
        ],
        "args": [
          {
            "name": "pricePerUnit",
            "type": {
              "option": "u64"
            }
          },
          {
            "name": "availableUnits",
            "type": {
              "option": "u64"
            }
          },
          {
            "name": "minPurchase",
            "type": {
              "option": "u64"
            }
          },
          {
            "name": "maxPurchase",
            "type": {
              "option": "u64"
            }
          },
          {
            "name": "isActive",
            "type": {
              "option": "bool"
            }
          },
          {
            "name": "expiryTimestamp",
            "type": {
              "option": "i64"
            }
          }
        ]
      },
      {
        "name": "processPurchase",
        "accounts": [
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
            "name": "buyer",
            "isMut": true,
            "isSigner": true
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
            "name": "feeCollector",
            "isMut": true,
            "isSigner": false
          },
          {
            "name": "tokenMint",
            "isMut": false,
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
      },
      {
        "name": "cancelListing",
        "accounts": [
          {
            "name": "listing",
            "isMut": true,
            "isSigner": false
          },
          {
            "name": "seller",
            "isMut": false,
            "isSigner": true
          }
        ],
        "args": []
      }
    ],
    "accounts": [
      {
        "name": "listing",
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
            }
          ]
        }
      },
      {
        "name": "transaction",
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
              "name": "listingId",
              "type": "string"
            },
            {
              "name": "unitsPurchased",
              "type": "u64"
            },
            {
              "name": "pricePerUnit",
              "type": "u64"
            },
            {
              "name": "totalAmount",
              "type": "u64"
            },
            {
              "name": "networkFee",
              "type": "u64"
            },
            {
              "name": "timestamp",
              "type": "i64"
            },
            {
              "name": "status",
              "type": "u8"
            }
          ]
        }
      }
    ],
    "events": [
      {
        "name": "ListingCreatedEvent",
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
        "name": "ListingUpdatedEvent",
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
            "name": "availableUnits",
            "type": "u64",
            "index": false
          },
          {
            "name": "isActive",
            "type": "bool",
            "index": false
          }
        ]
      },
      {
        "name": "ListingCancelledEvent",
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
            "name": "timestamp",
            "type": "i64",
            "index": false
          }
        ]
      },
      {
        "name": "PurchaseCompletedEvent",
        "fields": [
          {
            "name": "listingId",
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
            "name": "unitsPurchased",
            "type": "u64",
            "index": false
          },
          {
            "name": "totalAmount",
            "type": "u64",
            "index": false
          },
          {
            "name": "networkFee",
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
    ],
    "errors": [
      {
        "code": 6000,
        "name": "NotAuthorized",
        "msg": "You are not authorized to perform this action"
      },
      {
        "code": 6001,
        "name": "InvalidUnitAmount",
        "msg": "Invalid unit amount"
      },
      {
        "code": 6002,
        "name": "InvalidPurchaseAmount",
        "msg": "Invalid purchase amount"
      },
      {
        "code": 6003,
        "name": "InvalidPrice",
        "msg": "Invalid price"
      },
      {
        "code": 6004,
        "name": "InvalidExpiry",
        "msg": "Invalid expiry timestamp"
      },
      {
        "code": 6005,
        "name": "ListingNotActive",
        "msg": "Listing is not active"
      },
      {
        "code": 6006,
        "name": "ListingExpired",
        "msg": "Listing has expired"
      },
      {
        "code": 6007,
        "name": "BelowMinimumPurchase",
        "msg": "Purchase amount is below minimum"
      },
      {
        "code": 6008,
        "name": "AboveMaximumPurchase",
        "msg": "Purchase amount is above maximum"
      },
      {
        "code": 6009,
        "name": "InsufficientUnitsAvailable",
        "msg": "Insufficient units available"
      },
      {
        "code": 6010,
        "name": "InvalidTokenAccount",
        "msg": "Invalid token account"
      },
      {
        "code": 6011,
        "name": "InvalidTokenMint",
        "msg": "Invalid token mint"
      },
      {
        "code": 6012,
        "name": "CalculationError",
        "msg": "Calculation error"
      }
    ]
  };
  
  export const IDL: BijleeExchange = {
    "version": "0.1.0",
    "name": "bijlee_exchange",
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
        "name": "updateListing",
        "accounts": [
          {
            "name": "listing",
            "isMut": true,
            "isSigner": false
          },
          {
            "name": "seller",
            "isMut": false,
            "isSigner": true
          }
        ],
        "args": [
          {
            "name": "pricePerUnit",
            "type": {
              "option": "u64"
            }
          },
          {
            "name": "availableUnits",
            "type": {
              "option": "u64"
            }
          },
          {
            "name": "minPurchase",
            "type": {
              "option": "u64"
            }
          },
          {
            "name": "maxPurchase",
            "type": {
              "option": "u64"
            }
          },
          {
            "name": "isActive",
            "type": {
              "option": "bool"
            }
          },
          {
            "name": "expiryTimestamp",
            "type": {
              "option": "i64"
            }
          }
        ]
      },
      {
        "name": "processPurchase",
        "accounts": [
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
            "name": "buyer",
            "isMut": true,
            "isSigner": true
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
            "name": "feeCollector",
            "isMut": true,
            "isSigner": false
          },
          {
            "name": "tokenMint",
            "isMut": false,
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
      },
      {
        "name": "cancelListing",
        "accounts": [
          {
            "name": "listing",
            "isMut": true,
            "isSigner": false
          },
          {
            "name": "seller",
            "isMut": false,
            "isSigner": true
          }
        ],
        "args": []
      }
    ],
    "accounts": [
      {
        "name": "listing",
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
            }
          ]
        }
      },
      {
        "name": "transaction",
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
              "name": "listingId",
              "type": "string"
            },
            {
              "name": "unitsPurchased",
              "type": "u64"
            },
            {
              "name": "pricePerUnit",
              "type": "u64"
            },
            {
              "name": "totalAmount",
              "type": "u64"
            },
            {
              "name": "networkFee",
              "type": "u64"
            },
            {
              "name": "timestamp",
              "type": "i64"
            },
            {
              "name": "status",
              "type": "u8"
            }
          ]
        }
      }
    ],
    "events": [
      {
        "name": "ListingCreatedEvent",
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
        "name": "ListingUpdatedEvent",
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
            "name": "availableUnits",
            "type": "u64",
            "index": false
          },
          {
            "name": "isActive",
            "type": "bool",
            "index": false
          }
        ]
      },
      {
        "name": "ListingCancelledEvent",
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
            "name": "timestamp",
            "type": "i64",
            "index": false
          }
        ]
      },
      {
        "name": "PurchaseCompletedEvent",
        "fields": [
          {
            "name": "listingId",
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
            "name": "unitsPurchased",
            "type": "u64",
            "index": false
          },
          {
            "name": "totalAmount",
            "type": "u64",
            "index": false
          },
          {
            "name": "networkFee",
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
    ],
    "errors": [
      {
        "code": 6000,
        "name": "NotAuthorized",
        "msg": "You are not authorized to perform this action"
      },
      {
        "code": 6001,
        "name": "InvalidUnitAmount",
        "msg": "Invalid unit amount"
      },
      {
        "code": 6002,
        "name": "InvalidPurchaseAmount",
        "msg": "Invalid purchase amount"
      },
      {
        "code": 6003,
        "name": "InvalidPrice",
        "msg": "Invalid price"
      },
      {
        "code": 6004,
        "name": "InvalidExpiry",
        "msg": "Invalid expiry timestamp"
      },
      {
        "code": 6005,
        "name": "ListingNotActive",
        "msg": "Listing is not active"
      },
      {
        "code": 6006,
        "name": "ListingExpired",
        "msg": "Listing has expired"
      },
      {
        "code": 6007,
        "name": "BelowMinimumPurchase",
        "msg": "Purchase amount is below minimum"
      },
      {
        "code": 6008,
        "name": "AboveMaximumPurchase",
        "msg": "Purchase amount is above maximum"
      },
      {
        "code": 6009,
        "name": "InsufficientUnitsAvailable",
        "msg": "Insufficient units available"
      },
      {
        "code": 6010,
        "name": "InvalidTokenAccount",
        "msg": "Invalid token account"
      },
      {
        "code": 6011,
        "name": "InvalidTokenMint",
        "msg": "Invalid token mint"
      },
      {
        "code": 6012,
        "name": "CalculationError",
        "msg": "Calculation error"
      }
    ]
  };