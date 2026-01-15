# Lazorkit Playground

A comprehensive demonstration of Lazorkit Smart Wallet capabilities, showcasing passkey-based authentication, gasless transactions, and automated subscription billing on Solana.

**🚀 [Live Demo](https://lazorkit-playground.vercel.app/)**

## 🌟 Features

- **Passkey Authentication**: Create smart wallets using WebAuthn passkeys - no seed phrases needed
- **Gasless Transactions**: Send SOL transfers without paying gas fees (paymaster-enabled)
- **Smart Wallet Details**: View wallet address, network, and SOL balance
- **Automated Subscriptions**: Pre-authorize recurring payments using Smart Wallet chunks/mandates
- **Developer Tutorials**: Step-by-step guides with working code examples
- **Dark Mode Support**: Full UI dark mode implementation
- **Mobile Responsive**: Works seamlessly on desktop and mobile devices

## 📚 What This Demonstrates

This playground showcases key Lazorkit features:

1. **Passkey-Based Wallet Creation**: Secure, passwordless authentication using device biometrics
2. **Gasless SOL Transfers**: Paymaster-sponsored transactions for seamless UX
3. **Smart Wallet Policies**: Pre-authorized transaction chunks for automation
4. **Session Management**: Persistent wallet connection across devices
5. **Subscription Automation**: Real-world SaaS billing use case with one-time authorization

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and pnpm (or npm/yarn)
- A modern browser with WebAuthn support (Chrome, Safari, Edge, Firefox)

### Installation

```bash
# Clone the repository
git clone https://github.com/joshDamian/lazor-kit-playground.git
cd lazor-kit-playground

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
```

### Environment Setup

Create a `.env.local` file in the root directory with the following variables:

```env
NEXT_PUBLIC_SOLANA_RPC_URL=
NEXT_PUBLIC_PAYMASTER_URL=https://kora.devnet.lazorkit.com
NEXT_PUBLIC_PORTAL_URL=
```

### Run Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📖 Step-by-Step Tutorials

Detailed tutorials are available in the `/docs` folder:

1. [Creating a Passkey-Based Smart Wallet](docs/tutorial-1-create-wallet.md)
2. [Sending a Gasless Transaction](docs/tutorial-2-gasless-transaction.md)
3. [Fetching Wallet Balance](docs/tutorial-3-wallet-balance.md)
4. [Automated Subscription Billing](docs/tutorial-4-subscription-automation.md)

You can also explore interactive tutorials within the app at `/tutorials`.

## 🏗️ Project Structure

```
lazorkit-guide/
├── app/
│   ├── components/         # Reusable UI components
│   │   ├── CodeSnippet.tsx # Syntax-highlighted code display
│   │   └── Navbar.tsx      # Navigation component
│   ├── wallet/             # Wallet creation page
│   ├── transfer/           # Gasless transaction page
│   ├── details/            # Wallet details page
│   ├── subscribe/          # Subscription automation demo
│   ├── tutorials/          # Interactive tutorials
│   ├── layout.tsx          # Root layout with providers
│   ├── page.tsx            # Home page
│   └── providers.tsx       # Lazorkit provider setup
├── lib/
│   ├── constants.ts        # App configuration
│   ├── plans.ts            # Subscription plan definitions
│   ├── utils.ts            # Utility functions
│   └── lazorkitPolicy.ts   # Smart wallet policy configuration
├── docs/                   # Tutorial markdown files
└── public/                 # Static assets
```

## 🔑 Key Implementation Files

### Provider Setup (`app/providers.tsx`)
Configures the Lazorkit wallet provider with connection and policy settings.

### Wallet Connection (`app/wallet/page.tsx`)
Demonstrates passkey-based wallet creation using `useWallet()` hook.

### Gasless Transaction (`app/transfer/page.tsx`)
Shows how to construct and send gasless SOL transfers with `signAndSendTransaction()`.

### Subscription Automation (`app/subscribe/page.tsx`)
Advanced example using Smart Wallet chunks for pre-authorized recurring payments.

## 🛠️ Core SDK Usage

### Install Lazorkit SDK

```bash
pnpm add @lazorkit/wallet
```

### Basic Wallet Setup

```typescript
import { LazorkitProvider } from "@lazorkit/wallet";
import { Connection } from "@solana/web3.js";

const connection = new Connection("https://api.devnet.solana.com");

function App() {
  return (
    <LazorkitProvider
      connection={connection}
      portalUrl="https://portal.lazorkit.sh"
      paymasterUrl="https://kora.devnet.lazorkit.com"
    >
      <YourApp />
    </LazorkitProvider>
  );
}
```

### Create Wallet with Passkey

```typescript
import { useWallet } from "@lazorkit/wallet";

function WalletComponent() {
  const { connect, isConnected, smartWalletPubkey } = useWallet();

  return (
    <button onClick={() => connect()}>
      {isConnected ? smartWalletPubkey?.toBase58() : "Connect Wallet"}
    </button>
  );
}
```

### Send Gasless Transaction

```typescript
import { useWallet } from "@lazorkit/wallet";
import { SystemProgram, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";

function TransferComponent() {
  const { signAndSendTransaction, smartWalletPubkey } = useWallet();

  const sendTransaction = async () => {
    const instruction = SystemProgram.transfer({
      fromPubkey: smartWalletPubkey!,
      toPubkey: new PublicKey("recipient..."),
      lamports: 0.1 * LAMPORTS_PER_SOL,
    });

    const signature = await signAndSendTransaction({
      instructions: [instruction],
    });

    console.log("Transaction signature:", signature);
  };

  return <button onClick={sendTransaction}>Send SOL</button>;
}
```

## 🎨 UI Components

### CodeSnippet Component
Displays syntax-highlighted code examples with copy functionality.

### Navbar Component
Responsive navigation with active route highlighting and dark mode support.

## 🌐 Deployment

### Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Add environment variables in Vercel dashboard
```

### Deploy to Netlify

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy --prod

# Set environment variables in Netlify dashboard
```

## 📱 Network Configuration

This app is configured for **Solana Devnet** by default. To test:

1. **Create a passkey wallet** - No funds needed initially
2. **Get devnet SOL** - Visit [Solana Faucet](https://faucet.solana.com/)
   - Paste your smart wallet address
   - Request 1-2 SOL
3. **Get devnet USDC** - Visit [Circle USDC Faucet](https://faucet.circle.com/)
   - Select "Solana Devnet" network
   - Paste your smart wallet address
   - Request test USDC tokens
4. **Try the features** - Test gasless transactions and subscription automation

## 🔐 Security Notes

- **No private keys stored**: Passkeys use device biometrics
- **No secrets in frontend**: All sensitive keys in environment variables
- **Paymaster protection**: Production apps should validate requests server-side
- **Mandate expiration**: Subscription chunks have 30-day expiry by default

## 🧪 Testing

```bash
# Run linter
pnpm lint

# Type checking
pnpm build
```

## 📚 Additional Resources

- [Lazorkit Documentation](https://docs.lazorkit.com)
- [Solana Documentation](https://docs.solana.com)
- [WebAuthn Guide](https://webauthn.guide)

## 🤝 Contributing

This is a demonstration project for the Lazorkit bounty. Feel free to fork and experiment!

## 📄 License

MIT

## 🙋 Support

For questions about Lazorkit SDK:
- [Lazorkit Telegram](https://t.me/lazorkit)
- [Lazorkit Twitter](https://twitter.com/lazorkit)
- [Lazorkit Github](https://github.com/lazor-kit)

Built with ❤️ using [Lazorkit](https://lazorkit.com) and [Next.js](https://nextjs.org)