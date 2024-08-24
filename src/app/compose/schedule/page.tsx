'use client'

import { Button } from '@/components/button'
import { DescriptionDetails } from '@/components/description-list'
import { Dialog, DialogActions, DialogBody, DialogDescription, DialogTitle } from '@/components/dialog'
import { Field, FieldGroup, Label, Fieldset, Legend } from '@/components/fieldset'
import { Text } from '@/components/text'
import { Badge } from '@/components/badge'
import { Link } from '@/components/link'
import { Input } from '@/components/input'
import { Select } from '@/components/select'
import { Heading, Subheading } from '@/components/heading'
import { useState } from 'react'
import { ChevronDoubleLeftIcon } from '@heroicons/react/16/solid'

export default function ScheduleTransaction({ ...props }: {} & React.ComponentPropsWithoutRef<typeof Button>) {

  return (
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
          <Legend>Transaction details</Legend>
          <Text>Below you can provide all the deatils about your transaction such future block number to schedule it, transaction type, and transaction inputs. The transaction will be executed at the specified block in the future.</Text>
          <FieldGroup>
            <Field>
              <Label>Block</Label>
              <Input name="block" placeholder="Future Block Number" autoFocus />
            </Field>
            <Field>
              <Label>Transaction</Label>
              <Select name="reason" defaultValue="">
                <option value="" disabled>
                  Select a transaction type&hellip;
                </option>
                <option value="balanceTransfer">Balance Transfer</option>
                <option value="encrypt">Encrypt</option>
                <option value="extrinsicCall">Extrinsic Call</option>
                <option value="contractCall">Contract Call</option>
              </Select>
            </Field>
            <Field>
              <DescriptionDetails>{"ToDo: display specific transaction inputs based on the transaction type"}</DescriptionDetails>
            </Field>
          </FieldGroup>
          <Button className="relative top-0 right-0 cursor-pointer" type="button">Schedule</Button>
        </Fieldset>
      </div >
    </>
  )
}
