import { expect } from "chai";
import * as pulumi from "@pulumi/pulumi";
import { promise } from "./index";
import { storageAccount } from "../";

if (pulumi.runtime.isDryRun()) {
    pulumi.log.warn("skipped checks: not known during preview")
} else {
    describe("Azure storage account", () => {
        it("should have an exact name", async () => {
            const name = await promise(storageAccount.name);
            expect(name).to.equal("pulumidemo2");
        });
        it("should be in the west europe region", async () => {
            const region = await promise(storageAccount.location);
            expect(region).to.equal("westeurope");
        })
    });
}