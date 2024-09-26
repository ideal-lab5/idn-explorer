/** 
 * This is the DelayedTransactionDetails domain class.
*/

export interface Parameter {
    name: string;
    type: string;
    value: any;
}

export class DelayedTransactionDetails {
    block: number;
    pallet: string;
    extrinsic: string;
    params: Parameter[];

    constructor(
        block: number,
        pallet: string,
        extrinsic: string,
        params: Parameter[]
    ) {
        this.block = block;
        this.pallet = pallet;
        this.extrinsic = extrinsic;
        this.params = params;
    }
}