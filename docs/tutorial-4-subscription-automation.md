# Tutorial 4: Automated Subscription Billing

## Overview

In this tutorial, you'll learn how to implement automated subscription billing using Lazorkit Smart Wallet chunks (mandates). Users authorize a payment once with their passkey, then future payments execute automatically without repeated approval.

## What You'll Learn

- What Smart Wallet chunks/mandates are
- How to create pre-authorized payment instructions
- How to build authorization messages for passkey signing
- How to create mandates on-chain
- How to execute automated payments
- Production setup considerations

## Prerequisites

- Completed [Tutorial 1: Creating a Passkey-Based Smart Wallet](./tutorial-1-create-wallet.md)
- Completed [Tutorial 2: Sending a Gasless Transaction](./tutorial-2-gasless-transaction.md)
- Connected Lazorkit wallet with USDC balance
- Understanding of Solana instructions and transactions

## What is a Smart Wallet Chunk (Mandate)?

A **chunk** (also called a **mandate**) is a pre-authorized transaction stored on your Lazorkit smart wallet. It allows specific operations to execute automatically without requiring repeated passkey approval.

### Key Properties of Mandates:

1. **One-time authorization** - User signs once with passkey
2. **Specific instructions** - Only authorized operations can execute
3. **Expiration date** - Mandates expire after a set time (e.g., 30 days)
4. **Automated execution** - Future payments require no user interaction

### Use Cases:

- SaaS subscription billing
- Recurring donations
- Automated DCA (Dollar Cost Averaging)
- Scheduled payments

## How Automated Subscriptions Work

```
Step 1: User subscribes
┌─────────────────────┐
│  User clicks        │
│  "Subscribe"        │
└──────────┬──────────┘
           │
           v
┌─────────────────────┐
│  Create USDC        │
│  transfer           │
│  instruction        │
└──────────┬──────────┘
           │
           v
┌─────────────────────┐
│  User signs with    │
│  passkey (one time) │
└──────────┬──────────┘
           │
           v
┌─────────────────────┐
│  Mandate stored     │
│  on smart wallet    │
└─────────────────────┘

Step 2: Automated billing (backend)
┌─────────────────────┐
│  Cron job runs      │
│  (e.g., monthly)    │
└──────────┬──────────┘
           │
           v
┌─────────────────────┐
│  Execute mandate    │
│  (no passkey!)      │
└──────────┬──────────┘
           │
           v
┌─────────────────────┐
│  Payment completes  │
│  automatically      │
└─────────────────────┘
```

## Step 1: Define Subscription Plans

Create subscription plan definitions:

```typescript
// lib/plans.ts
export interface Plan {
  id: string;
  label: string;
  price: number; // USDC amount
  intervalDays: number;
}

export const PLANS: Plan[] = [
  {
    id: "basic",
    label: "Basic Plan",
    price: 9.99,
    intervalDays: 30,
  },
  {
    id: "pro",
    label: "Pro Plan",
    price: 29.99,
    intervalDays: 30,
  },
  {
    id: "enterprise",
    label: "Enterprise Plan",
    price: 99.99,
    intervalDays: 30,
  },
];
```

## Step 2: Create USDC Transfer Instruction

Build the instruction that will be pre-authorized:

```typescript
import { createTransferInstruction } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";

/**
 * Creates a USDC transfer instruction
 * This is the instruction that will be stored in the mandate
 */
async function createUsdcTransferIx(
  from: PublicKey,
  to: PublicKey,
  amount: number
) {
  const USDC_MINT = new PublicKey("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"); // Devnet USDC
  const USDC_DECIMALS = 6;

  // Get associated token accounts
  const fromAta = await getAssociatedTokenAddress(USDC_MINT, from);
  const toAta = await getAssociatedTokenAddress(USDC_MINT, to);

  // Convert USDC to smallest unit (6 decimals)
  const amountInSmallestUnit = Math.floor(amount * Math.pow(10, USDC_DECIMALS));

  // Create transfer instruction
  return createTransferInstruction(
    fromAta,     // source
    toAta,       // destination
    from,        // owner
    amountInSmallestUnit
  );
}
```

## Step 3: Build Authorization Message

Create the message that the user will sign with their passkey:

