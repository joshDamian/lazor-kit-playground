# Tutorial 2: Sending a Gasless Transaction

## Overview

In this tutorial, you'll learn how to send gasless SOL transfers using your Lazorkit smart wallet. The paymaster sponsors transaction fees, creating a seamless experience for your users.

## What You'll Learn

- How to construct Solana transactions
- How to use `signAndSendTransaction` for gasless transfers
- How to handle transaction states and errors
- How to display transaction signatures

## Prerequisites

- Completed [Tutorial 1: Creating a Passkey-Based Smart Wallet](./tutorial-1-create-wallet.md)
- Connected Lazorkit wallet
- Basic understanding of Solana transactions

## How Gasless Transactions Work

1. **User initiates transfer** - No SOL needed for gas fees
2. **Transaction is signed** - Using smart wallet with passkey
3. **Paymaster sponsors fees** - Transaction fees paid by paymaster
4. **Transaction executes** - SOL transfer completes on-chain

## Step 1: Set Up the Transfer Component

Create a component with form inputs for recipient and amount:

```typescript
"use client";

import { useWallet } from "@lazorkit/wallet";
import { PublicKey, LAMPORTS_PER_SOL, SystemProgram } from "@solana/web3.js";
import { useState } from "react";

export default function TransferPage() {
  const { smartWalletPubkey, isConnected, signAndSendTransaction } = useWallet();

  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [signature, setSignature] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  return (
    <div>
      <h1>Gasless Transaction</h1>
      <p>Wallet: {smartWalletPubkey?.toBase58()}</p>

      {/* Form inputs will go here */}
    </div>
  );
}
```

## Step 2: Create the Transaction

Build a Solana transaction with a transfer instruction:

```typescript
const handleSend = async () => {
  setStatus("sending");
  setErrorMsg(null);

  // Validate inputs
  if (!recipient || !amount || Number(amount) <= 0) {
    setErrorMsg("Enter valid recipient and amount");
    setStatus("error");
    return;
  }

  try {
    // Create the transfer instruction
    const instruction = SystemProgram.transfer({
      fromPubkey: smartWalletPubkey!,
      toPubkey: new PublicKey(recipient),
      lamports: Number(amount) * LAMPORTS_PER_SOL,
    });

    // Sign and send with paymaster (gasless)
    const sig = await signAndSendTransaction({
      instructions: [instruction],
    });

    setSignature(sig);
    setStatus("success");
    console.log("Transaction signature:", sig);

    // Clear form
    setRecipient("");
    setAmount("");
  } catch (err: unknown) {
    setErrorMsg((err as Error).message || "Transaction failed");
    setStatus("error");
  }
};
```

## Step 3: Add Form UI

Create the input form with proper validation:

```typescript
return (
  <div>
    <h1>Gasless Transaction</h1>
    <p>Wallet: {smartWalletPubkey?.toBase58()}</p>

    <div>
      <input
        type="text"
        placeholder="Recipient address"
        value={recipient}
        onChange={(e) => setRecipient(e.target.value)}
      />

      <input
        type="number"
        placeholder="Amount (SOL)"
        value={amount}
        step={0.00000001}
        onChange={(e) => setAmount(e.target.value)}
      />

      <button
        onClick={handleSend}
        disabled={status === "sending"}
      >
        {status === "sending" ? "Sending..." : "Send Transaction"}
      </button>
    </div>

    {/* Success/Error messages */}
    {status === "success" && signature && (
      <div>
        <p>✅ Transaction sent successfully!</p>
        <p>Signature: {signature}</p>
      </div>
    )}

    {status === "error" && errorMsg && (
      <p style={{ color: 'red' }}>❌ {errorMsg}</p>
    )}
  </div>
);
```

## Step 4: Understanding `signAndSendTransaction`

The `signAndSendTransaction` function handles:

1. **Building the transaction** - Adds recent blockhash and fee payer
2. **Requesting passkey signature** - Opens passkey dialog
3. **Submitting to paymaster** - Paymaster adds signature and pays fees
4. **Sending to Solana** - Transaction executed on-chain

### Function Signature

```typescript
signAndSendTransaction({
  instructions: TransactionInstruction[], // Array of instructions
  signers?: Signer[]                      // Optional additional signers
}): Promise<string>                       // Returns transaction signature
```

## Step 5: Handle Transaction States

Provide clear feedback for all transaction states:

```typescript
const [status, setStatus] = useState<
  "idle" | "sending" | "success" | "error"
>("idle");

// Loading state
if (status === "sending") {
  return <p>Sending transaction... Please approve with your passkey.</p>;
}

// Success state
if (status === "success") {
  return (
    <div>
      <p>✅ Transaction successful!</p>
      <a
        href={`https://explorer.solana.com/tx/${signature}?cluster=devnet`}
        target="_blank"
        rel="noopener noreferrer"
      >
        View on Solana Explorer
      </a>
    </div>
  );
}

// Error state
if (status === "error") {
  return (
    <div>
      <p>❌ Transaction failed: {errorMsg}</p>
      <button onClick={() => setStatus("idle")}>Try Again</button>
    </div>
  );
}
```

## Step 6: Add Copy Signature Feature

Make it easy for users to copy the transaction signature:

```typescript
const [copied, setCopied] = useState(false);

