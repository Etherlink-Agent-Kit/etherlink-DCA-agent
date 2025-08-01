// /app/api/agents/route.ts
import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { EtherlinkKit } from 'etherlink-agent-kit';
import { encrypt } from '@/lib/utils/crypto';

// Testnet token configurations
const TESTNET_TOKENS = {
  '0x4c2aa252bee766d3399850569713b55178934849': {
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6
  },
  '0xf92bf3fccbecabb3e31905c5de10c9fffa7a6acf': {
    symbol: 'ZILY',
    name: 'Zily Token',
    decimals: 18
  }
};

// Function to handle GET requests (fetch user's agents)
export async function GET(request: Request) {
  try {
    // Get wallet address from query params or headers
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('wallet');
    
    if (!walletAddress) {
      return NextResponse.json({ error: 'Wallet address required' }, { status: 400 });
    }

    const supabase = createAdminClient();
    
    // Query agents by wallet address (case-insensitive)
    const { data: agents, error } = await supabase
      .from('agents')
      .select('*')
      .eq('user_wallet_address', walletAddress.toLowerCase());

    if (error) {
      console.error('Database error:', error);
      throw new Error(error.message);
    }

    console.log(`Found ${agents?.length || 0} agents for wallet: ${walletAddress}`);
    console.log('Agents:', agents);

    return NextResponse.json({ agents: agents || [] });
  } catch (error: any) {
    console.error('Error fetching agents:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Function to handle POST requests (create a new agent)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { agentName, sourceTokenAddress, targetTokenAddress, amountToSwap, frequencyHours, walletAddress } = body;

    if (!agentName || !sourceTokenAddress || !targetTokenAddress || !amountToSwap || !frequencyHours || !walletAddress) {
        return NextResponse.json({ error: 'Missing required configuration fields.' }, { status: 400 });
    }

    // Get token configuration
    const normalizedAddress = sourceTokenAddress.toLowerCase();
    console.log('Received source token address:', sourceTokenAddress);
    console.log('Normalized address:', normalizedAddress);
    console.log('Available tokens:', Object.keys(TESTNET_TOKENS));
    
    const sourceToken = TESTNET_TOKENS[normalizedAddress as keyof typeof TESTNET_TOKENS];
    if (!sourceToken) {
      return NextResponse.json({ 
        error: `Unsupported source token: ${sourceTokenAddress}. Available tokens: ${Object.keys(TESTNET_TOKENS).join(', ')}` 
      }, { status: 400 });
    }

    // Validate target token
    const normalizedTargetAddress = targetTokenAddress.toLowerCase();
    const targetToken = TESTNET_TOKENS[normalizedTargetAddress as keyof typeof TESTNET_TOKENS];
    if (!targetToken) {
      return NextResponse.json({ 
        error: `Unsupported target token: ${targetTokenAddress}. Available tokens: ${Object.keys(TESTNET_TOKENS).join(', ')}` 
      }, { status: 400 });
    }

    // Convert token amount to wei based on token decimals
    const tokenToWei = (amount: string, decimals: number): string => {
      const amountNumber = parseFloat(amount);
      if (isNaN(amountNumber) || amountNumber < 0) {
        throw new Error(`Invalid ${sourceToken.symbol} amount`);
      }
      // Convert to wei based on token decimals
      const weiBigInt = BigInt(Math.floor(amountNumber * 10 ** decimals));
      return weiBigInt.toString();
    };

    const amountInWei = tokenToWei(amountToSwap, sourceToken.decimals);
    console.log(`Converting ${amountToSwap} ${sourceToken.symbol} to ${amountInWei} wei`);

    // Validate environment variables
    if (!process.env.NEXT_PUBLIC_ETHERLINK_TESTNET_PRIVATE_KEY) {
      throw new Error('NEXT_PUBLIC_ETHERLINK_TESTNET_PRIVATE_KEY is not set');
    }
    
    if (!process.env.NEXT_PUBLIC_ETHERLINK_TESTNET_RPC_URL) {
      throw new Error('NEXT_PUBLIC_ETHERLINK_TESTNET_RPC_URL is not set');
    }

    if (!process.env.AGENT_ENCRYPTION_KEY) {
      throw new Error('AGENT_ENCRYPTION_KEY is not set');
    }

    console.log('Environment variables validated successfully');

    // 2. Generate a new, dedicated wallet for this agent using the SDK
    // Create a temporary kit instance to generate a new account
    const tempKit = new EtherlinkKit({
      privateKey: process.env.NEXT_PUBLIC_ETHERLINK_TESTNET_PRIVATE_KEY as `0x${string}`, // Dummy key for account creation
      rpcUrl: process.env.NEXT_PUBLIC_ETHERLINK_TESTNET_RPC_URL
    });
    
    console.log('EtherlinkKit initialized successfully');
    
    const newAccount = tempKit.account.create();
    const agentAddress = newAccount.address;
    const agentPrivateKey = newAccount.privateKey;

    console.log('New agent account created:', agentAddress);

    // 3. FUND THE AGENT WALLET WITH SOURCE TOKEN
    console.log(`Funding agent wallet with ${sourceToken.symbol}...`);
    
    // Initialize user's kit to transfer tokens to agent
    const userKit = new EtherlinkKit({
      privateKey: process.env.NEXT_PUBLIC_ETHERLINK_TESTNET_PRIVATE_KEY as `0x${string}`,
      rpcUrl: process.env.NEXT_PUBLIC_ETHERLINK_TESTNET_RPC_URL
    });

    // Transfer tokens from user to agent wallet
    const tokenTransferResult = await userKit.token.transfer({
      tokenAddress: sourceTokenAddress as `0x${string}`,
      to: agentAddress as `0x${string}`,
      amount: BigInt(amountInWei)
    });

    console.log(`${sourceToken.symbol} transfer successful:`, tokenTransferResult);

    // 4. Encrypt the private key before storing it
    const encryptedPrivateKey = encrypt(agentPrivateKey);

    console.log('Private key encrypted successfully');

    // 4. Prepare the record for the database
    const agentConfig = {
      agent_name: agentName,
      user_wallet_address: walletAddress.toLowerCase(),
      agent_wallet_address: agentAddress,
      encrypted_private_key: encryptedPrivateKey,
      source_token_address: sourceTokenAddress,
      target_token_address: targetTokenAddress,
      amount_to_swap: amountInWei, // Store the converted wei amount
      frequency_hours: frequencyHours,
      is_active: true, // Start as active by default
      use_mainnet: false, // This is a testnet agent
      next_run_timestamp: new Date().toISOString(), // Run as soon as possible for the first time
    };

    console.log('Agent config prepared:', { ...agentConfig, encrypted_private_key: '[REDACTED]' });

    const supabase = createAdminClient();

    console.log('Supabase client created');

    // 5. Insert the new agent configuration into Supabase
    const { data: newAgent, error: dbError } = await supabase
        .from('agents')
        .insert(agentConfig)
        .select()
        .single();
    
    if (dbError) {
        console.error('Database error:', dbError);
        throw new Error(dbError.message);
    }
    
    console.log('Agent saved to database successfully');
    
    // 6. Return the newly created agent's data (especially its public address)
    return NextResponse.json({ 
      message: 'Agent created successfully!', 
      agent: newAgent,
      sourceToken: sourceToken.symbol,
      amount: `${amountToSwap} ${sourceToken.symbol}`,
      network: 'testnet'
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error creating agent:', error);
    
    // Provide more specific error messages
    if (error.message.includes('AGENT_ENCRYPTION_KEY')) {
      return NextResponse.json({ 
        error: 'Configuration error: ' + error.message + '. Please check your environment variables.' 
      }, { status: 500 });
    }
    
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}