```typescript
import {
  LazorkitClient,
  SmartWalletAction,
  credentialHashFromBase64
} from "@lazorkit/wallet";
import { BN } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";

async function createSubscriptionMandate(
  lazorkitClient: LazorkitClient,
  smartWallet: PublicKey,
  passkeyPublicKey: number[],
  credentialId: string,
  payer: PublicKey,
  usdcTransferIx: TransactionInstruction,
  expirationTimestamp: number
) {
  // Convert credential ID to hash
  const credentialHash = credentialHashFromBase64(credentialId);

  // Current timestamp
  const timestamp = new BN(Math.floor(Date.now() / 1000));

  // Build the authorization message
  const authMessage = await lazorkitClient.buildAuthorizationMessage({
    action: {
      type: SmartWalletAction.CreateChunk,
      args: {
        cpiInstructions: [usdcTransferIx], // Pre-authorized instruction
        expiresAt: expirationTimestamp,     // When mandate expires
      },
    },
    payer,
    smartWallet,
    passkeyPublicKey,
    credentialHash,
    timestamp,
  });

  return { authMessage, credentialHash, timestamp };
}
```

## Step 4: Sign with Passkey

Open the passkey dialog for user authorization:

```typescript
import { DialogManager, asPasskeyPublicKey } from "@lazorkit/wallet";

async function signMandateWithPasskey(
  authMessage: Buffer,
  credentialId: string,
  passkeyPublicKey: number[]
) {
  // Initialize dialog manager
  const dialogManager = new DialogManager({
    portalUrl: "https://portal.lazorkit.sh",
    rpcUrl: "https://api.devnet.solana.com",
    paymasterUrl: "https://paymaster.lazorkit.com",
  });

  // Open passkey dialog
  const signResult = await dialogManager.openSignMessage(
    authMessage.toString("base64"),
    credentialId
  );

  console.log("✅ User signed mandate with passkey");

  // Format signature for Lazorkit
  const passkeySignature = {
    passkeyPublicKey: asPasskeyPublicKey(passkeyPublicKey),
    signature64: signResult.signature,
    clientDataJsonRaw64: signResult.clientDataJsonBase64,
    authenticatorDataRaw64: signResult.authenticatorDataBase64,
  };

  return passkeySignature;
}
```

## Step 5: Create Mandate On-Chain

Store the pre-authorized chunk on the smart wallet:

```typescript
import { Paymaster, Transaction } from "@lazorkit/wallet";

async function storeMandateOnChain(
  lazorkitClient: LazorkitClient,
  smartWallet: PublicKey,
  payer: PublicKey,
  passkeySignature: any,
  credentialHash: Buffer,
  usdcTransferIx: TransactionInstruction,
  timestamp: BN
) {
  // Create the chunk transaction
  const transactionResult = await lazorkitClient.createChunkTxn(
    {
      payer,
      smartWallet,
      passkeySignature,
      credentialHash,
      cpiInstructions: [usdcTransferIx], // The pre-authorized instruction
      timestamp,
    },
    {
      computeUnitLimit: 300000, // Recommended for complex CPIs
    }
  );

  console.log("🔐 Creating mandate transaction on-chain...");

  // Sign and send with paymaster
  const paymaster = new Paymaster({
    paymasterUrl: "https://paymaster.lazorkit.com",
  });

  const signature = await paymaster.signAndSend(transactionResult as Transaction);

  console.log("✅ Mandate created! Signature:", signature);

  return signature;
}
```

## Step 6: Execute Automated Payment

Execute a payment using the pre-authorized mandate (no passkey needed):

```typescript
async function executeAutomatedPayment(
  lazorkitClient: LazorkitClient,
  smartWallet: PublicKey,
  payer: PublicKey,
  usdcTransferIx: TransactionInstruction
) {
  console.log("🔄 Executing payment using pre-authorized mandate...");

  // Execute the chunk (no passkey signature needed!)
  const transactionResult = await lazorkitClient.executeChunkTxn(
    {
      payer,
      smartWallet,
      cpiInstructions: [usdcTransferIx], // Same instruction as authorized
    },
    {
      computeUnitLimit: 300000,
    }
  );

  // Sign and send with paymaster
  const paymaster = new Paymaster({
    paymasterUrl: "https://paymaster.lazorkit.com",
  });

  const executionTx = await paymaster.signAndSend(transactionResult as Transaction);

  console.log("✅ Payment executed automatically:", executionTx);

  return executionTx;
}
```