const handleCopy = async () => {
  if (signature) {
    await navigator.clipboard.writeText(signature);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
};

return (
  <div>
    <p>Signature: {signature?.slice(0, 16)}...{signature?.slice(-16)}</p>
    <button onClick={handleCopy}>
      {copied ? "Copied!" : "Copy"}
    </button>
  </div>
);
```

## Advanced: Multiple Instructions

You can include multiple instructions in a single transaction:

```typescript
const instructions = [
  // Transfer SOL
  SystemProgram.transfer({
    fromPubkey: smartWalletPubkey!,
    toPubkey: new PublicKey(recipient1),
    lamports: 0.1 * LAMPORTS_PER_SOL,
  }),
  // Transfer more SOL to another address
  SystemProgram.transfer({
    fromPubkey: smartWalletPubkey!,
    toPubkey: new PublicKey(recipient2),
    lamports: 0.2 * LAMPORTS_PER_SOL,
  }),
];

const signature = await signAndSendTransaction({
  instructions,
});
```

## Common Issues and Solutions

### Issue: "Insufficient funds"

**Solution**: Even though the transaction is gasless (no fee needed), you still need SOL in your wallet for the transfer amount. Get devnet SOL from [Solana Faucet](https://faucet.solana.com/).

### Issue: "Invalid public key"

**Solution**: Validate the recipient address before sending:

```typescript
const isValidAddress = (address: string): boolean => {
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
};

if (!isValidAddress(recipient)) {
  setErrorMsg("Invalid recipient address");
  return;
}
```

### Issue: Transaction times out

**Solution**: Add timeout handling:

```typescript
const TIMEOUT = 30000; // 30 seconds

const timeoutPromise = new Promise((_, reject) =>
  setTimeout(() => reject(new Error("Transaction timeout")), TIMEOUT)
);

try {
  const signature = await Promise.race([
    signAndSendTransaction({ instructions }),
    timeoutPromise
  ]);
} catch (err) {
  // Handle timeout
}
```

## Testing Your Transfer

1. **Get a test recipient address** - Create another wallet or use a friend's address
2. **Get devnet SOL** - Visit [Solana Faucet](https://faucet.solana.com/) and request 1-2 SOL
3. **Send a small amount** - Try 0.01 SOL first
4. **View on explorer** - Check [Solana Explorer](https://explorer.solana.com/?cluster=devnet)

## Security Best Practices

1. **Validate all inputs** - Always validate recipient addresses and amounts
2. **Show transaction details** - Let users review before signing
3. **Handle errors gracefully** - Provide clear error messages
4. **Never auto-submit** - Always require explicit user action

## Full Code Example

```typescript
"use client";

import { useWallet } from "@lazorkit/wallet";
import { PublicKey, LAMPORTS_PER_SOL, SystemProgram } from "@solana/web3.js";
import { useState } from "react";

export default function TransferPage() {
  const { smartWalletPubkey, isConnected, signAndSendTransaction } = useWallet();

  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [signature, setSignature] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSend = async () => {
    setStatus("sending");
    setErrorMsg(null);

    if (!recipient || !amount || Number(amount) <= 0) {
      setErrorMsg("Enter valid recipient and amount");
      setStatus("error");
      return;
    }

    try {
      const instruction = SystemProgram.transfer({
        fromPubkey: smartWalletPubkey!,
        toPubkey: new PublicKey(recipient),
        lamports: Number(amount) * LAMPORTS_PER_SOL,
      });

      const sig = await signAndSendTransaction({
        instructions: [instruction],
      });

      setSignature(sig);
      setStatus("success");
      setRecipient("");
      setAmount("");
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || "Transaction failed");
      setStatus("error");
    }
  };

  const handleCopy = async () => {
    if (signature) {
      await navigator.clipboard.writeText(signature);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isConnected) {
    return <p>Please connect your wallet first.</p>;
  }

  return (
    <div>
      <h1>Gasless Transaction</h1>
      <p>Wallet: {smartWalletPubkey?.toBase58()}</p>

      <input
        type="text"
        placeholder="Recipient address"
        value={recipient}
        onChange={(e) => setRecipient(e.target.value)}
      />

      <input
        type="number"
        placeholder="Amount (SOL)"
        value={amount}
        step={0.00000001}
        onChange={(e) => setAmount(e.target.value)}
      />

      <button onClick={handleSend} disabled={status === "sending"}>
        {status === "sending" ? "Sending..." : "Send Transaction"}
      </button>

      {status === "success" && signature && (
        <div>
          <p>✅ Transaction sent successfully!</p>
          <p>{signature.slice(0, 16)}...{signature.slice(-16)}</p>
          <button onClick={handleCopy}>
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      )}

      {status === "error" && errorMsg && (
        <p style={{ color: 'red' }}>❌ {errorMsg}</p>
      )}
    </div>
  );
}
```

## Next Steps

- [Fetch wallet balance →](./tutorial-3-wallet-balance.md)
- [Set up automated subscriptions →](./tutorial-4-subscription-automation.md)

## Resources

- [Solana Transactions Guide](https://docs.solana.com/developing/programming-model/transactions)
- [SystemProgram Documentation](https://solana-labs.github.io/solana-web3.js/classes/SystemProgram.html)
- [Try the Live Demo](https://lazorkit-playground.vercel.app/transfer)

---

**Previous**: [Creating a Passkey-Based Smart Wallet ←](./tutorial-1-create-wallet.md)
**Next**: [Fetching Wallet Balance →](./tutorial-3-wallet-balance.md)