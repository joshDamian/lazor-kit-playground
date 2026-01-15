"use client";

import { useWallet } from "@lazorkit/wallet";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import CodeSnippet from "@/app/components/CodeSnippet";
import { connection } from "@/app/providers";

export default function WalletDetailsPage() {
  const router = useRouter();

  const {
    smartWalletPubkey,
    isConnected,
    isConnecting,
    isLoading: walletLoading,
  } = useWallet();

  const [balance, setBalance] = useState<number | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  // Wait for component to mount and provider to hydrate
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsMounted(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Redirect if disconnected (only after component has mounted and provider has hydrated)
  useEffect(() => {
    if (isMounted && !walletLoading && !isConnected && !isConnecting) {
      router.push("/wallet");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMounted, walletLoading, isConnected, isConnecting]);

  // Fetch wallet SOL balance
  useEffect(() => {
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

    if (smartWalletPubkey && isMounted) {
      fetchBalance();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMounted]);

  // Show loading state while checking connection
  if (walletLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800">
        <main className="w-full max-w-2xl mx-auto px-6 py-16">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-12 border border-gray-100 dark:border-gray-700 space-y-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Wallet Details</h1>
            <p>Loading...</p>
          </div>
        </main>
      </div>
    );
  }

  // Don't render if not connected (will redirect)
  if (!isConnected) {
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800">
      <main className="w-full max-w-2xl mx-auto px-6 py-16">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-12 border border-gray-100 dark:border-gray-700 space-y-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Wallet Details</h1>

          <div className="space-y-3">
            <p className="dark:text-gray-100">
              <strong>Wallet Address:</strong>{" "}
              <span className="text-sm break-all">
                {smartWalletPubkey?.toBase58()}
              </span>
            </p>

            <p className="dark:text-gray-100">
              <strong>Network:</strong> Devnet
            </p>

            <p className="dark:text-gray-100">
              <strong>SOL Balance:</strong>{" "}
              {isLoadingBalance ? "Loading..." : `${balance?.toFixed(4)} SOL`}
            </p>
          </div>

          <CodeSnippet
            code={`import { useWallet } from "@lazorkit/wallet";
import { Connection, LAMPORTS_PER_SOL } from "@solana/web3.js";

function WalletBalanceExample() {
  const { smartWalletPubkey } = useWallet();
  const connection = new Connection("https://api.devnet.solana.com");

  const getBalance = async (): Promise<number> => {
    if (!smartWalletPubkey) return 0;

    const lamports = await connection.getBalance(smartWalletPubkey);
    return lamports / LAMPORTS_PER_SOL;
  };

  return (
    <div>
      <p>Wallet: {smartWalletPubkey?.toBase58()}</p>
      <button onClick={async () => {
        const balance = await getBalance();
        console.log(\`Balance: \${balance} SOL\`);
      }}>
        Get Balance
      </button>
    </div>
  );
}`}
          />
        </div>
      </main>
    </div>
  );
}
