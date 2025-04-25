"use client";
import { useEffect, useState } from "react";
import { WalletButton } from './solana-provider';

export default function WalletButtonClient(props: any) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return <WalletButton {...props} />;
} 