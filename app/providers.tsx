"use client";

import { Buffer as Buffer0 } from "buffer";
import { LazorkitProvider } from "@lazorkit/wallet";
import React from "react";
import { Connection } from "@solana/web3.js";

if (typeof window !== "undefined") {
  window.Buffer = window.Buffer || Buffer0;
}

export const connection = new Connection(
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL!,
);

export function Providers({ children }: { children: React.ReactNode }) {
  const CONFIG = {
    RPC_URL: process.env.NEXT_PUBLIC_SOLANA_RPC_URL!,
    PORTAL_URL: "https://lazor-kit-portal.vercel.app",
    PAYMASTER: {
      paymasterUrl: "https://kora.devnet.lazorkit.com",
    },
  };

  return (
    <LazorkitProvider
      rpcUrl={CONFIG.RPC_URL}
      portalUrl={CONFIG.PORTAL_URL}
      paymasterConfig={CONFIG.PAYMASTER}
    >
      {children}
    </LazorkitProvider>
  );
}
