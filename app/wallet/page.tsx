"use client";

import { useWallet } from "@lazorkit/wallet";
import { useRouter } from "next/navigation";
import CodeSnippet from "@/app/components/CodeSnippet";

export default function WalletPage() {
  const router = useRouter();

  const { smartWalletPubkey, isConnected, isConnecting, error, connect } =
    useWallet();

  const status = isConnected
    ? "connected"
    : isConnecting
      ? "connecting"
      : "disconnected";

  const handleConnect = async () => {
    try {
      await connect();
    } catch (err) {
      console.error("Connection failed:", err);
    }
  };

  const goToTransfer = () => router.push("/transfer");

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
      <main className="w-full max-w-2xl mx-auto px-6 py-16">
        <div className="bg-white rounded-2xl shadow-xl p-12 border border-gray-100 space-y-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Passkey Smart Wallet
          </h1>

          <p>
            Status:{" "}
            <strong>{status.charAt(0).toUpperCase() + status.slice(1)}</strong>
          </p>

          {status === "disconnected" && (
            <button
              onClick={handleConnect}
              className="px-8 py-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
            >
              Create Smart Wallet (Passkey)
            </button>
          )}

          {status === "connecting" && (
            <button
              disabled
              className="px-8 py-4 bg-gray-400 text-white font-semibold rounded-lg"
            >
              Connecting...
            </button>
          )}

          {status === "connected" && smartWalletPubkey && (
            <>
              <p>Network: Devnet</p>
              <p>Wallet Address: {smartWalletPubkey.toBase58()}</p>

              <button
                onClick={goToTransfer}
                className="px-8 py-4 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors shadow-lg hover:shadow-xl mt-4"
              >
                Go to Gasless Transaction
              </button>
            </>
          )}

          {error && (
            <p className="text-red-500">Connection failed: {error.message}</p>
          )}

          <CodeSnippet
            code={`import { useWallet } from "@lazorkit/wallet";

function WalletExample() {
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
}`}
          />
        </div>
      </main>
    </div>
  );
}
