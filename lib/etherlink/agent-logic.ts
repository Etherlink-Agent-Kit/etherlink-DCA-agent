import { EtherlinkKit } from 'etherlink-agent-kit';
import { createAgentTools } from './agent-tools';
import { createAdminClient } from '@/lib/supabase/server';

export async function runDcaAgentCycle(agentConfig: any) {
  console.log(`Running cycle for agent ID: ${agentConfig.id}`);
  
  try {
    // Decrypt the agent's private key securely
    const { decrypt } = await import('@/lib/utils/crypto');
    const privateKey = decrypt(agentConfig.encrypted_private_key); 
    
    // Determine if using mainnet or testnet
    const useMainnet = agentConfig.use_mainnet || false;
    const rpcUrl = useMainnet 
      ? process.env.NEXT_PUBLIC_ETHERLINK_MAINNET_RPC_URL!
      : process.env.NEXT_PUBLIC_ETHERLINK_TESTNET_RPC_URL!;
    const dexRouterAddress = useMainnet
      ? process.env.NEXT_PUBLIC_IGUANA_DEX_ROUTER_ADDRESS!
      : process.env.NEXT_PUBLIC_DEX_ROUTER_ADDRESS!;
    
    console.log(`Using ${useMainnet ? 'mainnet' : 'testnet'} configuration`);
    console.log(`RPC URL: ${rpcUrl}`);
    console.log(`Default DEX Router: ${dexRouterAddress}`);
    
    // Initialize EtherlinkKit with network configuration
    const kit = new EtherlinkKit({
      rpcUrl,
      privateKey: privateKey as `0x${string}`,
      network: useMainnet ? 'mainnet' : 'testnet'
    } as any);
    
    console.log(`Agent wallet: ${kit.account.getAddress()}`);
    console.log(`Network: ${useMainnet ? 'mainnet' : 'testnet'}`);
    console.log(`Agent: ${agentConfig.agent_name}`);
    console.log(`Amount: ${agentConfig.amount_to_swap} wei`);
    console.log(`From: ${agentConfig.source_token_address}`);
    console.log(`To: ${agentConfig.target_token_address}`);
    
    // Create agent tools
    const { approveToken, executeSwap, findBestPool } = createAgentTools(kit, dexRouterAddress, useMainnet);
    
    // Check available pools with router fallback
    console.log('\n🔍 Checking available pools with router fallback...');
    const bestPool = await findBestPool(
      agentConfig.source_token_address,
      agentConfig.target_token_address
    );
    
    if (!bestPool) {
      const errorMsg = `No available pools found for ${agentConfig.source_token_address} → ${agentConfig.target_token_address} on any router`;
      console.error(errorMsg);
      
      // Log the failure
      const supabase = createAdminClient();
      await supabase.from('agent_logs').insert({
        agent_id: agentConfig.id,
        status: 'failed',
        error_message: errorMsg,
        details: {
          source_token: agentConfig.source_token_address,
          target_token: agentConfig.target_token_address,
          network: useMainnet ? 'mainnet' : 'testnet',
          dex_router: dexRouterAddress,
          routers_tried: ['Iguana DEX', 'PancakeSwap V3', 'Uniswap V3']
        }
      });
      
      return;
    }
    
    console.log(`✅ Found best pool with ${bestPool.percentage}% fee on ${bestPool.routerName}`);
    if (bestPool.amountOut) {
      console.log(`📊 Estimated output: ${bestPool.amountOut.toString()} wei`);
    }
    
    // Execute the DCA cycle
    console.log('\n🔐 Approving tokens...');
    const approvalResult = await approveToken(agentConfig.source_token_address, agentConfig.amount_to_swap);
    console.log('Approval result:', approvalResult);
    
    if (approvalResult.includes('failed')) {
      const errorMsg = `Token approval failed: ${approvalResult}`;
      console.error(errorMsg);
      
      // Log the failure
      const supabase = createAdminClient();
      await supabase.from('agent_logs').insert({
        agent_id: agentConfig.id,
        status: 'failed',
        error_message: errorMsg,
        details: {
          approvalResult,
          network: useMainnet ? 'mainnet' : 'testnet',
          fee_tier: bestPool.fee,
          fee_percentage: bestPool.percentage,
          router_name: bestPool.routerName,
          router_address: bestPool.router
        }
      });
      
      return;
    }
    
    console.log('\n💱 Executing swap...');
    const swapResult = await executeSwap(
      agentConfig.source_token_address,
      agentConfig.target_token_address,
      agentConfig.amount_to_swap
    );
    console.log('Swap result:', swapResult);
    
    // Determine if the operation was successful
    const isSuccess = !swapResult.includes('failed') && !swapResult.includes('error');
    
    // Extract transaction hash if available
    const txHashMatch = swapResult.match(/Transaction hash: (0x[a-fA-F0-9]{64})/);
    const transactionHash = txHashMatch ? txHashMatch[1] : null;
    
    // Log the result
    const supabase = createAdminClient();
    await supabase.from('agent_logs').insert({
      agent_id: agentConfig.id,
      status: isSuccess ? 'success' : 'failed',
      transaction_hash: transactionHash,
      error_message: isSuccess ? null : swapResult,
      details: {
        approvalResult,
        swapResult,
        network: useMainnet ? 'mainnet' : 'testnet',
        dex_router: bestPool.router,
        router_name: bestPool.routerName,
        fee_tier: bestPool.fee,
        fee_percentage: bestPool.percentage,
        amount_swapped: agentConfig.amount_to_swap,
        source_token: agentConfig.source_token_address,
        target_token: agentConfig.target_token_address,
        estimated_output: bestPool.amountOut?.toString()
      }
    });
    
    console.log(`✅ DCA cycle completed with ${isSuccess ? 'success' : 'failure'}`);
    
  } catch (error: any) {
    console.error('Error in DCA agent cycle:', error);
    
    // Log the error
    const supabase = createAdminClient();
    await supabase.from('agent_logs').insert({
      agent_id: agentConfig.id,
      status: 'failed',
      error_message: error.message,
      details: {
        error: error.message,
        stack: error.stack
      }
    });
  }
}