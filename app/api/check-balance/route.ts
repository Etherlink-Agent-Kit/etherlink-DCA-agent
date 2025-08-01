import { NextResponse } from 'next/server';
import { EtherlinkKit } from 'etherlink-agent-kit';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { walletAddress, tokenAddress } = body;

    if (!walletAddress || !tokenAddress) {
      return NextResponse.json({ error: 'Wallet address and token address required' }, { status: 400 });
    }

    // Initialize EtherlinkKit
    const kit = new EtherlinkKit({
      privateKey: process.env.NEXT_PUBLIC_ETHERLINK_TESTNET_PRIVATE_KEY as `0x${string}`,
      rpcUrl: process.env.NEXT_PUBLIC_ETHERLINK_TESTNET_RPC_URL!
    });

    // Get token balance
    const balance = await kit.token.getBalance({
      tokenAddress: tokenAddress as `0x${string}`,
      ownerAddress: walletAddress as `0x${string}`
    });

    // Convert to human readable format (assuming 6 decimals for USDC)
    const balanceInUnits = Number(balance as bigint) / (10 ** 6);

    return NextResponse.json({ 
      walletAddress,
      tokenAddress,
      balance: (balance as bigint).toString(),
      balanceInUnits: balanceInUnits.toFixed(6)
    });

  } catch (error: any) {
    console.error('Error checking balance:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 