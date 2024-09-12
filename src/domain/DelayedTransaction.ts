/** 
 * This is the DelayedTransaction domain class.
*/
export class DelayedTransaction {
    scheduledBlock: number;
    id: string;
    owner: string;
    operation: string;
    deadlineBlock: number;

    constructor(
        scheduledBlock: number,
        id: string,
        owner: string,
        operation: string,
        deadlineBlock: number
    ) {
        this.scheduledBlock = scheduledBlock;
        this.id = id;
        this.owner = owner;
        this.operation = operation;
        this.deadlineBlock = deadlineBlock
    }
}