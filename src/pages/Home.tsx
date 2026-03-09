import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { motion } from "motion/react";
import { ArrowRight, Sparkles, Zap, Shield, Globe, Check, HelpCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

const Home: React.FC = () => {
  const { user, loginWithGoogle } = useAuth();
  const { t } = useTranslation();
  const [regionPrice, setRegionPrice] = useState({ amount: 15, currency: "USD" });

  useEffect(() => {
    // Simple region detection based on browser locale
    const locale = navigator.language.toLowerCase();
    const latamCountries = ["es-mx", "pt-br", "es-ar", "es-cl", "es-co", "es-pe"];
    const chinaLocale = "zh-cn";

    if (latamCountries.some(c => locale.includes(c)) || locale.includes(chinaLocale)) {
      setRegionPrice({ amount: 5, currency: "USD" });
    }
  }, []);

  const handleUpgrade = async () => {
    if (!user) {
      loginWithGoogle();
      return;
    }
    try {
      const countryCode = navigator.language.toUpperCase().split('-')[1] || 'US';
      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ countryCode }),
      });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Checkout error:", error);
    }
  };

  return (
    <div className="relative overflow-hidden">
      {/* Hero Section */}
      <section className="relative px-4 pt-20 pb-32 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-4 py-1.5 text-sm font-medium text-orange-700 ring-1 ring-inset ring-orange-700/10">
              <Sparkles className="h-4 w-4" />
              {t('live_scoring')} & {t('tactical_insights')}
            </span>
            <h1 className="mt-8 text-5xl font-bold tracking-tight text-neutral-900 sm:text-7xl">
              {t('hero_title').split('AI')[0]}
              <span className="text-orange-600">AI</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-neutral-600">
              {t('hero_subtitle')}
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              {user ? (
                <Link
                  to="/scorekeeper"
                  className="rounded-full bg-orange-600 px-8 py-4 text-lg font-semibold text-white shadow-lg hover:bg-orange-500 transition-all flex items-center gap-2"
                >
                  {t('scorekeeper')} <ArrowRight className="h-5 w-5" />
                </Link>
              ) : (
                <button
                  onClick={loginWithGoogle}
                  className="rounded-full bg-orange-600 px-8 py-4 text-lg font-semibold text-white shadow-lg hover:bg-orange-500 transition-all flex items-center gap-2"
                >
                  {t('start_free')} <ArrowRight className="h-5 w-5" />
                </button>
              )}
            </div>
            <p className="mt-4 text-sm text-neutral-500 italic">
              * 1 month free trial included
            </p>
          </motion.div>
        </div>

        {/* Sports Data Visualization Mockup */}
        <div className="mt-20 flex justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="relative rounded-2xl border border-neutral-200 bg-white p-6 shadow-2xl lg:max-w-5xl w-full"
          >
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="h-24 rounded-xl bg-orange-50 border border-orange-100 p-4">
                <div className="text-xs font-bold text-orange-600 uppercase">Offensive Efficiency</div>
                <div className="text-2xl font-black text-neutral-800">112.4</div>
              </div>
              <div className="h-24 rounded-xl bg-blue-50 border border-blue-100 p-4">
                <div className="text-xs font-bold text-blue-600 uppercase">Defensive Rating</div>
                <div className="text-2xl font-black text-neutral-800">104.8</div>
              </div>
              <div className="h-24 rounded-xl bg-emerald-50 border border-emerald-100 p-4">
                <div className="text-xs font-bold text-emerald-600 uppercase">Win Probability</div>
                <div className="text-2xl font-black text-neutral-800">68%</div>
              </div>
            </div>
            <div className="h-64 rounded-xl bg-neutral-50 flex items-end justify-between p-6 gap-2">
              {[40, 70, 45, 90, 65, 80, 55, 95, 75, 85].map((h, i) => (
                <motion.div 
                  key={i}
                  initial={{ height: 0 }}
                  animate={{ height: `${h}%` }}
                  transition={{ delay: 0.5 + (i * 0.05) }}
                  className="w-full bg-orange-500 rounded-t-lg"
                />
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-white py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center">
            <h2 className="text-base font-semibold leading-7 text-orange-600 uppercase tracking-wide">{t('features')}</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
              Professional Tools for Basketball Teams
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
              <div className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-neutral-900">
                  <Zap className="h-5 w-5 flex-none text-orange-600" />
                  {t('live_scoring')}
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-neutral-600">
                  <p className="flex-auto">Professional scorekeeper interface optimized for tablets. Record points, rebounds, and fouls with one tap.</p>
                </dd>
              </div>
              <div className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-neutral-900">
                  <Shield className="h-5 w-5 flex-none text-orange-600" />
                  {t('advanced_stats')}
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-neutral-600">
                  <p className="flex-auto">Automatic box scores, efficiency ratings, and shot maps generated instantly from your live data.</p>
                </dd>
              </div>
              <div className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-neutral-900">
                  <Globe className="h-5 w-5 flex-none text-orange-600" />
                  {t('tactical_insights')}
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-neutral-600">
                  <p className="flex-auto">DeepSeek AI analyzes your match data to provide tactical summaries and coaching reports.</p>
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-neutral-50">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">{t('pricing')}</h2>
            <p className="mt-4 text-neutral-600">{t('regional_pricing_notice')}</p>
          </div>
          <div className="mx-auto mt-16 grid max-w-lg grid-cols-1 gap-y-6 sm:mt-20 lg:max-w-none lg:grid-cols-2 lg:gap-x-8">
            <div className="flex flex-col justify-between rounded-3xl bg-white p-8 ring-1 ring-neutral-200 xl:p-10">
              <div>
                <h3 className="text-lg font-semibold leading-8 text-neutral-900">{t('free_plan')}</h3>
                <ul className="mt-6 space-y-3 text-sm text-neutral-600">
                  <li className="flex gap-2"><Check className="h-4 w-4 text-orange-600" /> View schedules</li>
                  <li className="flex gap-2"><Check className="h-4 w-4 text-orange-600" /> League calendar</li>
                  <li className="flex gap-2"><Check className="h-4 w-4 text-orange-600" /> Limited stats</li>
                </ul>
                <p className="mt-6 flex items-baseline gap-x-1">
                  <span className="text-4xl font-bold tracking-tight text-neutral-900">$0</span>
                  <span className="text-sm font-semibold leading-6 text-neutral-600">/month</span>
                </p>
              </div>
              <button onClick={loginWithGoogle} className="mt-8 block rounded-md bg-neutral-900 px-3 py-2 text-center text-sm font-semibold leading-6 text-white shadow-sm hover:bg-neutral-800">Get started</button>
            </div>
            <div className="flex flex-col justify-between rounded-3xl bg-white p-8 ring-2 ring-orange-600 xl:p-10">
              <div>
                <h3 className="text-lg font-semibold leading-8 text-orange-600">{t('pro_plan')}</h3>
                <ul className="mt-6 space-y-3 text-sm text-neutral-600">
                  <li className="flex gap-2"><Check className="h-4 w-4 text-orange-600" /> {t('live_scoring')}</li>
                  <li className="flex gap-2"><Check className="h-4 w-4 text-orange-600" /> {t('advanced_stats')}</li>
                  <li className="flex gap-2"><Check className="h-4 w-4 text-orange-600" /> {t('tactical_insights')}</li>
                  <li className="flex gap-2"><Check className="h-4 w-4 text-orange-600" /> Data export</li>
                </ul>
                <p className="mt-6 flex items-baseline gap-x-1">
                  <span className="text-4xl font-bold tracking-tight text-neutral-900">${regionPrice.amount}</span>
                  <span className="text-sm font-semibold leading-6 text-neutral-600">/{regionPrice.currency}</span>
                </p>
              </div>
              <button onClick={handleUpgrade} className="mt-8 block rounded-md bg-orange-600 px-3 py-2 text-center text-sm font-semibold leading-6 text-white shadow-sm hover:bg-orange-500">{t('upgrade_pro')}</button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 bg-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-neutral-900 mb-12 text-center">Frequently Asked Questions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              { q: t('how_to_register'), a: "Go to the Scorekeeper tab, click 'Start Recording', and begin logging events for your match." },
              { q: t('how_to_export'), a: "After a match is finished, you can export the box score as CSV or JSON from the Stats dashboard." },
              { q: t('how_to_roster'), a: "In your team settings, you can add players with their names, numbers, and positions." },
              { q: "Is there a mobile app?", a: "HoopsAI is a PWA. You can install it directly from your browser on Android and iOS." }
            ].map((faq, i) => (
              <div key={i} className="p-6 rounded-2xl bg-neutral-50">
                <h3 className="font-bold text-neutral-900 flex items-center gap-2">
                  <HelpCircle className="h-5 w-5 text-orange-600" />
                  {faq.q}
                </h3>
                <p className="mt-2 text-neutral-600 text-sm">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
