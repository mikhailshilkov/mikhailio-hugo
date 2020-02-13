import * as docker from "@pulumi/docker";
import * as gcp from "@pulumi/gcp";
import * as pulumi from "@pulumi/pulumi";

// Location to deploy Cloud Run services
const location = gcp.config.region || "us-central1";

// Enable Cloud Run service for the current project
const enableCloudRun = new gcp.projects.Service("EnableCloudRun", {
    service: "run.googleapis.com",
});

// Build a Docker image from our sample Ruby app and put it to Google Container Registry.
// Note: Run `gcloud auth configure-docker` in your command line to configure auth to GCR.
const myImage = new docker.Image("azure-functions-image", {
    imageName: pulumi.interpolate`gcr.io/${gcp.config.project}/azure-functions:v1.0.0`,
    build: {
        context: "./azure",
    },
});

// Deploy to Cloud Run. Some extra parameters like concurrency and memory are set for illustration purpose.
const azureFunctions = new gcp.cloudrun.Service("cloudrun-functions", {
    location,
    template: {
        spec: {
            containers: [{
                image: myImage.imageName,
                resources: {
                    limits: {
                        memory: "1Gi",
                    },
                },
            }],
            containerConcurrency: 50,
        },
    },
});

// Open the service to public unrestricted access
const iam = new gcp.cloudrun.IamMember("public-access", {
    service: azureFunctions.name,
    location,
    role: "roles/run.invoker",
    member: "allUsers",
});

// Export the URL
export const endpoint = pulumi.interpolate`${azureFunctions.status.url}/api/HttpExample?name=`;
