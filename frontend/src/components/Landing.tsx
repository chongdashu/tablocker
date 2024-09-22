"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { motion, useScroll } from "framer-motion";
import { ArrowRight, Check, Chrome, Play, User, Zap } from "lucide-react";

export function LandingComponent() {
  const { scrollYProgress } = useScroll();

  const scrollTo = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white text-gray-800">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Chrome className="w-8 h-8 text-purple-600" />
            <span className="text-xl font-bold">Un-Tab</span>
          </div>
          <nav className="hidden md:flex items-center space-x-6">
            {/* <button
              onClick={() => scrollTo("why-untab")}
              className="text-gray-600 hover:text-purple-600"
            >
              Why Un-Tab
            </button> */}
            <button
              onClick={() => scrollTo("how-it-works")}
              className="text-gray-600 hover:text-purple-600"
            >
              How It Works
            </button>
            {/* <button
              onClick={() => scrollTo("testimonials")}
              className="text-gray-600 hover:text-purple-600"
            >
              Testimonials
            </button> */}
            <button
              onClick={() => scrollTo("pricing")}
              className="text-gray-600 hover:text-purple-600"
            >
              Pricing
            </button>
            <button
              onClick={() => scrollTo("faq")}
              className="text-gray-600 hover:text-purple-600"
            >
              FAQ
            </button>
          </nav>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" className="hidden md:inline-flex">
              <User className="w-4 h-4 mr-2" />
              Log In
            </Button>
            <Button className="bg-purple-600 hover:bg-purple-700 text-white">
              Get Started
            </Button>
          </div>
        </div>
        <motion.div
          className="h-1 bg-purple-600"
          style={{ scaleX: scrollYProgress }}
        />
      </header>

      <main>
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-20 text-center">
          <motion.h1
            className="text-4xl md:text-6xl font-bold mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            Keep your Focus,
            <br />
            <span className="relative">
              <span className="bottom-0 left-0 w-full h-3 bg-purple-300 text-whiteopacity-50">
                Un-Tab
              </span>{" "}
              your Distractions
            </span>
          </motion.h1>
          <motion.p
            className="text-xl mb-8 max-w-2xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            Take control of your browsing habits. Boost your productivity.
            Un-Tab helps you to stay focused by blocking access to distracting
            sites.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.8 }}
          >
            <Button
              size="lg"
              className="bg-purple-600 hover:bg-purple-700 text-white"
              onClick={() =>
                window.open(
                  "https://chromewebstore.google.com/detail/productivity-enforcer/ckhdpoeddfocfjinehpedlbcihjjmopn?hl=en",
                  "_blank"
                )
              }
            >
              <svg
                className="mr-2 h-4 w-4 text-white"
                role="img"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <title>Google Chrome</title>
                <path
                  fill="currentColor"
                  d="M12 0C8.21 0 4.831 1.757 2.632 4.501l3.953 6.848A5.454 5.454 0 0 1 12 6.545h10.691A12 12 0 0 0 12 0zM1.931 5.47A11.943 11.943 0 0 0 0 12c0 6.012 4.42 10.991 10.189 11.864l3.953-6.847a5.45 5.45 0 0 1-6.865-2.29zm13.342 2.166a5.446 5.446 0 0 1 1.45 7.09l.002.001h-.002l-5.344 9.257c.206.01.413.016.621.016 6.627 0 12-5.373 12-12 0-1.54-.29-3.011-.818-4.364zM12 16.364a4.364 4.364 0 1 1 0-8.728 4.364 4.364 0 0 1 0 8.728Z"
                />
              </svg>
              Add to Chrome for FREE
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </motion.div>
        </section>

        {/* Why Un-Tab Section  */}
        {/* <section id="why-untab" className="container mx-auto px-4 py-20">
          <h2 className="text-3xl font-bold mb-12 text-center">Why Un-Tab?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Brain,
                title: "Deep Work Catalyst",
                description:
                  "Un-Tab creates the perfect environment for deep work sessions, allowing you to achieve flow state and maximize your cognitive output.",
              },
              {
                icon: Clock,
                title: "Time Reclamation",
                description:
                  "Reclaim hours of your day by eliminating mindless browsing. Un-Tab helps you allocate your time intentionally, boosting overall productivity.",
              },
              {
                icon: Lightbulb,
                title: "Habit Reformation",
                description:
                  "Break the cycle of digital distraction. Un-Tab aids in forming new, productive habits by making you more aware of your browsing patterns.",
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                className="bg-white p-6 rounded-lg shadow-lg"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.2, duration: 0.8 }}
              >
                <feature.icon className="w-12 h-12 text-purple-600 mb-4" />
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p>{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </section> */}

        {/* How it Works Section */}
        <section id="how-it-works" className="container mx-auto px-4 py-20">
          <h2 className="text-3xl font-bold mb-12 text-center">
            How Un-Tab Works
          </h2>
          <div className="flex flex-col lg:flex-row items-center justify-between space-y-12 lg:space-y-0 lg:space-x-12">
            <div className="w-full lg:w-1/2">
              <motion.div
                className="bg-purple-100 p-8 rounded-2xl shadow-lg overflow-hidden relative"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.3 }}
              >
                <div className="aspect-w-16 aspect-h-9 bg-purple-200 flex items-center justify-center">
                  <Play className="w-16 h-16 text-purple-600" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-purple-600/20 to-transparent pointer-events-none"></div>
              </motion.div>
            </div>
            <div className="w-full lg:w-1/2">
              <ol className="list-decimal list-inside space-y-4 text-lg">
                <li>Install from the Chrome Web Store</li>
                <li>Add the websites you want to block</li>
                <li>Enjoy distraction-free browsing</li>
              </ol>
              <motion.div
                className="mt-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.8 }}
              ></motion.div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        {/* <section
          id="testimonials"
          className="container mx-auto px-4 py-20 bg-purple-50"
        >
          <h2 className="text-3xl font-bold mb-12 text-center">
            What Our Users Say
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                name: "Alex Johnson",
                role: "Software Developer",
                comment:
                  "Un-Tab has revolutionized my workday. I'm now able to code for hours without getting sidetracked by social media.",
                avatar: "/placeholder.svg",
              },
              {
                name: "Sarah Lee",
                role: "Content Creator",
                comment:
                  "As a writer, focus is everything. Un-Tab helps me stay in the zone and meet my deadlines consistently.",
                avatar: "/placeholder.svg",
              },
              {
                name: "Michael Chen",
                role: "Entrepreneur",
                comment:
                  "Un-Tab is a game-changer for productivity. It's helped me cultivate better digital habits and grow my business.",
                avatar: "/placeholder.svg",
              },
            ].map((testimonial, index) => (
              <motion.div
                key={index}
                className="bg-white p-6 rounded-lg shadow-lg"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.2, duration: 0.8 }}
              >
                <div className="flex items-center mb-4">
                  <Image
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    width={48}
                    height={48}
                    className="rounded-full mr-4"
                  />
                  <div>
                    <h3 className="font-semibold">{testimonial.name}</h3>
                    <p className="text-sm text-gray-600">{testimonial.role}</p>
                  </div>
                </div>
                <p className="text-gray-700">"{testimonial.comment}"</p>
              </motion.div>
            ))}
          </div>
        </section> */}

        {/* Pricing Section */}
        <section id="pricing" className="container mx-auto px-4 py-20">
          <h2 className="text-3xl font-bold mb-12 text-center">
            Choose Your Un-Tab Plan
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {[
              {
                title: "Standard",
                price: "FREE",
                features: [
                  "Block up to 5 websites",
                  "Sync across devices",
                  "Basic analytics",
                ],
                cta: "Install to Chrome",
                ctaLink:
                  "https://chromewebstore.google.com/detail/productivity-enforcer/ckhdpoeddfocfjinehpedlbcihjjmopn?hl=en",
                popular: false,
              },
              {
                title: "Pro",
                price: "$5.99",
                rrp: "$11.99",
                discount: "50% off!",
                features: [
                  "Unlimited website blocking",
                  "Sync across devices",
                  "Advanced analytics and reports",
                  "Priority Support",
                  "Early access to new features",
                ],
                cta: "Go Pro",
                ctaLink:
                  process.env.NODE_ENV === "production"
                    ? "https://buy.stripe.com/4gw9ASguVgiXeByaEE"
                    : "https://buy.stripe.com/test_3cs4go6HJ8Xs0Fi000",
                popular: true,
              },
            ].map((plan, index) => (
              <motion.div
                key={index}
                className={`bg-white p-8 rounded-lg shadow-lg border-2 ${
                  plan.popular ? "border-purple-600" : "border-transparent"
                } relative`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.2, duration: 0.8 }}
              >
                {plan.popular && (
                  <div className="absolute top-0 right-0 bg-purple-600 text-white px-3 py-1 rounded-bl-lg rounded-tr-lg text-sm font-semibold">
                    Lifetime Purchase
                  </div>
                )}
                <h3 className="text-2xl font-bold mb-4">{plan.title}</h3>
                <div className="text-4xl font-bold mb-2 flex items-center">
                  {plan.rrp && (
                    <span className="text-2xl line-through text-gray-500 mr-2">
                      {plan.rrp}
                    </span>
                  )}
                  {plan.price}
                  {plan.discount && (
                    <span className="inline-block bg-red-100 text-red-600 font-semibold ml-2 text-lg px-3 py-1 rounded-full">
                      {plan.discount}
                    </span>
                  )}
                </div>
                {plan.popular && (
                  <div className="text-purple-600 font-semibold mb-6">
                    Buy once, use forever! No subscription.
                  </div>
                )}
                <ul className="space-y-2 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center">
                      <Check className="w-5 h-5 text-green-500 mr-2" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button
                  size="lg"
                  className={`w-full ${
                    plan.popular
                      ? "bg-purple-600 hover:bg-purple-700 text-white"
                      : "bg-gray-500 hover:bg-gray-600 text-white"
                  }`}
                  onClick={() => (window.location.href = plan.ctaLink)}
                >
                  {plan.cta}
                  {plan.popular && <Zap className="ml-2 h-4 w-4" />}
                </Button>
              </motion.div>
            ))}
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="container mx-auto px-4 py-20 bg-purple-50">
          <h2 className="text-3xl font-bold mb-12 text-center">
            Frequently Asked Questions
          </h2>
          <Accordion type="single" collapsible className="max-w-2xl mx-auto">
            {[
              {
                question: "How does Un-Tab differ from other website blockers?",
                answer:
                  "Other website blockers are overly complicated, look terrible and expensive. Un-Tab is simple to use, beautiful and just works. You can use it for free.",
              },
              {
                question: "Can I use Un-Tab on multiple devices?",
                answer:
                  "Yes! If you register with an account, you can sync your blocked sites and settings across all your devices.",
              },
              {
                question: "Is the Pro version really a one-time purchase?",
                answer:
                  "We believe in providing value without recurring costs. The Pro version is a lifetime purchase, giving you unlimited access to all current and future Pro features.",
              },
            ].map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger>{faq.question}</AccordionTrigger>
                <AccordionContent>{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-4 py-20 text-center">
          <motion.div
            className="bg-purple-600 text-white p-12 rounded-lg shadow-xl"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-3xl font-bold mb-6">
              Ready to Un-Tab Your Distractions?
            </h2>
            <p className="text-xl mb-8">
              Join thousands of focused individuals and take control of your
              browsing habits today.
            </p>
            <Button size="lg" variant="secondary">
              Get Un-Tab Now <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </motion.div>
        </section>
      </main>

      <footer className="container mx-auto px-4 py-8 text-center text-sm text-gray-600">
        <p>&copy; {new Date().getFullYear()} UnTab.xyz. All rights reserved.</p>
        <p>
          Made with ❤️ by{" "}
          <a
            href="https://twitter.com/chongdashu"
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-600 hover:text-purple-800"
          >
            <svg
              className="inline-block w-4 h-4 mr-1 align-text-bottom"
              role="img"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <title>X</title>
              <path
                fill="currentColor"
                d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"
              />
            </svg>
            chongdashu
          </a>
        </p>
        <div className="mt-4">
          <a
            href="/privacy-policy"
            className="text-purple-600 hover:text-purple-800 mr-4"
          >
            Privacy Policy
          </a>
          <a
            href="/terms-of-service"
            className="text-purple-600 hover:text-purple-800"
          >
            Terms of Service
          </a>
        </div>
      </footer>
    </div>
  );
}
