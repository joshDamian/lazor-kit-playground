"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { name: "Overview", path: "/" },
  { name: "Wallet", path: "/wallet" },
  { name: "Transfer", path: "/transfer" },
  { name: "Details", path: "/details" },
  { name: "Subscribe", path: "/subscribe" },
  { name: "Tutorials", path: "/tutorials" },
];

export default function Navbar() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(path);
  };

  return (
    <nav className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="py-6 border-b border-gray-100 dark:border-gray-800">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Lazorkit Playground
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Passkeys • Smart Wallet • Gasless
          </p>
        </div>
        <div className="hidden md:block">
          <div className="flex space-x-1 py-4">
            {navItems.map((item) => {
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`
                    relative px-4 py-2 text-sm font-medium transition-colors
                    ${
                      active
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                    }
                  `}
                >
                  {item.name}
                  {active && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400" />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
      <div className="md:hidden border-t border-gray-200 dark:border-gray-700">
        <div className="flex overflow-x-auto">
          {navItems.map((item) => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`
                  flex-shrink-0 relative px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors
                  ${
                    active
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                  }
                `}
              >
                {item.name}
                {active && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400" />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}