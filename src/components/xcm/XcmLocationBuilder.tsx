'use client'

import React, { useState, useEffect, useCallback, ChangeEvent } from 'react'
import { PlusIcon, MinusIcon } from '@heroicons/react/24/outline'

export interface XcmJunction {
  type: 'parachain' | 'accountId32' | 'accountKey20' | 'palletInstance' | 'generalIndex' | 'generalKey' | 'onlyChild' | 'plurality'
  value?: any
}

export interface XcmLocation {
  parents: number
  interior: 'here' | { [key: string]: XcmJunction[] }
}

interface XcmLocationBuilderProps {
  value?: XcmLocation
  onChange: (location: XcmLocation) => void
  className?: string
}

const JUNCTION_TYPES = [
  { value: 'parachain', label: 'Parachain', description: 'Target a specific parachain by ID' },
  { value: 'accountId32', label: 'AccountId32', description: 'Substrate account with 32-byte public key' },
  { value: 'accountKey20', label: 'AccountKey20', description: 'Ethereum-style account with 20-byte address' },
  { value: 'palletInstance', label: 'Pallet Instance', description: 'Target a specific pallet instance' },
  { value: 'generalIndex', label: 'General Index', description: 'General purpose index' },
  { value: 'generalKey', label: 'General Key', description: 'General purpose key' },
  { value: 'onlyChild', label: 'Only Child', description: 'The only child junction' },
  { value: 'plurality', label: 'Plurality', description: 'Plurality junction for governance' }
]

const NETWORK_OPTIONS = [
  { value: 'any', label: 'Any' },
  { value: 'named', label: 'Named' },
  { value: 'polkadot', label: 'Polkadot' },
  { value: 'kusama', label: 'Kusama' }
]

