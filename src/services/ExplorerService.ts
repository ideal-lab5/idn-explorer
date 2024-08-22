import { singleton } from "tsyringe";
import { IExplorerService } from "./IExplorerService";
import { cryptoWaitReady } from '@polkadot/util-crypto';
import chainSpec from "../etf_spec/dev/etf_spec.json"
import {Etf} from "@ideallabs/etf.js";

@singleton()
export class ExplorerService implements IExplorerService {

    api: any;
    CUSTOM_TYPES: any;
    abi: any;
    node_env = "ws://127.0.0.1:9944";
    constructor() {
        this.getEtfApi().then(() => {
          console.log("ETF.js API is ready.");
        });
    }; 

    async getEtfApi(signer = undefined): Promise<any> {
        // ensure params are defined
        if (process.env.NEXT_PUBLIC_NODE_WS === undefined) {
          console.error("Provide a valid value for NEXT_PUBLIC_NODE_DETAILS");
          return Promise.resolve(null);
        }

        if (!this.api) {

          try {
            await cryptoWaitReady();
            let api = new Etf(this.node_env, false);
            console.log("Connecting to ETF chain");
            await api.init(JSON.stringify(chainSpec), this.CUSTOM_TYPES);
            this.api = api;
          } catch (_e) {
            // TODO: next will try to fetch the wasm blob but it doesn't need to
            // since the transitive dependency is built with the desired wasm already 
            // so we can ignore this error for now (no impact to functionality)
            // but shall be addressed in the future
          }
        }
        if (signer) {
          this.api.api.setSigner(signer);
        }
        console.log("api initialized")
        return Promise.resolve(this.api);
    };

}