import { NextResponse } from 'next/server';
import { EtherlinkKit } from 'etherlink-agent-kit';

export async function GET(request: Request) {
  try {
    const kit = new EtherlinkKit({
      privateKey: process.env.NEXT_PUBLIC_ETHERLINK_MAINNET_PRIVATE_KEY as `0x${string}`,
      rpcUrl: process.env.NEXT_PUBLIC_ETHERLINK_MAINNET_RPC_URL!
    });

    // Mainnet USDC/WXTZ addresses
    const USDC_ADDRESS = '0x796Ea11Fa2dD751eD01b53C372fFDB4AAa8f00F9';
    const WXTZ_ADDRESS = '0xc9B53AB2679f573e480d01e0f49e2B5CFB7a3EAb';

    // Alternative router addresses to try
    const ALTERNATIVE_ROUTERS = [
      { name: 'Iguana DEX', address: '0xE67B7D039b78DE25367EF5E69596075Bbd852BA9' },
      { name: 'PancakeSwap V3', address: '0x13f4EA83D0bd40E75C8222255bc855a974568Dd4' },
      { name: 'Uniswap V3', address: '0xE592427A0AEce92De3Edee1F18E0157C05861564' }
    ];

    // Test different fee tiers including 0.25%
    const feeTiers = [
      { fee: 500, percentage: 0.05 },   // 0.05%
      { fee: 2500, percentage: 0.25 },  // 0.25% (new tier)
      { fee: 3000, percentage: 0.3 },   // 0.3%
      { fee: 10000, percentage: 1.0 }   // 1%
    ];
    
    const allResults = [];
    let bestPool = null;
    
    // Try each router
    for (const router of ALTERNATIVE_ROUTERS) {
      console.log(`\n🔍 Testing ${router.name} router: ${router.address}`);
      const routerResults = [];
      
      for (const feeInfo of feeTiers) {
        try {
          console.log(`  Testing ${router.name} pool with ${feeInfo.percentage}% fee (${feeInfo.fee} basis points)...`);
          
          // Try to get pool address to see if pool exists
          const poolAddress = await kit.chain.readContract({
            address: router.address as `0x${string}`,
            abi: [{
              inputs: [
                { name: "tokenA", type: "address" },
                { name: "tokenB", type: "address" },
                { name: "fee", type: "uint24" }
              ],
              name: "getPool",
              outputs: [{ name: "pool", type: "address" }],
              stateMutability: "view",
              type: "function"
            }],
            functionName: 'getPool',
            args: [
              USDC_ADDRESS as `0x${string}`,
              WXTZ_ADDRESS as `0x${string}`,
              feeInfo.fee
            ],
          }) as string;
          
          if (poolAddress && poolAddress !== '0x0000000000000000000000000000000000000000') {
            console.log(`  ✅ ${router.name} pool found at ${poolAddress} for ${feeInfo.percentage}% fee`);
            
            // Try to get amount out to verify liquidity
            try {
              const amountOut = await kit.chain.readContract({
                address: router.address as `0x${string}`,
                abi: [{
                  inputs: [
                    { name: "tokenIn", type: "address" },
                    { name: "tokenOut", type: "address" },
                    { name: "fee", type: "uint24" },
                    { name: "amountIn", type: "uint256" }
                  ],
                  name: "getAmountOut",
                  outputs: [{ name: "amountOut", type: "uint256" }],
                  stateMutability: "view",
                  type: "function"
                }],
                functionName: 'getAmountOut',
                args: [
                  USDC_ADDRESS as `0x${string}`,
                  WXTZ_ADDRESS as `0x${string}`,
                  feeInfo.fee,
                  BigInt('1000000') // 1 USDC
                ],
              }) as bigint;
              
              console.log(`  ✅ ${router.name} pool has liquidity. Amount out: ${amountOut.toString()} wei`);
              
              const result = { 
                router: router.name,
                routerAddress: router.address,
                fee: feeInfo.fee, 
                percentage: feeInfo.percentage,
                status: 'success', 
                message: 'Pool exists with liquidity',
                poolAddress: poolAddress,
                amountOut: amountOut.toString()
              };
              
              routerResults.push(result);
              allResults.push(result);
              
              // Set as best pool if it's the first successful one or has better fee
              if (!bestPool || (feeInfo.fee === 2500 && bestPool.fee !== 2500)) {
                bestPool = result;
              }
              
            } catch (amountError: any) {
              console.log(`  ⚠️ ${router.name} pool exists but no liquidity: ${amountError.message}`);
              const result = { 
                router: router.name,
                routerAddress: router.address,
                fee: feeInfo.fee, 
                percentage: feeInfo.percentage,
                status: 'partial', 
                message: 'Pool exists but no liquidity',
                poolAddress: poolAddress,
                amountOut: null
              };
              routerResults.push(result);
              allResults.push(result);
            }
          } else {
            console.log(`  ❌ No ${router.name} pool found for ${feeInfo.percentage}% fee`);
            const result = { 
              router: router.name,
              routerAddress: router.address,
              fee: feeInfo.fee, 
              percentage: feeInfo.percentage,
              status: 'failed', 
              message: 'Pool does not exist',
              poolAddress: null,
              amountOut: null
            };
            routerResults.push(result);
            allResults.push(result);
          }
        } catch (error: any) {
          console.log(`  ❌ Error checking ${router.name} ${feeInfo.percentage}% pool: ${error.message}`);
          const result = { 
            router: router.name,
            routerAddress: router.address,
            fee: feeInfo.fee, 
            percentage: feeInfo.percentage,
            status: 'failed', 
            message: error.message,
            poolAddress: null,
            amountOut: null
          };
          routerResults.push(result);
          allResults.push(result);
        }
      }
      
      // Log summary for this router
      const successfulPools = routerResults.filter(r => r.status === 'success');
      console.log(`  📊 ${router.name} summary: ${successfulPools.length}/${routerResults.length} pools available`);
    }

    // Find the best available pool
    const availablePools = allResults.filter(r => r.status === 'success');

    return NextResponse.json({ 
      message: 'Mainnet pool test results with router fallback',
      network: 'mainnet',
      routers_tested: ALTERNATIVE_ROUTERS.map(r => r.name),
      results: allResults,
      bestPool,
      tokens: {
        USDC: USDC_ADDRESS,
        WXTZ: WXTZ_ADDRESS
      },
      summary: {
        totalPools: allResults.length,
        availablePools: availablePools.length,
        recommendedFee: bestPool ? bestPool.fee : null,
        recommendedPercentage: bestPool ? bestPool.percentage : null,
        recommendedRouter: bestPool ? bestPool.router : null,
        poolExists: allResults.some(r => r.status === 'success' || r.status === 'partial')
      }
    });
    
  } catch (error: any) {
    console.error('Mainnet pool test error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 