'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { container } from '@/lib/di-container';
import { ISubscriptionService } from '@/services/ISubscriptionService';
import { Subscription, SubscriptionState, PulseFilter } from '@/domain/Subscription';
import { useConnectedWallet } from './connectedWalletContext';

interface SubscriptionContextType {
  subscriptions: Subscription[];
  loading: boolean;
  error: string | null;
  createSubscription: (
    signer: any,
    amount: number,
    target: string,
    frequency: number,
    metadata?: string,
    pulseFilter?: PulseFilter
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

  const refreshSubscriptions = useCallback(async (address?: string) => {
    console.log('refreshSubscriptions called, address:', address);
    try {
      setLoading(true);
      setError(null);
      if (address) {
        let userSubscriptions: Subscription[] = [];
        console.log('Fetching subscriptions for connected wallet:', address);
        userSubscriptions = await subscriptionService.getSubscriptionsForAccount(address);
        console.log(`Received ${userSubscriptions.length} subscriptions from service`);
        setSubscriptions(userSubscriptions);
      }
      else {
        console.log('No signer or signerAddress available');
        setSubscriptions([]);
      }
    } catch (err) {
      console.error('Failed to fetch subscriptions:', err);
      setError('Failed to load subscriptions');
      setSubscriptions([]);
    } finally {
      setLoading(false);
    }
  }, [subscriptionService]);

  const createSubscription = useCallback(async (
    signer: any,
    amount: number,
    target: string,
    frequency: number,
    metadata?: string,
    pulseFilter?: PulseFilter
  ) => {
    try {
      await subscriptionService.createSubscription(
        signer, amount, target, frequency, metadata, pulseFilter
      );
      await refreshSubscriptions(signer.address);
    } catch (err) {
      console.error('Failed to create subscription:', err);
      throw err;
    }
  }, [subscriptionService]);

  const pauseSubscription = useCallback(async (
    signer: any,
    id: string
  ) => {
    try {
      await subscriptionService.pauseSubscription(signer, id);
      await refreshSubscriptions(signer.address);
    } catch (err) {
      console.error('Failed to pause subscription:', err);
      throw err;
    }
  }, [subscriptionService]);

  const reactivateSubscription = useCallback(async (
    signer: any,
    id: string
  ) => {
    try {
      await subscriptionService.reactivateSubscription(signer, id);
      await refreshSubscriptions(signer.address);
    } catch (err) {
      console.error('Failed to resume subscription:', err);
      throw err;
    }
  }, [subscriptionService]);

  const killSubscription = useCallback(async (
    signer: any,
    id: string
  ) => {
    try {
      await subscriptionService.killSubscription(signer, id);
      await refreshSubscriptions(signer.address);
    } catch (err) {
      console.error('Failed to cancel subscription:', err);
      throw err;
    }
  }, [subscriptionService]);

  const getSubscription = useCallback(async (id: string) => {
    try {
      return await subscriptionService.getSubscription(id);
    } catch (err) {
      console.error('Failed to get subscription:', err);
      throw err;
    }
  }, [subscriptionService]);
  
  const getAllSubscriptions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const allSubscriptions = await subscriptionService.getAllSubscriptions();
      console.log(`Retrieved ${allSubscriptions.length} subscriptions for dashboard`);
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
    getAllSubscriptions
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};
