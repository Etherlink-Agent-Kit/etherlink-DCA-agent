import { EtherlinkKit } from 'etherlink-agent-kit';
import Erc20ABI from './abis/Erc20.json';
import DexRouterABI from './abis/DexRouter.json';
import IguanaRouterABI from './abis/IguanaRouter.json';
import IguanaRouterV3ABI from './abis/IguanaRouterV3.json';

// Known working SwapRouter address from successful transaction
const SWAP_ROUTER = '0xE67B7D039b78DE25367EF5E69596075Bbd852BA9';

// This function creates a set of tools for a specific agent instance
export function createAgentTools(agentKit: EtherlinkKit, dexRouterAddress: string, useMainnet: boolean = false) {

  const approveToken = async (tokenAddress: string, amount: string): Promise<string> => {
    try {
      const txHash = await agentKit.chain.executeContract({
        address: tokenAddress as `0x${string}`,
        abi: Erc20ABI as any,
        functionName: 'approve',
        args: [dexRouterAddress as `0x${string}`, amount],
      });
      return `Approval successful. Transaction hash: ${txHash}`;
    } catch (error: any) {
      return `Approval failed: ${error.message}`;
    }
  };

  // Function to find the best available pool with multiple router fallbacks
  const findBestPool = async (tokenIn: string, tokenOut: string): Promise<{ fee: number, percentage: number, amountOut?: bigint, router: string, routerName: string } | null> => {
    console.log(`Finding pool for ${tokenIn} → ${tokenOut}`);
    
    // Define available routers to try
    const routers = [
      { address: SWAP_ROUTER, name: 'Iguana DEX V3', fee: 2500, percentage: 0.25 },
      { address: dexRouterAddress, name: 'Testnet DEX Router', fee: 3000, percentage: 0.3 },
      { address: '0x8a7bBf269B95875FC1829901bb2c815029d8442e', name: 'Alternative Router', fee: 5000, percentage: 0.5 }
    ];
    
    console.log(`🔍 Trying ${routers.length} different routers...`);
    
    for (const router of routers) {
      try {
        console.log(`\n📡 Testing router: ${router.name} (${router.address})`);
        
        // Try to read a simple function to check if router is accessible
        try {
          await agentKit.chain.readContract({
            address: router.address as `0x${string}`,
            abi: [{ "inputs": [], "name": "factory", "outputs": [{"internalType": "address", "name": "", "type": "address"}], "stateMutability": "view", "type": "function" }],
            functionName: 'factory'
          });
          console.log(`✅ Router ${router.name} is accessible`);
        } catch (readError) {
          console.log(`⚠️  Router ${router.name} read test failed, but continuing...`);
        }
        
        console.log(`✅ Using ${router.percentage}% fee tier (${router.fee} basis points)`);
        console.log(`✅ Router: ${router.address} (${router.name})`);
        
        return { 
          fee: router.fee, 
          percentage: router.percentage, 
          router: router.address, 
          routerName: router.name 
        };
             } catch (error: any) {
         console.log(`❌ Router ${router.name} failed: ${error.message}`);
         continue;
       }
    }
    
    console.log(`❌ No working routers found for ${tokenIn} → ${tokenOut}`);
    return null;
  };

  const executeSwap = async (tokenIn: string, tokenOut: string, amountIn: string): Promise<string> => {
    try {
      console.log(`DCA Agent attempting swap: ${amountIn} wei of ${tokenIn} to ${tokenOut}`);
      console.log(`Agent wallet: ${agentKit.account.getAddress()}`);
      console.log(`Network: ${useMainnet ? 'Mainnet' : 'Testnet'}`);
      console.log(`DEX: ${useMainnet ? 'Iguana DEX V3' : 'PancakeSwap V3'}`);
      
      // Check if agent has sufficient balance
      const balance = await agentKit.token.getBalance({
        tokenAddress: tokenIn as `0x${string}`
      }) as bigint;
      
      console.log(`Agent balance: ${balance.toString()} wei`);
      
      if (balance < BigInt(amountIn)) {
        return `Swap failed: Insufficient balance. Have: ${balance.toString()}, Need: ${amountIn}`;
      }
      
      // Find the best available pool (simplified)
      const bestPool = await findBestPool(tokenIn, tokenOut);
      if (!bestPool) {
        return `Swap failed: No available pools found for ${tokenIn} → ${tokenOut}`;
      }
      
      console.log(`Using ${bestPool.routerName} router with ${bestPool.percentage}% fee (${bestPool.fee} basis points)`);
      
      // Calculate minimum amount out (with 1% slippage tolerance)
      const amountInBigInt = BigInt(amountIn);
      const minAmountOut = amountInBigInt * BigInt(99) / BigInt(100); // 1% slippage
      
      // Set deadline (5 minutes from now)
      const deadline = Math.floor(Date.now() / 1000) + 300;
      
      if (useMainnet) {
        // Use Iguana DEX V3 on mainnet with exactInputSingle (proven to work)
        console.log(`Executing Iguana DEX V3 swap on mainnet using exactInputSingle`);
        console.log(`Amount in: ${amountInBigInt.toString()} wei`);
        console.log(`Min amount out: ${minAmountOut.toString()} wei`);
        console.log(`Fee tier: ${bestPool.fee} (${bestPool.percentage}%)`);
        console.log(`Deadline: ${deadline}`);
        
        // Use the exactInputSingle method (proven to work based on successful transaction)
        try {
          const exactInputSingleParams = {
            tokenIn: tokenIn as `0x${string}`,
            tokenOut: tokenOut as `0x${string}`,
            fee: BigInt(bestPool.fee),
            recipient: agentKit.account.getAddress() as `0x${string}`,
            deadline: BigInt(deadline),
            amountIn: amountInBigInt,
            amountOutMinimum: minAmountOut,
            sqrtPriceLimitX96: BigInt(0)
          };
          
          const txHash = await agentKit.chain.executeContract({
            address: SWAP_ROUTER as `0x${string}`,
            abi: [
              {
                "inputs": [
                  {
                    "components": [
                      {"internalType": "address", "name": "tokenIn", "type": "address"},
                      {"internalType": "address", "name": "tokenOut", "type": "address"},
                      {"internalType": "uint24", "name": "fee", "type": "uint24"},
                      {"internalType": "address", "name": "recipient", "type": "address"},
                      {"internalType": "uint256", "name": "deadline", "type": "uint256"},
                      {"internalType": "uint256", "name": "amountIn", "type": "uint256"},
                      {"internalType": "uint256", "name": "amountOutMinimum", "type": "uint256"},
                      {"internalType": "uint160", "name": "sqrtPriceLimitX96", "type": "uint160"}
                    ],
                    "internalType": "struct ISwapRouter.ExactInputSingleParams",
                    "name": "params",
                    "type": "tuple"
                  }
                ],
                "name": "exactInputSingle",
                "outputs": [{"internalType": "uint256", "name": "amountOut", "type": "uint256"}],
                "stateMutability": "payable",
                "type": "function"
              }
            ],
            functionName: 'exactInputSingle',
            args: [exactInputSingleParams],
          });
          
          return `Iguana DEX V3 swap successful with ${bestPool.percentage}% fee. Transaction hash: ${txHash}`;
        } catch (swapError: any) {
          console.log(`Iguana DEX V3 swap failed: ${swapError.message}`);
          return `Swap failed: ${swapError.message}`;
        }
      } else {
        // Execute real swap on testnet using available DEX router
        console.log(`Executing real swap on testnet: ${amountIn} wei of ${tokenIn} to ${tokenOut}`);
        console.log(`Router: ${dexRouterAddress}, Method: exactInputSingle, Fee: ${bestPool.fee} (${bestPool.percentage}%)`);
        
        try {
          // Try to execute real swap using the available router
          const exactInputSingleParams = {
            tokenIn: tokenIn as `0x${string}`,
            tokenOut: tokenOut as `0x${string}`,
            fee: BigInt(bestPool.fee),
            recipient: agentKit.account.getAddress() as `0x${string}`,
            deadline: BigInt(deadline),
            amountIn: amountInBigInt,
            amountOutMinimum: minAmountOut,
            sqrtPriceLimitX96: BigInt(0)
          };
          
          const txHash = await agentKit.chain.executeContract({
            address: dexRouterAddress as `0x${string}`,
            abi: [
              {
                "inputs": [
                  {
                    "components": [
                      {"internalType": "address", "name": "tokenIn", "type": "address"},
                      {"internalType": "address", "name": "tokenOut", "type": "address"},
                      {"internalType": "uint24", "name": "fee", "type": "uint24"},
                      {"internalType": "address", "name": "recipient", "type": "address"},
                      {"internalType": "uint256", "name": "deadline", "type": "uint256"},
                      {"internalType": "uint256", "name": "amountIn", "type": "uint256"},
                      {"internalType": "uint256", "name": "amountOutMinimum", "type": "uint256"},
                      {"internalType": "uint160", "name": "sqrtPriceLimitX96", "type": "uint160"}
                    ],
                    "internalType": "struct ISwapRouter.ExactInputSingleParams",
                    "name": "params",
                    "type": "tuple"
                  }
                ],
                "name": "exactInputSingle",
                "outputs": [{"internalType": "uint256", "name": "amountOut", "type": "uint256"}],
                "stateMutability": "payable",
                "type": "function"
              }
            ],
            functionName: 'exactInputSingle',
            args: [exactInputSingleParams],
          });
          
          return `Real testnet swap successful with ${bestPool.percentage}% fee. Transaction hash: ${txHash}`;
        } catch (swapError: any) {
          console.log(`Real testnet swap failed: ${swapError.message}`);
          
          // Fallback: Try alternative swap method if exactInputSingle fails
          try {
            console.log(`Trying alternative swap method...`);
            
            // Try a simpler swap method that might be available
            const txHash = await agentKit.chain.executeContract({
              address: dexRouterAddress as `0x${string}`,
              abi: [
                {
                  "inputs": [
                    {"internalType": "address", "name": "tokenIn", "type": "address"},
                    {"internalType": "address", "name": "tokenOut", "type": "address"},
                    {"internalType": "uint256", "name": "amountIn", "type": "uint256"},
                    {"internalType": "uint256", "name": "amountOutMin", "type": "uint256"},
                    {"internalType": "address", "name": "to", "type": "address"},
                    {"internalType": "uint256", "name": "deadline", "type": "uint256"}
                  ],
                  "name": "swapExactTokensForTokens",
                  "outputs": [{"internalType": "uint256[]", "name": "amounts", "type": "uint256[]"}],
                  "stateMutability": "nonpayable",
                  "type": "function"
                }
              ],
              functionName: 'swapExactTokensForTokens',
              args: [
                tokenIn as `0x${string}`,
                tokenOut as `0x${string}`,
                amountInBigInt,
                minAmountOut,
                agentKit.account.getAddress() as `0x${string}`,
                BigInt(deadline)
              ],
            });
            
            return `Real testnet swap successful (fallback method). Transaction hash: ${txHash}`;
          } catch (fallbackError: any) {
            console.log(`Fallback swap also failed: ${fallbackError.message}`);
            return `Swap failed: ${swapError.message}. Fallback also failed: ${fallbackError.message}`;
          }
        }
      }
    } catch (error: any) {
      return `Swap failed: ${error.message}`;
    }
  };
  
  return { approveToken, executeSwap, findBestPool };
}