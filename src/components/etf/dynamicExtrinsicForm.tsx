'use client'
import { Field, Label } from '@/components/fieldset'
import { Subheading } from '@/components/heading'
import { Select } from '@/components/select'
import { Input } from '@/components/input'
import { ApiPromise, WsProvider } from '@polkadot/api'
import React, { useEffect, useState } from 'react'


interface PalletOption {
    text: string;
    value: string;
}
export const DynamicExtrinsicForm: React.FC = () => {
    const [api, setApi] = useState<ApiPromise | null>(null)
    const [pallets, setPallets] = useState<PalletOption[]>([])
    const [extrinsics, setExtrinsics] = useState<string[]>([])
    const [parameters, setParameters] = useState<string[]>([])
    const [selectedPallet, setSelectedPallet] = useState<string>("")
    const [selectedExtrinsic, setSelectedExtrinsic] = useState<string>("")

    useEffect(() => {
        async function connect() {
            const wsProvider = new WsProvider(process.env.NEXT_PUBLIC_NODE_WS || 'wss://rpc.polkadot.io')
            const api = await ApiPromise.create({ provider: wsProvider })
            setApi(api)

            const availablePallets = Object
                .keys(api.tx)
                .filter((s) =>
                    !s.startsWith('$')
                )
                .sort()
                .filter((name): number => Object.keys(api.tx[name]).length)
                .map((name): { text: string; value: string } => ({
                    text: name,
                    value: name
                }));
            setPallets(availablePallets)
        }

        connect()
    }, [])

    function handlePalletChange(selectedPallet: string) {
        setSelectedPallet(selectedPallet);
        if (api && selectedPallet) {
            // Safely access the pallet
            const pallet = api.tx[selectedPallet as keyof typeof api.tx];
            if (pallet) {
                const palletExtrinsics = Object.keys(pallet);
                setExtrinsics(palletExtrinsics);
                setParameters([]); // Reset parameters when a new extrinsic is selected
            } else {
                console.error(`Pallet ${selectedPallet} does not exist or has no extrinsics.`);
                setExtrinsics([]);
            }
        }
    }


    function handleExtrinsicChange(selectedExtrinsic: string) {
        setSelectedExtrinsic(selectedExtrinsic);
        if (api && selectedPallet && selectedExtrinsic) {
            const extrinsicMeta = api.tx[selectedPallet][selectedExtrinsic].meta
            const paramTypes = extrinsicMeta.args.map((arg) => arg.type.toString())
            setParameters(paramTypes)
        }
    }

    return (
        <div className="grid grid-cols-2 gap-6">
            <Field>
                <Label>Pallet</Label>
                <Select name="pallet" value={selectedPallet} onChange={(e) => handlePalletChange(e.target.value)}>
                    <option value="" disabled>Select Pallet</option>
                    {pallets.map((pallet, index) => (
                        <option key={index} value={pallet.value}>
                            {pallet.text}
                        </option>
                    ))}
                </Select>
            </Field>
            {extrinsics.length > 0 && (
                <Field>
                    <Label>Extrinsic</Label>
                    <Select name="extrinsic" value={selectedExtrinsic} onChange={(e) => handleExtrinsicChange(e.target.value)}>
                        <option value="" disabled>Select Extrinsic</option>
                        {extrinsics.map((extrinsic, index) => (
                            <option key={index} value={extrinsic}>
                                {extrinsic}
                            </option>
                        ))}
                    </Select>
                </Field>)}

            {parameters.length > 0 && (
                <>
                    {parameters.map((param, index) => (
                        <Field key={index}>
                            <Label>{param}</Label>
                            <Input type="text" name={`input_${param}`} placeholder={"Enter value"} autoFocus />
                        </Field>
                    ))}
                </>
            )
            }
        </div>
    )
}
