# Etherlink DCA Agent

A decentralized, "set-and-forget" web application that empowers users to automate their cryptocurrency investment strategy on the Etherlink blockchain. Users can deploy autonomous AI agents that execute Dollar-Cost Averaging (DCA) trades directly on the blockchain, even when the user is offline.

## 🔄 API Endpoints

### Agent Management
- `GET /api/agents` - Fetch user's agents
- `POST /api/agents` - Create new testnet agent
- `POST /api/create-mainnet-agent` - Create new mainnet agent
- `POST /api/create-zily-agent` - Create Zily-specific agent
- `PUT /api/agents/[id]` - Update agent configuration
- `DELETE /api/agents/[id]` - Delete agent

### Blockchain Operations
- `GET /api/check-balance` - Check token balances
- `POST /api/fund-zily-agent` - Fund agent wallet
- `GET /api/test-pool` - Test pool accessibility
- `GET /api/test-direct-pool` - Test direct pool access
- `GET /api/test-mainnet-pool` - Test mainnet pools

### System Operations
- `GET /api/cron` - Execute scheduled agents
- `GET /api/debug-agents` - Debug agent status

## 🏗️ Project Structure

```
implementation-kit/
├── app/
│   ├── api/
│   │   ├── agents/              # Agent CRUD operations
│   │   ├── create-mainnet-agent/ # Mainnet agent creation
│   │   ├── create-zily-agent/   # Zily agent creation
│   │   ├── fund-zily-agent/     # Agent funding
│   │   ├── check-balance/       # Balance checking
│   │   ├── test-pool/           # Pool testing
│   │   ├── test-direct-pool/    # Direct pool access
│   │   ├── test-mainnet-pool/   # Mainnet pool testing
│   │   ├── debug-agents/        # Agent debugging
│   │   └── cron/               # Scheduled agent execution
│   ├── create-agent/           # Testnet agent creation
│   ├── create-mainnet-agent/   # Mainnet agent creation
│   ├── dashboard/              # Agent management dashboard
│   ├── config/                # Wagmi configuration
│   ├── providers.tsx          # React providers
│   ├── layout.tsx             # Root layout
│   └── page.tsx              # Main homepage
├── lib/
│   ├── etherlink/            # Blockchain integration
│   │   ├── abis/            # Smart contract ABIs
│   │   ├── agent-logic.ts   # Agent execution logic
│   │   └── agent-tools.ts   # Agent utility functions
│   ├── supabase/            # Database client
│   │   ├── client.ts        # Supabase client
│   │   └── server.ts        # Server-side client
│   └── utils/               # Utility functions
│       └── crypto.ts        # Encryption utilities
├── docs.md                  # Technical documentation
├── env.example             # Environment variables template
├── next.config.mjs         # Next.js configuration
├── tailwind.config.ts      # Tailwind CSS configuration
├── tsconfig.json           # TypeScript configuration
└── vercel.json            # Vercel deployment configuration
```


## 🚀 Features

- **Wallet-First Authentication**: Connect with any Web3 wallet (MetaMask, etc.)
- **Autonomous Agents**: Deploy AI agents that execute trades automatically
- **Secure Architecture**: Separate wallets for user control and agent execution
- **Real-time Monitoring**: Track agent performance and transaction history
- **Serverless & Scalable**: Built on Vercel and Supabase
- **Multi-Network Support**: Testnet and Mainnet deployment options
- **AI-Powered Decision Making**: LangChain integration for intelligent trading

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 14 with App Router
- **UI**: React 18, Tailwind CSS, RainbowKit
- **State Management**: TanStack React Query
- **Wallet Integration**: Wagmi, Viem, SIWE (Sign-In with Ethereum)

### Backend
- **Runtime**: Next.js API Routes (serverless)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth with wallet signatures
- **Scheduling**: Vercel Cron Jobs

### Blockchain
- **Network**: Etherlink Testnet & Mainnet
- **SDK**: etherlink-agent-kit, etherlink-langchain-tools
- **Smart Contracts**: ERC20, DEX Router integration
- **Transaction Management**: Viem for EVM compatibility

### AI & Automation
- **AI Framework**: LangChain
- **LLM**: OpenAI GPT models
- **Tools**: etherlink-langchain-tools for blockchain operations
- **Decision Making**: AI-powered trade execution logic

## 🏗️ Technical Architecture

### System Overview
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Blockchain    │
│   (Next.js)     │◄──►│   (API Routes)  │◄──►│   (Etherlink)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐              │
         └──────────────►│   Database      │◄─────────────┘
                        │   (Supabase)    │
                        └─────────────────┘
