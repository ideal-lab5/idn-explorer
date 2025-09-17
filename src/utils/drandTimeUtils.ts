/*
 * Copyright 2025 by Ideal Labs, LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import type { IDrandService } from '@/services/IDrandService';

export const MIN_SCHEDULE_MINUTES = 2;
export const MIN_SCHEDULE_ROUND = 40; // ~2 minutes minimum (40 rounds * 3 seconds)

/**
 * Convert a Date to the corresponding drand round number
 */
export const dateToRound = async (date: Date, drandService: IDrandService): Promise<number> => {
  const timestamp = Math.floor(date.getTime() / 1000);
  await drandService.getChainInfo(); // Ensure chain info is loaded
  return drandService.getRoundAtTime(timestamp);
};

/**
 * Convert a drand round number to the corresponding Date
 */
export const roundToDate = async (round: number, drandService: IDrandService): Promise<Date> => {
  const chainInfo = await drandService.getChainInfo();
  // Round 1 starts at genesis_time, so round N starts at genesis_time + (N-1) * period
  const timestamp = chainInfo.genesis_time + (round - 1) * chainInfo.period;
  return new Date(timestamp * 1000);
};

/**
 * Get the minimum date that can be scheduled (2 minutes from now)
 */
export const getMinimumScheduleDate = (): Date => {
  const now = new Date();
  return new Date(now.getTime() + MIN_SCHEDULE_MINUTES * 60 * 1000); // 2 minutes from now
};

/**
 * Get the maximum date that can be scheduled (no limit)
 */
export const getMaximumScheduleDate = (): Date | null => {
  // No maximum limit
  return null;
};

/**
 * Format time until a specific round is reached
 */
export const getTimeUntilRound = (targetRound: number, currentRound: number): string => {
  if (targetRound <= currentRound) {
    return 'Round has already passed';
  }

  const roundsUntil = targetRound - currentRound;
  const secondsUntil = roundsUntil * 3; // Quicknet rounds are 3 seconds apart

  if (secondsUntil < 60) {
    return `in ${secondsUntil} seconds`;
  } else if (secondsUntil < 3600) {
    const minutes = Math.floor(secondsUntil / 60);
    return `in ${minutes} minute${minutes === 1 ? '' : 's'}`;
  } else if (secondsUntil < 86400) {
    const hours = Math.floor(secondsUntil / 3600);
    const minutes = Math.floor((secondsUntil % 3600) / 60);
    return `in ${hours} hour${hours === 1 ? '' : 's'}${minutes > 0 ? ` and ${minutes} minute${minutes === 1 ? '' : 's'}` : ''}`;
  } else {
    const days = Math.floor(secondsUntil / 86400);
    const hours = Math.floor((secondsUntil % 86400) / 3600);
    return `in ${days} day${days === 1 ? '' : 's'}${hours > 0 ? ` and ${hours} hour${hours === 1 ? '' : 's'}` : ''}`;
  }
};

/**
 * Format a date for display with timezone
 */
export const formatDateWithTimezone = (date: Date): string => {
  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: userTimezone,
    timeZoneName: 'short',
  }).format(date);
};

/**
 * Validate if a date is within acceptable scheduling bounds
 */
export const validateScheduleDate = (date: Date): { isValid: boolean; error?: string } => {
  const minDate = getMinimumScheduleDate();

  if (date < minDate) {
    return {
      isValid: false,
      error: 'Schedule time must be at least 2 minutes in the future',
    };
  }

  // No maximum date validation since there's no limit

  return { isValid: true };
};

/**
 * Get user-friendly relative time description
 */
export const getRelativeTimeDescription = (date: Date): string => {
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 60) {
    return `in ${diffMinutes} minute${diffMinutes === 1 ? '' : 's'}`;
  } else if (diffHours < 24) {
    return `in ${diffHours} hour${diffHours === 1 ? '' : 's'}`;
  } else if (diffDays === 1) {
    return 'tomorrow';
  } else if (diffDays < 7) {
    return `in ${diffDays} days`;
  } else {
    const weeks = Math.floor(diffDays / 7);
    return `in ${weeks} week${weeks === 1 ? '' : 's'}`;
  }
};
