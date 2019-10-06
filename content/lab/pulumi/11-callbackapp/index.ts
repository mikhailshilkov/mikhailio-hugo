import * as pulumi from "@pulumi/pulumi";
import * as azure from "@pulumi/azure";

const config = new pulumi.Config();
const rgName = config.get("rgName");
const appName = config.get("appName");

const resourceGroup = new azure.core.ResourceGroup("pulumi-workshop", {
    name: rgName,
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
    name: appName,
    appServicePlanId: plan.id,
    storageConnectionString: storageAccount.primaryConnectionString,
    version: "~2",
    appSettings: {
        FUNCTIONS_WORKER_RUNTIME: "node",
        WEBSITE_NODE_DEFAULT_VERSION: "10.14.1",
        WEBSITE_RUN_FROM_PACKAGE: "https://mikhailworkshop.blob.core.windows.net/zips/app.zip",
    },
});

export const hostname = app.defaultHostname;
export const endpoint = pulumi.interpolate`https://${app.defaultHostname}/api/hello`;

const archiveApp = new azure.appservice.ArchiveFunctionApp("archive-app", {
    resourceGroup,
    archive: new pulumi.asset.FileArchive("./app"),
});

export const archiveEndpoint = pulumi.interpolate`${archiveApp.endpoint}hello`;

const callbackApp = new azure.appservice.HttpEventSubscription("callbackfn", {
    resourceGroup,
    callback: async (context, request) => {
        return {
            status: 200,
            body: "Greetings from Azure Functions in a callback!",
            headers: {
                "content-type": "text/html",
            },
        };
    },
});

export let callbackEndpoint = callbackApp.url;
