/** 
 * This is the DelayedTransaction domain class.
*/
export class ExecutedTransaction {
    block: number;
    id: string;
    owner: string;
    operation: string;
    status: string;
    eventData: any;
    metadata: any;
    delayedTx: boolean = false;

    constructor(
        block: number,
        id: string,
        owner: string,
        operation: string,
        status: string,
        eventData: any,
        metadata: any,
        delayedTx: boolean) {
        this.block = block;
        this.id = id;
        this.owner = owner;
        this.operation = operation;
        this.status = status;
        this.eventData = eventData;
        this.metadata = metadata;
        this.delayedTx = delayedTx;
    }

}