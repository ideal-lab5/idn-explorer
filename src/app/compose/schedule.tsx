'use client'

import { Button } from '@/components/button'
import { DescriptionDetails } from '@/components/description-list'
import { Dialog, DialogActions, DialogBody, DialogDescription, DialogTitle } from '@/components/dialog'
import { Field, FieldGroup, Label } from '@/components/fieldset'
import { Input } from '@/components/input'
import { Select } from '@/components/select'
import { useState } from 'react'

export function ScheduleTransaction({ ...props }: { } & React.ComponentPropsWithoutRef<typeof Button>) {
  let [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Button type="button" onClick={() => setIsOpen(true)} {...props} />
      <Dialog open={isOpen} onClose={setIsOpen}>
        <DialogTitle>Schedule Transaction</DialogTitle>
        <DialogDescription>
          The transaction will be executed at the specified block in the future.
        </DialogDescription>
        <DialogBody>
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
            <DescriptionDetails>{"ToDo: display specific transaction inputs based on the transaction type"}</DescriptionDetails>
          </FieldGroup>

        </DialogBody>
        <DialogActions>
          <Button plain onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={() => setIsOpen(false)}>Schedule</Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
