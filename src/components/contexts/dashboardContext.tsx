// Copyright 2023-2024 Ideal Labs.
// SPDX-License-Identifier: Apache-2.0

'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { RandomnessDistributionEvent } from '../../domain/RandomnessEvent';
import { Subscription } from '../../domain/Subscription';
import { container } from '../../lib/di-container';
import { IRandomnessService, RandomnessMetrics } from '../../services/IRandomnessService';
import { ISubscriptionService } from '../../services/ISubscriptionService';

export interface DashboardData {
  // Randomness metrics
  randomnessMetrics: RandomnessMetrics;
  // Latest randomness distributions
  latestDistributions: RandomnessDistributionEvent[];
  // Active subscriptions
  activeSubscriptions: Subscription[];
  // Distribution events for chart visualization
  distributionEvents: RandomnessDistributionEvent[];
  // Loading states
  isLoading: boolean;
  isError: boolean;
  errorMessage: string | null;
}

interface DashboardContextType {
  dashboardData: DashboardData;
  refreshData: () => Promise<void>;
}

const initialData: DashboardData = {
  randomnessMetrics: {
    totalDistributions: 0,
    totalSubscriptionsServed: 0,
    averageRandomnessPerBlock: 0,
    distributionsLast24Hours: 0,
  },
  latestDistributions: [],
  activeSubscriptions: [],
  distributionEvents: [],
  isLoading: true,
  isError: false,
  errorMessage: null,
};

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
};

export const DashboardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [dashboardData, setDashboardData] = useState<DashboardData>(initialData);

  const refreshData = async () => {
    setDashboardData(prev => ({ ...prev, isLoading: true, isError: false, errorMessage: null }));

    // Track if we have critical errors (data connection issues) vs. non-critical errors (no data yet)
    let criticalError = false;
    let errorDetails = '';

    try {
      // Get services from container
      const randomnessService = container.resolve<IRandomnessService>('IRandomnessService');
      const subscriptionService = container.resolve<ISubscriptionService>('ISubscriptionService');
      const apiService = container.resolve<any>('IPolkadotApiService');

      // First check if we can connect to the blockchain node at all
      try {
        const api = await apiService.getApi();
        // Check if connected
        if (!api.isConnected) {
          throw new Error('Not connected to blockchain node');
        }
        console.log('Successfully connected to blockchain node');
      } catch (connectionError) {
        console.error('Critical error: Cannot connect to blockchain:', connectionError);
        criticalError = true;
        errorDetails = 'Cannot connect to blockchain node. Please check your connection.';
        // Still continue to try individual calls
      }

      // Use individual try/catch for each service call to prevent one failure from breaking everything
      // 1. Get randomness metrics
      let randomnessMetrics = initialData.randomnessMetrics;
      try {
        randomnessMetrics = await randomnessService.getRandomnessMetrics();
        console.log('Successfully fetched randomness metrics:', randomnessMetrics);
      } catch (metricsError) {
        console.warn('Non-critical: Failed to fetch randomness metrics:', metricsError);
        // Continue with default metrics
      }
      
      // 2. Get latest distributions
      let latestDistributions: RandomnessDistributionEvent[] = [];
      try {
        latestDistributions = await randomnessService.getLatestDistributions(10);
        console.log(`Successfully fetched ${latestDistributions.length} latest distributions`);
      } catch (distributionsError) {
        console.warn('Non-critical: Failed to fetch latest distributions:', distributionsError);
        // Continue with empty array
      }
      
      // 3. Get subscriptions - handle subscription service issues
      let allSubscriptions: Subscription[] = [];
      let activeSubscriptions: Subscription[] = [];
      try {
        // getAllSubscriptions may not be implemented, wrap in try/catch
        allSubscriptions = await subscriptionService.getAllSubscriptions();
        console.log(`Successfully fetched ${allSubscriptions.length} subscriptions`);
        
        // Filter for active subscriptions - empty array is valid (no subscriptions yet)
        activeSubscriptions = allSubscriptions.filter(sub => {
          if (!sub || !sub.state) return false;
          
          // Handle potential type mismatch between string and enum
          try {
            // Normalize the state string for comparison
            const state = String(sub.state).toLowerCase().trim();
            
            // Log subscription state for debugging
            console.log(`Subscription ${sub.id} state: "${sub.state}" (normalized: "${state}")`);
            
            // Check for any variant of 'active' state
            return state === 'active' || state === '"active"' || state.includes('active');
          } catch (err) {
            console.error('Error checking subscription state:', err);
            return false;
          }
        });
        console.log(`Found ${activeSubscriptions.length} active subscriptions`);
        
        // If we have subscriptions but none are active, log details for debugging
        if (allSubscriptions.length > 0 && activeSubscriptions.length === 0) {
          console.log('Found subscriptions but none are active. States:', 
            allSubscriptions.map(s => ({id: s.id, state: s.state})));
        }
      } catch (subscriptionsError) {
        console.warn('Non-critical: Failed to fetch subscriptions:', subscriptionsError);
        // Continue with empty arrays
      }
      
      // 4. Get chart distribution events with safer block range
      let distributionEvents: RandomnessDistributionEvent[] = [];
      try {
        // Get current block number more safely
        const api = await apiService.getApi();
        let currentBlockNumber;
        try {
          currentBlockNumber = await api.derive.chain.bestNumber();
          console.log(`Current block number: ${currentBlockNumber}`);
        } catch (blockError) {
          console.warn('Non-critical: Failed to get current block number:', blockError);
          // Just use a small fixed range instead
          distributionEvents = await randomnessService.getRandomnessDistributionEvents(1, 100);
          console.log(`Using fallback block range, got ${distributionEvents.length} events`);
          throw new Error('Used fallback block range');
        }
        
        // Convert block number safely
        const endBlock = parseInt(currentBlockNumber.toString());
        // Use a smaller range for less errors and better performance
        const startBlock = Math.max(1, endBlock - 100); // Reduced from 500 to 100 for faster querying
        
        distributionEvents = await randomnessService.getRandomnessDistributionEvents(
          startBlock,
          endBlock
        );
        console.log(`Successfully fetched ${distributionEvents.length} distribution events`);
      } catch (error) {
        const eventsError = error as Error;
        if (eventsError.message !== 'Used fallback block range') {
          console.warn('Non-critical: Failed to fetch distribution events:', eventsError);
        }
        // Continue with existing distribution events
      }

      // Only show critical error in UI if we have no data AND a critical connection error
      const hasNoData = 
        randomnessMetrics.totalDistributions === 0 && 
        latestDistributions.length === 0 && 
        distributionEvents.length === 0;

      setDashboardData({
        randomnessMetrics,
        latestDistributions,
        activeSubscriptions,
        distributionEvents,
        isLoading: false,
        // Only show error state if critical connection issue AND no data
        isError: criticalError && hasNoData,
        errorMessage: criticalError && hasNoData ? errorDetails : null,
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setDashboardData(prev => ({
        ...prev,
        isLoading: false,
        isError: true,
        errorMessage: 'Failed to connect to blockchain. Please check your connection.',
      }));
    }
  };

  // Fetch data on initial load
  useEffect(() => {
    const handleInitialLoad = async () => {
      try {
        await refreshData();
      } catch (err) {
        console.error('Error during initial data load:', err);
        // Don't need setError as refreshData already handles error state
      }
    };

    handleInitialLoad();

    const interval = setInterval(() => {
      refreshData();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const value = {
    dashboardData,
    refreshData,
  };

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>;
};
