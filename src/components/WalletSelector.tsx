'use client';

import React from 'react';
import Image from 'next/image';
import { WalletProviderProps } from '@/lib/solana-wallet';

interface WalletSelectorProps {
  wallets: WalletProviderProps[];
  onSelect: (walletName: string) => void;
  onCancel: () => void;
}

const WalletSelector: React.FC<WalletSelectorProps> = ({ wallets, onSelect, onCancel }) => {
  if (wallets.length === 0) {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
        <div className="bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full">
          <h2 className="text-xl font-bold text-white mb-4">No Wallets Found</h2>
          <p className="text-gray-300 mb-4">
            No compatible wallets were detected. Please install a Solana wallet extension like Phantom, Solflare, or Backpack.
          </p>
          <div className="flex justify-end">
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full">
        <h2 className="text-xl font-bold text-white mb-4">Select a Wallet</h2>
        <p className="text-gray-300 mb-4">
          Choose which wallet you want to use for transactions. This wallet will be used for all your energy listings and transactions.
        </p>
        
        <div className="space-y-2 mb-6">
          {wallets.map((wallet) => (
            <button
              key={wallet.name}
              onClick={() => onSelect(wallet.name)}
              className="w-full flex items-center p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition"
            >
              <div className="relative w-8 h-8 mr-3">
                <Image 
                  src={wallet.icon} 
                  alt={`${wallet.name} icon`}
                  width={32}
                  height={32}
                  className="rounded-full"
                  onError={(e) => {
                    // Fallback if image fails to load
                    const target = e.target as HTMLImageElement;
                    target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMjIgMTJDMjIgMTcuNTIyOCAxNy41MjI4IDIyIDEyIDIyQzYuNDc3MTUgMjIgMiAxNy41MjI4IDIgMTJDMiA2LjQ3NzE1IDYuNDc3MTUgMiAxMiAyQzE3LjUyMjggMiAyMiA2LjQ3NzE1IDIyIDEyWiIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIyIi8+PHBhdGggZD0iTTEyIDEyLjVDMTIuODI4NCAxMi41IDEzLjUgMTEuODI4NCAxMy41IDExQzEzLjUgMTAuMTcxNiAxMi44Mjg0IDkuNSAxMiA5LjVDMTEuMTcxNiA5LjUgMTAuNSAxMC4xNzE2IDEwLjUgMTFDMTAuNSAxMS44Mjg0IDExLjE3MTYgMTIuNSAxMiAxMi41WiIgZmlsbD0id2hpdGUiLz48cGF0aCBkPSJNMTkgMTFDMTkgMTUuNDE4MyAxNS40MTgzIDE5IDExIDE5QzYuNTgxNzIgMTkgMyAxNS40MTgzIDMgMTFDMyA2LjU4MTcyIDYuNTgxNzIgMyAxMSAzQzE1LjQxODMgMyAxOSA2LjU4MTcyIDE5IDExWiIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIyIi8+PC9zdmc+';
                  }}
                />
              </div>
              <span className="text-white font-medium">{wallet.name}</span>
            </button>
          ))}
        </div>
        
        <div className="flex justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default WalletSelector; 