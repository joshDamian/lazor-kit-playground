"use client";

import { useWallet } from "@lazorkit/wallet";
import { PublicKey, LAMPORTS_PER_SOL, SystemProgram } from "@solana/web3.js";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import CodeSnippet from "@/app/components/CodeSnippet";

export default function TransferPage() {
  const router = useRouter();

  const {
    smartWalletPubkey,
    isConnected,
    isConnecting,
    isLoading,
    signAndSendTransaction,
    isSigning,
  } = useWallet();

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
    if (isMounted && !isLoading && !isConnected && !isConnecting) {
      router.push("/wallet");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMounted, isLoading, isConnected, isConnecting]);

  // Form state
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState<
    "idle" | "sending" | "success" | "error"
  >("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const truncateHash = (hash: string) => {
    if (hash.length <= 32) return hash;
    return `${hash.slice(0, 16)}...${hash.slice(-16)}`;
  };

  const handleCopy = async () => {
    if (signature) {
      await navigator.clipboard.writeText(signature);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSend = async () => {
    setStatus("sending");
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!recipient || !amount || Number(amount) <= 0) {
      setErrorMsg("Enter valid recipient and amount");
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
      setSuccessMsg("Transaction sent successfully!");
      setStatus("success");

      setRecipient("");
      setAmount("");
    } catch (err: unknown) {
      console.log(err);
      setErrorMsg((err as Error).message || "Transaction failed");
      setStatus("error");
    }
  };

  // Show loading state while checking connection
  if (isLoading && !isSigning) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800">
        <main className="w-full max-w-2xl mx-auto px-6 py-16">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-12 border border-gray-100 dark:border-gray-700 space-y-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Gasless Transaction
            </h1>
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Gasless Transaction
          </h1>

          <p>Wallet: {smartWalletPubkey?.toBase58()}</p>

          <div className="space-y-4">
            <input
              type="text"
              placeholder="Recipient address"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              className="w-full p-3 border rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400"
            />

            <input
              type="number"
              placeholder="Amount (SOL)"
              value={amount}
              step={0.00000001}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full p-3 border rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400"
            />

            <button
              onClick={handleSend}
              disabled={status === "sending"}
              className={`px-8 py-4 font-semibold rounded-lg shadow-lg transition-colors ${
                status === "sending"
                  ? "bg-gray-400 text-white"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              {status === "sending" ? "Sending..." : "Send Transaction"}
            </button>
          </div>

          {successMsg && (
            <div className="space-y-2">
              <p className="text-green-600 dark:text-green-400">{successMsg}</p>
              {signature && (
                <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
                  <span className="text-sm text-gray-700 dark:text-gray-300 font-mono">
                    {truncateHash(signature)}
                  </span>
                  <button
                    onClick={handleCopy}
                    className="ml-auto px-3 py-1 text-sm bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:hover:bg-blue-800 text-blue-700 dark:text-blue-300 rounded transition-colors"
                  >
                    {copied ? "Copied!" : "Copy"}
                  </button>
                </div>
              )}
            </div>
          )}
          {errorMsg && <p className="text-red-500 dark:text-red-400">{errorMsg}</p>}

          <CodeSnippet
            code={`import { useWallet } from "@lazorkit/wallet";
import { SystemProgram, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";

function TransferExample() {
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
}`}
          />
        </div>
      </main>
    </div>
  );
}
