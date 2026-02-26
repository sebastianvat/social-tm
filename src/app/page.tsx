import Link from "next/link"
import Image from "next/image"
import {
  Globe,
  Calendar,
  Send,
  Coins,
  ArrowRight,
  Sparkles,
  Zap,
  Check,
  Star,
  Shield,
  Clock,
  BarChart3,
  Image as ImageIcon,
  Bot,
  MousePointerClick,
} from "lucide-react"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 z-50 w-full border-b border-zinc-100 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold leading-tight text-zinc-900">Social TM</span>
              <span className="text-[10px] font-medium leading-tight text-zinc-400">by Transilvania Marketing</span>
            </div>
          </div>
          <nav className="hidden items-center gap-8 md:flex">
            <a href="#cum-functioneaza" className="text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-900">
              Cum functioneaza
            </a>
            <a href="#functionalitati" className="text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-900">
              Functionalitati
            </a>
            <a href="#preturi" className="text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-900">
              Preturi
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-zinc-600 hover:text-zinc-900">
              Login
            </Link>
            <Link
              href="/register"
              className="inline-flex h-9 items-center rounded-full bg-emerald-500 px-5 text-sm font-medium text-white transition-colors hover:bg-emerald-600"
            >
              Incepe gratuit
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden pt-16">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />
        <div className="absolute right-0 top-20 h-[500px] w-[500px] rounded-full bg-emerald-100/40 blur-[120px]" />
        <div className="absolute -left-20 top-40 h-[400px] w-[400px] rounded-full bg-cyan-100/30 blur-[100px]" />

        <div className="relative mx-auto max-w-6xl px-6 pb-20 pt-24">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-sm font-medium text-emerald-700">
                <Sparkles className="h-4 w-4" />
                Powered by Claude Opus & GPT-Image
              </div>
              <h1 className="mt-6 text-[42px] font-bold leading-[1.1] tracking-tight text-zinc-900 md:text-[56px]">
                Social media
                <br />
                <span className="bg-gradient-to-r from-emerald-500 to-cyan-500 bg-clip-text text-transparent">
                  pe pilot automat
                </span>
              </h1>
              <p className="mt-6 max-w-lg text-lg leading-relaxed text-zinc-500">
                Pune URL-ul site-ului tau. AI-ul scaneaza produsele, genereaza un calendar complet
                cu postari si imagini premium, si posteaza automat pe toate platformele.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link
                  href="/register"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-emerald-500 px-8 text-base font-medium text-white transition-all hover:bg-emerald-600 hover:shadow-lg hover:shadow-emerald-200"
                >
                  Incepe gratuit
                  <ArrowRight className="h-5 w-5" />
                </Link>
                <span className="flex items-center gap-2 text-sm text-zinc-400">
                  <Coins className="h-4 w-4 text-emerald-500" />
                  50 tokeni cadou la inregistrare
                </span>
              </div>

              <div className="mt-10 flex items-center gap-8">
                {[
                  { value: "30s", label: "Scanare website" },
                  { value: "30+", label: "Postari/luna" },
                  { value: "4", label: "Platforme" },
                ].map((stat) => (
                  <div key={stat.label}>
                    <p className="text-2xl font-bold text-zinc-900">{stat.value}</p>
                    <p className="text-xs text-zinc-400">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl shadow-zinc-200/50">
                <Image
                  src="/img/dashboard-mockup.png"
                  alt="Social TM Dashboard"
                  width={800}
                  height={500}
                  className="w-full"
                  priority
                />
              </div>
              <div className="absolute -bottom-4 -left-4 rounded-xl border border-zinc-200 bg-white p-3 shadow-lg">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100">
                    <Check className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-zinc-900">Calendar generat!</p>
                    <p className="text-[10px] text-zinc-400">30 postari • martie 2026</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trusted by */}
      <section className="border-y border-zinc-100 bg-zinc-50/50 py-8">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-4">
            <span className="text-xs font-medium uppercase tracking-widest text-zinc-400">Construit de echipa</span>
            <div className="flex items-center gap-2 text-zinc-400">
              <Image src="/img/logo-tm.svg" alt="Transilvania Marketing" width={28} height={28} className="opacity-50" />
              <span className="text-sm font-semibold text-zinc-500">Transilvania Marketing</span>
            </div>
            <span className="text-xs text-zinc-400">250+ clienti • 7.6x ROAS mediu • €7M+ ad spend gestionat</span>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="cum-functioneaza" className="py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center">
            <span className="text-sm font-semibold uppercase tracking-widest text-emerald-600">Cum functioneaza</span>
            <h2 className="mt-3 text-3xl font-bold text-zinc-900 md:text-[42px] md:leading-tight">
              3 pasi. 2 minute. Calendar complet.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-zinc-500">
              Nu trebuie sa stii marketing. Platforma face toata munca.
            </p>
          </div>

          <div className="mt-20 grid gap-16 md:gap-24">
            {/* Step 1 */}
            <div className="grid items-center gap-12 lg:grid-cols-2">
              <div className="order-2 lg:order-1">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-lg font-bold text-white">
                  1
                </div>
                <h3 className="mt-4 text-2xl font-bold text-zinc-900">Scaneaza website-ul</h3>
                <p className="mt-3 text-zinc-500 leading-relaxed">
                  Pune URL-ul si in 30 de secunde AI-ul extrage automat produsele, descrierile,
                  preturile si imaginile. Fara munca manuala.
                </p>
                <ul className="mt-6 space-y-3">
                  {["Detecteaza automat produsele", "Extrage imagini si preturi", "Analizeaza brand voice-ul"].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-sm text-zinc-600">
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100">
                        <Check className="h-3 w-3 text-emerald-600" />
                      </div>
                      {item}
                    </li>
                  ))}
                </ul>
                <div className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-600">
                  <Coins className="h-3.5 w-3.5 text-emerald-500" />
                  10 tokeni per scanare
                </div>
              </div>
              <div className="order-1 lg:order-2">
                <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl shadow-zinc-100">
                  <Image src="/img/scan-mockup.png" alt="Website Scanner" width={600} height={400} className="w-full" />
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="grid items-center gap-12 lg:grid-cols-2">
              <div>
                <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl shadow-zinc-100">
                  <Image src="/img/posts-mockup.png" alt="AI Content Generation" width={600} height={400} className="w-full" />
                </div>
              </div>
              <div>
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-lg font-bold text-white">
                  2
                </div>
                <h3 className="mt-4 text-2xl font-bold text-zinc-900">Genereaza cu AI</h3>
                <p className="mt-3 text-zinc-500 leading-relaxed">
                  Claude Opus creeaza 30 postari unice cu text captivant, hashtags relevante si imagini
                  generate cu GPT-Image. Totul adaptat brandului tau.
                </p>
                <ul className="mt-6 space-y-3">
                  {["Text premium cu Claude Opus", "Imagini generate cu GPT-Image", "Hashtags si CTA-uri optimizate", "Mix: promo, educational, engagement"].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-sm text-zinc-600">
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100">
                        <Check className="h-3 w-3 text-emerald-600" />
                      </div>
                      {item}
                    </li>
                  ))}
                </ul>
                <div className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-600">
                  <Coins className="h-3.5 w-3.5 text-emerald-500" />
                  50 tokeni per calendar
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="grid items-center gap-12 lg:grid-cols-2">
              <div className="order-2 lg:order-1">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-lg font-bold text-white">
                  3
                </div>
                <h3 className="mt-4 text-2xl font-bold text-zinc-900">Posteaza automat</h3>
                <p className="mt-3 text-zinc-500 leading-relaxed">
                  Conecteaza conturile de social media, aproba postarile si lasa platforma
                  sa publice automat la orele optime. Tu te relaxezi.
                </p>
                <ul className="mt-6 space-y-3">
                  {["Facebook & Instagram", "LinkedIn", "TikTok", "Publicare la ora optima"].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-sm text-zinc-600">
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100">
                        <Check className="h-3 w-3 text-emerald-600" />
                      </div>
                      {item}
                    </li>
                  ))}
                </ul>
                <div className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-600">
                  <Coins className="h-3.5 w-3.5 text-emerald-500" />
                  2 tokeni per postare publicata
                </div>
              </div>
              <div className="order-1 lg:order-2">
                <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-xl shadow-zinc-100">
                  <div className="space-y-4">
                    {[
                      { platform: "Facebook", time: "09:00", status: "Publicat", color: "bg-blue-500" },
                      { platform: "Instagram", time: "12:30", status: "Programat", color: "bg-pink-500" },
                      { platform: "LinkedIn", time: "14:00", status: "Programat", color: "bg-sky-600" },
                      { platform: "TikTok", time: "18:00", status: "In asteptare", color: "bg-zinc-900" },
                    ].map((item) => (
                      <div key={item.platform} className="flex items-center justify-between rounded-xl border border-zinc-100 bg-zinc-50/50 p-4">
                        <div className="flex items-center gap-3">
                          <div className={`h-3 w-3 rounded-full ${item.color}`} />
                          <div>
                            <p className="text-sm font-semibold text-zinc-900">{item.platform}</p>
                            <p className="text-xs text-zinc-400">{item.time}</p>
                          </div>
                        </div>
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          item.status === "Publicat"
                            ? "bg-emerald-100 text-emerald-700"
                            : item.status === "Programat"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-zinc-100 text-zinc-600"
                        }`}>
                          {item.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="functionalitati" className="border-t border-zinc-100 bg-zinc-50/50 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center">
            <span className="text-sm font-semibold uppercase tracking-widest text-emerald-600">Functionalitati</span>
            <h2 className="mt-3 text-3xl font-bold text-zinc-900 md:text-[42px] md:leading-tight">
              Tot ce ai nevoie, intr-un singur loc
            </h2>
          </div>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: Globe, title: "Website Scanner", desc: "Extrage automat produse, preturi si imagini din orice website.", color: "bg-blue-100 text-blue-600" },
              { icon: Bot, title: "Claude Opus AI", desc: "Cel mai avansat model AI genereaza text premium pentru fiecare postare.", color: "bg-violet-100 text-violet-600" },
              { icon: ImageIcon, title: "GPT-Image", desc: "Imagini generate cu aceeasi tehnologie din ChatGPT. Calitate maxima.", color: "bg-pink-100 text-pink-600" },
              { icon: Calendar, title: "Calendar automat", desc: "30 postari/luna distribuite inteligent: promo, educational, engagement.", color: "bg-emerald-100 text-emerald-600" },
              { icon: Send, title: "Auto-posting", desc: "Publica automat pe Facebook, Instagram, LinkedIn si TikTok.", color: "bg-cyan-100 text-cyan-600" },
              { icon: Coins, title: "Platesti ce folosesti", desc: "Sistem de tokeni fara abonament. Cumperi cat vrei, cand vrei.", color: "bg-amber-100 text-amber-600" },
              { icon: Shield, title: "Approve mode", desc: "Aproba fiecare postare sau lasa pe auto-pilot. Tu alegi.", color: "bg-green-100 text-green-600" },
              { icon: BarChart3, title: "Analytics", desc: "Vezi ce functioneaza: reach, engagement, click-uri per platforma.", color: "bg-indigo-100 text-indigo-600" },
              { icon: Clock, title: "Ora optima", desc: "AI-ul alege automat cel mai bun moment pentru fiecare postare.", color: "bg-orange-100 text-orange-600" },
            ].map((feature) => (
              <div
                key={feature.title}
                className="rounded-2xl border border-zinc-200 bg-white p-6 transition-all hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-50"
              >
                <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${feature.color}`}>
                  <feature.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-base font-semibold text-zinc-900">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-500">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="preturi" className="py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center">
            <span className="text-sm font-semibold uppercase tracking-widest text-emerald-600">Preturi</span>
            <h2 className="mt-3 text-3xl font-bold text-zinc-900 md:text-[42px] md:leading-tight">
              Platesti doar ce folosesti
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-zinc-500">
              Fara abonamente lunare. Cumperi tokeni si ii folosesti cand vrei, cat vrei.
            </p>
          </div>

          <div className="mx-auto mt-16 grid max-w-4xl gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              { name: "Starter", tokens: 100, price: 9, desc: "Perfect pentru test", features: ["1 scanare website", "~1 calendar", "Suport email"] },
              { name: "Creator", tokens: 500, price: 39, desc: "1 brand, 1 luna", popular: true, features: ["5 scanari", "~5 calendare", "Imagini AI", "Auto-posting"] },
              { name: "Pro", tokens: 1500, price: 99, desc: "Mai multe branduri", features: ["15 scanari", "~15 calendare", "Imagini AI", "Auto-posting", "Prioritate suport"] },
              { name: "Agency", tokens: 5000, price: 299, desc: "Fara limite", features: ["50 scanari", "~50 calendare", "Imagini AI", "Auto-posting", "Suport dedicat", "API access"] },
            ].map((pack) => (
              <div
                key={pack.name}
                className={`relative flex flex-col rounded-2xl border p-6 ${
                  pack.popular
                    ? "border-emerald-500 bg-emerald-50/50 shadow-lg shadow-emerald-100"
                    : "border-zinc-200 bg-white"
                }`}
              >
                {pack.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-emerald-500 px-3 py-0.5 text-xs font-medium text-white">
                    Popular
                  </div>
                )}
                <h3 className="text-lg font-bold text-zinc-900">{pack.name}</h3>
                <p className="mt-1 text-sm text-zinc-500">{pack.desc}</p>
                <div className="mt-4">
                  <span className="text-3xl font-bold text-zinc-900">{pack.price}</span>
                  <span className="text-sm text-zinc-400"> EUR</span>
                </div>
                <div className="mt-1 flex items-center gap-1.5 text-sm font-medium text-emerald-600">
                  <Coins className="h-4 w-4" />
                  {pack.tokens} tokeni
                </div>
                <ul className="mt-6 flex-1 space-y-2.5">
                  {pack.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-zinc-600">
                      <Check className="h-4 w-4 text-emerald-500" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register"
                  className={`mt-6 flex h-10 w-full items-center justify-center rounded-full text-sm font-medium transition-colors ${
                    pack.popular
                      ? "bg-emerald-500 text-white hover:bg-emerald-600"
                      : "bg-zinc-900 text-white hover:bg-zinc-800"
                  }`}
                >
                  Cumpara tokeni
                </Link>
              </div>
            ))}
          </div>

          {/* Token costs table */}
          <div className="mx-auto mt-16 max-w-2xl">
            <h3 className="mb-6 text-center text-lg font-semibold text-zinc-900">Cost per actiune</h3>
            <div className="overflow-hidden rounded-xl border border-zinc-200">
              {[
                { action: "Scaneaza website", tokens: 10, icon: Globe },
                { action: "Genereaza calendar (30 postari)", tokens: 50, icon: Calendar },
                { action: "Genereaza o postare", tokens: 3, icon: MousePointerClick },
                { action: "Genereaza imagine AI", tokens: 5, icon: ImageIcon },
                { action: "Auto-postare pe social media", tokens: 2, icon: Send },
              ].map((item, idx) => (
                <div
                  key={item.action}
                  className={`flex items-center justify-between px-5 py-3.5 ${
                    idx > 0 ? "border-t border-zinc-100" : ""
                  } ${idx % 2 === 0 ? "bg-zinc-50/50" : "bg-white"}`}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="h-4 w-4 text-zinc-400" />
                    <span className="text-sm text-zinc-700">{item.action}</span>
                  </div>
                  <span className="flex items-center gap-1.5 text-sm font-semibold text-emerald-600">
                    <Coins className="h-3.5 w-3.5" />
                    {item.tokens}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-zinc-100 bg-zinc-900 py-24">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-emerald-400">
            <Sparkles className="h-4 w-4" />
            50 tokeni cadou
          </div>
          <h2 className="mt-6 text-3xl font-bold text-white md:text-[42px] md:leading-tight">
            Gata sa pui social media pe autopilot?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-zinc-400">
            Incepe in 2 minute. Fara card, fara obligatii. Primesti 50 tokeni
            sa testezi — suficient pentru un calendar complet.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/register"
              className="inline-flex h-12 items-center gap-2 rounded-full bg-emerald-500 px-8 text-base font-medium text-white transition-all hover:bg-emerald-400 hover:shadow-lg hover:shadow-emerald-500/25"
            >
              Creeaza cont gratuit
              <ArrowRight className="h-5 w-5" />
            </Link>
            <span className="text-sm text-zinc-500">Raspuns in 30 secunde</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-100 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500">
                <Zap className="h-4 w-4 text-white" />
              </div>
              <div>
                <span className="text-sm font-bold text-zinc-900">Social TM</span>
                <span className="ml-2 text-xs text-zinc-400">by Transilvania Marketing</span>
              </div>
            </div>
            <div className="flex items-center gap-8 text-sm text-zinc-400">
              <Link href="/login" className="hover:text-zinc-600">Login</Link>
              <Link href="/register" className="hover:text-zinc-600">Register</Link>
              <a href="https://transilvaniamarketing.ro" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-600">
                Transilvania Marketing
              </a>
            </div>
            <p className="text-xs text-zinc-400">
              © 2026 Transilvania Marketing. Toate drepturile rezervate.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
