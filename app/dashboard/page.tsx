'use client';

import { useAccount } from 'wagmi';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface Agent {
  id: string;
  agent_name: string;
  agent_wallet_address: string;
  source_token_address: string;
  target_token_address: string;
  amount_to_swap: string;
  frequency_hours: number;
  is_active: boolean;
  use_mainnet: boolean;
  next_run_timestamp: string;
  created_at: string;
}

// Helper function to convert wei to USDC (USDC has 6 decimals)
function weiToUSDC(wei: string): string {
  const weiBigInt = BigInt(wei);
  const usdcBigInt = weiBigInt / BigInt(10 ** 6);
  const remainder = weiBigInt % BigInt(10 ** 6);
  
  if (remainder === BigInt(0)) {
    return usdcBigInt.toString();
  } else {
    // Show with 2 decimal places for USDC precision
    const decimalPart = (remainder * BigInt(100)) / BigInt(10 ** 6);
    return `${usdcBigInt}.${decimalPart.toString().padStart(2, '0')}`;
  }
}

  // Helper function to convert wei to WXTZ (WXTZ has 18 decimals)
  function weiToWXTZ(wei: string): string {
    const weiBigInt = BigInt(wei);
    const wxtzBigInt = weiBigInt / BigInt(10 ** 18);
    const remainder = weiBigInt % BigInt(10 ** 18);
    
    if (remainder === BigInt(0)) {
      return wxtzBigInt.toString();
    } else {
      // Show with 6 decimal places for WXTZ precision
      const decimalPart = (remainder * BigInt(1000000)) / BigInt(10 ** 18);
      return `${wxtzBigInt}.${decimalPart.toString().padStart(6, '0')}`;
    }
  }

// Helper function to get token symbol from address
function getTokenSymbol(address: string, useMainnet: boolean): string {
  if (useMainnet) {
    // Mainnet addresses
    if (address === '0xc9B53AB2679f573e480d01e0f49e2B5CFB7a3EAb') return 'WXTZ';
    if (address === '0x796Ea11Fa2dD751eD01b53C372fFDB4AAa8f00F9') return 'USDC';
  } else {
    // Testnet addresses
    if (address === '0x4C2AA252BEe766D3399850569713b55178934849') return 'USDC';
    if (address === '0xF92bF3FCcBecABb3e31905c5de10C9FffA7A6acf') return 'ZILY';
  }
  return 'Unknown';
}

// Helper function to format amount based on token
function formatAmount(amount: string, sourceToken: string, useMainnet: boolean): string {
  const symbol = getTokenSymbol(sourceToken, useMainnet);
  if (symbol === 'USDC') {
    return `${weiToUSDC(amount)} USDC`;
  } else if (symbol === 'WXTZ') {
    return `${weiToWXTZ(amount)} WXTZ`;
  } else if (symbol === 'ZILY') {
    return `${weiToUSDC(amount)} ZILY`; // Using USDC formatter for ZILY
  }
  return `${amount} wei`;
}