## Step 7: Complete Subscription Component

Bring it all together in a React component:

```typescript
"use client";

import { useState } from "react";
import { useWallet, LazorkitClient } from "@lazorkit/wallet";
import { PublicKey } from "@solana/web3.js";

interface Plan {
  id: string;
  label: string;
  price: number;
  intervalDays: number;
}

export default function SubscribePage() {
  const { smartWalletPubkey, isConnected, wallet } = useWallet();
  const [mandateSignature, setMandateSignature] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);

  const plan: Plan = {
    id: "basic",
    label: "Basic Plan",
    price: 9.99,
    intervalDays: 30,
  };

  const createMandate = async () => {
    if (!smartWalletPubkey || !wallet) return;

    setIsCreating(true);

    try {
      // Mandate expires in 30 days
      const expirationTimestamp =
        Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60;

      const lazorkitClient = new LazorkitClient(connection);

      // Create USDC transfer instruction
      const usdcTransferIx = await createUsdcTransferIx(
        smartWalletPubkey,
        merchantWallet,
        plan.price
      );

      // Build authorization message
      const { authMessage, credentialHash, timestamp } =
        await createSubscriptionMandate(
          lazorkitClient,
          smartWalletPubkey,
          wallet.passkeyPubkey,
          wallet.credentialId,
          payer,
          usdcTransferIx,
          expirationTimestamp
        );

      // Sign with passkey
      const passkeySignature = await signMandateWithPasskey(
        authMessage,
        wallet.credentialId,
        wallet.passkeyPubkey
      );

      // Store mandate on-chain
      const signature = await storeMandateOnChain(
        lazorkitClient,
        smartWalletPubkey,
        payer,
        passkeySignature,
        credentialHash,
        usdcTransferIx,
        timestamp
      );

      setMandateSignature(signature);
      console.log("✅ Subscription activated!");
    } catch (error) {
      console.error("❌ Failed to create mandate:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const executePayment = async () => {
    if (!smartWalletPubkey) return;

    setIsExecuting(true);

    try {
      const lazorkitClient = new LazorkitClient(connection);

      // Create same USDC transfer instruction
      const usdcTransferIx = await createUsdcTransferIx(
        smartWalletPubkey,
        merchantWallet,
        plan.price
      );

      // Execute using mandate (no passkey needed!)
      await executeAutomatedPayment(
        lazorkitClient,
        smartWalletPubkey,
        payer,
        usdcTransferIx
      );

      console.log("✅ Payment successful!");
    } catch (error) {
      console.error("❌ Payment failed:", error);
    } finally {
      setIsExecuting(false);
    }
  };

  if (!isConnected) {
    return <p>Connect your wallet to subscribe.</p>;
  }

  return (
    <div>
      <h1>Subscription: {plan.label}</h1>
      <p>${plan.price} USDC every {plan.intervalDays} days</p>

      {!mandateSignature && (
        <button onClick={createMandate} disabled={isCreating}>
          {isCreating ? "Creating..." : "Subscribe Now"}
        </button>
      )}

      {mandateSignature && (
        <div>
          <p>✅ Subscription Active</p>
          <button onClick={executePayment} disabled={isExecuting}>
            {isExecuting ? "Processing..." : "Execute Payment"}
          </button>
        </div>
      )}
    </div>
  );
}
```

## Production Setup: Backend Execution

In a real application, payment execution should be handled by your backend, not the frontend:

### Backend Architecture:

