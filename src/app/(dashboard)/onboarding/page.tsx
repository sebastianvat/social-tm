"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Zap } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

const STEPS = 3

export default function OnboardingPage() {
  const [step, setStep] = useState(1)
  const [name, setName] = useState("")
  const [language, setLanguage] = useState("ro")
  const [brandUrl, setBrandUrl] = useState("")
  const [businessType, setBusinessType] = useState("")
  const [selectedAction, setSelectedAction] = useState("")
  const router = useRouter()

  async function handleComplete() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user && name) {
      await supabase.from("profiles").update({ full_name: name }).eq("id", user.id)
    }

    if (selectedAction === "scan" && brandUrl) {
      router.push(`/dashboard/brands/new?url=${encodeURIComponent(brandUrl)}`)
    } else if (selectedAction === "calendar") {
      router.push("/dashboard/brands/new")
    } else {
      router.push("/dashboard")
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-16 flex justify-center">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-semibold text-zinc-900">Social TM</span>
          </div>
        </div>

        {/* Step 1 */}
        {step === 1 && (
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900">
              Personalizeaza experienta
            </h1>
            <p className="mt-2 text-sm text-zinc-500">
              Cateva detalii ca sa iti oferim cea mai buna experienta.
            </p>

            <div className="mt-10 space-y-6">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-zinc-700">
                  Cum te numesti? <span className="text-zinc-400">(optional)</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ana"
                  className="flex h-11 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-zinc-700">
                  Limba preferata
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="flex h-11 w-full appearance-none rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                >
                  <option value="ro">Romana</option>
                  <option value="en">English</option>
                </select>
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              className="mt-10 flex h-10 w-full items-center justify-center rounded-lg bg-zinc-900 text-sm font-medium text-white hover:bg-zinc-800"
            >
              Continua
            </button>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900">
              Adauga primul tau brand
            </h1>
            <p className="mt-2 text-sm text-zinc-500">
              Pune URL-ul website-ului tau si noi facem restul.
            </p>

            <div className="mt-10 space-y-6">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-zinc-700">
                  URL website
                </label>
                <input
                  type="url"
                  value={brandUrl}
                  onChange={(e) => setBrandUrl(e.target.value)}
                  placeholder="https://magazinul-tau.ro"
                  className="flex h-11 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-zinc-700">
                  Tip business
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: "ecommerce", label: "eCommerce" },
                    { id: "services", label: "Servicii" },
                    { id: "blog", label: "Blog / Media" },
                    { id: "other", label: "Altceva" },
                  ].map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setBusinessType(type.id)}
                      className={`flex h-11 items-center justify-center rounded-lg border text-sm font-medium transition-colors ${
                        businessType === type.id
                          ? "border-zinc-900 bg-zinc-900 text-white"
                          : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300"
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-10 flex items-center gap-3">
              <button
                onClick={() => setStep(3)}
                className="flex h-10 flex-1 items-center justify-center rounded-lg bg-zinc-900 text-sm font-medium text-white hover:bg-zinc-800"
              >
                Continua
              </button>
            </div>
            <button
              onClick={() => setStep(3)}
              className="mt-3 flex w-full items-center justify-center text-sm text-zinc-400 hover:text-zinc-600"
            >
              Skip
            </button>
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900">
              Cu ce vrei sa incepi?
            </h1>
            <p className="mt-2 text-sm text-zinc-500">
              Alege o actiune sau exploreaza platforma.
            </p>

            <div className="mt-10 space-y-3">
              {[
                { id: "calendar", label: "Genereaza calendar social media", desc: "AI-ul creeaza 30 postari cu text si imagini" },
                { id: "scan", label: "Scaneaza un website", desc: "Extrage produse si servicii automat" },
                { id: "explore", label: "Exploreaza platforma", desc: "Descopera functionalitatile singur" },
              ].map((action) => (
                <button
                  key={action.id}
                  onClick={() => setSelectedAction(action.id)}
                  className={`flex w-full flex-col items-start rounded-xl border p-4 text-left transition-colors ${
                    selectedAction === action.id
                      ? "border-zinc-900 bg-zinc-50"
                      : "border-zinc-200 hover:border-zinc-300"
                  }`}
                >
                  <span className="text-sm font-medium text-zinc-900">{action.label}</span>
                  <span className="mt-0.5 text-xs text-zinc-500">{action.desc}</span>
                </button>
              ))}
            </div>

            <button
              onClick={handleComplete}
              disabled={!selectedAction}
              className="mt-10 flex h-10 w-full items-center justify-center rounded-lg bg-zinc-900 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-40"
            >
              Incepe
            </button>
          </div>
        )}

        {/* Step dots */}
        <div className="mt-16 flex items-center justify-center gap-2">
          {Array.from({ length: STEPS }).map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all ${
                i + 1 === step ? "w-6 bg-zinc-900" : i + 1 < step ? "w-2 bg-zinc-900" : "w-2 bg-zinc-200"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
