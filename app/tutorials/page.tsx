"use client";

import { useState } from "react";
import CodeSnippet from "@/app/components/CodeSnippet";
import Link from "next/link";

const tutorials = [
  {
    title: "Create a Passkey-Based Smart Wallet",
    description:
      "Learn how to create a Lazorkit smart wallet using passkeys in your app. Passkeys provide a secure, passwordless authentication method that works across devices.",
    code: `import { useWallet } from "@lazorkit/wallet";

function CreateWalletExample() {
  const { connect } = useWallet();

  const handleConnect = async (): Promise<void> => {
    try {
      await connect(); // triggers passkey wallet creation
    } catch (error) {
      console.error("Connection failed:", error);
    }
  };

  return (
    <button onClick={handleConnect}>
      Create Smart Wallet (Passkey)
    </button>
  );
}`,
    link: "/wallet",
  },
  {
    title: "Send a Gasless Transaction",
    description:
      "Step-by-step guide to sending a gasless SOL transfer using your Lazorkit smart wallet. The paymaster covers transaction fees, making it seamless for end users.",
    code: `import { useWallet } from "@lazorkit/wallet";
import { SystemProgram, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";

function GaslessTransferExample() {
  const { smartWalletPubkey, signAndSendTransaction } = useWallet();

  const sendGaslessTransaction = async (
    recipient: string,
    amount: number
  ): Promise<string> => {
    const instruction = SystemProgram.transfer({
      fromPubkey: smartWalletPubkey!,
      toPubkey: new PublicKey(recipient),
      lamports: amount * LAMPORTS_PER_SOL,
    });

    const signature = await signAndSendTransaction({
      instructions: [instruction],
    });
    return signature;
  };

  return (
    <button onClick={() => sendGaslessTransaction("recipient...", 0.1)}>
      Send Transaction
    </button>
  );
}`,
    link: "/transfer",
  },
  {
    title: "Fetch Wallet Balance",
    description:
      "Learn how to fetch and display your smart wallet's SOL balance on Solana Devnet using the Connection API.",
    code: `import { useWallet } from "@lazorkit/wallet";
import { Connection, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useState, useEffect } from "react";

function WalletBalanceExample() {
  const { smartWalletPubkey } = useWallet();
  const [balance, setBalance] = useState<number | null>(null);

  const connection = new Connection("https://api.devnet.solana.com");

  useEffect(() => {
    const fetchBalance = async () => {
      if (!smartWalletPubkey) return;

      const lamports = await connection.getBalance(smartWalletPubkey);
      setBalance(lamports / LAMPORTS_PER_SOL);
    };

    fetchBalance();
  }, [smartWalletPubkey]);

  return (
    <div>
      <p>Balance: {balance?.toFixed(4)} SOL</p>
    </div>
  );
}`,
    link: "/details",
  },
  {
    title: "Automated Subscription Billing",
    description:
      "Learn how to create pre-authorized payment mandates (chunks) for automated subscriptions. Users authorize once with their passkey, and future payments execute automatically without repeated approval.",
    code: `import { LazorkitClient, SmartWalletAction } from "@lazorkit/wallet";

async function createSubscriptionMandate(
  lazorkitClient: LazorkitClient,
  smartWallet: PublicKey,
  usdcTransferIx: TransactionInstruction,
  expiresAt: number
) {
  // Build authorization message
  const authMessage = await lazorkitClient.buildAuthorizationMessage({
    action: {
      type: SmartWalletAction.CreateChunk,
      args: {
        cpiInstructions: [usdcTransferIx],
        expiresAt,
      },
    },
    payer,
    smartWallet,
    passkeyPublicKey,
    credentialHash,
    timestamp,
  });

  // User signs with passkey
  const signResult = await dialogManager.openSignMessage(
    authMessage.toString("base64"),
    credentialId
  );

  // Create mandate on smart wallet
  return await lazorkitClient.createChunkTxn({
    payer,
    smartWallet,
    passkeySignature,
    credentialHash,
    cpiInstructions: [usdcTransferIx],
    timestamp,
  });
}`,
    link: "/subscribe",
  },
];

export default function TutorialsPage() {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const toggleExpand = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800">
      <main className="w-full max-w-3xl mx-auto px-6 py-16 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">
            Lazorkit Tutorials
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Learn how to build with passkey-based smart wallets and gasless
            transactions
          </p>
        </div>

        <div className="space-y-4">
          {tutorials.map((tut, idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden transition-all"
            >
              <div
                className="flex justify-between items-center cursor-pointer p-6 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                onClick={() => toggleExpand(idx)}
              >
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {tut.title}
                </h2>
                <span className="text-2xl text-blue-600 dark:text-blue-400 font-bold">
                  {expandedIndex === idx ? "−" : "+"}
                </span>
              </div>

              {expandedIndex === idx && (
                <div className="px-6 pb-6 space-y-4 border-t border-gray-100 dark:border-gray-700 pt-4">
                  <p className="text-gray-700 dark:text-gray-300">{tut.description}</p>

                  <CodeSnippet code={tut.code} />

                  {tut.link && (
                    <Link
                      href={tut.link}
                      className="inline-block px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
                    >
                      Try Example
                    </Link>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
