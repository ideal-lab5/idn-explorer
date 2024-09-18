/** 
 * This is the DelayedTransaction domain class.
*/
export class DelayedTransaction {
    scheduledBlock: string;
    id: string;
    owner: string;
    operation: string;
    deadlineBlock: string;

    constructor(
        scheduledBlock: string,
        id: string,
        owner: string,
        operation: string,
        deadlineBlock: string
    ) {
        this.scheduledBlock = scheduledBlock;
        this.id = id;
        this.owner = owner;
        this.operation = operation;
        this.deadlineBlock = deadlineBlock
    }
}