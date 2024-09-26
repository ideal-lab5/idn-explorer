import "reflect-metadata";
import { ExplorerService } from "@/services/ExplorerService";
import type { IExplorerService } from "@/services/IExplorerService";
import { container, delay, inject, injectable, registry } from "tsyringe";

@injectable()
@registry([
    {
        token: "ExplorerServiceImplementation",
        useToken: delay(() => ExplorerService)
    }
])
class ExplorerClient {
    constructor(@inject("ExplorerServiceImplementation") public explorerServiceInstance: IExplorerService
) { }
}

export const explorerClient: IExplorerService = container.resolve(ExplorerClient).explorerServiceInstance;