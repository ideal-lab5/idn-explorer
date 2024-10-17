'use client'

import { Badge } from '@/components/badge'
import { DescriptionDetails, DescriptionList, DescriptionTerm } from '@/components/description-list'
import { Divider } from '@/components/divider'
import { useConnectedWallet } from '@/components/etf/connectedWalletContext'
import { Heading, Subheading } from '@/components/heading'
import { Link } from '@/components/link'
import { ChevronLeftIcon, CommandLineIcon, CubeIcon, WalletIcon } from '@heroicons/react/16/solid'
import { notFound } from 'next/navigation'

export default function ExecutedTransaction({ params }: { readonly params: { readonly id: readonly string[] } }) {

  const {
    executedTransactions
  } = useConnectedWallet();

  if (!params.id[0]) notFound();

  const idComponents = params.id[0].split('_OP_');
  if (idComponents?.length < 2) notFound();

  const transaction = executedTransactions.find((tx) => tx.id === idComponents[0] && tx.operation === idComponents[1]);
  if (!transaction) notFound();

  return (
    transaction ? <div>
      <div className="max-lg:hidden">
        <Link href={params.id[1] === "compose" ? "/compose" : "/"} className="inline-flex items-center gap-2 text-sm/6 text-zinc-500 dark:text-zinc-400">
          <ChevronLeftIcon className="size-4 fill-zinc-400 dark:fill-zinc-500" />
          {params.id[1] === "compose" ? "Back to Compose" : "Back to Explore"}
        </Link>
      </div>
      <div className="mt-4 lg:mt-8">
        <div className="flex items-center gap-4">
          <Heading>Transaction #{transaction.id}</Heading>
          <Badge color={transaction.status === 'Confirmed' ? 'lime' : 'red'}>{transaction.status}</Badge>
        </div>
        <div className="isolate mt-2.5 flex flex-wrap justify-between gap-x-6 gap-y-4">
          <div className="flex flex-wrap gap-x-10 gap-y-4 py-1.5">
            <span className="flex items-center gap-3 text-base/6 text-zinc-950 sm:text-sm/6 dark:text-white">
              <CommandLineIcon className="size-4 shrink-0 fill-zinc-400 dark:fill-zinc-500" />
              <span>{transaction.operation}</span>
            </span>
            <span className="flex items-center gap-3 text-base/6 text-zinc-950 sm:text-sm/6 dark:text-white">
              <WalletIcon className="size-4 shrink-0 fill-zinc-400 dark:fill-zinc-500" />
              <span className="inline-flex gap-3">
                {transaction.id}{' '}
                <span>
                  <span aria-hidden="true">••••</span> {transaction.owner}
                </span>
              </span>
            </span>
            <span className="flex items-center gap-3 text-base/6 text-zinc-950 sm:text-sm/6 dark:text-white">
              <CubeIcon className="size-4 shrink-0 fill-zinc-400 dark:fill-zinc-500" />
              <span>{transaction.block}</span>
            </span>
          </div>
        </div>
      </div>
      <div className="mt-12">
        <Subheading>Summary</Subheading>
        <Divider className="mt-4" />
        <DescriptionList>
          <DescriptionTerm>Transaction type</DescriptionTerm>
          <DescriptionDetails>{transaction.operation}</DescriptionDetails>
          <DescriptionTerm>Block</DescriptionTerm>
          <DescriptionDetails>{transaction.block}</DescriptionDetails>
          <DescriptionTerm>Owner</DescriptionTerm>
          <DescriptionDetails>{transaction.owner}</DescriptionDetails>
          <DescriptionTerm>Metadata</DescriptionTerm>
          {transaction?.metadata?.map((metadata: any, index: number) =>
            <div key={"detail_" + index}>
              <DescriptionDetails>
                {metadata}
              </DescriptionDetails>
            </div>)}
          <DescriptionTerm>Event data</DescriptionTerm>
          <DescriptionDetails>
            {transaction?.eventData?.map((eventData: any, index: number) =>
              <div key={"detail_" + index}>
                <p className='text-xs'>{eventData.type}</p>
                <p className='text-xs'>{eventData.value}</p>
              </div>)}
          </DescriptionDetails>
        </DescriptionList>
      </div>
    </div> : <div>Loading...</div>
  );
}