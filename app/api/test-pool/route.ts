import { NextResponse } from 'next/server';
import { EtherlinkKit } from 'etherlink-agent-kit';

export async function GET(request: Request) {
  try {
    const kit = new EtherlinkKit({
      privateKey: process.env.NEXT_PUBLIC_ETHERLINK_TESTNET_PRIVATE_KEY as `0x${string}`,
      rpcUrl: process.env.NEXT_PUBLIC_ETHERLINK_TESTNET_RPC_URL!
    });

    const USDC_ADDRESS = '0x4C2AA252BEe766D3399850569713b55178934849';
    const WXTZ_ADDRESS = '0xc9B53AB2679f573e480d01e0f49e2B5CFB7a3EAb';
    const DEX_ROUTER = '0x03BCdBc56308c365B4dbADD4d71D0795f3ecCe36';

    // Test different fee tiers including 0.25%
    const feeTiers = [
      { fee: 500, percentage: 0.05 },   // 0.05%
      { fee: 2500, percentage: 0.25 },  // 0.25% (new tier)
      { fee: 3000, percentage: 0.3 },   // 0.3%
      { fee: 10000, percentage: 1.0 }   // 1%
    ];
    
    const results = [];
    
    for (const feeInfo of feeTiers) {
      try {
        console.log(`Testing pool with ${feeInfo.percentage}% fee (${feeInfo.fee} basis points)...`);
        
        // Try to get pool address to see if pool exists
        const poolAddress = await kit.chain.readContract({
          address: DEX_ROUTER as `0x${string}`,
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
        });
        
        if (poolAddress && poolAddress !== '0x0000000000000000000000000000000000000000') {
          console.log(`✅ Pool found at ${poolAddress} for ${feeInfo.percentage}% fee`);
          results.push({ 
            fee: feeInfo.fee, 
            percentage: feeInfo.percentage,
            status: 'success', 
            message: 'Pool exists',
            poolAddress: poolAddress
          });
        } else {
          console.log(`❌ No pool found for ${feeInfo.percentage}% fee`);
          results.push({ 
            fee: feeInfo.fee, 
            percentage: feeInfo.percentage,
            status: 'failed', 
            message: 'Pool does not exist',
            poolAddress: null
          });
        }
      } catch (error: any) {
        console.log(`❌ Error checking ${feeInfo.percentage}% pool: ${error.message}`);
        results.push({ 
          fee: feeInfo.fee, 
          percentage: feeInfo.percentage,
          status: 'failed', 
          message: error.message,
          poolAddress: null
        });
      }
    }

    // Find the best available pool
    const availablePools = results.filter(r => r.status === 'success');
    const bestPool = availablePools.length > 0 ? availablePools[0] : null;

    return NextResponse.json({ 
      message: 'Pool test results',
      results,
      bestPool,
      tokens: {
        USDC: USDC_ADDRESS,
        WXTZ: WXTZ_ADDRESS,
        DEX_ROUTER: DEX_ROUTER
      },
      summary: {
        totalPools: results.length,
        availablePools: availablePools.length,
        recommendedFee: bestPool ? bestPool.fee : null,
        recommendedPercentage: bestPool ? bestPool.percentage : null
      }
    });
    
  } catch (error: any) {
    console.error('Pool test error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 