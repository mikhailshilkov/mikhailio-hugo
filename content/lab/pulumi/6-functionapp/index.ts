import * as pulumi from "@pulumi/pulumi";
import * as azure from "@pulumi/azure";

const resourceGroup = new azure.core.ResourceGroup("pulumi-workshop", {
    name: "pulumi-workshop",
    location: azure.Locations.WestUS,
});

const storageAccount = new azure.storage.Account("storage", {
    resourceGroupName: resourceGroup.name,
    accountReplicationType: "LRS",
    accountTier: "Standard",
});

const plan = new azure.appservice.Plan("asp", {
    resourceGroupName: resourceGroup.name,
    kind: "FunctionApp",
    sku: {
        tier: "Dynamic",
        size: "Y1",
    },
});

const app = new azure.appservice.FunctionApp("fa", {
    resourceGroupName: resourceGroup.name,
    appServicePlanId: plan.id,
    storageConnectionString: storageAccount.primaryConnectionString,
    version: "~2",
    appSettings: {
        FUNCTIONS_WORKER_RUNTIME: "node",
        WEBSITE_NODE_DEFAULT_VERSION: "10.14.1",
        WEBSITE_RUN_FROM_PACKAGE: "https://mikhailworkshop.blob.core.windows.net/zips/app.zip",
    },
});

export const appName = app.name;