'use client'

import React from 'react'
import { ChevronRightIcon } from '@heroicons/react/20/solid'
import type { XcmLocation, XcmJunction } from './XcmLocationBuilder'

interface XcmLocationViewerProps {
  location: XcmLocation | string
  className?: string
  showRaw?: boolean
}

const JUNCTION_TYPE_LABELS = {
  parachain: 'Parachain',
  accountId32: 'AccountId32',
  accountKey20: 'AccountKey20',
  palletInstance: 'Pallet Instance',
  generalIndex: 'General Index',  
  generalKey: 'General Key',
  onlyChild: 'Only Child',
  plurality: 'Plurality'
}

const JUNCTION_TYPE_COLORS = {
  parachain: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  accountId32: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  accountKey20: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  palletInstance: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  generalIndex: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  generalKey: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
  onlyChild: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
  plurality: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
}

// Helper function to format network objects for display
function formatNetworkValue(network: any): string {
  if (typeof network === 'string') {
    return network
  }
  if (typeof network === 'object' && network !== null) {
    // Handle network objects like {"polkadot": null}, {"kusama": null}
    const keys = Object.keys(network)
    if (keys.length > 0) {
      return keys[0] // Return the network name (e.g., "polkadot")
    }
  }
  return String(network)
}

export default function XcmLocationViewer({ location, className = '', showRaw = false }: XcmLocationViewerProps) {
  // Parse and normalize location data
  let parsedLocation: XcmLocation | null = null
  
  if (typeof location === 'string') {
    parsedLocation = parseLocationString(location)
  } else if (location && typeof location === 'object') {
    // Handle raw blockchain data by normalizing junction format
    parsedLocation = normalizeXcmLocation(location)
  }

  if (!parsedLocation) {
    return (
      <div className={`text-zinc-500 text-sm ${className}`}>
        Invalid XCM Location
      </div>
    )
  }

  const renderJunctionValue = (junction: XcmJunction) => {
    switch (junction.type) {
      case 'parachain':
        return (
          <span className="font-mono text-sm">
            {junction.value?.parachain || junction.value}
          </span>
        )
      case 'accountId32':
        return (
          <div className="space-y-1">
            <div className="font-mono text-xs break-all">
              {junction.value?.id || junction.value}
            </div>
            {junction.value?.network && (
              <div className="text-xs text-zinc-500">
                Network: {formatNetworkValue(junction.value.network)}
              </div>
            )}
          </div>
        )
      case 'accountKey20':
        return (
          <div className="space-y-1">
            <div className="font-mono text-xs break-all">
              {junction.value?.key || junction.value}
            </div>
            {junction.value?.network && (
              <div className="text-xs text-zinc-500">
                Network: {formatNetworkValue(junction.value.network)}
              </div>
            )}
          </div>
        )
      case 'palletInstance':
        return (
          <span className="font-mono text-sm">
            {junction.value?.instance || junction.value}
          </span>
        )
      case 'generalIndex':
        return (
          <span className="font-mono text-sm">
            {junction.value?.index || junction.value}
          </span>
        )
      case 'generalKey':
        return (
          <span className="font-mono text-xs break-all">
            {junction.value?.generalKey || junction.value}
          </span>
        )
      case 'plurality':
        return (
          <div className="space-y-1">
            {junction.value?.id && (
              <div className="text-xs">
                ID: {junction.value.id.type || junction.value.id}
              </div>
            )}
            {junction.value?.part && (
              <div className="text-xs">
                Part: {junction.value.part.type || junction.value.part}
              </div>
            )}
          </div>
        )
      default:
        return (
          <span className="font-mono text-xs">
            {JSON.stringify(junction.value)}
          </span>
        )
    }
  }

  const renderJunction = (junction: XcmJunction, index: number) => {
    const colorClass = JUNCTION_TYPE_COLORS[junction.type] || 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200'
    
    return (
      <div key={index} className="flex items-center space-x-2">
        {index > 0 && (
          <ChevronRightIcon className="h-4 w-4 text-zinc-400 flex-shrink-0" />
        )}
        <div className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-3 flex-1">
          <div className="flex items-center justify-between mb-2">
            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${colorClass}`}>
              {JUNCTION_TYPE_LABELS[junction.type] || junction.type}
            </span>
          </div>
          <div className="text-zinc-900 dark:text-zinc-100">
            {renderJunctionValue(junction)}
          </div>
        </div>
      </div>
    )
  }

  const renderInterior = () => {
    if (parsedLocation.interior === 'here') {
      return (
        <div className="text-zinc-500 text-sm italic">
          Here (no interior junctions)
        </div>
      )
    }

    if (typeof parsedLocation.interior === 'object') {
      const interiorKey = Object.keys(parsedLocation.interior)[0]
      const junctions = parsedLocation.interior[interiorKey]
      
      if (!junctions || junctions.length === 0) {
        return (
          <div className="text-zinc-500 text-sm italic">
            No junctions
          </div>
        )
      }

      return (
        <div className="space-y-3">
          <div className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Interior Path ({interiorKey.toUpperCase()}):
          </div>
          <div className="space-y-2">
            {junctions.map((junction, index) => renderJunction(junction, index))}
          </div>
        </div>
      )
    }

    return null
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4">
        {/* Parents */}
        <div className="mb-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Parents:
            </span>
            <span className="inline-flex items-center px-2 py-1 text-sm font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200 rounded-full">
              {parsedLocation.parents}
            </span>
            <span className="text-xs text-zinc-500">
              {parsedLocation.parents === 0 ? '(local)' : 
               parsedLocation.parents === 1 ? '(parent/relay)' : 
               `(${parsedLocation.parents} hops up)`}
            </span>
          </div>
        </div>

        {/* Interior */}
        {renderInterior()}

        {/* Raw JSON view */}
        {showRaw && (
          <details className="mt-4">
            <summary className="text-sm font-medium text-zinc-700 dark:text-zinc-300 cursor-pointer hover:text-zinc-900 dark:hover:text-zinc-100">
              View Raw JSON
            </summary>
            <pre className="mt-2 p-3 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded text-xs text-zinc-600 dark:text-zinc-400 overflow-x-auto">
              {JSON.stringify(parsedLocation, null, 2)}
            </pre>
          </details>
        )}
      </div>
    </div>
  )
}

/**
 * Normalize raw blockchain XCM location data to expected junction format
 * Raw data has junctions like { parachain: 2000 } instead of { type: 'parachain', value: { parachain: 2000 } }
 */
function normalizeXcmLocation(rawLocation: any): XcmLocation | null {
  try {
    if (!rawLocation || typeof rawLocation !== 'object') {
      return null
    }

    const normalized: XcmLocation = {
      parents: rawLocation.parents || 0,
      interior: rawLocation.interior
    }

    // Handle interior normalization
    if (rawLocation.interior && typeof rawLocation.interior === 'object' && rawLocation.interior !== 'here') {
      const interiorKey = Object.keys(rawLocation.interior)[0] as keyof typeof rawLocation.interior
      const rawJunctions = rawLocation.interior[interiorKey]
      

      
      if (Array.isArray(rawJunctions)) {
        const normalizedJunctions: XcmJunction[] = rawJunctions.map((rawJunction: any): XcmJunction => {
          // Convert raw junction format to expected format
          if (rawJunction.parachain !== undefined) {
            return { type: 'parachain', value: { parachain: rawJunction.parachain } }
          } 
          else if (rawJunction.accountId32 !== undefined) {
            return { type: 'accountId32', value: rawJunction.accountId32 }
          } 
          else if (rawJunction.accountKey20 !== undefined) {
            return { type: 'accountKey20', value: rawJunction.accountKey20 }
          } 
          else if (rawJunction.palletInstance !== undefined) {
            return { type: 'palletInstance', value: { palletInstance: rawJunction.palletInstance } }
          } 
          else if (rawJunction.generalIndex !== undefined) {
            return { type: 'generalIndex', value: { generalIndex: rawJunction.generalIndex } }
          } 
          else if (rawJunction.generalKey !== undefined) {
            return { type: 'generalKey', value: rawJunction.generalKey }
          } 
          else if (rawJunction.onlyChild !== undefined) {
            return { type: 'onlyChild', value: {} }
          } 
          else if (rawJunction.plurality !== undefined) {
            return { type: 'plurality', value: rawJunction.plurality }
          }
          else {
            // Fallback for unknown junction types - default to parachain
            console.warn('Unknown junction type:', rawJunction)
            return { type: 'parachain', value: rawJunction }
          }
        })
        

        
        normalized.interior = {
          [interiorKey]: normalizedJunctions
        }
      }
    }

    return normalized
  } catch (error) {
    console.warn('Failed to normalize XCM location:', rawLocation, error)
    return null
  }
}

/**
 * Parse a string representation of XCM location back to structured format
 * This handles the formatted strings from subscriptionMapper.ts
 */
function parseLocationString(locationStr: string): XcmLocation | null {
  try {
    // First, try to parse as JSON (most common case for raw blockchain data)
    if (locationStr.startsWith('{') || locationStr.startsWith('[')) {
      const rawLocation = JSON.parse(locationStr)
      // If it's already in the correct format, return as-is
      // If it's raw blockchain format, normalize it
      return normalizeXcmLocation(rawLocation)
    }
    
    // Handle formatted strings like "Parachain 2000" or "Parents: 1, Parachain: 2000"
    if (locationStr.includes('Parachain')) {
      const parachainMatch = locationStr.match(/Parachain[:\s]+(\d+)/)
      const parentsMatch = locationStr.match(/Parents[:\s]+(\d+)/)
      
      const parents = parentsMatch ? parseInt(parentsMatch[1]) : 0
      const parachainId = parachainMatch ? parseInt(parachainMatch[1]) : null
      
      if (parachainId !== null) {
        return {
          parents,
          interior: {
            x1: [{ type: 'parachain', value: { parachain: parachainId } }]
          }
        }
      }
    }

    // Fallback: try to parse as JSON anyway
    const rawLocation = JSON.parse(locationStr)
    return normalizeXcmLocation(rawLocation)
  } catch (error) {
    console.warn('Failed to parse XCM location string:', locationStr, error)
    return null
  }
}
