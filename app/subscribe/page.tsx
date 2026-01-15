"use client";

import { useState } from "react";
import {
  asPasskeyPublicKey,
  credentialHashFromBase64,
  LazorkitClient,
  SmartWalletAction,
  SmartWalletActionArgs,
  Transaction,
  useWallet,
  DialogManager,
  Paymaster,
} from "@lazorkit/wallet";
import { PLANS, Plan } from "@/lib/plans";
import {
  getConnection,
  MERCHANT_WALLET,
  PAYMASTER_PAYER_KORA,
  PAYMASTER_URL,
  PORTAL_URL,
  RPC_URL,
} from "@/lib/constants";

import { BN } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { createUsdcTransferIx } from "@/lib/utils";
import CodeSnippet from "@/app/components/CodeSnippet";

/**
 * Creates a mandate (chunk) on the smart wallet that authorizes recurring USDC transfers.
 * The user signs once with their passkey to authorize future automated payments.
 */
export async function executeSubscriptionChunk(
  lazorkitClient: LazorkitClient,
  smartWallet: PublicKey,
  passkeyPublicKey: number[],
  credentialId: string,
  payer: PublicKey,
  action: SmartWalletActionArgs,
) {
  const credentialHash = credentialHashFromBase64(credentialId);

  const timestamp = new BN(Math.floor(Date.now() / 1000));
  const authMessage = await lazorkitClient.buildAuthorizationMessage({
    action,
    payer,
    smartWallet,
    passkeyPublicKey,
    credentialHash,
    timestamp,
  });

  console.log("📝 Building mandate authorization...");

  const dialogManager = new DialogManager({
    portalUrl: PORTAL_URL,
    rpcUrl: RPC_URL,
    paymasterUrl: PAYMASTER_URL,
  });

  const signResult = await dialogManager.openSignMessage(
    authMessage.toString("base64"),
    credentialId,
  );

  console.log("✅ User signed mandate with passkey");

  const passkeySignature = {
    passkeyPublicKey: asPasskeyPublicKey(passkeyPublicKey),
    signature64: signResult.signature,
    clientDataJsonRaw64: signResult.clientDataJsonBase64,
    authenticatorDataRaw64: signResult.authenticatorDataBase64,
  };

  const transactionResult = await lazorkitClient.createChunkTxn(
    {
      payer,
      smartWallet,
      passkeySignature,
      credentialHash,
      cpiInstructions: action.args.cpiInstructions,
      timestamp,
    },
    { computeUnitLimit: 300000 },
  );

  console.log("🔐 Creating mandate transaction on-chain...");

  const paymaster = new Paymaster({ paymasterUrl: PAYMASTER_URL });

  // If transactionResult returns a Transaction object:
  return await paymaster.signAndSend(transactionResult as Transaction);
}

