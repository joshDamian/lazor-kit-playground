import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800">
      <main className="w-full max-w-2xl mx-auto px-6 py-16">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-12 border border-gray-100 dark:border-gray-700">
          <div className="text-center space-y-8">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                Lazorkit Playground
              </h1>

              <div className="mt-8 text-left bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  What this demonstrates:
                </h2>
                <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Passkey-based smart wallet creation</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Gasless Solana transactions</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Smart Wallet policies & automation</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Automated subscription billing (chunks)</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="pt-4">
              <Link
                href="/wallet"
                className="inline-block px-8 py-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
              >
                Start with Passkey Wallet
              </Link>
            </div>

            <div className="pt-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">Devnet only</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
