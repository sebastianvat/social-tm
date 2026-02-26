import Link from "next/link"
import { Zap, Globe, Calendar, Send, Coins, ArrowRight, Sparkles } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      {/* Header */}
      <header className="border-b border-zinc-100 dark:border-zinc-900">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <Zap className="h-6 w-6 text-violet-600" />
            <span className="text-xl font-bold">Social TM</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white">
              Login
            </Link>
            <Link
              href="/register"
              className="inline-flex h-9 items-center rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900"
            >
              Incepe gratuit
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 py-24 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-violet-50 px-4 py-1.5 text-sm font-medium text-violet-700 dark:bg-violet-950 dark:text-violet-300">
          <Sparkles className="h-4 w-4" />
          Powered by Claude Opus + GPT-Image
        </div>
        <h1 className="mt-6 text-5xl font-bold leading-tight tracking-tight text-zinc-900 dark:text-white sm:text-6xl">
          Social media pe pilot automat
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-zinc-600 dark:text-zinc-400">
          Pune URL-ul site-ului tau. AI-ul scaneaza produsele, genereaza un calendar complet
          cu postari si imagini, si posteaza automat. Tu te relaxezi.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <Link
            href="/register"
            className="inline-flex h-12 items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-8 text-base font-medium text-white hover:from-violet-700 hover:to-indigo-700"
          >
            Incepe gratuit — 50 tokeni cadou
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-zinc-100 bg-zinc-50 dark:border-zinc-900 dark:bg-zinc-950/50">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <h2 className="text-center text-3xl font-bold text-zinc-900 dark:text-white">
            3 pasi. 2 minute. Calendar complet.
          </h2>
          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {[
              {
                icon: Globe,
                step: "1",
                title: "Scaneaza website-ul",
                description: "Pune URL-ul si AI-ul extrage automat produsele, descrierile si imaginile tale.",
                tokens: "10 tokeni",
              },
              {
                icon: Calendar,
                step: "2",
                title: "Genereaza calendarul",
                description: "Claude Opus creeaza 30 postari cu text, hashtags si imagini generate cu AI.",
                tokens: "50 tokeni",
              },
              {
                icon: Send,
                step: "3",
                title: "Posteaza automat",
                description: "Conecteaza conturile si postrarile se publica automat la orele optime.",
                tokens: "2 tokeni/postare",
              },
            ].map((item) => (
              <div key={item.step} className="relative rounded-2xl border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-900">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 text-lg font-bold text-white">
                  {item.step}
                </div>
                <h3 className="mt-4 text-xl font-semibold text-zinc-900 dark:text-white">{item.title}</h3>
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{item.description}</p>
                <div className="mt-4 inline-flex items-center gap-1 rounded-full bg-violet-50 px-3 py-1 text-xs font-medium text-violet-700 dark:bg-violet-950 dark:text-violet-300">
                  <Coins className="h-3 w-3" />
                  {item.tokens}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <h2 className="text-center text-3xl font-bold text-zinc-900 dark:text-white">
          Platesti doar ce folosesti
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-center text-zinc-600 dark:text-zinc-400">
          Fara abonamente. Cumperi tokeni si ii folosesti cand vrei.
        </p>
        <div className="mt-16 grid gap-6 md:grid-cols-4">
          {[
            { name: "Starter", tokens: 100, price: 9, desc: "Perfect pentru test" },
            { name: "Creator", tokens: 500, price: 39, desc: "1 brand, 1 luna", popular: true },
            { name: "Pro", tokens: 1500, price: 99, desc: "Mai multe branduri" },
            { name: "Agency", tokens: 5000, price: 299, desc: "Pentru agentii" },
          ].map((pack) => (
            <div
              key={pack.name}
              className={`relative rounded-2xl border p-6 ${
                pack.popular
                  ? "border-violet-500 bg-violet-50 dark:border-violet-400 dark:bg-violet-950/30"
                  : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
              }`}
            >
              {pack.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 px-3 py-0.5 text-xs font-medium text-white">
                  Popular
                </div>
              )}
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">{pack.name}</h3>
              <p className="mt-1 text-sm text-zinc-500">{pack.desc}</p>
              <div className="mt-4">
                <span className="text-3xl font-bold text-zinc-900 dark:text-white">{pack.price}</span>
                <span className="text-sm text-zinc-500"> EUR</span>
              </div>
              <div className="mt-1 flex items-center gap-1 text-sm text-violet-600 dark:text-violet-400">
                <Coins className="h-4 w-4" />
                {pack.tokens} tokeni
              </div>
              <Link
                href="/register"
                className={`mt-6 flex h-10 w-full items-center justify-center rounded-lg text-sm font-medium ${
                  pack.popular
                    ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-700 hover:to-indigo-700"
                    : "bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900"
                }`}
              >
                Cumpara
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-100 dark:border-zinc-900">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6 text-sm text-zinc-500">
          <span>&copy; 2026 Transilvania Marketing</span>
          <span>Powered by AI</span>
        </div>
      </footer>
    </div>
  )
}