```

### Core Components

#### 1. **Frontend Layer**
- **Pages**: Dashboard, Agent Creation, Agent Management
- **Components**: Wallet Connection, Agent Forms, Transaction History
- **State**: React Query for server state, local state for UI
- **Styling**: Tailwind CSS with responsive design

#### 2. **API Layer**
- **Agent Management**: CRUD operations for DCA agents
- **Blockchain Integration**: Direct pool access, balance checks
- **Cron Jobs**: Automated agent execution
- **Authentication**: Wallet-based auth with SIWE

#### 3. **Database Layer**
- **Tables**: agents, trades, user_sessions
- **Relations**: User → Agents → Trades
- **Encryption**: Agent private keys encrypted at rest
- **Real-time**: Supabase subscriptions for live updates

#### 4. **Blockchain Layer**
- **Etherlink Integration**: Custom chain definitions for testnet/mainnet
- **Smart Contract Interaction**: ERC20, DEX Router contracts
- **Transaction Management**: Gas estimation, nonce handling
- **Error Handling**: Retry logic, fallback mechanisms

## 🔧 Technical Implementation

### Etherlink Integration

The application uses the `etherlink-agent-kit` SDK for seamless blockchain interaction:

```typescript
// Initialize EtherlinkKit
const kit = new EtherlinkKit({
  privateKey: process.env.ETHERLINK_PRIVATE_KEY as `0x${string}`,
  rpcUrl: process.env.ETHERLINK_RPC_URL!,
  network: 'testnet' // or 'mainnet'
});

// Token operations
await kit.token.transfer({
  tokenAddress: '0x...',
  to: '0x...',
  amount: BigInt('1000000')
});

// Contract interactions
await kit.chain.executeContract({
  address: '0x...',
  abi: [...],
  functionName: 'swap',
  args: [...]
});
```

### Security Model

#### Multi-Wallet Architecture
1. **User Wallet**: Used for authentication and funding (private key never leaves user)
2. **Agent Wallet**: Dedicated hot wallet for each agent (encrypted on server)
3. **Separation of Concerns**: User controls funding, agent controls execution

#### Encryption & Key Management
```typescript
// Agent private key encryption
const encryptedPrivateKey = encrypt(agentPrivateKey, AGENT_ENCRYPTION_KEY);
const decryptedPrivateKey = decrypt(encryptedPrivateKey, AGENT_ENCRYPTION_KEY);
```

### AI Agent Implementation

#### LangChain Integration
```typescript
// AI-powered decision making
const agent = new LangChainAgent({
  tools: [
    new TransferTokenTool(kit),
    new ExecuteContractTool(kit),
    new MintNftTool(kit)
  ],
  llm: new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
});

// Agent execution
const result = await agent.invoke({
  input: `Execute DCA trade: ${amount} ${sourceToken} → ${targetToken}`
});
```



## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account
- Etherlink testnet/mainnet access
- OpenAI API key (for AI features)

## 🚀 Quick Start

### 1. Clone and Install Dependencies

```bash
cd implementation-kit
npm install
```

### 2. Environment Setup

Copy the environment template and fill in your values:

```bash
cp env.example .env.local
```

Fill in the required environment variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Etherlink Testnet Configuration
NEXT_PUBLIC_ETHERLINK_TESTNET_RPC_URL=https://node.ghostnet.etherlink.com
NEXT_PUBLIC_ETHERLINK_TESTNET_PRIVATE_KEY=your_testnet_private_key
NEXT_PUBLIC_DEX_ROUTER_ADDRESS=your_dex_router_address

# Etherlink Mainnet Configuration
NEXT_PUBLIC_ETHERLINK_MAINNET_RPC_URL=https://node.mainnet.etherlink.com
NEXT_PUBLIC_ETHERLINK_MAINNET_PRIVATE_KEY=your_mainnet_private_key

# Agent Configuration
AGENT_ENCRYPTION_KEY=your_32_character_encryption_key

# Cron Job Secret
CRON_SECRET=your_cron_secret_key

# OpenAI (for AI agent reasoning)
OPENAI_API_KEY=your_openai_api_key
```


### 3. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.


## 🔄 Deployment

### Vercel Deployment

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy the application

### Cron Job Setup

The cron job runs at `/api/cron` and should be configured in Vercel:

```json
{
  "crons": [
    {
      "path": "/api/cron",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

### Environment Variables for Production

Ensure all required environment variables are set in your Vercel dashboard:

- Supabase configuration
- Etherlink RPC URLs and private keys
- Agent encryption key
- Cron secret
- OpenAI API key

## 🧪 Testing

```bash
# Run the development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint
```

## 🔒 Security Considerations

### Private Key Management
- User private keys never leave the browser
- Agent private keys are encrypted at rest
- Encryption key is stored securely in environment variables

### Transaction Security
- All transactions are simulated before execution
- Gas estimation and nonce management
- Error handling and retry logic

### Access Control
- Wallet-based authentication
- Session management with expiration
- Rate limiting on API endpoints


## 🔮 Future Enhancements

- [ ] Multi-chain support (Ethereum, Polygon, etc.)
- [ ] Advanced AI strategies (momentum, arbitrage)
- [ ] Mobile app development
- [ ] Social features and agent sharing
- [ ] Advanced analytics and reporting
- [ ] Portfolio rebalancing strategies
- [ ] Risk management features
- [ ] Integration with DeFi protocols