export default function SubscribePage() {
  const { smartWalletPubkey, isConnected, wallet } = useWallet();
  const [planStates, setPlanStates] = useState<
    Record<
      string,
      {
        mandateSignature: string | null;
        showExecuteButton: boolean;
        isCreatingMandate: boolean;
        isExecuting: boolean;
        expiresAt: number | null;
      }
    >
  >({});

  /**
   * Creates a subscription mandate (pre-authorized payment chunk)
   * User authorizes once with passkey, allowing future payments without approval
   */
  const createMandate = async (plan: Plan) => {
    if (!smartWalletPubkey || !isConnected || !wallet) return;

    // Set loading state
    setPlanStates((prev) => ({
      ...prev,
      [plan.id]: {
        ...prev[plan.id],
        isCreatingMandate: true,
      },
    }));

    try {
      // Mandate expires in 30 days
      const expirationTimestamp =
        Math.floor(new Date().getTime() / 1000) + 30 * 24 * 60 * 60;

      console.log("🎯 Creating subscription mandate with details:", {
        plan: plan.label,
        amount: `${plan.price} USDC`,
        recipient: MERCHANT_WALLET,
        recipientShort: `${MERCHANT_WALLET.slice(0, 4)}...${MERCHANT_WALLET.slice(-4)}`,
        expiresAt: new Date(expirationTimestamp * 1000).toLocaleDateString(),
        expiresIn: "30 days",
      });

      const lazorkitClient = new LazorkitClient(getConnection());
      const usdcTransferIx = await createUsdcTransferIx(
        smartWalletPubkey,
        new PublicKey(MERCHANT_WALLET),
        plan.price,
      );

      console.log("💰 Mandate allows USDC transfers:", {
        token: "USDC",
        amount: plan.price,
        recipient: MERCHANT_WALLET,
        frequency: `Every ${plan.intervalDays} days`,
        expiresAt: new Date(expirationTimestamp * 1000).toISOString(),
      });

      const subscriptionMandateTx = await executeSubscriptionChunk(
        lazorkitClient,
        smartWalletPubkey,
        wallet.passkeyPubkey,
        wallet.credentialId,
        new PublicKey(PAYMASTER_PAYER_KORA),
        {
          type: SmartWalletAction.CreateChunk,
          args: {
            cpiInstructions: [usdcTransferIx],
            expiresAt: expirationTimestamp,
          },
        },
      );
      console.log("✅ Mandate creation TX signature:", subscriptionMandateTx);

      // Update state with signature and expiry
      setPlanStates((prev) => ({
        ...prev,
        [plan.id]: {
          ...prev[plan.id],
          mandateSignature: subscriptionMandateTx,
          expiresAt: expirationTimestamp,
          isCreatingMandate: false,
        },
      }));

      // Show execute button after 10 seconds (simulates backend confirmation)
      setTimeout(() => {
        setPlanStates((prev) => ({
          ...prev,
          [plan.id]: {
            ...prev[plan.id],
            showExecuteButton: true,
          },
        }));
      }, 10000);
    } catch (error) {
      console.error("❌ Failed to create mandate:", error);
      setPlanStates((prev) => ({
        ...prev,
        [plan.id]: {
          ...prev[plan.id],
          isCreatingMandate: false,
        },
      }));
    }
  };

  /**
   * Executes a payment using the pre-authorized mandate
   * No passkey approval needed - the mandate was already authorized
   */
  const executePayment = async (plan: Plan) => {
    if (!smartWalletPubkey || !isConnected || !wallet) return;

    // Set loading state
    setPlanStates((prev) => ({
      ...prev,
      [plan.id]: {
        ...prev[plan.id],
        isExecuting: true,
      },
    }));

    try {
      console.log("🔄 Executing payment using pre-authorized mandate:", {
        plan: plan.label,
        amount: `${plan.price} USDC`,
        noPasskeyRequired: true,
        note: "Payment authorized by existing mandate",
      });

      const lazorkitClient = new LazorkitClient(getConnection());
      const usdcTransferIx = await createUsdcTransferIx(
        smartWalletPubkey,
        new PublicKey(MERCHANT_WALLET),
        plan.price,
      );

      const transactionResult = await lazorkitClient.executeChunkTxn(
        {
          payer: new PublicKey(PAYMASTER_PAYER_KORA),
          smartWallet: smartWalletPubkey,
          cpiInstructions: [usdcTransferIx], // The pre-authorized instructions
        },
        {
          computeUnitLimit: 300000, // Recommended for complex CPIs
        },
      );

      const paymaster = new Paymaster({ paymasterUrl: PAYMASTER_URL });

      const executionTx = await paymaster.signAndSend(
        transactionResult as Transaction,
      );

      console.log("✅ Payment executed successfully:", {
        txSignature: executionTx,
        amount: `${plan.price} USDC`,
        recipient: MERCHANT_WALLET,
        automatedPayment: true,
      });

      setPlanStates((prev) => ({
        ...prev,
        [plan.id]: {
          ...prev[plan.id],
          isExecuting: false,
          mandateSignature: executionTx,
        },
      }));
    } catch (error) {
      console.error("❌ Failed to execute payment:", error);
      setPlanStates((prev) => ({
        ...prev,
        [plan.id]: {
          ...prev[plan.id],
          isExecuting: false,
        },
      }));
    }
  };

  if (!isConnected) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800">
        <main className="w-full max-w-2xl mx-auto px-6 py-16">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-12 border border-gray-100 dark:border-gray-700 space-y-6">
            <p className="text-gray-900 dark:text-gray-100">
              Connect your LazorKit wallet to subscribe.
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800">
      <main className="w-full max-w-2xl mx-auto px-6 py-16">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-12 border border-gray-100 dark:border-gray-700 space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Automated Subscription Billing
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Authorize once with your passkey, then payments execute
              automatically without further approval
            </p>
          </div>

          {/* How It Works Section */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-blue-900 dark:text-blue-300 mb-3">
              How It Works
            </h2>
            <ol className="space-y-2 text-sm text-blue-800 dark:text-blue-300">
              <li className="flex items-start">
                <span className="font-semibold mr-2">1.</span>
                <span>
                  <strong>Subscribe:</strong> You authorize the subscription
                  once with your passkey
                </span>
              </li>
              <li className="flex items-start">
                <span className="font-semibold mr-2">2.</span>
                <span>
                  <strong>Mandate Created:</strong> A payment mandate (chunk) is
                  stored on your smart wallet
                </span>
              </li>
              <li className="flex items-start">
                <span className="font-semibold mr-2">3.</span>
                <span>
                  <strong>Automated Billing:</strong> Future payments execute
                  automatically without passkey approval
                </span>
              </li>
            </ol>
          </div>

          {/* What is a Mandate Explanation */}
          <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
              💡 What is a Mandate?
            </h3>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              A mandate is a pre-authorized transaction chunk on your smart
              wallet. It allows specific USDC transfers to a merchant until the
              mandate expires. This enables automated SaaS billing without
              repeated passkey approvals.
            </p>
          </div>

          <div className="space-y-4">
            {PLANS.map((plan) => {
              const state = planStates[plan.id] || {
                mandateSignature: null,
                showExecuteButton: false,
                isCreatingMandate: false,
                isExecuting: false,
                expiresAt: null,
              };

              return (
                <div
                  key={plan.id}
                  className="border border-gray-200 dark:border-gray-700 p-6 rounded-lg bg-gray-50 dark:bg-gray-800 space-y-3"
                >
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    {plan.label}
                  </h2>
                  <p className="text-gray-700 dark:text-gray-300">
                    ${plan.price} USDC every {plan.intervalDays} days
                  </p>

                  {/* Show mandate details if available */}
                  {state.mandateSignature && (
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg space-y-2">
                      <p className="text-sm text-green-800 dark:text-green-300 font-semibold">
                        ✅ Mandate Created
                      </p>

                      {/* Mandate Details */}
                      <div className="space-y-1 text-xs text-green-700 dark:text-green-400">
                        <div className="flex justify-between">
                          <span className="font-medium">Amount:</span>
                          <span>{plan.price} USDC</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Merchant:</span>
                          <span className="font-mono">
                            {MERCHANT_WALLET.slice(0, 6)}...
                            {MERCHANT_WALLET.slice(-6)}
                          </span>
                        </div>
                        {state.expiresAt && (
                          <div className="flex justify-between">
                            <span className="font-medium">Expires:</span>
                            <span>
                              {new Date(
                                state.expiresAt * 1000,
                              ).toLocaleDateString()}{" "}
                              (30 days)
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Transaction Signature */}
                      <div className="pt-2 border-t border-green-200 dark:border-green-800">
                        <p className="text-xs text-green-700 dark:text-green-400 font-mono break-all">
                          {state.mandateSignature.slice(0, 20)}...
                          {state.mandateSignature.slice(-20)}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => createMandate(plan)}
                      disabled={
                        state.isCreatingMandate || !!state.mandateSignature
                      }
                      className={`px-6 py-3 font-semibold rounded-lg transition-colors shadow-lg hover:shadow-xl ${
                        state.isCreatingMandate || state.mandateSignature
                          ? "bg-gray-400 dark:bg-gray-600 text-white cursor-not-allowed"
                          : "bg-blue-600 text-white hover:bg-blue-700"
                      }`}
                    >
                      {state.isCreatingMandate
                        ? "Creating..."
                        : state.mandateSignature
                          ? "Subscribed"
                          : "Subscribe Now"}
                    </button>

                    {/* Execute button appears after 10 seconds */}
                    {state.showExecuteButton && (
                      <button
                        onClick={() => executePayment(plan)}
                        disabled={state.isExecuting}
                        className={`px-6 py-3 font-semibold rounded-lg transition-colors shadow-lg hover:shadow-xl ${
                          state.isExecuting
                            ? "bg-gray-400 dark:bg-gray-600 text-white cursor-not-allowed"
                            : "bg-green-600 text-white hover:bg-green-700"
                        }`}
                      >
                        {state.isExecuting
                          ? "Processing..."
                          : "Execute Payment"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Developer Example Section */}
          <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700 space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Developer Example: Automated USDC Subscriptions
              </h2>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Users approve a payment mandate once with their passkey. Future
                payments are executed automatically without repeated passkey
                approval.
              </p>
            </div>

            {/* Snippet 1: Build Authorization Message */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                1. Build Authorization Message
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Create the authorization message that the user will sign with
                their passkey to approve the mandate.
              </p>
              <CodeSnippet
                code={`const timestamp = new BN(Math.floor(Date.now() / 1000));
const credentialHash = credentialHashFromBase64(credentialId);

const authMessage = await lazorkitClient.buildAuthorizationMessage({
  action: {
    type: SmartWalletAction.CreateChunk,
    args: {
      cpiInstructions: [usdcTransferIx],
      expiresAt: expirationTimestamp,
    },
  },
  payer: new PublicKey(PAYMASTER_PAYER_KORA),
  smartWallet: smartWalletPubkey,
  passkeyPublicKey: wallet.passkeyPubkey,
  credentialHash,
  timestamp,
});`}
              />
            </div>

            {/* Snippet 2: Sign with Passkey */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                2. Sign with Passkey
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Open the passkey dialog for the user to authorize the mandate.
              </p>
              <CodeSnippet
                code={`const dialogManager = new DialogManager({
  portalUrl: PORTAL_URL,
  rpcUrl: RPC_URL,
  paymasterUrl: PAYMASTER_URL,
});

const signResult = await dialogManager.openSignMessage(
  authMessage.toString("base64"),
  credentialId
);

const passkeySignature = {
  passkeyPublicKey: asPasskeyPublicKey(wallet.passkeyPubkey),
  signature64: signResult.signature,
  clientDataJsonRaw64: signResult.clientDataJsonBase64,
  authenticatorDataRaw64: signResult.authenticatorDataBase64,
};`}
              />
            </div>

            {/* Snippet 3: Create Mandate on Smart Wallet */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                3. Create Mandate on Smart Wallet
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Store the pre-authorized payment chunk on-chain.
              </p>
              <CodeSnippet
                code={`const transactionResult = await lazorkitClient.createChunkTxn(
  {
    payer: new PublicKey(PAYMASTER_PAYER_KORA),
    smartWallet: smartWalletPubkey,
    passkeySignature,
    credentialHash,
    cpiInstructions: [usdcTransferIx],
    timestamp,
  },
  { computeUnitLimit: 300000 }
);

const paymaster = new Paymaster({ paymasterUrl: PAYMASTER_URL });
const mandateTx = await paymaster.signAndSend(transactionResult);`}
              />
            </div>

            {/* Snippet 4: Execute Automated Payment */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                4. Execute Automated Payment
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Execute a payment using the pre-authorized mandate (no passkey
                required).
              </p>
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-sm">
                <p className="text-amber-800 dark:text-amber-300">
                  <strong>💡 Production Setup:</strong> In a real application,
                  this execution step would typically be handled by your backend
                  as a recurring job (e.g., cron job, scheduled task). The
                  backend monitors subscriptions and executes payments
                  automatically at the appropriate intervals without user
                  interaction.
                </p>
              </div>
              <CodeSnippet
                code={`// No passkey signature needed - using the pre-authorized chunk
const transactionResult = await lazorkitClient.executeChunkTxn(
  {
    payer: new PublicKey(PAYMASTER_PAYER_KORA),
    smartWallet: smartWalletPubkey,
    cpiInstructions: [usdcTransferIx],
  },
  {
    computeUnitLimit: 300000,
  }
);

const paymaster = new Paymaster({ paymasterUrl: PAYMASTER_URL });
const executionTx = await paymaster.signAndSend(transactionResult);`}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
