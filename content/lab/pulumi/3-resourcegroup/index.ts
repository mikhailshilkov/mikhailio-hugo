import * as pulumi from "@pulumi/pulumi";
import * as azure from "@pulumi/azure";

const rg = new azure.core.ResourceGroup("pulumi-workshop", {
    name: "pulumi-workshop",
    location: azure.Locations.WestUS,
});
