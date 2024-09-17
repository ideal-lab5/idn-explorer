'use client'
import { Field, Label } from '@/components/fieldset'
import { Select } from '@/components/select'
import { Input } from '@/components/input'
import { ApiPromise, WsProvider } from '@polkadot/api'
import React, { useEffect, useState } from 'react'
import { DelayedTransactionDetails } from '@/domain/DelayedTransactionDetails'


interface PalletOption {
    text: string;
    value: string;
}

interface MethodArgument {
    argType: string;
    argTypeName: string;
    name: string;
    value: any;
}

export const DynamicExtrinsicForm: React.FC<{ block: number, setExtrinsicData: React.Dispatch<React.SetStateAction<DelayedTransactionDetails | null>> }> = ({ block, setExtrinsicData }) => {
    const [api, setApi] = useState<ApiPromise | null>(null)
    const [pallets, setPallets] = useState<PalletOption[]>([])
    const [extrinsics, setExtrinsics] = useState<string[]>([])
    const [parameters, setParameters] = useState<MethodArgument[]>([])
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

        connect();
    }, [])

    function handlePalletChange(selectedPallet: string) {
        setSelectedPallet(selectedPallet);
        setSelectedExtrinsic("");
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
            const paramTypes = extrinsicMeta.args.map((arg): MethodArgument => ({
                argType: arg.type.toString(),
                argTypeName: arg.typeName.unwrapOrDefault().toString(),
                name: arg.name.toString(),
                value: null
            }));
            setParameters(paramTypes);
        }
    }

    function handleParameterChange(paramIndex: number, value: any) {
        const updatedParams = [...parameters];
        updatedParams[paramIndex].value = value;
        setParameters(updatedParams);
    }

    useEffect(() => {
        async function isReady() {
            if (selectedPallet && selectedExtrinsic && parameters.reduce((acc, param) => acc && param.value, true)) {
                setExtrinsicData(new DelayedTransactionDetails(
                    block,
                    selectedPallet,
                    selectedExtrinsic,
                    parameters.map((param) => ({
                        name: param.name,
                        type: param.argType,
                        value: param.value
                    }))
                ))
            } else {
                setExtrinsicData(null)
            }
        }

        isReady();
    }, [selectedPallet, selectedExtrinsic, parameters])

    return (
        <>
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
                            <Field key={`${selectedExtrinsic}_${param.name}_${index}`}>
                                <Label>{`${param.name}: ${param.argType}`}</Label>
                                <Input type="text" name={`input_${selectedExtrinsic}_${param.name}_${index}`} placeholder={`${param.argTypeName}`} onChange={(e) => handleParameterChange(index, e.target.value)} autoFocus />
                            </Field>
                        ))}
                    </>
                )
                }
            </div>
        </>
    )
}
