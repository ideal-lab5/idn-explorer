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

import { Field, Label } from '@/components/fieldset';
import { Input } from '@/components/input';
import { Select } from '@/components/select';
import { DelayedTransactionDetails } from '@/domain/DelayedTransactionDetails';
import { ChainStateService } from '@/services/ChainStateService';
import React, { useEffect, useState } from 'react';
import { container } from 'tsyringe';

interface PalletOption {
  text: string;
  value: string;
}

interface MethodArgument {
  name: string;
  type: string;
  typeName: string;
  value: any;
}

export const DynamicExtrinsicForm: React.FC<{
  block: number;
  setExtrinsicData: React.Dispatch<React.SetStateAction<DelayedTransactionDetails | null>>;
}> = ({ block, setExtrinsicData }) => {
  const chainStateService = container.resolve(ChainStateService);
  const [pallets, setPallets] = useState<PalletOption[]>([]);
  const [extrinsics, setExtrinsics] = useState<string[]>([]);
  const [parameters, setParameters] = useState<MethodArgument[]>([]);
  const [selectedPallet, setSelectedPallet] = useState<string>('');
  const [selectedExtrinsic, setSelectedExtrinsic] = useState<string>('');

  useEffect(() => {
    async function loadPallets() {
      const availablePallets = await chainStateService.getPallets();
      setPallets(availablePallets);
    }

    loadPallets();
  }, []);

  async function handlePalletChange(selectedPallet: string) {
    setSelectedPallet(selectedPallet);
    setSelectedExtrinsic('');
    if (selectedPallet) {
      const palletExtrinsics = await chainStateService.getExtrinsics(selectedPallet);
      setExtrinsics(palletExtrinsics);
      setParameters([]); // Reset parameters when a new pallet is selected
    }
  }

  async function handleExtrinsicChange(selectedExtrinsic: string) {
    setSelectedExtrinsic(selectedExtrinsic);
    if (selectedPallet && selectedExtrinsic) {
      const paramTypes = await chainStateService.getExtrinsicParameters(
        selectedPallet,
        selectedExtrinsic
      );
      setParameters(paramTypes.map(param => ({ ...param, value: null })));
    }
  }

  function handleParameterChange(paramIndex: number, value: any) {
    const updatedParams = [...parameters];
    updatedParams[paramIndex].value = value;
    setParameters(updatedParams);
  }

  useEffect(() => {
    async function isReady() {
      if (
        selectedPallet &&
        selectedExtrinsic &&
        parameters.reduce((acc, param) => acc && param.value, true)
      ) {
        setExtrinsicData(
          new DelayedTransactionDetails(
            block,
            selectedPallet,
            selectedExtrinsic,
            parameters.map(param => ({
              name: param.name,
              type: param.type,
              value: param.value,
            }))
          )
        );
      } else {
        setExtrinsicData(null);
      }
    }

    isReady();
  }, [selectedPallet, selectedExtrinsic, parameters, block]);

  return (
    <div className="grid grid-cols-2 gap-6">
      <Field>
        <Label>Pallet</Label>
        <Select
          name="pallet"
          value={selectedPallet}
          onChange={e => handlePalletChange(e.target.value)}
        >
          <option value="" disabled>
            Select Pallet
          </option>
          {pallets.map((pallet, index) => (
            <option key={index} value={pallet.value}>
              {pallet.text}
            </option>
          ))}
        </Select>
      </Field>
      {extrinsics.length > 0 && (
        <Field>
          <Label>Extrinsic</Label>
          <Select
            name="extrinsic"
            value={selectedExtrinsic}
            onChange={e => handleExtrinsicChange(e.target.value)}
          >
            <option value="" disabled>
              Select Extrinsic
            </option>
            {extrinsics.map((extrinsic, index) => (
              <option key={index} value={extrinsic}>
                {extrinsic}
              </option>
            ))}
          </Select>
        </Field>
      )}
      {parameters.length > 0 &&
        parameters.map((param, index) => (
          <Field key={`${selectedExtrinsic}_${param.name}_${index}`}>
            <Label>{`${param.name}: ${param.type}`}</Label>
            <Input
              type="text"
              name={`input_${selectedExtrinsic}_${param.name}_${index}`}
              placeholder={`${param.typeName}`}
              onChange={e => handleParameterChange(index, e.target.value)}
              autoFocus
            />
          </Field>
        ))}
    </div>
  );
};
