'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function CreateMainnetAgent() {
  const { isConnected, address } = useAccount();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    agentName: '',
      sourceTokenAddress: '0x796Ea11Fa2dD751eD01b53C372fFDB4AAa8f00F9', // USDC on Etherlink mainnet
  targetTokenAddress: '0xc9B53AB2679f573e480d01e0f49e2B5CFB7a3EAb', // WXTZ on Etherlink mainnet
    amountToSwap: '',
    frequencyHours: '24'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected || !address) {
      toast.error('Please connect your wallet first');
      return;
    }

    // Validate amount
    const amount = parseFloat(formData.amountToSwap);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount greater than 0');
      return;
    }

    if (amount > 1000000) {
      toast.error('Amount cannot exceed 1,000,000 USDC (for safety)');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/create-mainnet-agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          walletAddress: address
        }),
      });

      if (response.ok) {
        const result = await response.json();
        toast.success('Mainnet agent created successfully! 🚀');
        router.push('/dashboard');
      } else {
        const error = await response.json();
        toast.error(`Error creating mainnet agent: ${error.error}`);
      }
    } catch (error) {
      console.error('Error creating mainnet agent:', error);
      toast.error('Failed to create mainnet agent. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // For amount field, ensure it's a valid number
    if (name === 'amountToSwap') {
      const numValue = parseFloat(value);
      if (value === '' || (numValue >= 0 && numValue <= 1000000)) { // Allow up to 1M USDC
        setFormData({
          ...formData,
          [name]: value
        });
      }
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <h2 className="text-2xl font-bold mb-4">Connect Wallet Required</h2>
          <p className="text-gray-600 mb-6">
            Please connect your wallet to create a mainnet DCA agent.
          </p>
          <Link 
            href="/"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Go Back
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Mainnet DCA Agent</h1>
            <p className="text-gray-600">
              Deploy an autonomous agent that trades USDC → WXTZ on Etherlink mainnet via Iguana DEX
            </p>
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="font-semibold text-green-900 mb-2">🌐 Mainnet Configuration</h3>
              <ul className="text-sm text-green-800 space-y-1">
                <li>• Network: Etherlink Mainnet</li>
                <li>• DEX: Iguana DEX</li>
                <li>• Router: 0xE67B7D039b78DE25367EF5E69596075Bbd852BA9</li>
                <li>• Source: USDC (0x796Ea11Fa2dD751eD01b53C372fFDB4AAa8f00F9)</li>
                <li>• Target: WXTZ (0xc9B53AB2679f573e480d01e0f49e2B5CFB7a3EAb)</li>
              </ul>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="agentName" className="block text-sm font-medium text-gray-700 mb-2">
                Agent Name
              </label>
              <input
                type="text"
                id="agentName"
                name="agentName"
                value={formData.agentName}
                onChange={handleInputChange}
                placeholder="USDC to WXTZ DCA Agent"
                className="w-full px-3 py-2 border text-black border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                Give your agent a descriptive name
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="sourceTokenAddress" className="block text-sm font-medium text-gray-700 mb-2">
                  Source Token (USDC)
                </label>
                <input
                  type="text"
                  id="sourceTokenAddress"
                  name="sourceTokenAddress"
                  value={formData.sourceTokenAddress}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 text-black border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                  required
                  readOnly
                />
                <p className="text-sm text-gray-500 mt-1">
                  USDC token on Etherlink mainnet via Iguana DEX (pre-configured)
                </p>
              </div>

              <div>
                <label htmlFor="targetTokenAddress" className="block text-sm font-medium text-gray-700 mb-2">
                  Target Token (WXTZ)
                </label>
                <input
                  type="text"
                  id="targetTokenAddress"
                  name="targetTokenAddress"
                  value={formData.targetTokenAddress}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 text-black border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                  required
                  readOnly
                />
                <p className="text-sm text-gray-500 mt-1">
                  WXTZ token on Etherlink mainnet via Iguana DEX (pre-configured)
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="amountToSwap" className="block text-sm font-medium text-gray-700 mb-2">
                  Amount to Swap (in USDC)
                </label>
                <input
                  type="number"
                  step="0.01"
                  id="amountToSwap"
                  name="amountToSwap"
                  value={formData.amountToSwap}
                  onChange={handleInputChange}
                  placeholder="10.0"
                  className="w-full px-3 py-2 border text-black border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <p className="text-sm text-gray-500 mt-1">
                  Amount in USDC (e.g., 10 for 10 USDC, 50.5 for 50.5 USDC)
                </p>
              </div>

              <div>
                <label htmlFor="frequencyHours" className="block text-sm font-medium text-gray-700 mb-2">
                  Frequency (Hours)
                </label>
                <select
                  id="frequencyHours"
                  name="frequencyHours"
                  value={formData.frequencyHours}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border text-black border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="0.017">Every 1 minute</option>
                  <option value="0.083">Every 5 minutes</option>
                  <option value="1">Every 1 hour</option>
                  <option value="6">Every 6 hours</option>
                  <option value="12">Every 12 hours</option>
                  <option value="24">Every 24 hours</option>
                  <option value="168">Every week</option>
                </select>
                <p className="text-sm text-gray-500 mt-1">
                  How often the agent should execute trades
                </p>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-900 mb-2">⚠️ Important Notes:</h3>
              <ul className="text-sm text-green-800 space-y-1">
                <li>• This agent will trade on Etherlink MAINNET (real money)</li>
                <li>• The agent will create its own dedicated wallet for security</li>
                <li>• USDC will be automatically transferred from your wallet to the agent wallet</li>
                <li>• The agent will execute USDC → WXTZ swaps via Iguana DEX</li>
                <li>• Gas fees are very low (~0.0001 XTZ per transaction)</li>
                <li>• Start with small amounts (10 USDC) for testing</li>
                <li>• You can pause or modify the agent anytime from the dashboard</li>
              </ul>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Creating Mainnet Agent...' : 'Create Mainnet Agent'}
              </button>
              <Link
                href="/dashboard"
                className="flex-1 bg-gray-200 text-gray-800 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors text-center"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 