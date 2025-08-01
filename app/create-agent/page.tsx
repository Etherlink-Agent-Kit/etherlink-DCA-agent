'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';

// Testnet token configurations
const TESTNET_TOKENS = {
  USDC: {
    address: '0x4C2AA252BEe766D3399850569713b55178934849',
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6
  },
  ZILY: {
    address: '0xF92bF3FCcBecABb3e31905c5de10C9FffA7A6acf',
    symbol: 'ZILY',
    name: 'Zily Token',
    decimals: 18
  },
  // Add more testnet tokens as they become available
  // WXTZ: {
  //   address: '0x...', // WXTZ testnet address when available
  //   symbol: 'WXTZ',
  //   name: 'Wrapped XTZ',
  //   decimals: 18
  // }
};

export default function CreateAgent() {
  const { isConnected, address } = useAccount();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    agentName: '',
    sourceTokenAddress: TESTNET_TOKENS.USDC.address,
    targetTokenAddress: TESTNET_TOKENS.ZILY.address,
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
      toast.error('Amount cannot exceed 1,000,000 tokens');
      return;
    }

    // Validate that source and target tokens are different
    if (formData.sourceTokenAddress === formData.targetTokenAddress) {
      toast.error('Source and target tokens must be different');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/agents', {
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
        toast.success('Agent created successfully! 🚀');
        router.push('/dashboard');
      } else {
        const error = await response.json();
        toast.error(`Error creating agent: ${error.error}`);
      }
    } catch (error) {
      console.error('Error creating agent:', error);
      toast.error('Failed to create agent. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // For amount field, ensure it's a valid number
    if (name === 'amountToSwap') {
      const numValue = parseFloat(value);
      if (value === '' || (numValue >= 0 && numValue <= 1000000)) { // Allow up to 1M tokens
        setFormData({
          ...formData,
          [name]: value
        });
      }
    } else if (name === 'sourceTokenAddress' || name === 'targetTokenAddress') {
      // Prevent selecting the same token for source and target
      const newFormData = {
        ...formData,
        [name]: value
      };
      
      if (newFormData.sourceTokenAddress === newFormData.targetTokenAddress) {
        toast.error('Source and target tokens must be different');
        return;
      }
      
      setFormData(newFormData);
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const getTokenSymbol = (address: string) => {
    const token = Object.values(TESTNET_TOKENS).find(t => t.address.toLowerCase() === address.toLowerCase());
    return token?.symbol || 'Unknown';
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <h2 className="text-2xl font-bold mb-4">Connect Wallet Required</h2>
          <p className="text-gray-600 mb-6">
            Please connect your wallet to create a DCA agent.
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
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New DCA Agent</h1>
            <p className="text-gray-600">
              Configure your autonomous DCA agent that will execute trades on Etherlink testnet.
            </p>
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">🧪 Testnet Configuration</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Network: Etherlink Testnet</li>
                <li>• Available Tokens: USDC, ZILY</li>
                <li>• Test tokens available via faucet</li>
                <li>• No real value - perfect for testing</li>
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
                placeholder="My DCA Agent"
                className="w-full px-3 py-2 text-black border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                Give your agent a descriptive name (e.g., "USDC to ZILY DCA")
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="sourceTokenAddress" className="block text-sm font-medium text-gray-700 mb-2">
                  Source Token
                </label>
                <select
                  id="sourceTokenAddress"
                  name="sourceTokenAddress"
                  value={formData.sourceTokenAddress}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 text-black border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  {Object.values(TESTNET_TOKENS).map((token) => (
                    <option key={token.address} value={token.address}>
                      {token.symbol} - {token.name}
                    </option>
                  ))}
                </select>
                <p className="text-sm text-gray-500 mt-1">
                  Token to swap from (currently {getTokenSymbol(formData.sourceTokenAddress)})
                </p>
              </div>

              <div>
                <label htmlFor="targetTokenAddress" className="block text-sm font-medium text-gray-700 mb-2">
                  Target Token
                </label>
                <select
                  id="targetTokenAddress"
                  name="targetTokenAddress"
                  value={formData.targetTokenAddress}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 text-black border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  {Object.values(TESTNET_TOKENS).map((token) => (
                    <option key={token.address} value={token.address}>
                      {token.symbol} - {token.name}
                    </option>
                  ))}
                </select>
                <p className="text-sm text-gray-500 mt-1">
                  Token to swap to (currently {getTokenSymbol(formData.targetTokenAddress)})
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="amountToSwap" className="block text-sm font-medium text-gray-700 mb-2">
                  Amount to Swap (in {getTokenSymbol(formData.sourceTokenAddress)})
                </label>
                <input
                  type="number"
                  step="0.01"
                  id="amountToSwap"
                  name="amountToSwap"
                  value={formData.amountToSwap}
                  onChange={handleInputChange}
                  placeholder="100.0"
                  className="w-full px-3 py-2 border text-black border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <p className="text-sm text-gray-500 mt-1">
                  Amount in {getTokenSymbol(formData.sourceTokenAddress)} (e.g., 100 for 100 {getTokenSymbol(formData.sourceTokenAddress)})
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

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">Important Notes:</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• The agent will create its own dedicated wallet for security</li>
                <li>• {getTokenSymbol(formData.sourceTokenAddress)} will be automatically transferred from your wallet to the agent wallet</li>
                <li>• The agent will execute {getTokenSymbol(formData.sourceTokenAddress)} → {getTokenSymbol(formData.targetTokenAddress)} swaps automatically</li>
                <li>• All transactions will be executed on Etherlink testnet</li>
                <li>• You can pause or modify the agent anytime from the dashboard</li>
                <li>• Test tokens are available via the Etherlink testnet faucet</li>
              </ul>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Creating Agent...' : 'Create Agent'}
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