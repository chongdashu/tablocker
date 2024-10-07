"use client";

import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle } from "lucide-react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function RegisterConfirmation() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const emailParam = searchParams.get("email");
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white text-gray-800">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Image
              src="/images/icon128.png"
              alt="UnTab.xyz Logo"
              width={32}
              height={32}
            />
            <span className="text-xl font-bold">UnTab.xyz</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-20">
        <motion.div
          className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="text-center mb-8">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Thank you for signing up!
            </h1>
            {email && (
              <p className="text-lg text-gray-600">
                Your email ({email}) has been verified.
              </p>
            )}
          </div>

          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                How to log in to the Chrome extension:
              </h2>
              <ol className="list-decimal list-inside space-y-2 text-gray-700 pl-5">
                <li className="flex items-center">
                  <span className="mr-2">1.</span>
                  Click on the extension icon in your Chrome browser
                </li>
                <li className="flex items-center">
                  <span className="mr-2">2.</span>
                  Enter your email and password
                </li>
                <li className="flex items-center">
                  <span className="mr-2">3.</span>
                  Click the &quot;Login&quot; button
                </li>
              </ol>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Chrome Extension Login Screen:
              </h3>
              <div className="border-2 border-gray-300 rounded-md overflow-hidden">
                <Image
                  src="/images/chrome-extension-login.png"
                  alt="Chrome Extension Login Screen"
                  width={400}
                  height={300}
                  layout="responsive"
                />
              </div>
            </div>

            <div className="text-center">
              <Button
                size="lg"
                className="bg-purple-600 hover:bg-purple-700 text-white"
                onClick={() =>
                  window.open(
                    "https://chromewebstore.google.com/detail/un-tab-keep-focus-stop-di/kkkohcffjocedjphabjonopolmjfofik",
                    "_blank"
                  )
                }
              >
                Get Un-Tab Extension
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </motion.div>
      </main>

      <footer className="container mx-auto px-4 py-8 text-center text-sm text-gray-600">
        <p>&copy; {new Date().getFullYear()} UnTab.xyz. All rights reserved.</p>
      </footer>
    </div>
  );
}
