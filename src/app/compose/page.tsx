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
import { container } from "tsyringe";
import { ExplorerService } from '@/services/ExplorerService'
import { useConnectedWallet } from '@/components/etf/ConnectedWalletContext'
import { ConnectWallet } from '@/components/etf/connectWallet'
import { ExecutedTransaction } from '@/domain/ExecutedTransaction'

export default function Compose() {
  const { signer, isConnected } = useConnectedWallet();
  //get the service instance
  const explorerServiceInstance = container.resolve(ExplorerService);
  let executedTransactions: ExecutedTransaction[] = []; //await getMyExecutedTransactions();
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
                <Select name="sort_by">
                  <option value="date">My Executed</option>
                  <option value="name">My Scheduled</option>
                </Select>
              </div>
            </div>
          </div>
          <Link href={`/compose/schedule`} aria-hidden="true">
            <Button type="button" className="relative top-0 right-0 cursor-pointer" outline>Schedule Transaction</Button>
          </Link>
        </div>
        <ul className="mt-10">
          {executedTransactions.map((transaction, index) => (
            <li key={transaction.cid}>
              <Divider soft={index > 0} />
              <div className="flex items-center justify-between">
                <div key={transaction.cid} className="flex gap-6 py-3">
                  <div className="w-32 shrink-0">
                    <Link href={`${transaction.url}/compose`} aria-hidden="true">
                      <img className="size-10/12 rounded-lg shadow" src={transaction.imgUrl} alt="" />
                    </Link>
                  </div>
                  <div className="space-y-1.5">
                    <div className="text-base/6 font-semibold">
                      <Link href={`${transaction.url}/compose`}>{transaction.cid}</Link>
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
                      <DropdownItem href={`${transaction.url}/compose`}>View</DropdownItem>
                    </DropdownMenu>
                  </Dropdown>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </> : <div className="flex items-center justify-center pt-20">
        <Heading>Please connect your wallet <ConnectWallet buttonOnly={true} /></Heading>
      </div>
  )
}
