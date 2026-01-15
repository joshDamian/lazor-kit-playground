import { PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import {
  createTransferCheckedInstruction,
  getAssociatedTokenAddress,
} from "@solana/spl-token";
import { USDC_MINT } from "@/lib/constants";

export function toTokenAmount(amount: number, decimals: number): BN {
  if (amount < 0) {
    throw new Error("Amount cannot be negative");
  }

  if (decimals < 0 || !Number.isInteger(decimals)) {
    throw new Error("Decimals must be a non-negative integer");
  }

  // Convert to string with fixed precision to avoid floating point issues
  const amountStr = (amount * Math.pow(10, decimals)).toFixed(0);

  return new BN(amountStr);
}

export async function createUsdcTransferIx(
  owner: PublicKey,
  recipient: PublicKey,
  amount: number,
) {
  const sourceAta = await getAssociatedTokenAddress(
    new PublicKey(USDC_MINT),
    owner,
    true,
  );
  const destAta = await getAssociatedTokenAddress(
    new PublicKey(USDC_MINT),
    recipient,
  );

  return createTransferCheckedInstruction(
    sourceAta,
    new PublicKey(USDC_MINT),
    destAta,
    owner,
    toTokenAmount(amount, 6),
    6, // USDC decimals
  );
}
