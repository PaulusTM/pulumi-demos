import * as azure from "@pulumi/azure";
import * as random from "@pulumi/random";
import { WebServer } from "./webserver";

const password = new random.RandomPassword("password", {
    length: 20,
    special: true,
}, {
    additionalSecretOutputs: ["result"],
}).result;

const resourceGroup = new azure.core.ResourceGroup("resourceGroup");

const network = new azure.network.VirtualNetwork("server-network", {
    resourceGroupName: resourceGroup.name,
    addressSpaces: ["10.0.0.0/16"],
    subnets: [{
        name: "default",
        addressPrefix: "10.0.1.0/24",
    }]
})

for (let i = 0; i < 3; i++) {
    const server = new WebServer(`ws-${i}`, {
        username: "PulumiDemoAdmin",
        password,
        resourceGroupName: resourceGroup.name,
        subnetId: network.subnets[0].id,
    });
}