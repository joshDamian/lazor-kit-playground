# Tutorial 3: Fetching Wallet Balance

## Overview

In this tutorial, you'll learn how to fetch and display your Lazorkit smart wallet's SOL balance on Solana. This is essential for showing users how much SOL they have available before making transactions.

## What You'll Learn

- How to use Solana's Connection API
- How to fetch wallet balance in lamports
- How to convert lamports to SOL
- How to handle loading states
- How to implement automatic balance updates

## Prerequisites

- Completed [Tutorial 1: Creating a Passkey-Based Smart Wallet](./tutorial-1-create-wallet.md)
- Connected Lazorkit wallet
- Basic understanding of React hooks (useEffect, useState)

## Understanding Lamports

Solana uses **lamports** as the smallest unit of SOL (similar to satoshis in Bitcoin):

- 1 SOL = 1,000,000,000 lamports (1 billion)
- The blockchain stores all balances in lamports
- You need to convert lamports to SOL for display

## Step 1: Set Up Connection

Create a Solana connection to query the blockchain:

```typescript
import { Connection, LAMPORTS_PER_SOL } from "@solana/web3.js";

// Initialize connection to Solana Devnet
const connection = new Connection("https://api.devnet.solana.com");
```

This connection allows you to interact with the Solana blockchain to fetch account data, including balances.

## Step 2: Fetch Balance

Use the connection to get the wallet's balance:

```typescript
"use client";

import { useWallet } from "@lazorkit/wallet";
import { Connection, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useState, useEffect } from "react";

export default function WalletBalancePage() {
  const { smartWalletPubkey } = useWallet();
  const [balance, setBalance] = useState<number | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(true);

  const connection = new Connection("https://api.devnet.solana.com");

  useEffect(() => {
    const fetchBalance = async () => {
      if (!smartWalletPubkey) return;

      try {
        setIsLoadingBalance(true);

        // Get balance in lamports
        const lamports = await connection.getBalance(smartWalletPubkey);

        // Convert to SOL
        setBalance(lamports / LAMPORTS_PER_SOL);
      } catch (err) {
        console.error("Failed to fetch balance:", err);
      } finally {
        setIsLoadingBalance(false);
      }
    };

    fetchBalance();
  }, [smartWalletPubkey]);

  return (
    <div>
      <h1>Wallet Balance</h1>
      <p>
        {isLoadingBalance
          ? "Loading..."
          : `${balance?.toFixed(4)} SOL`}
      </p>
    </div>
  );
}
```

## Step 3: Handle Loading States

Provide clear feedback while the balance is being fetched:

```typescript
const [balance, setBalance] = useState<number | null>(null);
const [isLoadingBalance, setIsLoadingBalance] = useState(true);
const [error, setError] = useState<string | null>(null);

useEffect(() => {
  const fetchBalance = async () => {
    if (!smartWalletPubkey) return;

    try {
      setIsLoadingBalance(true);
      setError(null);

      const lamports = await connection.getBalance(smartWalletPubkey);
      setBalance(lamports / LAMPORTS_PER_SOL);
    } catch (err) {
      console.error("Failed to fetch balance:", err);
      setError("Failed to load balance");
    } finally {
      setIsLoadingBalance(false);
    }
  };

  fetchBalance();
}, [smartWalletPubkey]);

// Render states
if (isLoadingBalance) {
  return <p>Loading balance...</p>;
}

if (error) {
  return <p style={{ color: 'red' }}>{error}</p>;
}

return <p>Balance: {balance?.toFixed(4)} SOL</p>;
```

## Step 4: Add Manual Refresh

Allow users to manually refresh their balance:

