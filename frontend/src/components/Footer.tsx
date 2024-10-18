import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-gray-100 py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap justify-between">
          <div className="w-full md:w-1/3 mb-6 md:mb-0">
            <h3 className="text-lg font-semibold mb-2 text-black">UnTab.xyz</h3>
            <p className="text-sm text-gray-600">
              Keep Focus; Stop Distractions
            </p>
          </div>
          <div className="w-full md:w-1/3 mb-6 md:mb-0">
            <h3 className="text-lg font-semibold mb-2 text-black">
              Quick Links
            </h3>
            <ul className="text-sm">
              <li>
                <Link href="/" className="text-gray-600 hover:text-purple-600">
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href="/#how-it-works"
                  className="text-gray-600 hover:text-purple-600"
                >
                  How It Works
                </Link>
              </li>
              <li>
                <Link
                  href="/#pricing"
                  className="text-gray-600 hover:text-purple-600"
                >
                  Pricing
                </Link>
              </li>
              <li>
                <Link
                  href="/#faq"
                  className="text-gray-600 hover:text-purple-600"
                >
                  FAQ
                </Link>
              </li>
            </ul>
          </div>
          <div className="w-full md:w-1/3">
            <h3 className="text-lg font-semibold mb-2 text-black">Legal</h3>
            <ul className="text-sm">
              <li>
                <Link
                  href="/privacy-policy"
                  className="text-gray-600 hover:text-purple-600"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms-of-service"
                  className="text-gray-600 hover:text-purple-600"
                >
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 text-center text-sm text-gray-600">
          <p>&copy; {new Date().getFullYear()} Un-Tab. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
