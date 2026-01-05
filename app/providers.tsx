"use client";

import { Buffer as Buffer0 } from "buffer";
import { LazorkitProvider } from "@lazorkit/wallet";

if (typeof window !== "undefined") {
  window.Buffer = window.Buffer || Buffer0;
}

const CONFIG = {
  RPC_URL: process.env.NEXT_PUBLIC_SOLANA_RPC_URL!,
  PORTAL_URL: "https://portal.lazor.sh",
  PAYMASTER: {
    paymasterUrl: "https://kora.devnet.lazorkit.com",
  },
};

export function Providers({ children }: { children: React.ReactNode }) {
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