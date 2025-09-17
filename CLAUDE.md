# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the Ideal Network Explorer - a Next.js 14 web application for interacting with and monitoring the Ideal Network blockchain, focusing on randomness delivery subscriptions and blockchain exploration.

## Essential Commands

```bash
# Development
npm run dev          # Start development server at http://localhost:3000
npm run build        # Build for production
npm run start        # Start production server

# Code Quality
npm run lint         # Run ESLint
npm run format       # Auto-format with Prettier
npm run format:check # Check formatting without changes
```

## Environment Setup

Required environment variables in `.env.local`:

```
NEXT_PUBLIC_NODE_WS="ws://127.0.0.1:9944"  # Ideal Network node WebSocket URL

# Drand Configuration (optional - defaults provided)
NEXT_PUBLIC_DRAND_API_URL="https://api.drand.sh"  # Drand API endpoint
NEXT_PUBLIC_QUICKNET_CHAIN_HASH="52db9ba70e0cc0f6eaf7803dd07447a1f5477735fd3f661792ba94600c84e971"  # Quicknet chain hash
```

## Architecture Overview

### Service Layer with Dependency Injection

The application uses TSyringe for dependency injection with interface-based service abstractions:

```typescript
// Services are registered in src/lib/di-container.ts
// All services follow interface contracts in src/services/interfaces/
IPolkadotApiService; // Blockchain API connection
ISubscriptionService; // Randomness subscription management
IChainStateService; // Chain state monitoring
IExplorerService; // Blockchain exploration
```

**Critical**: Services must be registered only in browser environment to avoid SSR issues. The DI container is initialized client-side only.

### Context Provider Hierarchy

The app uses nested React Context providers (src/components/contexts/):

1. `DIProvider` - Provides dependency injection container access
2. `PolkadotProvider` - Manages blockchain connection state
3. `ConnectedWalletProvider` - Handles wallet connections
4. `SubscriptionProvider` - Manages subscription data

### Key Architectural Patterns

- **Domain Entities**: Located in `src/domain/` (Subscription, DelayedTransaction, etc.)
- **Service Interfaces**: Abstract contracts in `src/services/interfaces/`
- **Service Implementations**: Concrete implementations in `src/services/`
- **UI Components**: Reusable components in `src/components/`
- **Utility Functions**: Helper functions and mappers in `src/utils/`

## Critical Implementation Details

### Dependency Injection Setup

1. **reflect-metadata** must be imported first in `src/lib/di-container.ts`
2. Services use `@injectable()` decorator and implement interface contracts
3. Registration happens in `registerServices()` function, called only in browser

### Blockchain Integration

- Uses `@polkadot/api` for blockchain connectivity
- Wallet integration via `@polkadot/extension-dapp`
- Custom timelock functionality with `@ideallabs/timelock.js`
- XCM (Cross-Consensus Messaging) support for inter-chain communication

### TypeScript Configuration

- Strict mode enabled
- Experimental decorators for DI
- Path mapping: `@/*` resolves to `src/*`

### Styling System

- Tailwind CSS with custom Inter font
- Headless UI components for accessibility
- Framer Motion for animations
- Recharts for data visualization

## Common Development Tasks

### Adding a New Service

1. Create interface in `src/services/interfaces/`
2. Implement service in `src/services/`
3. Register in `src/lib/di-container.ts` (browser-only)
4. Use via DI container in components

### Working with Blockchain Data

- Chain state updates via `IChainStateService`
- Subscription operations through `ISubscriptionService`
- Use existing utility functions in `src/utils/mapper.ts` for data transformation

### Component Development

- Follow existing patterns in `src/components/`
- Use context providers for state management
- Leverage existing UI components (buttons, modals, etc.)

## Important Notes

- No test framework currently configured - rely on TypeScript and ESLint for code quality
- Mock services available for development without blockchain connection
- Apache 2.0 license headers required on all source files
- Webpack configuration customized for TSyringe/reflect-metadata compatibility