export default function XcmLocationBuilder({ value, onChange, className = '' }: XcmLocationBuilderProps) {
  const [parents, setParents] = useState(value?.parents || 1)
  const [junctionCount, setJunctionCount] = useState<'here' | 'x1' | 'x2' | 'x3' | 'x4' | 'x5'>('x1')
  const [junctions, setJunctions] = useState<XcmJunction[]>([
    { type: 'parachain', value: { parachain: 2000 } }
  ])

  // Initialize from value prop - only run once on mount
  useEffect(() => {
    if (value) {
      setParents(value.parents)
      if (value.interior === 'here') {
        setJunctionCount('here')
        setJunctions([])
      } else if (typeof value.interior === 'object') {
        const interiorKeys = Object.keys(value.interior)
        if (interiorKeys.length > 0) {
          const key = interiorKeys[0]
          const junctionArray = value.interior[key]
          setJunctionCount(key as any)
          setJunctions(junctionArray)
        }
      }
    }
  }, []) // Remove value dependency to prevent infinite loop

  const updateLocation = useCallback(() => {
    const location: XcmLocation = {
      parents,
      interior: junctionCount === 'here' ? 'here' : { [junctionCount]: junctions }
    }
    // Only call onChange if the location actually changed
    const currentLocationString = JSON.stringify(location)
    const valueString = JSON.stringify(value)
    if (currentLocationString !== valueString) {
      onChange(location)
    }
  }, [parents, junctionCount, junctions, onChange, value])

  useEffect(() => {
    updateLocation()
  }, [updateLocation])

  const handleJunctionCountChange = (count: typeof junctionCount) => {
    setJunctionCount(count)
    const numJunctions = count === 'here' ? 0 : parseInt(count.substring(1))
    
    // Adjust junctions array
    if (numJunctions === 0) {
      setJunctions([])
    } else if (numJunctions > junctions.length) {
      // Add new junctions
      const newJunctions = [...junctions]
      for (let i = junctions.length; i < numJunctions; i++) {
        newJunctions.push({ type: 'parachain', value: { parachain: 2000 } })
      }
      setJunctions(newJunctions)
    } else if (numJunctions < junctions.length) {
      // Remove excess junctions
      setJunctions(junctions.slice(0, numJunctions))
    }
  }

  const updateJunction = (index: number, junction: XcmJunction) => {
    const newJunctions = [...junctions]
    newJunctions[index] = junction
    setJunctions(newJunctions)
  }

  const renderJunctionEditor = (junction: XcmJunction, index: number) => {
    const handleTypeChange = (type: string) => {
      let defaultValue: any
      switch (type) {
        case 'parachain':
          defaultValue = { parachain: 2000 }
          break
        case 'accountId32':
          defaultValue = { 
            network: { any: null },
            id: '0x' + '00'.repeat(32)
          }
          break
        case 'accountKey20':
          defaultValue = {
            network: { any: null },
            key: '0x' + '00'.repeat(20)
          }
          break
        case 'palletInstance':
          defaultValue = { palletInstance: 0 }
          break
        case 'generalIndex':
          defaultValue = { generalIndex: 0 }
          break
        case 'generalKey':
          defaultValue = { generalKey: '0x' }
          break
        case 'onlyChild':
          defaultValue = { onlyChild: null }
          break
        case 'plurality':
          defaultValue = {
            id: { unit: null },
            part: { voice: null }
          }
          break
        default:
          defaultValue = {}
      }
      updateJunction(index, { type: type as any, value: defaultValue })
    }

    const handleValueChange = (field: string, value: any) => {
      const newValue = { ...junction.value, [field]: value }
      updateJunction(index, { ...junction, value: newValue })
    }

    return (
      <div key={index} className="p-4 border border-zinc-300 dark:border-zinc-600 rounded-lg space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-zinc-900 dark:text-zinc-100">
            Junction {index + 1}
          </h4>
        </div>
        
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Junction Type
            </label>
            <select
              value={junction.type}
              onChange={(e) => handleTypeChange(e.target.value)}
              className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100"
            >
              {JUNCTION_TYPES.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-zinc-500 mt-1">
              {JUNCTION_TYPES.find(t => t.value === junction.type)?.description}
            </p>
          </div>

          {/* Render type-specific fields */}
          {junction.type === 'parachain' && (
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Parachain ID
              </label>
              <input
                type="number"
                value={junction.value?.parachain || 2000}
                onChange={(e: ChangeEvent<HTMLInputElement>) => handleValueChange('parachain', parseInt(e.target.value))}
                min={0}
                max={4294967295}
                placeholder="Enter parachain ID"
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100"
              />
            </div>
          )}

          {junction.type === 'accountId32' && (
            <>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Network
                </label>
                <select
                  value={Object.keys(junction.value?.network || { any: null })[0]}
                  onChange={(e) => handleValueChange('network', { [e.target.value]: null })}
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100"
                >
                  {NETWORK_OPTIONS.map(network => (
                    <option key={network.value} value={network.value}>
                      {network.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Account ID (32 bytes hex)
                </label>
                <input
                  value={junction.value?.id || '0x' + '00'.repeat(32)}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => handleValueChange('id', e.target.value)}
                  placeholder="0x..."
                  pattern="^0x[0-9a-fA-F]{64}$"
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100"
                />
                <p className="text-xs text-zinc-500 mt-1">
                  64 character hexadecimal string (32 bytes)
                </p>
              </div>
            </>
          )}

          {junction.type === 'accountKey20' && (
            <>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Network
                </label>
                <select
                  value={Object.keys(junction.value?.network || { any: null })[0]}
                  onChange={(e) => handleValueChange('network', { [e.target.value]: null })}
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100"
                >
                  {NETWORK_OPTIONS.map(network => (
                    <option key={network.value} value={network.value}>
                      {network.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Account Key (20 bytes hex)
                </label>
                <input
                  value={junction.value?.key || '0x' + '00'.repeat(20)}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => handleValueChange('key', e.target.value)}
                  placeholder="0x..."
                  pattern="^0x[0-9a-fA-F]{40}$"
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100"
                />
                <p className="text-xs text-zinc-500 mt-1">
                  40 character hexadecimal string (20 bytes)
                </p>
              </div>
            </>
          )}

          {junction.type === 'palletInstance' && (
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Pallet Instance
              </label>
              <input
                type="number"
                value={junction.value?.palletInstance || 0}
                onChange={(e: ChangeEvent<HTMLInputElement>) => handleValueChange('palletInstance', parseInt(e.target.value))}
                min={0}
                max={255}
                placeholder="Enter pallet instance"
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100"
              />
            </div>
          )}

          {junction.type === 'generalIndex' && (
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                General Index
              </label>
              <input
                type="number"
                value={junction.value?.generalIndex || 0}
                onChange={(e: ChangeEvent<HTMLInputElement>) => handleValueChange('generalIndex', parseInt(e.target.value))}
                min={0}
                placeholder="Enter general index"
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100"
              />
            </div>
          )}

          {junction.type === 'generalKey' && (
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                General Key (hex)
              </label>
              <input
                value={junction.value?.generalKey || '0x'}
                onChange={(e: ChangeEvent<HTMLInputElement>) => handleValueChange('generalKey', e.target.value)}
                placeholder="0x..."
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100"
              />
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="space-y-4 p-4 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
        <div className="flex items-center justify-between">
          <h3 className="text-md font-semibold text-zinc-900 dark:text-zinc-100">
            XCM Location Builder
          </h3>
          <div className="text-xs text-zinc-500 bg-zinc-200 dark:bg-zinc-700 px-2 py-1 rounded">
            Advanced Mode
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Parents
            </label>
            <input
              type="number"
              value={parents}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setParents(parseInt(e.target.value))}
              min={0}
              max={255}
              placeholder="Number of parent hops"
              className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100"
            />
            <p className="text-xs text-zinc-500">
              0 = local, 1 = parent (relay), 2+ = grandparent+
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Interior Junctions
            </label>
            <select
              value={junctionCount}
              onChange={(e) => handleJunctionCountChange(e.target.value as any)}
              className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100"
            >
              <option value="here">Here (no junctions)</option>
              <option value="x1">X1 (1 junction)</option>
              <option value="x2">X2 (2 junctions)</option>
              <option value="x3">X3 (3 junctions)</option>
              <option value="x4">X4 (4 junctions)</option>
              <option value="x5">X5 (5 junctions)</option>
            </select>
            <p className="text-xs text-zinc-500">
              Number of interior path junctions
            </p>
          </div>
        </div>

        {junctionCount !== 'here' && (
          <div className="space-y-3">
            <h4 className="font-medium text-zinc-900 dark:text-zinc-100">
              Configure Junctions
            </h4>
            {junctions.map((junction, index) => renderJunctionEditor(junction, index))}
          </div>
        )}

        {/* Location Preview */}
        <div className="mt-4 p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg">
          <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            Generated XCM Location:
          </h4>
          <pre className="text-xs text-zinc-600 dark:text-zinc-400 overflow-x-auto whitespace-pre-wrap">
            {JSON.stringify(
              {
                parents,
                interior: junctionCount === 'here' ? 'here' : { [junctionCount]: junctions.map(j => ({ [j.type]: j.value })) }
              },
              null,
              2
            )}
          </pre>
        </div>
      </div>
    </div>
  )
}
