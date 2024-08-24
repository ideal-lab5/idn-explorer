import { Badge } from '@/components/badge'
import { DescriptionDetails, DescriptionList, DescriptionTerm } from '@/components/description-list'
import { Divider } from '@/components/divider'
import { Heading, Subheading } from '@/components/heading'
import { Link } from '@/components/link'
import { getExecutedTransaction } from '@/data'
import { ChevronLeftIcon, CommandLineIcon, CubeIcon, WalletIcon } from '@heroicons/react/16/solid'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

export async function generateMetadata({ params }: { params: { id: string[] } }): Promise<Metadata> {
  let transaction = await getExecutedTransaction(params.id[0])

  return {
    title: transaction && `Transaction #${transaction.cid}`,
  }
}

export default async function ExecutedTransaction({ params }: { params: { id: string[] } }) {
  let transaction = await getExecutedTransaction(params.id[0])

  if (!transaction) {
    notFound()
  }

  return (
    <>
      <div className="max-lg:hidden">
        <Link href={params.id[1] === "compose" ? "/compose" : "/"} className="inline-flex items-center gap-2 text-sm/6 text-zinc-500 dark:text-zinc-400">
          <ChevronLeftIcon className="size-4 fill-zinc-400 dark:fill-zinc-500" />
          {params.id[1] === "compose" ? "Back to Compose" : "Back to Explore"}
        </Link>
      </div>
      <div className="mt-4 lg:mt-8">
        <div className="flex items-center gap-4">
          <Heading>Transaction #{transaction.cid}</Heading>
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
                {transaction.cid}{' '}
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
          <DescriptionTerm>Fee</DescriptionTerm>
          <DescriptionDetails>{transaction.fee}</DescriptionDetails>
          <DescriptionTerm>Details</DescriptionTerm>
          <DescriptionDetails>{"ToDo: display specific transaction details based on transaction type"}</DescriptionDetails>
        </DescriptionList>
      </div>
    </>
  )
}
