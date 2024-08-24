import {container} from "tsyringe";
import { ExplorerService} from "../ExplorerService";

const etfApi = container.resolve(ExplorerService);

export class Account{

    address: any;
    accountInfo: any;
    
    

    constructor(address: any) {
        this.address = address;
    }; 

    async initialize(): Promise<any> {

        if (!this.accountInfo) {

            this.accountInfo = await etfApi.api.api.query.system.account(this.address);

        }

        return Promise.resolve(this.accountInfo);

    }

    getFreeBalance(asString: boolean) {

        let balance;

        if(asString) {
            balance = this.accountInfo.data.free.toHuman();
        } else {
            balance = parseInt(this.accountInfo.data.free.toHuman());
        }

        return balance
    }

}