```typescript
const [balance, setBalance] = useState<number | null>(null);
const [isLoadingBalance, setIsLoadingBalance] = useState(true);

const fetchBalance = async () => {
  if (!smartWalletPubkey) return;

  try {
    setIsLoadingBalance(true);
    const lamports = await connection.getBalance(smartWalletPubkey);
    setBalance(lamports / LAMPORTS_PER_SOL);
  } catch (err) {
    console.error("Failed to fetch balance:", err);
  } finally {
    setIsLoadingBalance(false);
  }
};

// Fetch on mount
useEffect(() => {
  fetchBalance();
}, [smartWalletPubkey]);

return (
  <div>
    <p>Balance: {balance?.toFixed(4)} SOL</p>
    <button onClick={fetchBalance} disabled={isLoadingBalance}>
      {isLoadingBalance ? "Refreshing..." : "Refresh Balance"}
    </button>
  </div>
);
```

## Step 5: Format Balance Display

Format the balance for better readability:

```typescript
const formatBalance = (balance: number | null): string => {
  if (balance === null) return "0.0000";

  // Show 4 decimal places
  if (balance < 0.0001) {
    return balance.toExponential(2);
  }

  return balance.toFixed(4);
};

return (
  <div>
    <p>Balance: {formatBalance(balance)} SOL</p>

    {balance !== null && balance < 0.01 && (
      <p style={{ color: 'orange' }}>
        ⚠️ Low balance. Get devnet SOL from the faucet.
      </p>
    )}
  </div>
);
```

## Step 6: Auto-Update on Transactions

Automatically refresh balance after transactions:

```typescript
"use client";

import { useWallet } from "@lazorkit/wallet";
import { Connection, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useState, useEffect } from "react";

export default function WalletBalancePage() {
  const { smartWalletPubkey, signAndSendTransaction } = useWallet();
  const [balance, setBalance] = useState<number | null>(null);

  const connection = new Connection("https://api.devnet.solana.com");

  const fetchBalance = async () => {
    if (!smartWalletPubkey) return;

    const lamports = await connection.getBalance(smartWalletPubkey);
    setBalance(lamports / LAMPORTS_PER_SOL);
  };

  // Fetch balance on mount
  useEffect(() => {
    fetchBalance();
  }, [smartWalletPubkey]);

  const sendTransaction = async () => {
    // Send your transaction
    const signature = await signAndSendTransaction({
      instructions: [/* your instructions */],
    });

    // Wait a moment for blockchain to update
    setTimeout(() => {
      fetchBalance(); // Refresh balance after transaction
    }, 2000);
  };

  return (
    <div>
      <p>Balance: {balance?.toFixed(4)} SOL</p>
      <button onClick={sendTransaction}>Send Transaction</button>
    </div>
  );
}
```

## Advanced: Real-Time Balance Updates

Use polling to keep balance updated:

```typescript
useEffect(() => {
  if (!smartWalletPubkey) return;

  // Initial fetch
  fetchBalance();

  // Poll every 10 seconds
  const intervalId = setInterval(() => {
    fetchBalance();
  }, 10000); // 10 seconds

  // Cleanup on unmount
  return () => clearInterval(intervalId);
}, [smartWalletPubkey]);
```

## Advanced: WebSocket Subscription

For real-time updates, use WebSocket subscriptions:

```typescript
useEffect(() => {
  if (!smartWalletPubkey) return;

  // Subscribe to account changes
  const subscriptionId = connection.onAccountChange(
    smartWalletPubkey,
    (accountInfo) => {
      const lamports = accountInfo.lamports;
      setBalance(lamports / LAMPORTS_PER_SOL);
      console.log("Balance updated:", lamports / LAMPORTS_PER_SOL);
    },
    "confirmed" // commitment level
  );

  // Initial fetch
  fetchBalance();

  // Cleanup subscription on unmount
  return () => {
    connection.removeAccountChangeListener(subscriptionId);
  };
}, [smartWalletPubkey]);
```

## Common Issues and Solutions

### Issue: Balance shows 0 SOL

