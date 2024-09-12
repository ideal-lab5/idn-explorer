/** 
 * This is the Randomness domain class. It is used to represent a generated random value.
*/
export class Randomness {
    block: number;
    randomness: string;
    signature: string;
    status: string = "Generated";

    constructor(
        block: number,
        randomness: string,
        signature: string
    ) {
        this.block = block;
        this.randomness = randomness;
        this.signature = signature;
    }
}