import { NextRequest, NextResponse } from 'next/server';
import { EtherlinkKit } from 'etherlink-agent-kit';
import { encrypt } from '@/lib/utils/crypto';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST() {
  try {
    const etherlinkKit = new EtherlinkKit({
      privateKey: process.env.NEXT_PUBLIC_ETHERLINK_TESTNET_PRIVATE_KEY as `0x${string}`,
      rpcUrl: process.env.NEXT_PUBLIC_ETHERLINK_TESTNET_RPC_URL as string,
    });

    // Create a new agent wallet
    const agentAccount = await etherlinkKit.account.create();
    const agentPrivateKey = agentAccount.privateKey;
    const agentWalletAddress = agentAccount.address;

    // Encrypt the private key
    const encryptedPrivateKey = encrypt(agentPrivateKey);

    // Create agent config for USDC → ZILY via SmartRouter
    const agentConfig = {
      user_wallet_address: '0xA879eB55AaD088A8a19E06610129d4CDb4f2c99b', // Your wallet
      agent_wallet_address: agentWalletAddress,
      encrypted_private_key: encryptedPrivateKey,
      agent_name: 'USDC to ZILY DCA via SmartRouter',
      source_token_address: '0x4C2AA252BEe766D3399850569713b55178934849', // USDC
      target_token_address: '0xF92bF3FCcBecABb3e31905c5de10C9FffA7A6acf', // ZILY
      amount_to_swap: '10000', // 0.01 USDC (small amount for testing)
      frequency_hours: 0.017, // 1 minute
      is_active: true,
      next_run_timestamp: new Date(Date.now() + 60000).toISOString() // Run in 1 minute
    };

    // Save to database
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('agents')
      .insert(agentConfig)
      .select()
      .single();

    if (error) {
      console.error('Failed to create ZILY agent:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('ZILY agent created:', data);
    return NextResponse.json({ 
      message: 'ZILY agent created successfully',
      agent: data
    });

  } catch (error: any) {
    console.error('Error creating ZILY agent:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 