**Solution**: You need to fund your devnet wallet. Visit [Solana Faucet](https://faucet.solana.com/) and request SOL:

1. Copy your smart wallet address
2. Go to https://faucet.solana.com/
3. Paste your address
4. Select "Devnet"
5. Request 1-2 SOL
6. Wait 30 seconds and refresh

### Issue: "Failed to fetch balance"

**Solution**: Check your RPC connection:

```typescript
// Try alternative RPC endpoints
const connection = new Connection(
  "https://api.devnet.solana.com",
  { commitment: "confirmed" }
);

// Or use a paid RPC provider for better reliability
const connection = new Connection(
  process.env.NEXT_PUBLIC_RPC_URL || "https://api.devnet.solana.com"
);
```

### Issue: Balance not updating after transaction

**Solution**: Add a delay before refreshing:

```typescript
const sig = await signAndSendTransaction({ instructions });

// Wait for transaction confirmation
await connection.confirmTransaction(sig, "confirmed");

// Now refresh balance
await fetchBalance();
```

## Performance Considerations

1. **Avoid excessive RPC calls** - Don't fetch balance on every render
2. **Use appropriate polling intervals** - 10-30 seconds is usually sufficient
3. **Implement caching** - Store balance temporarily to reduce RPC load
4. **Handle RPC rate limits** - Use try-catch and exponential backoff

```typescript
const fetchBalanceWithRetry = async (retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      const lamports = await connection.getBalance(smartWalletPubkey!);
      setBalance(lamports / LAMPORTS_PER_SOL);
      return;
    } catch (err) {
      if (i === retries - 1) throw err;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
};
```

## Full Code Example

```typescript
"use client";

import { useWallet } from "@lazorkit/wallet";
import { Connection, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useState, useEffect } from "react";

export default function WalletBalancePage() {
  const { smartWalletPubkey, isConnected } = useWallet();
  const [balance, setBalance] = useState<number | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const connection = new Connection("https://api.devnet.solana.com");

  const fetchBalance = async () => {
    if (!smartWalletPubkey) return;

    try {
      setIsLoadingBalance(true);
      setError(null);

      const lamports = await connection.getBalance(smartWalletPubkey);
      setBalance(lamports / LAMPORTS_PER_SOL);
    } catch (err) {
      console.error("Failed to fetch balance:", err);
      setError("Failed to load balance");
    } finally {
      setIsLoadingBalance(false);
    }
  };

  // Fetch balance on mount and when wallet changes
  useEffect(() => {
    fetchBalance();
  }, [smartWalletPubkey]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!smartWalletPubkey) return;

    const intervalId = setInterval(() => {
      fetchBalance();
    }, 30000);

    return () => clearInterval(intervalId);
  }, [smartWalletPubkey]);

  if (!isConnected) {
    return <p>Please connect your wallet first.</p>;
  }

  return (
    <div>
      <h1>Wallet Balance</h1>

      <div>
        <p><strong>Wallet Address:</strong></p>
        <p>{smartWalletPubkey?.toBase58()}</p>
      </div>

      <div>
        <p><strong>Network:</strong> Devnet</p>
      </div>

      <div>
        <p><strong>SOL Balance:</strong></p>
        {isLoadingBalance && <p>Loading...</p>}
        {error && <p style={{ color: 'red' }}>{error}</p>}
        {!isLoadingBalance && !error && (
          <p>{balance?.toFixed(4)} SOL</p>
        )}
      </div>

      <button onClick={fetchBalance} disabled={isLoadingBalance}>
        {isLoadingBalance ? "Refreshing..." : "Refresh Balance"}
      </button>

      {balance !== null && balance < 0.01 && (
        <div style={{ color: 'orange' }}>
          <p>⚠️ Low balance</p>
          <a
            href="https://faucet.solana.com/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Get devnet SOL from faucet
          </a>
        </div>
      )}
    </div>
  );
}
```

## Next Steps

- [Send gasless transactions →](./tutorial-2-gasless-transaction.md)
- [Set up automated subscriptions →](./tutorial-4-subscription-automation.md)

## Resources

- [Solana Connection API](https://solana-labs.github.io/solana-web3.js/classes/Connection.html)
- [Solana Devnet Faucet](https://faucet.solana.com/)
- [Try the Live Demo](https://lazorkit-playground.vercel.app/details)

---

**Previous**: [Sending a Gasless Transaction ←](./tutorial-2-gasless-transaction.md)
**Next**: [Automated Subscription Billing →](./tutorial-4-subscription-automation.md)