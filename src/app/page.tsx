import { Badge } from '@/components/badge'
import { Divider } from '@/components/divider'
import { Heading, Subheading } from '@/components/heading'
import { Input, InputGroup } from '@/components/input'
import { Navbar, NavbarItem, NavbarSection } from '@/components/navbar'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/table'
import { getExecutedTransactions } from '@/data'
import { MagnifyingGlassIcon } from '@heroicons/react/20/solid'

export function Stat({ title, value, change, helpText }: { title: string; value: string; change: string; helpText?: string }) {
  return (
    <div>
      <Divider />
      <div className="mt-6 text-lg/6 font-medium sm:text-sm/6">{title}</div>
      <div className="mt-3 text-3xl/8 font-semibold sm:text-2xl/8">{value}</div>
      <div className="mt-3 text-sm/6 sm:text-xs/6">
        <Badge color={'purple'}>{change}</Badge>{' '}
        <span className="text-zinc-500">{helpText}</span>
      </div>
    </div>
  )
}

export default async function Home() {
  let executedTransactions = await getExecutedTransactions()

  return (
    <>
      <Heading>The Ideal Network Explorer</Heading>
      <div className="mt-4 grid gap-8 sm:grid-cols-2 xl:grid-cols-4">
        <Stat title="Last Block" value="#21,380,509" change="1.2s" helpText="target 6s" />
        <Stat title="Epoch" value="79%" change="4h 48m 36s" />
        <Stat title="Executed" value="100" change="+4.5%" />
        <Stat title="Scheduled" value="148" change="+21.2%" />
      </div>
      <Subheading className="mt-10"><Badge color="lime">Transactions</Badge></Subheading>
      <div>
        <Navbar>
          <NavbarSection>
            <NavbarItem href="#" current>Executed</NavbarItem>
            <NavbarItem href="#">Scheduled</NavbarItem>
          </NavbarSection>
        </Navbar>
      </div>
      <div className="mt-4 grid xl:grid-cols-2 sm:grid-cols-2">
        <InputGroup>
          <MagnifyingGlassIcon />
          <Input name="search" placeholder="Search transactions&hellip;" aria-label="Search" />
        </InputGroup>
      </div>
      <Table className="mt-4 [--gutter:theme(spacing.6)] lg:[--gutter:theme(spacing.10)]">
        <TableHead>
          <TableRow>
            <TableHeader>Block number</TableHeader>
            <TableHeader>Id</TableHeader>
            <TableHeader>Owner</TableHeader>
            <TableHeader>Operation</TableHeader>
            <TableHeader className="text-right">Result</TableHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {executedTransactions.map((transaction) => (
            <TableRow key={transaction.cid} href={transaction.url} title={`Transaction #${transaction.cid}`}>
              <TableCell>{transaction.block}</TableCell>
              <TableCell className="text-zinc-500">{transaction.cid}</TableCell>
              <TableCell>{transaction.owner}</TableCell>
              <TableCell>{transaction.operation}</TableCell>
              <TableCell className="text-right"><Badge color={transaction.status === "Confirmed" ? "lime" : "red"}>{transaction.status}</Badge></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  )
}
