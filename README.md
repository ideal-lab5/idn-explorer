# Ideal Network Explorer

This is a web interface for interacting with and monitoring the [Ideal Network](https://docs.idealabs.network). The explorer features blockchain exploration, randomness subscription management, and **drand-based timelock transaction scheduling**.

## Features

- 📊 **Activity Hub**: Real-time monitoring dashboard with randomness bridging chart, current block, drand round, and session info
- 🎲 **Randomness Subscriptions**: Create and manage randomness delivery subscriptions
- 🔍 **Blockchain Explorer**: View blocks, transactions, and network activity
- ⏰ **Timelock Transactions** _(Coming Soon)_: Schedule transactions for future execution using drand rounds
- 🔗 **XCM Integration**: Cross-consensus messaging tools
- 💼 **Wallet Integration**: Browser wallet support via Polkadot.js extension

## Setup

### Prerequisites

- Node.js and npm
- (Optional) Ideal Network node for blockchain connectivity

### Installation

Install the npm dependencies:

```bash
npm install
```

### Environment Configuration

Create a `.env.local` file in the project root with the following variables:

```bash
# Required: Ideal Network node WebSocket URL
NEXT_PUBLIC_NODE_WS="ws://127.0.0.1:9944"

# Required: Upstash Redis (for randomness caching)
randomness_KV_REST_API_URL="https://your-redis.upstash.io"
randomness_KV_REST_API_TOKEN="your-token"

# Optional: Drand Configuration (defaults provided)
NEXT_PUBLIC_DRAND_API_URL="https://api.drand.sh"
NEXT_PUBLIC_QUICKNET_CHAIN_HASH="52db9ba70e0cc0f6eaf7803dd07447a1f5477735fd3f661792ba94600c84e971"
```

See `.env.local.example` for a complete configuration template.

> **Note**: Get free Upstash Redis credentials at [upstash.com](https://upstash.com)

## Development

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run format       # Format code with Prettier
npm test             # Run unit tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage report
```

## Timelock Transaction Scheduling _(Coming Soon)_

The explorer will support scheduling transactions for future execution using drand's randomness beacon:

1. **Connect Wallet**: Use a Polkadot.js compatible browser extension
2. **Navigate to Timelock**: Go to `/timelock/schedule`
3. **Set Drand Round**: Specify a future drand round number (updates every 3 seconds)
4. **Configure Transaction**: Select pallet, extrinsic, and parameters
5. **Submit**: Transaction will be encrypted and scheduled for the specified round

The current drand round is displayed in the Activity Hub and updates in real-time.

## Docker

### Build with Environment Variables

```shell
docker build -t ideallabs/etf-explorer \
  --build-arg NEXT_PUBLIC_NODE_WS="ws://172.14.1.1:9944" \
  --build-arg NEXT_PUBLIC_DRAND_API_URL="https://api.drand.sh" \
  --build-arg randomness_KV_REST_API_URL="https://your-redis.upstash.io" \
  --build-arg randomness_KV_REST_API_TOKEN="your-token" \
  .
```

### Run Container

```shell
docker run -p 3000:3000 ideallabs/etf-explorer
```

## Architecture

- **Frontend**: Next.js 14 with React 18 and TypeScript
- **Styling**: Tailwind CSS with Headless UI components
- **Blockchain**: Polkadot.js API for Substrate chains
- **Caching**: Upstash Redis for persistent randomness data
- **Timelock**: @ideallabs/timelock.js with drand integration
- **State Management**: React Context with Dependency Injection (TSyringe)

## License

This repo is licensed under the Apache 2 license.
