'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function Home() {
  const { isConnected } = useAccount();
  const [isRainbowKitLoaded, setIsRainbowKitLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('Home component mounted');
    console.log('isConnected:', isConnected);
    
    // Check if RainbowKit is loaded
    try {
      setIsRainbowKitLoaded(true);
      console.log('RainbowKit should be loaded');
    } catch (err) {
      console.error('Error loading RainbowKit:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [isConnected]);

  console.log('Rendering Home component, isRainbowKitLoaded:', isRainbowKitLoaded);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">E</span>
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Etherlink DCA
              </h1>
            </div>
            <div className="flex items-center gap-4">
              {error ? (
                <div className="bg-red-50 border border-red-200 px-4 py-2 rounded-xl text-red-600 text-sm">
                  Error: {error}
                </div>
              ) : isRainbowKitLoaded ? (
                <ConnectButton />
              ) : (
                <div className="bg-gray-100 px-4 py-2 rounded-xl text-gray-600 text-sm">
                  Loading...
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <div className="mb-8">
            <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Automated
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"> DCA</span>
              <br />
              on Etherlink
            </h2>
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-4xl mx-auto leading-relaxed">
              Deploy autonomous AI agents that execute Dollar-Cost Averaging trades directly on the Etherlink blockchain. 
              <span className="font-semibold text-gray-800"> Set it and forget it</span> - your agents work even when you're offline.
            </p>
          </div>

          {!isConnected ? (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 p-8 max-w-md mx-auto">
              <div className="mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Connect Your Wallet</h3>
                <p className="text-gray-600">
                  Connect your Web3 wallet to start creating and managing your DCA agents.
                </p>
              </div>
              <div className="flex justify-center">
                {error ? (
                  <div className="bg-red-50 border border-red-200 px-6 py-3 rounded-xl text-red-600">
                    Wallet connection error: {error}
                  </div>
                ) : isRainbowKitLoaded ? (
                  <ConnectButton />
                ) : (
                  <div className="bg-gray-100 px-6 py-3 rounded-xl text-gray-600">
                    Loading wallet connection...
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 p-8 hover:shadow-2xl transition-all duration-300">
                <div className="mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">Create New Agent</h3>
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    Deploy a new autonomous DCA agent with your preferred configuration. Choose from testnet or mainnet deployment.
                  </p>
                </div>
                <div className="space-y-3">
                  <Link 
                    href="/create-agent"
                    className="block w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-300 text-center shadow-lg hover:shadow-xl"
                  >
                    Create Testnet Agent
                  </Link>
                  <Link 
                    href="/create-mainnet-agent"
                    className="block w-full bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-4 rounded-xl font-semibold hover:from-green-700 hover:to-green-800 transition-all duration-300 text-center shadow-lg hover:shadow-xl"
                  >
                    Create Mainnet Agent
                  </Link>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 p-8 hover:shadow-2xl transition-all duration-300">
                <div className="mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">Manage Agents</h3>
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    View and manage your existing DCA agents, monitor performance, and control their execution.
                  </p>
                </div>
                <Link 
                  href="/dashboard"
                  className="block w-full bg-gradient-to-r from-indigo-600 to-indigo-700 text-white px-6 py-4 rounded-xl font-semibold hover:from-indigo-700 hover:to-indigo-800 transition-all duration-300 text-center shadow-lg hover:shadow-xl"
                >
                  View Dashboard
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Features Section */}
        <div className="mt-24">
          <div className="text-center mb-16">
            <h3 className="text-4xl font-bold text-gray-900 mb-4">How It Works</h3>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Three simple steps to start your automated DCA strategy
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200 p-8 text-center hover:shadow-xl transition-all duration-300">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <span className="text-3xl font-bold text-white">1</span>
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-4">Connect & Configure</h4>
              <p className="text-gray-600 leading-relaxed">
                Connect your wallet and configure your DCA strategy with token pairs, amounts, and execution frequency.
              </p>
            </div>
            
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200 p-8 text-center hover:shadow-xl transition-all duration-300">
              <div className="bg-gradient-to-br from-green-500 to-green-600 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <span className="text-3xl font-bold text-white">2</span>
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-4">Deploy Agent</h4>
              <p className="text-gray-600 leading-relaxed">
                Deploy an autonomous agent with its own dedicated wallet for secure and isolated execution.
              </p>
            </div>
            
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200 p-8 text-center hover:shadow-xl transition-all duration-300">
              <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <span className="text-3xl font-bold text-white">3</span>
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-4">Monitor & Profit</h4>
              <p className="text-gray-600 leading-relaxed">
                Monitor your agents' performance in real-time and let them execute trades automatically on schedule.
              </p>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="mt-24 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 p-8">
          <div className="text-center mb-8">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">Why Choose Etherlink DCA?</h3>
            <p className="text-xl text-gray-600">
              Built for the modern DeFi ecosystem
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">24/7</div>
              <div className="text-gray-600">Autonomous Trading</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">Secure</div>
              <div className="text-gray-600">Multi-Wallet Architecture</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-indigo-600 mb-2">Low Cost</div>
              <div className="text-gray-600">Etherlink Gas Fees</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">Real-time</div>
              <div className="text-gray-600">Performance Monitoring</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
