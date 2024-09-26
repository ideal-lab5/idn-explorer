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
import { NUMBER_BLOCKS_EXECUTED, useConnectedWallet } from '@/components/etf/ConnectedWalletContext'
import { ConnectWallet } from '@/components/etf/connectWallet'
import { useState } from 'react'
import { ExclamationTriangleIcon } from '@heroicons/react/20/solid'

export default function Compose() {

  const [selectedTab, setSelectedTab] = useState<string>("scheduled");

  const { latestBlock, signer, isConnected,
    executedTransactions,
    scheduledTransactions,
    epochIndex, sessionProgress,
    sessionLength, eraProgress,
    sessionsPerEra
  } = useConnectedWallet();

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
                  <Input name="search" placeholder="Search transactions&hellip;" />
                </InputGroup>
              </div>
              <div>
                <Select name="sort_by" onChange={(e) => setSelectedTab(e.target.value)}>
                  <option value="scheduled">My Scheduled</option>
                  <option value="executed">My Executed</option>
                </Select>
                {selectedTab === "executed" && <span className="text-zinc-500 ml-2 text-xs">{`Last ${NUMBER_BLOCKS_EXECUTED} blocks`}</span>}
              </div>
            </div>
          </div>
          <Link href={`/compose/schedule`} aria-hidden="true">
            <Button type="button" className="relative top-0 right-0 cursor-pointer" outline>Schedule Transaction</Button>
          </Link>
        </div>
        <ul className="mt-10">
          {selectedTab === "executed" && executedTransactions.filter((transaction) => transaction.owner === signer.address).map((transaction, index) => (
            <li key={index+"_"+transaction.id+"_"+transaction.operation}>
              <Divider soft={index > 0} />
              <div className="flex items-center justify-between">
                <div className="flex gap-6 py-3">
                  <div className="w-32 shrink-0">
                    <Link href={"#"} aria-hidden="true">
                      <img className="size-10/12 rounded-lg shadow" src={"ideal/original-original.png"} alt="" />
                    </Link>
                  </div>
                  <div className="space-y-1.5">
                    <div className="text-base/6 font-semibold">
                      <Link href={"#"}>{transaction.id}</Link>
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
                      <DropdownItem href={"#"}>View</DropdownItem>
                    </DropdownMenu>
                  </Dropdown>
                </div>
              </div>
            </li>
          ))}
          {selectedTab === "scheduled" && scheduledTransactions.filter((transaction) => transaction.owner === signer.address).map((transaction, index) => (
            <li key={transaction.id}>
              <Divider soft={index > 0} />
              <div className="flex items-center justify-between">
                <div key={transaction.id} className="flex gap-6 py-3">
                  <div className="w-32 shrink-0">
                    <Link href={"#"} aria-hidden="true">
                      <img className="size-10/12 rounded-lg shadow" src={"ideal/original-original.png"} alt="" />
                    </Link>
                  </div>
                  <div className="space-y-1.5">
                    <div className="text-base/6 font-semibold">
                      <Link href={"#"}>{transaction.id}</Link>
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
                      <DropdownItem href={"#"}>View</DropdownItem>
                    </DropdownMenu>
                  </Dropdown>
                </div>
              </div>
            </li>
          ))}
          {selectedTab === "executed" && !executedTransactions.filter((transaction) => transaction.owner === signer.address).length &&
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
          {selectedTab === "scheduled" && !scheduledTransactions.filter((transaction) => transaction.owner === signer.address).length &&
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
