import { Connection } from "@solana/web3.js";

export const USDC_MINT = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"; // Devnet USDC
export const MERCHANT_WALLET = "4iw7w6aME8sfpf1F1LP3EybyLrtbp7PF9TjBT6fhCKdB";
export const RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL!;
export const PORTAL_URL = "https://lazor-kit-portal.vercel.app";
export const PAYMASTER_URL = "https://kora.devnet.lazorkit.com";
export const PAYMASTER_PAYER_KORA =
  "7Pkkhm8YeoBXFGKHTJXJ8ckdYiqtPdVWMefEVqK5vXed";

let connection: Connection;
export const getConnection = () => {
  if (!connection) {
    connection = new Connection(RPC_URL);
  }

  return connection;
};
