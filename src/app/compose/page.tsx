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

'use client'

import { Badge } from '@/components/badge'
import { Button } from '@/components/button'
import { Divider } from '@/components/divider'
import { Dropdown, DropdownButton, DropdownItem, DropdownMenu } from '@/components/dropdown'
import { Heading } from '@/components/heading'
import { Input, InputGroup } from '@/components/input'
import { Link } from '@/components/link'
import { Select } from '@/components/select'
import { EllipsisVerticalIcon, MagnifyingGlassIcon } from '@heroicons/react/16/solid'
import { NUMBER_BLOCKS_EXECUTED, useConnectedWallet } from '@/components/contexts/connectedWalletContext'
import { ConnectWallet } from '@/components/timelock/connectWallet'
import { useState } from 'react'
import { ExclamationTriangleIcon, XCircleIcon } from '@heroicons/react/20/solid'
import { explorerClient } from '@/lib/explorer-client';

interface LatestError {
  index: number;
  message: string;
  type: string;
}

export default function Compose() {

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [lastMessage, setLastMessage] = useState<LatestError | null>(null);

  const { signer, isConnected,
    executedTransactions,
    scheduledTransactions,
    composeCurrentSelection,
    setComposeCurrentSelection,
    composeCurrentSearchTerm,
    setComposeCurrentSearchTerm
  } = useConnectedWallet();

  const handleCancelTransaction = async (blockNumber: number, index: number) => {
    if (isProcessing || !signer) {
      return;
    }
    setIsProcessing(true);
    setLastMessage(null);
    try {
      await explorerClient.cancelTransaction(signer, blockNumber, index);
      setLastMessage({ index, message: "Your transaction will be canceled within next few blocks. Keep an eye on My Events.", type: "success" });
    } catch (error: any) {
      console.error(error);
      setLastMessage({ index, message: error.message, type: "error" });
    }
    setIsProcessing(false);
  }

  return (
    signer && isConnected ?
      <>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-sm:w-full sm:flex-1">
            <Heading>Compose</Heading>
            <div className="mt-4 flex max-w-xl gap-4">
              <div className="flex-1">
                <InputGroup>
                  <MagnifyingGlassIcon />
                  <Input name="search" value={composeCurrentSearchTerm} onChange={e => setComposeCurrentSearchTerm(e.target.value)} placeholder="Search transactions&hellip;" />
                </InputGroup>
              </div>
              <div>
                <Select name="sort_by" value={composeCurrentSelection} onChange={(e) => setComposeCurrentSelection(e.target.value)}>
                  <option value="scheduled">My Scheduled</option>
                  <option value="executed">My Events</option>
                </Select>
                {composeCurrentSelection === "executed" && <span className="text-zinc-500 ml-2 text-xs">{`Latest ${NUMBER_BLOCKS_EXECUTED} blocks`}</span>}
              </div>
            </div>
          </div>
          <Link href={`/compose/schedule`} aria-hidden="true">
            <Button type="button" className="relative top-0 right-0 cursor-pointer" outline>Schedule Transaction</Button>
          </Link>
        </div>
        <ul className="mt-10">
          {composeCurrentSelection === "executed" && executedTransactions.filter((transaction) => transaction.owner === signer.address).filter(element => composeCurrentSearchTerm == "" || (element.id.toLowerCase().includes(composeCurrentSearchTerm.toLowerCase()) || element.operation.toLowerCase().includes(composeCurrentSearchTerm.toLowerCase()) || element.owner.toLowerCase().includes(composeCurrentSearchTerm.toLowerCase()))).map((transaction, index) => (
            <li key={index + "_" + transaction.id + "_" + transaction.operation}>
              <Divider soft={index > 0} />
              <div className="flex items-center justify-between">
                <div className="flex gap-6 py-3">
                  <div className="w-32 shrink-0">
                    <Link href={`/compose/${transaction.id}_OP_${transaction.operation}/compose`} aria-hidden="true">
                      <img className="size-10/12 rounded-lg shadow" src={"ideal/original-original.png"} alt="" />
                    </Link>
                  </div>
                  <div className="space-y-1.5">
                    <div className="text-base/6 font-semibold">
                      <Link href={`/compose/${transaction.id}_OP_${transaction.operation}/compose`}>{transaction.id}</Link>
                    </div>
                    <div className="text-xs/6 text-zinc-500">
                      Block: {transaction.block}
                    </div>
                    <div className="text-xs/6 text-zinc-600">
                      <Badge>{transaction.operation}</Badge>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Badge className="max-sm:hidden" color={transaction.status === 'Confirmed' ? 'lime' : 'red'}>
                    {transaction.status}
                  </Badge>
                  <Dropdown>
                    <DropdownButton className="cursor-pointer" plain aria-label="More options">
                      <EllipsisVerticalIcon />
                    </DropdownButton>
                    <DropdownMenu anchor="bottom end">
                      <DropdownItem href={`/compose/${transaction.id}_OP_${transaction.operation}/compose`}>View</DropdownItem>
                    </DropdownMenu>
                  </Dropdown>
                </div>
              </div>
            </li>
          ))}
          {composeCurrentSelection === "scheduled" && scheduledTransactions.filter((transaction) => transaction.owner === signer.address).filter(element => composeCurrentSearchTerm == "" || (element.id.toLowerCase().includes(composeCurrentSearchTerm.toLowerCase()) || element.operation.toLowerCase().includes(composeCurrentSearchTerm.toLowerCase()) || element.owner.toLowerCase().includes(composeCurrentSearchTerm.toLowerCase()))).map((transaction, index) => (
            <li key={transaction.id}>
              <Divider soft={index > 0} />
              <div className="flex items-center justify-between">
                <div key={transaction.id} className="flex gap-6 py-3">
                  <div className="w-32 shrink-0">
                    <img className="size-10/12 rounded-lg shadow" src={"ideal/original-original.png"} alt="" />
                  </div>
                  <div className="space-y-1.5">
                    <div className="text-base/6 font-semibold">
                      {transaction.id}
                    </div>
                    <div className="text-xs/6 text-zinc-500">
                      Deadline: {transaction.deadlineBlock}
                    </div>
                    <div className="text-xs/6 text-zinc-600">
                      <Badge>{transaction.operation}</Badge>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Badge className="max-sm:hidden" color={'lime'}>
                    {"Scheduled"}
                  </Badge>
                  <Dropdown>
                    <DropdownButton className="cursor-pointer" plain aria-label="More options">
                      <EllipsisVerticalIcon />
                    </DropdownButton>
                    <DropdownMenu anchor="bottom end">
                      <DropdownItem onClick={() => handleCancelTransaction(parseInt(transaction.deadlineBlock), index)}>{isProcessing ? "Canceling..." : "Cancel"}</DropdownItem>
                    </DropdownMenu>
                  </Dropdown>
                </div>
              </div>
              {lastMessage?.index === index &&
                <div className={`border-l-4 ${lastMessage.type === "error" ? "border-rose-400 bg-rose-50 p-4" : "border-yellow-400 bg-yellow-50 p-4"}`}>
                  <div className="flex">
                    <div className="flex-shrink-0">
                      {lastMessage?.type === "error" ? <XCircleIcon aria-hidden="true" className="h-5 w-5 text-rose-400" /> :  <ExclamationTriangleIcon aria-hidden="true" className="h-5 w-5 text-yellow-400" />}
                    </div>
                    <div className="ml-3">
                      <h3 className={`text-sm font-medium ${lastMessage?.type === "error" ? "text-rose-800" : "text-yellow-700"}`}>{lastMessage?.message}</h3>
                    </div>
                  </div>
                </div>}
            </li>
          ))}
          {composeCurrentSelection === "executed" && !executedTransactions.filter((transaction) => transaction.owner === signer.address).length &&
            <div className="border-l-4 border-yellow-400 bg-yellow-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <ExclamationTriangleIcon aria-hidden="true" className="h-5 w-5 text-yellow-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    You have no executed transactions.{' '}
                    <Link href={`/compose/schedule`} aria-hidden="true" className="font-medium text-yellow-700 underline hover:text-yellow-600">
                      Schedule a new transaction.
                    </Link>
                  </p>
                </div>
              </div>
            </div>}
          {composeCurrentSelection === "scheduled" && !scheduledTransactions.filter((transaction) => transaction.owner === signer.address).length &&
            <div className="border-l-4 border-yellow-400 bg-yellow-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <ExclamationTriangleIcon aria-hidden="true" className="h-5 w-5 text-yellow-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    You have no up coming transactions scheduled.{' '}
                    <Link href={`/compose/schedule`} aria-hidden="true" className="font-medium text-yellow-700 underline hover:text-yellow-600">
                      Schedule a new transaction.
                    </Link>
                  </p>
                </div>
              </div>
            </div>}
        </ul>
      </> : <div className="flex items-center justify-center pt-20">
        <Heading>Please connect your wallet <ConnectWallet buttonOnly={true} /></Heading>
      </div>
  )
}
