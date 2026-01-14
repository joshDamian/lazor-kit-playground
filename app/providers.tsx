"use client";

import { Buffer as Buffer0 } from "buffer";
import { LazorkitProvider } from "@lazorkit/wallet";
import React from "react";
import { Connection } from "@solana/web3.js";
import { PAYMASTER_URL, PORTAL_URL, RPC_URL } from "@/lib/constants";

if (typeof window !== "undefined") {
  window.Buffer = window.Buffer || Buffer0;
}

export const connection = new Connection(RPC_URL);

export function Providers({ children }: { children: React.ReactNode }) {
  const CONFIG = {
    RPC_URL,
    PORTAL_URL,
    PAYMASTER: {
      paymasterUrl: PAYMASTER_URL,
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
