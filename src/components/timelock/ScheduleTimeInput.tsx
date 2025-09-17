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

'use client';

import { Button } from '@/components/button';
import { Input } from '@/components/input';
import { DrandService } from '@/services/DrandService';
import {
  dateToRound,
  formatDateWithTimezone,
  getMaximumScheduleDate,
  getMinimumScheduleDate,
  getRelativeTimeDescription,
  getTimeUntilRound,
  MIN_SCHEDULE_MINUTES,
  MIN_SCHEDULE_ROUND,
  roundToDate,
  validateScheduleDate,
} from '@/utils/drandTimeUtils';
import { CalendarIcon, HashtagIcon } from '@heroicons/react/20/solid';
import { useCallback, useEffect, useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

interface ScheduleTimeInputProps {
  currentRound: number;
  onRoundChange: (round: number) => void;
  initialRound?: number;
}

type ScheduleMode = 'datetime' | 'round';

export function ScheduleTimeInput({
  currentRound,
  onRoundChange,
  initialRound,
}: ScheduleTimeInputProps) {
  const [mode, setMode] = useState<ScheduleMode>('datetime');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [manualRound, setManualRound] = useState<number>(initialRound || currentRound + 1200); // 1 hour ahead (1200 rounds = 3600 seconds)
  const [calculatedRound, setCalculatedRound] = useState<number>(0);
  const [estimatedDate, setEstimatedDate] = useState<Date | null>(null);
  const [validationError, setValidationError] = useState<string>('');
  const [drandService] = useState(() => new DrandService());

  // Initialize with a default future date (1 hour from now)
  useEffect(() => {
    if (!selectedDate) {
      const defaultDate = new Date();
      defaultDate.setHours(defaultDate.getHours() + 1);
      defaultDate.setMinutes(0, 0, 0); // Round to nearest hour
      setSelectedDate(defaultDate);
    }
  }, [selectedDate]);

  // Convert date to round when in datetime mode
  const updateRoundFromDate = useCallback(
    async (date: Date) => {
      try {
        const round = await dateToRound(date, drandService);
        setCalculatedRound(round);
        // Also update manualRound to keep values synchronized
        if (!initialRound) {
          setManualRound(round);
        }
        if (mode === 'datetime') {
          onRoundChange(round);
        }
      } catch (error) {
        console.error('Failed to convert date to round:', error);
      }
    },
    [drandService, mode, onRoundChange, initialRound]
  );

  // Convert round to date when in round mode
  const updateDateFromRound = useCallback(
    async (round: number) => {
      try {
        const date = await roundToDate(round, drandService);
        setEstimatedDate(date);
        if (mode === 'round') {
          onRoundChange(round);
        }
      } catch (error) {
        console.error('Failed to convert round to date:', error);
      }
    },
    [drandService, mode, onRoundChange]
  );

  // Update calculations when selectedDate changes
  useEffect(() => {
    if (selectedDate && mode === 'datetime') {
      updateRoundFromDate(selectedDate);
    }
  }, [selectedDate, mode, updateRoundFromDate]);

  // Update calculations when manualRound changes
  useEffect(() => {
    if (mode === 'round') {
      updateDateFromRound(manualRound);
    }
  }, [manualRound, mode, updateDateFromRound]);

  // Validate the selected date
  useEffect(() => {
    if (selectedDate && mode === 'datetime') {
      const validation = validateScheduleDate(selectedDate);
      setValidationError(validation.error || '');
    } else if (mode === 'round') {
      const minRound = currentRound + MIN_SCHEDULE_ROUND; 
      if (manualRound <= currentRound) {
        setValidationError('Round must be in the future');
      } else if (manualRound < minRound) {
        setValidationError(`Round must be at least ${MIN_SCHEDULE_MINUTES} minutes in the future`);
      } else {
        setValidationError('');
      }
    }
  }, [selectedDate, manualRound, mode, currentRound]);

  const handleDateChange = (date: Date | null) => {
    if (date) {
      setSelectedDate(date);
      setValidationError('');
    }
  };

  const handleRoundChange = (value: string) => {
    const round = parseInt(value) || 0;
    setManualRound(round);
    setValidationError('');
  };

  const handleModeChange = (newMode: ScheduleMode) => {
    setMode(newMode);
    setValidationError('');

    // Sync the values when switching modes
    if (newMode === 'round' && selectedDate) {
      updateRoundFromDate(selectedDate);
    } else if (newMode === 'datetime' && manualRound) {
      updateDateFromRound(manualRound);
    }
  };

  return (
    <div className="space-y-4">
      {/* Mode Toggle */}
      <div className="flex rounded-lg border border-zinc-200 p-1 dark:border-zinc-800">
        <Button
          type="button"
          onClick={() => handleModeChange('datetime')}
          className={`flex-1 text-sm ${
            mode === 'datetime'
              ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-white'
              : 'bg-transparent text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
          }`}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          Date & Time
        </Button>
        <Button
          type="button"
          onClick={() => handleModeChange('round')}
          className={`flex-1 text-sm ${
            mode === 'round'
              ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-white'
              : 'bg-transparent text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
          }`}
        >
          <HashtagIcon className="mr-2 h-4 w-4" />
          Round Number
        </Button>
      </div>

      {/* Date/Time Mode */}
      {mode === 'datetime' && (
        <div className="space-y-3">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Execution Date & Time
          </label>
          <div className="relative">
            <DatePicker
              selected={selectedDate}
              onChange={handleDateChange}
              showTimeSelect
              timeFormat="HH:mm"
              timeIntervals={1}
              dateFormat="MMMM d, yyyy h:mm aa"
              minDate={getMinimumScheduleDate()}
              maxDate={getMaximumScheduleDate() || undefined}
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:focus:border-zinc-400"
              placeholderText="Select date and time"
              autoComplete="off"
              wrapperClassName="w-full"
            />
          </div>
          {selectedDate && (
            <div className="rounded-lg bg-zinc-50 p-3 text-sm dark:bg-zinc-800">
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-zinc-600 dark:text-zinc-400">Execution time:</span>
                  <span className="font-medium">{formatDateWithTimezone(selectedDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-600 dark:text-zinc-400">Drand Round:</span>
                  <span className="font-mono">#{calculatedRound.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-600 dark:text-zinc-400">Time until execution:</span>
                  <span className="text-emerald-600 dark:text-emerald-400">
                    {getRelativeTimeDescription(selectedDate)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Round Number Mode */}
      {mode === 'round' && (
        <div className="space-y-3">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Drand Round Number
          </label>
          <div className="flex items-center space-x-2">
            <Input
              type="number"
              value={manualRound}
              onChange={e => handleRoundChange(e.target.value)}
              placeholder="Future Round Number"
              min={currentRound + 1}
            />
            <span className="text-sm text-zinc-500">
              (Current: {currentRound.toLocaleString()})
            </span>
          </div>
          {estimatedDate && (
            <div className="rounded-lg bg-zinc-50 p-3 text-sm dark:bg-zinc-800">
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-zinc-600 dark:text-zinc-400">Round:</span>
                  <span className="font-mono">#{manualRound.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-600 dark:text-zinc-400">Estimated time:</span>
                  <span className="font-medium">{formatDateWithTimezone(estimatedDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-600 dark:text-zinc-400">Time until execution:</span>
                  <span className="text-emerald-600 dark:text-emerald-400">
                    {getTimeUntilRound(manualRound, currentRound)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Validation Error */}
      {validationError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
          {validationError}
        </div>
      )}

      {/* Help Text */}
      <div className="text-xs text-zinc-500">
        <p>• Minimum: 5 minutes in the future • Maximum: 30 days in the future</p>
        <p>• Drand Quicknet generates a new round every 3 seconds</p>
      </div>
    </div>
  );
}