export default function Dashboard() {
  const { isConnected, address } = useAccount();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastTradeCheck, setLastTradeCheck] = useState<Date>(new Date());

  useEffect(() => {
    if (isConnected && address) {
      fetchAgents();
      // Check for recent trades immediately
      checkForNewTrades();
      // Start polling for new trades
      const interval = setInterval(() => {
        checkForNewTrades();
      }, 30000); // Check every 30 seconds

      return () => clearInterval(interval);
    } else {
      setLoading(false);
    }
  }, [isConnected, address]);

  const fetchAgents = async () => {
    try {
      console.log('Fetching agents for wallet:', address);
      
      // Use wallet address (will be normalized in API)
      const walletAddress = address;
      console.log('Using wallet address:', walletAddress);
      console.log('Normalized wallet address:', walletAddress?.toLowerCase());
      
      const response = await fetch(`/api/agents?wallet=${walletAddress}`);
      console.log('Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Agents data:', data);
        console.log('Number of agents found:', data.agents?.length || 0);
        
        // Log agent details for debugging
        if (data.agents && data.agents.length > 0) {
          data.agents.forEach((agent: any, index: number) => {
            console.log(`Agent ${index + 1}:`, {
              id: agent.id,
              name: agent.agent_name,
              wallet: agent.user_wallet_address,
              network: agent.use_mainnet ? 'mainnet' : 'testnet',
              active: agent.is_active
            });
          });
        }
        
        setAgents(data.agents || []);
      } else {
        const errorData = await response.json();
        console.error('Failed to fetch agents:', errorData);
        toast.error(`Failed to fetch agents: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error fetching agents:', error);
      toast.error('Error fetching agents. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const checkForNewTrades = async () => {
    if (!address) return;
    
    try {
      const response = await fetch(`/api/agents/trades?wallet=${address}`);
      if (response.ok) {
        const data = await response.json();
        const newTrades = data.trades?.filter((trade: any) => 
          new Date(trade.execution_timestamp) > lastTradeCheck
        ) || [];
        
        newTrades.forEach((trade: any) => {
          if (trade.status === 'success') {
            toast.success(
              `✅ ${trade.agent_name} executed trade successfully!\nTransaction: ${trade.transaction_hash?.slice(0, 10)}...`,
              { duration: 6000 }
            );
          } else {
            toast.error(
              `❌ ${trade.agent_name} trade failed: ${trade.error_message}`,
              { duration: 8000 }
            );
          }
        });
        
        if (newTrades.length > 0) {
          setLastTradeCheck(new Date());
        }
      }
    } catch (error) {
      console.error('Error checking for new trades:', error);
    }
  };

  // Show notification when dashboard loads
  useEffect(() => {
    if (isConnected && address && agents.length > 0) {
      const activeAgents = agents.filter(agent => agent.is_active);
      if (activeAgents.length > 0) {
        toast.success(`🔔 Trade monitoring active for ${activeAgents.length} agent(s)`, { duration: 3000 });
      }
    }
  }, [agents, isConnected, address]);

  // Debug wallet connection
  useEffect(() => {
    console.log('Wallet connection status:', { isConnected, address });
    if (isConnected && address) {
      console.log('Connected wallet address:', address);
      console.log('Normalized address:', address.toLowerCase());
    }
  }, [isConnected, address]);

  const toggleAgentStatus = async (agentId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/agents/${agentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_active: !currentStatus }),
      });

      if (response.ok) {
        // Refresh agents list
        fetchAgents();
        toast.success(currentStatus ? 'Agent paused successfully' : 'Agent activated successfully');
      } else {
        toast.error('Failed to update agent status');
      }
    } catch (error) {
      console.error('Error updating agent:', error);
      toast.error('Failed to update agent status');
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard!`);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      toast.error('Failed to copy to clipboard');
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <h2 className="text-2xl font-bold mb-4">Connect Wallet Required</h2>
          <p className="text-gray-600 mb-6">
            Please connect your wallet to view your dashboard.
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-center mt-4 text-gray-600">Loading your agents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Your DCA Agents</h1>
            <p className="text-gray-600 mt-2">
              Manage your autonomous trading agents
            </p>
          </div>
          <div className="flex gap-3">
            <Link 
              href="/create-agent"
              className="bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg shadow-md hover:bg-blue-700 transition-colors"
            >
              + New Testnet Agent
            </Link>
            <Link 
              href="/create-mainnet-agent"
              className="bg-green-600 text-white font-semibold px-6 py-3 rounded-lg shadow-md hover:bg-green-700 transition-colors"
            >
              + New Mainnet Agent
            </Link>
          </div>
        </div>

        <div className="space-y-6">
          {agents.length > 0 ? (
            agents.map((agent) => {
              console.log('Rendering agent:', agent);
              const useMainnet = agent.use_mainnet || false;
              const sourceSymbol = getTokenSymbol(agent.source_token_address, useMainnet);
              const targetSymbol = getTokenSymbol(agent.target_token_address, useMainnet);
              const formattedAmount = formatAmount(agent.amount_to_swap, agent.source_token_address, useMainnet);
              
              return (
              <div key={agent.id} className="bg-white p-6 border rounded-xl shadow-lg">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{agent.agent_name}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Created: {new Date(agent.created_at).toLocaleDateString()}
                      {useMainnet && (
                        <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                          Mainnet
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      agent.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {agent.is_active ? 'Active' : 'Paused'}
                    </span>
                    <button
                      onClick={() => toggleAgentStatus(agent.id, agent.is_active)}
                      className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                        agent.is_active
                          ? 'bg-red-100 text-red-700 hover:bg-red-200'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      {agent.is_active ? 'Pause' : 'Activate'}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Agent Wallet</p>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-mono bg-blue-50 text-gray-900 px-3 py-2 rounded border flex-1">
                        {agent.agent_wallet_address ? `${agent.agent_wallet_address.slice(0, 8)}...${agent.agent_wallet_address.slice(-6)}` : 'N/A'}
                      </p>
                      {agent.agent_wallet_address && (
                        <button
                          onClick={() => copyToClipboard(agent.agent_wallet_address, 'Agent wallet address')}
                          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Copy wallet address"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Amount</p>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-mono bg-blue-50 text-gray-900 px-3 py-2 rounded border flex-1">
                        {formattedAmount}
                      </p>
                      <button
                        onClick={() => copyToClipboard(formattedAmount, 'Amount')}
                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="Copy amount"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Frequency</p>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-mono bg-blue-50 text-gray-900 px-3 py-2 rounded border flex-1">
                        {agent.frequency_hours ? `Every ${agent.frequency_hours} hours` : 'N/A'}
                      </p>
                      {agent.frequency_hours && (
                        <button
                          onClick={() => copyToClipboard(agent.frequency_hours.toString(), 'Frequency')}
                          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Copy frequency"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Next Run</p>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-mono bg-blue-50 text-gray-900 px-3 py-2 rounded border flex-1">
                        {agent.next_run_timestamp ? new Date(agent.next_run_timestamp).toLocaleString() : 'N/A'}
                      </p>
                      {agent.next_run_timestamp && (
                        <button
                          onClick={() => copyToClipboard(new Date(agent.next_run_timestamp).toLocaleString(), 'Next run time')}
                          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Copy next run time"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <p className="text-sm text-gray-600">
                    Swapping <span className="font-mono bg-blue-100 px-1 rounded">
                      {formattedAmount}
                    </span> from <span className="font-mono bg-blue-100 px-1 rounded">
                      {sourceSymbol}
                    </span> to <span className="font-mono bg-blue-100 px-1 rounded">
                      {targetSymbol}
                    </span>
                    {useMainnet && (
                      <span className="ml-2 text-green-600 font-semibold">
                        via Iguana DEX
                      </span>
                    )}
                  </p>
                </div>
              </div>
            );
            })
          ) : (
            <div className="text-center py-16 border-2 border-dashed border-gray-300 rounded-lg bg-white">
              <div className="mb-4">
                <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No agents yet</h3>
              <p className="text-gray-600 mb-6">Create your first DCA agent to start automated trading.</p>
              <div className="flex gap-3 justify-center">
                <Link 
                  href="/create-agent"
                  className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  Create Testnet Agent
                </Link>
                <Link 
                  href="/create-mainnet-agent"
                  className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                >
                  Create Mainnet Agent
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}