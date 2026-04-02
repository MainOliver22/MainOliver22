import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navbar />
      <main className="max-w-6xl mx-auto px-6 py-24 text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">Intelligent Investment Platform</h1>
        <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
          Trade automatically with AI-powered bots, exchange crypto assets, complete KYC verification, and manage your portfolio — all in one place.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/auth/register" className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition">Get Started</Link>
          <Link href="/auth/login" className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold border border-blue-600 hover:bg-blue-50 transition">Sign In</Link>
        </div>
        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          {[
            { title: '🤖 Auto Bot Trading', desc: 'Deploy proven algorithmic strategies with risk controls and real-time performance tracking.' },
            { title: '🔄 Multi-Asset Exchange', desc: 'Convert between fiat and crypto instantly with competitive rates and transparent fees.' },
            { title: '🔐 KYC & Compliance', desc: 'Bank-grade identity verification with AML checks to keep your account secure.' },
          ].map(({ title, desc }) => (
            <div key={title} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold mb-2">{title}</h3>
              <p className="text-gray-600 text-sm">{desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
