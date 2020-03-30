import * as azure from "@pulumi/azure";
import * as pulumi from "@pulumi/pulumi";

/**
 * WebServer is a reusable web server component that creates and exports a NIC, public IP, and VM.
 */
export class WebServer extends pulumi.ComponentResource {
    public readonly networkInterface: azure.network.NetworkInterface;
    public readonly vm: azure.compute.VirtualMachine;

    /**
     * Allocate a new web server VM, NIC, and public IP address.
     * @param name The name of the web server resource.
     * @param args A bag of arguments to control the web server VM creation.
     */
    constructor(name: string, args: WebServerArgs) {
        super("ws-ts-azure-comp:webserver:WebServer", name);

        this.networkInterface = new azure.network.NetworkInterface(`${name}-nic`, {
            resourceGroupName: args.resourceGroupName,
            ipConfigurations: [{
                name: "webserveripcfg",
                subnetId: args.subnetId,
                privateIpAddressAllocation: "Dynamic"
            }],
        }, { parent: this });

        // Now create the VM, using the resource group and NIC allocated above.
        this.vm = new azure.compute.VirtualMachine(`${name}-vm`, {
            resourceGroupName: args.resourceGroupName,
            networkInterfaceIds: [this.networkInterface.id],
            vmSize: args.vmSize || "Standard_A0",
            deleteDataDisksOnTermination: true,
            deleteOsDiskOnTermination: true,
            osProfile: {
                computerName: "hostname",
                adminUsername: args.username,
                adminPassword: args.password,
                customData: args.bootScript,
            },
            osProfileLinuxConfig: {
                disablePasswordAuthentication: false,
            },
            storageOsDisk: {
                createOption: "FromImage",
                name: `${name}-osdisk1`,
            },
            storageImageReference: {
                publisher: "canonical",
                offer: "UbuntuServer",
                sku: "18.04-LTS",
                version: "latest",
            },
        }, { parent: this });
    }
}

export interface WebServerArgs {
    /**
     * A required username for the VM login.
     */
    username: pulumi.Input<string>;
    /**
     * A required encrypted password for the VM password.
     */
    password: pulumi.Input<string>;
    /**
     * An optional boot script that the VM will use.
     */
    bootScript?: pulumi.Input<string>;
    /**
     * An optional VM size; if unspecified, Standard_A0 (micro) will be used.
     */
    vmSize?: pulumi.Input<string>;
    /**
     * A required Resource Group in which to create the VM
     */
    resourceGroupName: pulumi.Input<string>;
    /**
     * A required Subnet in which to deploy the VM
     */
    subnetId: pulumi.Input<string>;
}