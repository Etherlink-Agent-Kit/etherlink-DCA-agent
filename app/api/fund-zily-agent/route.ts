import { NextRequest, NextResponse } from 'next/server';
import { EtherlinkKit } from 'etherlink-agent-kit';

export async function POST() {
  try {
    const etherlinkKit = new EtherlinkKit({
      privateKey: process.env.NEXT_PUBLIC_ETHERLINK_TESTNET_PRIVATE_KEY as `0x${string}`,
      rpcUrl: process.env.NEXT_PUBLIC_ETHERLINK_TESTNET_RPC_URL as string,
    });

    // Transfer 0.05 USDC to the ZILY agent wallet
    const zilyAgentWallet = '0x93c82802B8e5165551CA57C2d65bb0b257E268F5';
    const amountToTransfer = '50000'; // 0.05 USDC (50,000 wei)

    console.log(`Transferring ${amountToTransfer} wei USDC to ${zilyAgentWallet}`);

    const txHash = await etherlinkKit.token.transfer({
      tokenAddress: '0x4C2AA252BEe766D3399850569713b55178934849' as `0x${string}`, // USDC
      to: zilyAgentWallet as `0x${string}`,
      amount: BigInt(amountToTransfer)
    });

    console.log('Transfer successful:', txHash);
    return NextResponse.json({ 
      message: 'ZILY agent funded successfully',
      txHash,
      amount: amountToTransfer,
      to: zilyAgentWallet
    });

  } catch (error: any) {
    console.error('Error funding ZILY agent:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 