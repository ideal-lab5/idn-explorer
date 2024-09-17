'use client'

import { Button } from '@/components/button'
import { Field, Label, Fieldset } from '@/components/fieldset'
import { Text } from '@/components/text'
import { Badge } from '@/components/badge'
import { Link } from '@/components/link'
import { Input } from '@/components/input'
import { Heading, Subheading } from '@/components/heading'
import { ChevronDoubleLeftIcon } from '@heroicons/react/16/solid'
import { DynamicExtrinsicForm } from '@/components/etf/dynamicExtrinsicForm'
import { useConnectedWallet } from '@/components/etf/ConnectedWalletContext'
import { ConnectWallet } from '@/components/etf/connectWallet'
import { useState } from 'react'
import { DelayedTransactionDetails } from '@/domain/DelayedTransactionDetails'
import { ExplorerService } from '@/services/ExplorerService'
import { container } from 'tsyringe'

const FUTURE_BLOCK_DEFAULT_START: number = 100;

export default function ScheduleTransaction({ ...props }: {} & React.ComponentPropsWithoutRef<typeof Button>) {

  const { latestBlock, signer, isConnected } = useConnectedWallet();
  const [block, setBlock] = useState<number>(latestBlock + FUTURE_BLOCK_DEFAULT_START);
  const [extrinsicData, setExtrinsicData] = useState<DelayedTransactionDetails | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const explorerServiceInstance = container.resolve(ExplorerService);

  async function handleScheduleTransaction() {

    if (isProcessing || !signer || extrinsicData === null) {
      return;
    }

    setIsProcessing(true);

    if (extrinsicData) {
      try {
        await explorerServiceInstance.scheduleTransaction(signer, extrinsicData);
      } catch (error) {
        console.error(error);
      }
    }

    setIsProcessing(false);
  }

  return (
    signer && isConnected ?
      <>
        <div className="max-lg:hidden">
          <Link href={"/compose"} className="inline-flex items-center gap-2 text-sm/6 text-zinc-500 dark:text-zinc-400">
            <ChevronDoubleLeftIcon className="size-4 fill-zinc-400 dark:fill-zinc-500" />
            {"Back to Compose"}
          </Link>
        </div>
        <div className="mt-4 lg:mt-8">
          <div className="flex items-center gap-4">
            <Heading>New Delayed Transaction</Heading>
            <Badge color={"lime"}>{"New"}</Badge>
          </div>
        </div>
        <div className="mt-6 relative">
          <Fieldset>
            <section className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
              <div className="space-y-1">
                <Subheading>Future Block</Subheading>
                <Text>Specify the future block number at which you want the transaction to be executed.</Text>
              </div>
              <div>
                <Field>
                  <Label>Block</Label>
                  <Input name="block" value={block} onChange={e => setBlock(parseInt(e.target.value))} placeholder="Future Block Number" autoFocus />
                </Field>
              </div>
              <div className="space-y-1">
                <Subheading>Pallet / Extrinsic / Arguments</Subheading>
                <Text>Select the pallet, extrinsic, and provide all necessary arguments to compose your delayed transaction.</Text>
              </div>
              <div>
                <DynamicExtrinsicForm setExtrinsicData={setExtrinsicData} block={block} />
              </div>
            </section>

            <section className="grid gap-x-8 gap-y-2 sm:grid-cols-2 mt-5">
              <div className="space-y-1"></div>
              <Button disabled={extrinsicData === null || isProcessing}
                className="relative top-0 right-0 cursor-pointer"
                type="button" onClick={() => handleScheduleTransaction()}>
                {isProcessing ? "Processing..." : "Schedule Tx"}
              </Button>
            </section>
          </Fieldset>
        </div >
      </> : <div className="flex items-center justify-center pt-20">
        <Heading>Please connect your wallet <ConnectWallet buttonOnly={true} /></Heading>
      </div>
  )
}
