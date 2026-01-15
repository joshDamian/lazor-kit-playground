# Tutorial 1: Creating a Passkey-Based Smart Wallet

## Overview

In this tutorial, you'll learn how to create a Lazorkit smart wallet using passkeys. Passkeys provide a secure, passwordless authentication method that works across devices using WebAuthn technology.

## What You'll Learn

- How to set up the Lazorkit provider
- How to trigger passkey wallet creation
- How to handle wallet connection states
- How to access the smart wallet address

## Prerequisites

- Basic React/Next.js knowledge
- A modern browser with WebAuthn support (Chrome, Safari, Edge, Firefox)
- Lazorkit SDK installed: `pnpm add @lazorkit/wallet`

## Step 1: Set Up the Lazorkit Provider

First, wrap your application with the `LazorkitProvider` to enable wallet functionality.

```typescript
// app/providers.tsx
"use client";

import { LazorkitProvider } from "@lazorkit/wallet";
import { Connection } from "@solana/web3.js";
import { useMemo, type ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  const connection = useMemo(
    () => new Connection("https://api.devnet.solana.com"),
    []
  );

  return (
    <LazorkitProvider
      connection={connection}
      portalUrl="https://portal.lazorkit.sh"
      paymasterUrl="https://kora.devnet.lazorkit.com"
      rpcUrl="https://api.devnet.solana.com"
    >
      {children}
    </LazorkitProvider>
  );
}
```

Then wrap your root layout:

```typescript
// app/layout.tsx
import { Providers } from "./providers";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

## Step 2: Create the Wallet Component

Now create a component that handles wallet creation:

```typescript
// app/wallet/page.tsx
"use client";

import { useWallet } from "@lazorkit/wallet";

export default function WalletPage() {
  const {
    connect,
    isConnected,
    isConnecting,
    smartWalletPubkey,
    error
  } = useWallet();

  const handleConnect = async () => {
    try {
      await connect(); // This triggers the passkey dialog
    } catch (err) {
      console.error("Connection failed:", err);
    }
  };

  return (
    <div>
      <h1>Passkey Smart Wallet</h1>

      {!isConnected && !isConnecting && (
        <button onClick={handleConnect}>
          Create Smart Wallet (Passkey)
        </button>
      )}

      {isConnecting && (
        <button disabled>
          Connecting...
        </button>
      )}

      {isConnected && smartWalletPubkey && (
        <div>
          <p>✅ Wallet Connected!</p>
          <p>Network: Devnet</p>
          <p>Address: {smartWalletPubkey.toBase58()}</p>
        </div>
      )}

      {error && (
        <p style={{ color: 'red' }}>
          Connection failed: {error.message}
        </p>
      )}
    </div>
  );
}
```

## Step 3: Understanding the Flow

When a user clicks "Create Smart Wallet (Passkey)":

1. **`connect()` is called** - This initiates the passkey creation flow
2. **Browser prompts for passkey** - User sees native WebAuthn dialog
3. **User authenticates** - Using fingerprint, Face ID, or PIN
4. **Smart wallet is created** - Lazorkit creates the wallet on-chain
5. **State updates** - `isConnected` becomes `true`, `smartWalletPubkey` is populated

## Step 4: Handle Connection States

The `useWallet` hook provides several states to handle:

```typescript
const {
  connect,         // Function to initiate connection
  isConnected,     // Boolean: Is wallet connected?
  isConnecting,    // Boolean: Is connection in progress?
  smartWalletPubkey, // PublicKey: Wallet address (when connected)
  error,           // Error: Connection error (if any)
  wallet           // Object: Full wallet details
} = useWallet();
```

### Example: Complete State Handling

```typescript
const status = isConnected
  ? "connected"
  : isConnecting
    ? "connecting"
    : "disconnected";

return (
  <div>
    <p>Status: {status}</p>

    {status === "disconnected" && (
      <button onClick={handleConnect}>Connect</button>
    )}

    {status === "connecting" && (
      <p>Please approve the passkey request...</p>
    )}

    {status === "connected" && (
      <p>Wallet: {smartWalletPubkey?.toBase58()}</p>
    )}
  </div>
);
```

## Step 5: Persist Wallet Connection

The Lazorkit SDK automatically persists the wallet connection. When users return:

1. The provider checks for an existing session
2. If found, automatically reconnects the wallet
3. No passkey prompt needed for returning users

To handle this, check `isLoading`:

```typescript
const { isLoading, isConnected, smartWalletPubkey } = useWallet();

if (isLoading) {
  return <p>Loading wallet...</p>;
}

if (isConnected) {
  return <p>Welcome back! {smartWalletPubkey?.toBase58()}</p>;
}

return <button onClick={connect}>Connect</button>;
```

## Common Issues and Solutions

### Issue: Passkey dialog doesn't appear

**Solution**: Ensure your site is served over HTTPS (or localhost). WebAuthn requires a secure context.

### Issue: "User canceled" error

**Solution**: This is expected when users dismiss the passkey dialog. Handle it gracefully:

```typescript
try {
  await connect();
} catch (err) {
  if (err.message.includes("canceled")) {
    console.log("User canceled passkey creation");
  } else {
    console.error("Connection failed:", err);
  }
}
```

### Issue: Wallet doesn't persist

**Solution**: Check that your provider is wrapped at the root level and not inside a component that unmounts.

## Security Considerations

1. **No private keys**: Passkeys use public-key cryptography. Private keys never leave the device.
2. **Device-bound**: Passkeys are tied to the user's device/account.
3. **Phishing resistant**: Passkeys are domain-bound and can't be phished.
4. **Biometric-protected**: Access requires fingerprint, Face ID, or device PIN.

## Next Steps

Now that you have a connected wallet, you can:

- [Send gasless transactions →](./tutorial-2-gasless-transaction.md)
- [Fetch wallet balance →](./tutorial-3-wallet-balance.md)
- [Set up automated subscriptions →](./tutorial-4-subscription-automation.md)

## Full Code Example

```typescript
"use client";

import { useWallet } from "@lazorkit/wallet";

export default function WalletPage() {
  const {
    connect,
    isConnected,
    isConnecting,
    isLoading,
    smartWalletPubkey,
    error
  } = useWallet();

  const handleConnect = async () => {
    try {
      await connect();
    } catch (err) {
      console.error("Connection failed:", err);
    }
  };

  // Show loading state while checking for existing session
  if (isLoading) {
    return (
      <div>
        <h1>Passkey Smart Wallet</h1>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div>
      <h1>Passkey Smart Wallet</h1>

      {!isConnected && !isConnecting && (
        <button onClick={handleConnect}>
          Create Smart Wallet (Passkey)
        </button>
      )}

      {isConnecting && (
        <button disabled>Connecting...</button>
      )}

      {isConnected && smartWalletPubkey && (
        <div>
          <p>✅ Wallet Connected!</p>
          <p>Network: Devnet</p>
          <p>Address: {smartWalletPubkey.toBase58()}</p>
        </div>
      )}

      {error && (
        <p style={{ color: 'red' }}>
          Connection failed: {error.message}
        </p>
      )}
    </div>
  );
}
```

## Resources

- [Lazorkit Documentation](https://docs.lazorkit.com)
- [WebAuthn Guide](https://webauthn.guide)
- [Try the Live Demo](https://lazorkit-playground.vercel.app/wallet)

---

**Next Tutorial**: [Sending a Gasless Transaction →](./tutorial-2-gasless-transaction.md)