import { NextRequest, NextResponse } from 'next/server';
import { EtherlinkKit } from 'etherlink-agent-kit';
import { encrypt } from '@/lib/utils/crypto';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { agentName, sourceTokenAddress, targetTokenAddress, amountToSwap, frequencyHours, walletAddress } = body;

    // Validate required fields
    if (!agentName || !sourceTokenAddress || !targetTokenAddress || !amountToSwap || !frequencyHours || !walletAddress) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Convert USDC amount to wei (USDC has 6 decimals)
    const usdcAmount = parseFloat(amountToSwap);
    const amountInWei = BigInt(Math.floor(usdcAmount * 10 ** 6)).toString();

    const etherlinkKit = new EtherlinkKit({
      privateKey: process.env.NEXT_PUBLIC_ETHERLINK_MAINNET_PRIVATE_KEY as `0x${string}`,
      rpcUrl: process.env.NEXT_PUBLIC_ETHERLINK_MAINNET_RPC_URL as string,
      network: 'mainnet'
    } as any);

    // Create a new agent wallet
    const agentAccount = await etherlinkKit.account.create();
    const agentPrivateKey = agentAccount.privateKey;
    const agentWalletAddress = agentAccount.address;

    // Encrypt the private key
    const encryptedPrivateKey = encrypt(agentPrivateKey);

    // Check user's USDC balance before funding
    console.log(`Checking USDC balance for wallet: ${walletAddress}`);
    const userBalance = await etherlinkKit.token.getBalance({
      tokenAddress: sourceTokenAddress as `0x${string}`
    }) as bigint;

    console.log(`User USDC balance: ${userBalance.toString()} wei (${Number(userBalance) / 1e6} USDC)`);
    console.log(`Required amount: ${amountInWei} wei (${amountToSwap} USDC)`);

    if (userBalance < BigInt(amountInWei)) {
      return NextResponse.json({ 
        error: `Insufficient USDC balance. Have: ${Number(userBalance) / 1e6} USDC, Need: ${amountToSwap} USDC` 
      }, { status: 400 });
    }

    // Transfer USDC to agent wallet
    console.log(`Transferring ${amountInWei} wei USDC to agent wallet: ${agentWalletAddress}`);
    const fundingTxHash = await etherlinkKit.token.transfer({
      tokenAddress: sourceTokenAddress as `0x${string}`,
      to: agentWalletAddress as `0x${string}`,
      amount: BigInt(amountInWei)
    });

    console.log(`Funding transaction successful: ${fundingTxHash}`);

    // Create agent config for USDC → WXTZ via Iguana DEX
    const agentConfig = {
      user_wallet_address: walletAddress.toLowerCase(), // Normalize to lowercase for consistency
      agent_wallet_address: agentWalletAddress,
      encrypted_private_key: encryptedPrivateKey,
      agent_name: agentName,
      source_token_address: sourceTokenAddress, // USDC
      target_token_address: targetTokenAddress, // WXTZ
      amount_to_swap: amountInWei,
      frequency_hours: parseFloat(frequencyHours),
      is_active: true,
      use_mainnet: true, // Flag to use mainnet configuration
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
      console.error('Failed to create mainnet agent:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('Mainnet agent created and funded:', data);
    return NextResponse.json({ 
      message: 'Mainnet agent created and funded successfully',
      agent: data,
      network: 'mainnet',
      dex: 'Iguana DEX',
      amount: `${amountToSwap} USDC`,
      fundingTxHash: fundingTxHash,
      router: '0xE67B7D039b78DE25367EF5E69596075Bbd852BA9',
      source_token: 'USDC (0x796Ea11Fa2dD751eD01b53C372fFDB4AAa8f00F9)',
      target_token: 'WXTZ (0xc9B53AB2679f573e480d01e0f49e2B5CFB7a3EAb)'
    });

  } catch (error: any) {
    console.error('Error creating mainnet agent:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 