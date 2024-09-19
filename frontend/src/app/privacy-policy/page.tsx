const PrivacyPolicy = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
      <p className="mb-4">Last updated: {new Date().toLocaleDateString()}</p>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">1. Introduction</h2>
        <p>
          Welcome to Un-Tab (&quot;we&quot;, &quot;our&quot;, or
          &quot;us&quot;). We are committed to protecting your personal
          information and your right to privacy. This Privacy Policy explains
          how we collect, use, disclose, and safeguard your information when you
          use our browser extension and website.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">
          2. Information We Collect
        </h2>
        <p>
          We collect information that you provide directly to us, such as when
          you create an account or use our services. This may include:
        </p>
        <ul className="list-disc pl-6 mt-2">
          <li>Email address</li>
          <li>Usage data (e.g., websites you choose to block)</li>
          <li>Device information</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">
          3. How We Use Your Information
        </h2>
        <p>We use the information we collect to:</p>
        <ul className="list-disc pl-6 mt-2">
          <li>Provide, maintain, and improve our services</li>
          <li>Process transactions</li>
          <li>Send you technical notices and support messages</li>
          <li>Respond to your comments and questions</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">4. Data Security</h2>
        <p>
          We implement appropriate technical and organizational measures to
          protect the security of your personal information. However, please
          note that no method of transmission over the Internet or electronic
          storage is 100% secure.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">5. Your Rights</h2>
        <p>
          Depending on your location, you may have certain rights regarding your
          personal information, such as the right to access, correct, or delete
          your data. To exercise these rights, please contact us using the
          information provided below.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">
          6. Changes to This Privacy Policy
        </h2>
        <p>
          We may update our Privacy Policy from time to time. We will notify you
          of any changes by posting the new Privacy Policy on this page and
          updating the &quot;Last updated&quot; date.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-3">7. Contact Us</h2>
        <p>
          If you have any questions about this Privacy Policy, please contact us
          at:
        </p>
        <p>Email: privacy@untab.xyz</p>
      </section>
    </div>
  );
};

export default PrivacyPolicy;
