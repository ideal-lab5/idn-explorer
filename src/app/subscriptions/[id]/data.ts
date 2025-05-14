// This file contains dummy subscription data for the prototype

export interface DummySubscription {
  id: string;
  name: string;
  parachainId: number;
  duration: number;
  frequency: number;
  xcmLocation: string;
  status: string;
  remainingAmount: number;
  lastRandomValue?: string;
  createdAt: string;
  usageHistory: Array<{
    date: string;
    blocks: number;
    tokens: number;
  }>;
}

export const dummySubscriptions: DummySubscription[] = [
  {
    id: "sub-1",
    name: "Parachain Randomness",
    parachainId: 2004,
    duration: 100000,
    frequency: 100,
    xcmLocation: "para(2004)/pallet-randomness/0x1234567890abcdef",
    status: "active",
    remainingAmount: 15000,
    lastRandomValue: "0x7fa89c2d834c621d2b742cb7b7f8e7d62696fa7534985b5d1b6dde72bdcb9c5d",
    createdAt: "2025-01-15",
    usageHistory: [
      {
        date: "2025-04-30",
        blocks: 15249832,
        tokens: 50
      },
      {
        date: "2025-04-29",
        blocks: 15249732,
        tokens: 50
      },
      {
        date: "2025-04-28",
        blocks: 15249632,
        tokens: 50
      }
    ]
  },
  {
    id: "sub-2",
    name: "VRF Service",
    parachainId: 2012,
    duration: 50000,
    frequency: 50,
    xcmLocation: "para(2012)/pallet-vrf/0xabcdef1234567890",
    status: "paused",
    remainingAmount: 8500,
    createdAt: "2025-02-10",
    usageHistory: [
      {
        date: "2025-04-25",
        blocks: 15247832,
        tokens: 100
      },
      {
        date: "2025-04-23",
        blocks: 15246832,
        tokens: 100
      }
    ]
  },
  {
    id: "sub-3",
    name: "Smart Contract RNG",
    parachainId: 2008,
    duration: 200000,
    frequency: 200,
    xcmLocation: "para(2008)/pallet-contracts/0x9876543210fedcba",
    status: "active",
    remainingAmount: 25000,
    lastRandomValue: "0x3d8f52c17a2d93be8e91cb7b4c5eb9bd8a1c9e96d4e7f832a5b6c9d07e1f3a5b",
    createdAt: "2025-03-05",
    usageHistory: [
      {
        date: "2025-05-01",
        blocks: 15250132,
        tokens: 75
      },
      {
        date: "2025-04-29",
        blocks: 15249732,
        tokens: 75
      }
    ]
  }
];
