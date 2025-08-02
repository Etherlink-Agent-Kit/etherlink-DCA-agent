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
    const USDC_WXTZ_POOL = '0x99e4913d8e7dea6da9839fec75a5652df80fdafd';

    console.log('Testing direct pool access...');
    console.log(`Pool address: ${USDC_WXTZ_POOL}`);
    console.log(`USDC: ${USDC_ADDRESS}`);
    console.log(`WXTZ: ${WXTZ_ADDRESS}`);

    const results = {
      poolAccessible: false,
      poolDetails: null,
      liquidityTest: null,
      swapTest: null
    };

    try {
      // Test 1: Check if pool is accessible
      console.log('\n🔍 Testing pool accessibility...');
      const token0 = await kit.chain.readContract({
        address: USDC_WXTZ_POOL as `0x${string}`,
        abi: [{
          inputs: [],
          name: "token0",
          outputs: [{ name: "", type: "address" }],
          stateMutability: "view",
          type: "function"
        }],
        functionName: 'token0',
        args: [],
      }) as string;

      console.log(`✅ Pool is accessible. Token0: ${token0}`);
      results.poolAccessible = true;
      results.poolDetails = { token0 };

      // Test 2: Check liquidity
      console.log('\n💰 Testing liquidity...');
      try {
        const amountOut = await kit.chain.readContract({
          address: USDC_WXTZ_POOL as `0x${string}`,
          abi: [{
            inputs: [
              { name: "amountIn", type: "uint256" },
              { name: "zeroForOne", type: "bool" }
            ],
            name: "getAmountOut",
            outputs: [{ name: "amountOut", type: "uint256" }],
            stateMutability: "view",
            type: "function"
          }],
          functionName: 'getAmountOut',
          args: [BigInt('1000000'), true], // 1 USDC → WXTZ
        }) as bigint;

        console.log(`✅ Pool has liquidity. Amount out: ${amountOut.toString()} wei`);
        results.liquidityTest = {
          success: true,
          amountIn: '1000000',
          amountOut: amountOut.toString()
        };
      } catch (liquidityError: any) {
        console.log(`❌ Liquidity test failed: ${liquidityError.message}`);
        results.liquidityTest = {
          success: false,
          error: liquidityError.message
        };
      }

      // Test 3: Check if swap function exists
      console.log('\n💱 Testing swap function...');
      try {
        // Just check if the function exists by trying to read it
        await kit.chain.readContract({
          address: USDC_WXTZ_POOL as `0x${string}`,
          abi: [{
            inputs: [
              { name: "tokenIn", type: "address" },
              { name: "tokenOut", type: "address" },
              { name: "amountIn", type: "uint256" },
              { name: "amountOutMin", type: "uint256" },
              { name: "to", type: "address" },
              { name: "deadline", type: "uint256" }
            ],
            name: "swap",
            outputs: [{ name: "amountOut", type: "uint256" }],
            stateMutability: "nonpayable",
            type: "function"
          }],
          functionName: 'swap',
          args: [
            USDC_ADDRESS as `0x${string}`,
            WXTZ_ADDRESS as `0x${string}`,
            BigInt('1000000'),
            BigInt('0'),
            USDC_ADDRESS as `0x${string}`,
            BigInt(Math.floor(Date.now() / 1000) + 300)
          ],
        });

        console.log(`✅ Swap function exists`);
        results.swapTest = { success: true };
      } catch (swapError: any) {
        console.log(`❌ Swap function test failed: ${swapError.message}`);
        results.swapTest = {
          success: false,
          error: swapError.message
        };
      }

    } catch (poolError: any) {
      console.log(`❌ Pool not accessible: ${poolError.message}`);
      results.poolAccessible = false;
      results.poolDetails = { error: poolError.message };
    }

    return NextResponse.json({ 
      message: 'Direct pool access test results',
      network: 'mainnet',
      pool_address: USDC_WXTZ_POOL,
      tokens: {
        USDC: USDC_ADDRESS,
        WXTZ: WXTZ_ADDRESS
      },
      results,
      summary: {
        pool_accessible: results.poolAccessible,
        has_liquidity: results.liquidityTest?.success || false,
        swap_function_exists: results.swapTest?.success || false,
        recommended_fee: 2500,
        recommended_percentage: 0.25
      }
    });
    
  } catch (error: any) {
    console.error('Direct pool test error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 