```typescript
// backend/jobs/subscription-billing.ts
import { LazorkitClient } from "@lazorkit/wallet";
import { Connection } from "@solana/web3.js";

/**
 * Cron job that runs daily to process subscription payments
 */
export async function processSubscriptionPayments() {
  const connection = new Connection(process.env.RPC_URL!);
  const lazorkitClient = new LazorkitClient(connection);

  // 1. Query database for subscriptions due today
  const dueSubscriptions = await db.subscriptions.findMany({
    where: {
      nextBillingDate: { lte: new Date() },
      status: "active",
    },
  });

  // 2. Process each subscription
  for (const subscription of dueSubscriptions) {
    try {
      // Create USDC transfer instruction
      const usdcTransferIx = await createUsdcTransferIx(
        new PublicKey(subscription.smartWallet),
        new PublicKey(subscription.merchantWallet),
        subscription.amount
      );

      // Execute using mandate (no user interaction!)
      const signature = await lazorkitClient.executeChunkTxn(
        {
          payer: new PublicKey(process.env.PAYER_PUBKEY!),
          smartWallet: new PublicKey(subscription.smartWallet),
          cpiInstructions: [usdcTransferIx],
        },
        { computeUnitLimit: 300000 }
      );

      // 3. Update database
      await db.subscriptions.update({
        where: { id: subscription.id },
        data: {
          lastPaymentDate: new Date(),
          nextBillingDate: addDays(new Date(), subscription.intervalDays),
          lastTransactionSignature: signature,
        },
      });

      console.log(`✅ Processed subscription ${subscription.id}: ${signature}`);
    } catch (error) {
      console.error(`❌ Failed to process subscription ${subscription.id}:`, error);

      // Mark subscription as failed, notify user, etc.
      await handlePaymentFailure(subscription, error);
    }
  }
}

// Run daily at midnight
cron.schedule("0 0 * * *", processSubscriptionPayments);
```

### Database Schema:

```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  smart_wallet TEXT NOT NULL,
  merchant_wallet TEXT NOT NULL,
  amount DECIMAL NOT NULL,
  interval_days INTEGER NOT NULL,
  mandate_signature TEXT NOT NULL,
  mandate_expires_at TIMESTAMP NOT NULL,
  status TEXT NOT NULL, -- 'active', 'paused', 'cancelled'
  last_payment_date TIMESTAMP,
  next_billing_date TIMESTAMP NOT NULL,
  last_transaction_signature TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Common Issues and Solutions

### Issue: "Chunk not found"

**Solution**: The mandate either expired or was never created. Check:
- Mandate creation transaction succeeded
- Expiration date hasn't passed
- Using correct smart wallet address

### Issue: "CPI instruction mismatch"

**Solution**: The execution instruction must exactly match the authorized instruction:
```typescript
// Both must be identical
const authorizedIx = createTransferInstruction(...);
const executionIx = createTransferInstruction(...); // Same parameters!
```

### Issue: Mandate expired

**Solution**: Create a new mandate. Mandates have expiration dates for security:
```typescript
// Check expiration before executing
const currentTime = Math.floor(Date.now() / 1000);
if (currentTime > mandateExpiresAt) {
  console.log("Mandate expired, please renew subscription");
  // Prompt user to create new mandate
}
```

## Security Best Practices

1. **Set reasonable expiration dates** - 30-90 days is typical
2. **Validate amounts** - Ensure transfer amounts match subscription price
3. **Monitor failed payments** - Notify users of payment failures
4. **Allow cancellation** - Let users cancel/pause subscriptions
5. **Backend execution** - Never execute from frontend in production
6. **Rate limiting** - Prevent rapid repeated execution attempts
7. **Audit logs** - Log all subscription events

## Testing Checklist

- [ ] Mandate creation succeeds
- [ ] Passkey authorization works
- [ ] Mandate stored on-chain (verify with explorer)
- [ ] First payment executes successfully
- [ ] Subsequent payments work without passkey
- [ ] Expired mandates are rejected
- [ ] Wrong instruction amounts are rejected
- [ ] Users can cancel subscriptions

## Next Steps

Congratulations! You've learned how to implement automated subscription billing with Lazorkit Smart Wallets. You now understand:

- ✅ Creating passkey-based smart wallets
- ✅ Sending gasless transactions
- ✅ Fetching wallet balances
- ✅ Automating recurring payments with mandates

## Resources

- [Lazorkit Documentation](https://docs.lazorkit.com)
- [Smart Wallet Chunks Guide](https://docs.lazorkit.com/chunks)
- [Try the Live Demo](https://lazorkit-playground.vercel.app/subscribe)

---

**Previous**: [Fetching Wallet Balance ←](./tutorial-3-wallet-balance.md)