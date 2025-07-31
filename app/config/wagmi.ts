import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { mainnet, sepolia } from 'wagmi/chains';

// Custom Etherlink testnet configuration
const etherlinkTestnet = {
  id: 128123,
  name: 'Etherlink Testnet',
  network: 'etherlink-testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Tezos',
    symbol: 'XTZ',
  },
  rpcUrls: {
    public: { http: ['https://node.ghostnet.etherlink.com'] },
    default: { http: ['https://node.ghostnet.etherlink.com'] },
  },
  blockExplorers: {
    etherscan: { name: 'Etherlink Testnet Explorer', url: 'https://testnet-explorer.etherlink.com' },
    default: { name: 'Etherlink Testnet Explorer', url: 'https://testnet-explorer.etherlink.com' },
  },
} as const;

// Custom Etherlink mainnet configuration
const etherlinkMainnet = {
  id: 42793,
  name: 'Etherlink Mainnet',
  network: 'etherlink-mainnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Tezos',
    symbol: 'XTZ',
  },
  rpcUrls: {
    public: { http: ['https://node.mainnet.etherlink.com'] },
    default: { http: ['https://node.mainnet.etherlink.com'] },
  },
  blockExplorers: {
    etherscan: { name: 'Etherlink Explorer', url: 'https://explorer.etherlink.com' },
    default: { name: 'Etherlink Explorer', url: 'https://explorer.etherlink.com' },
  },
} as const;

const config = getDefaultConfig({
  appName: 'Etherlink DCA Agent',
  projectId: 'c4f79cc821944d9680842e34466bfbd9', // Using a test project ID
  chains: [etherlinkMainnet, etherlinkTestnet, mainnet, sepolia], // Etherlink chains first
});

export { config }; 