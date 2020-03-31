import * as azure from "@pulumi/azure";
import * as azuread from "@pulumi/azuread"
import * as k8s from "@pulumi/kubernetes"
import * as random from "@pulumi/random"
import * as docker from "@pulumi/docker";
import * as pulumi from "@pulumi/pulumi"

const password = new random.RandomPassword("password", {
    length: 20,
    special: true,
}).result;

const resourceGroup = new azure.core.ResourceGroup("resourceGroup", { name: "pulumi-playground" });

const adApp = new azuread.Application("aks", undefined);
const adSp = new azuread.ServicePrincipal("aksSP", { applicationId: adApp.applicationId });
const adSpPassword = new azuread.ServicePrincipalPassword("aksSpPassword", {
    servicePrincipalId: adSp.id,
    value: password,
    endDate: "2099-01-01T00:00:00Z",
});

const registry = new azure.containerservice.Registry("myregistry", {
    resourceGroupName: resourceGroup.name,
    sku: "Basic",
    adminEnabled: true,
});

const customImage = "node-app";
const myImage = new docker.Image(customImage, {
    imageName: pulumi.interpolate`${registry.loginServer}/${customImage}:v1.0.0`,
    build: {
        context: `./${customImage}`,
    },
    registry: {
        server: registry.loginServer,
        username: registry.adminUsername,
        password: registry.adminPassword,
    },
});

const cluster = new azure.containerservice.KubernetesCluster("pulumi-cluster", {
    name: "pulumi-cluster",
    resourceGroupName: "pulumi-playground",
    defaultNodePool: {
        name: "aksagentpool",
        nodeCount: 3,
        vmSize: "Standard_B2s",
        osDiskSizeGb: 30,
    },
    windowsProfile: { // strange, but if you don't it create a new cluster every time.
        adminUsername: "azureuser",
    },
    dnsPrefix: "pulumi-cluster",
    servicePrincipal: {
        clientId: adApp.applicationId,
        clientSecret: adSpPassword.value,
    },
    kubernetesVersion: "1.16.7",
    roleBasedAccessControl: { enabled: true },
    networkProfile: { networkPlugin: "azure" }
});

const provider = new k8s.Provider("aksK8s", {
    kubeconfig: cluster.kubeConfigRaw
})

const jenkins = new k8s.helm.v2.Chart(
    "jenkins",
    {
        repo: "stable",
        chart: "jenkins",
        version: "1.10.1",
        namespace: "default",
    },
    { providers: { kubernetes: provider } },
);

export let clusterName = cluster.name;
export let kubeConfig = cluster.kubeConfigRaw;


    // $ pulumi stack output kubeConfig > kubeconfig.yaml
    // $ KUBECONFIG=./kubeconfig.yaml kubectl get service