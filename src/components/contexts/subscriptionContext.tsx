'use client';

import { PulseFilter, Subscription, SubscriptionState } from '@/domain/Subscription';
import { container } from '@/lib/di-container';
import { ISubscriptionService, XcmLocation } from '@/services/ISubscriptionService';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useConnectedWallet } from './connectedWalletContext';

interface SubscriptionContextType {
  subscriptions: Subscription[];
  loading: boolean;
  error: string | null;
  createSubscription: (
    signer: any,
    credits: number,
    target: XcmLocation,
    callIndex: [number, number],
    frequency: number,
    metadata?: string,
    subscriptionId?: string
  ) => Promise<void>;
  pauseSubscription: (signer: any, id: string) => Promise<void>;
  reactivateSubscription: (signer: any, id: string) => Promise<void>;
  killSubscription: (signer: any, id: string) => Promise<void>;
  getSubscription: (id: string) => Promise<Subscription>;
  refreshSubscriptions: (address?: string) => Promise<void>;
  getAllSubscriptions: () => Promise<Subscription[]>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Get service instance from the container with error handling
  const subscriptionService = container.resolve<ISubscriptionService>('ISubscriptionService');

  const refreshSubscriptions = useCallback(
    async (address?: string) => {
      if (!address) {
        setSubscriptions([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const userSubscriptions = await subscriptionService.getSubscriptionsForAccount(address);
        setSubscriptions(userSubscriptions);
      } catch (error) {
        console.error('Failed to fetch subscriptions:', error);
        setError('Failed to load subscriptions');
        setSubscriptions([]);
      } finally {
        setLoading(false);
      }
    },
    [subscriptionService]
  );

  const createSubscription = useCallback(
    async (
      signer: any,
      credits: number,
      target: XcmLocation,
      callIndex: [number, number],
      frequency: number,
      metadata?: string,
      subscriptionId?: string
    ) => {
      try {
        await subscriptionService.createSubscription(
          signer,
          credits,
          target,
          callIndex,
          frequency,
          metadata,
          subscriptionId
        );
        await refreshSubscriptions(signer.address);
      } catch (err) {
        console.error('Failed to create subscription:', err);
        throw err;
      }
    },
    [subscriptionService]
  );

  const pauseSubscription = useCallback(
    async (signer: any, id: string) => {
      try {
        await subscriptionService.pauseSubscription(signer, id);
        await refreshSubscriptions(signer.address);
      } catch (err) {
        console.error('Failed to pause subscription:', err);
        throw err;
      }
    },
    [subscriptionService]
  );

  const reactivateSubscription = useCallback(
    async (signer: any, id: string) => {
      try {
        await subscriptionService.reactivateSubscription(signer, id);
        await refreshSubscriptions(signer.address);
      } catch (err) {
        console.error('Failed to resume subscription:', err);
        throw err;
      }
    },
    [subscriptionService]
  );

  const killSubscription = useCallback(
    async (signer: any, id: string) => {
      try {
        await subscriptionService.killSubscription(signer, id);
        await refreshSubscriptions(signer.address);
      } catch (err) {
        console.error('Failed to cancel subscription:', err);
        throw err;
      }
    },
    [subscriptionService]
  );

  const getSubscription = useCallback(
    async (id: string) => {
      try {
        return await subscriptionService.getSubscription(id);
      } catch (err) {
        console.error('Failed to get subscription:', err);
        throw err;
      }
    },
    [subscriptionService]
  );

  const getAllSubscriptions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const allSubscriptions = await subscriptionService.getAllSubscriptions();

      return allSubscriptions;
    } catch (err) {
      console.error('Failed to get all subscriptions:', err);
      setError('Failed to load subscriptions');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [subscriptionService]);

  const value = {
    subscriptions,
    loading,
    error,
    createSubscription,
    pauseSubscription,
    reactivateSubscription,
    killSubscription,
    getSubscription,
    refreshSubscriptions,
    getAllSubscriptions,
  };

  return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>;
};

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};
