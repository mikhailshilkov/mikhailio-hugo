---
title: "Get Up and Running with Azure Synapse and Pulumi"
date: 2020-12-04
tags: ["Azure", "Pulumi"]
description: "Use infrastructure as code to automate deployment of an Azure Synapse workspace"
thumbnail: teaser.png
originalSource: Pulumi Blog
originalUrl: https://www.pulumi.com/blog/get-up-and-running-with-azure-synapse-and-pulumi/
ghissueid: 50
---

Azure Synapse is an integrated analytics service that combines enterprise data warehousing of Azure SQL Data Warehouse and Big Data analytics of Apache Spark. Azure Synapse is a managed service well integrated with other Azure services for data ingestion and business analytics.

You could use the Azure portal to get started with Azure Synapse, but it can be hard to define sophisticated infrastructure for your analytics pipeline using the portal alone, and many users need to apply version control to their cloud configurations.

The alternative is to use an infrastructure as code tool to automate building and deploying cloud resources. This article demonstrates how to provision an Azure Synapse workspace using Pulumi and general-purpose programming languages like Python and C#.

## Azure Synapse Components

Let's start by introducing the components required to provision a basic Azure Synapse workspace. To follow along with the [Synapse Getting Started Guide](https://docs.microsoft.com/en-us/azure/synapse-analytics/get-started), you need the following key Azure infrastructure components:

- **Resource Group** to contain all other resources.
- **Storage Account** to store input data and analytics artifacts.
- **Azure Synapse Workspace**&mdash;a collaboration boundary for cloud-based analytics in Azure.
- **SQL Pool**&mdash;a dedicated Synapse SQL pool to run T-SQL based analytics.
- **Spark Pool** to use Apache Spark analytics.
- **IP Filters** and **Role Assignments** for secure access control.

## Infrastructure as Code

Let's walk through the steps to build a workspace with all the components mentioned above. We'll use Pulumi to provision the necessary resources. Feel free to pick the language of your choice that will apply to all code snippets.

You can check out the [full source code](https://github.com/pulumi/examples/tree/master/aws-ts-lambda-thumbnailer) in the Pulumi Examples.

### Resource Group

Let's start by defining a resource group to contain all other resources. Be sure to adjust its name and region to your preferred values.

```python
resource_group = resources.ResourceGroup("resourceGroup",
    resource_group_name="synapse-rg",
    location="westus2")
```

### Data Lake Storage Account

Synapse workspace will store data in a data lake storage account. We use a Standard Read-Access Geo-Redundant Storage account (SKU `Standard_RAGRS`) for this purpose. Make sure to change the `accountName` to your own globally unique name.

```python
storage_account = storage.StorageAccount("storageAccount",
    resource_group_name=resource_group.name,
    location=resource_group.location,
    account_name="yoursynapsesa",
    access_tier="Hot",
    enable_https_traffic_only=True,
    is_hns_enabled=True,
    kind="StorageV2",
    sku=storage.SkuArgs(
        name="Standard_RAGRS",
    ))
```

We'll use the `users` blob container as the analytics file system.

```python
users = storage.BlobContainer("users",
    resource_group_name=resource_group.name,
    account_name=storage_account.name,
    container_name="users",
    public_access="None")
```

### Synapse Workspace

It's time to use all of the above to provision an Azure Synapse workspace! Adjust the name and the SQL credentials in the definition below.

```python
workspace = synapse.Workspace("workspace",
    resource_group_name=resource_group.name,
    location=resource_group.location,
    workspace_name="mysynapse",
    default_data_lake_storage=synapse.DataLakeStorageAccountDetailsArgs(
        account_url=data_lake_storage_account_url,
        filesystem="users",
    ),
    identity=synapse.ManagedIdentityArgs(
        type="SystemAssigned",
    ),
    sql_administrator_login="sqladminuser",
    sql_administrator_login_password=random.RandomPassword("workspacePwd", length=12).result)
```

> Note that we also defined a system-assigned managed identity for the workspace.

### Security Setup

You need to allow access to the workspace with a firewall rule. The following is a blank access rule but feel free to restrict it to your target IP range.

```python
allow_all = synapse.IpFirewallRule("allowAll",
    resource_group_name=resource_group.name,
    workspace_name=workspace.name,
    rule_name="allowAll",
    end_ip_address="255.255.255.255",
    start_ip_address="0.0.0.0")
```

The following snippet assigns the **Storage Blob Data Contributor** role to the workspace managed identity and your target user. If you use the Azure CLI, run `az ad signed-in-user show --query=objectId` to look up your user ID.

```python
subscription_id = resource_group.id.apply(lambda id: id.split('/')[2])
role_definition_id = subscription_id.apply(lambda id: f"/subscriptions/{id}/providers/Microsoft.Authorization/roleDefinitions/ba92f5b4-2d11-453d-a403-e96b0029c9fe")

authorization.RoleAssignment("storageAccess",
    role_assignment_name=random.RandomUuid("roleName").result,
    scope=storage_account.id,
    principal_id=workspace.identity.principal_id.apply(lambda v: v or "<preview>"),
    principal_type="ServicePrincipal",
    role_definition_id=role_definition_id)

authorization.RoleAssignment("userAccess",
    role_assignment_name=random.RandomUuid("userRoleName").result,
    scope=storage_account.id,
    principal_id=config.get("userObjectId"),
    principal_type="User",
    role_definition_id=role_definition_id)
```

### SQL and Spark Pools

Finally, let's add two worker pools to the Synapse workspace. A SQL pool for T-SQL analytic queries...

```python
sql_pool = synapse.SqlPool("sqlPool",
    resource_group_name=resource_group.name,
    location=resource_group.location,
    workspace_name=workspace.name,
    sql_pool_name="SQLPOOL1",
    collation="SQL_Latin1_General_CP1_CI_AS",
    create_mode="Default",
    sku=synapse.SkuArgs(
        name="DW100c",
    ))
```

... and a Spark pool for Big Data analytics.

```python
spark_pool = synapse.BigDataPool("sparkPool",
    resource_group_name=resource_group.name,
    location=resource_group.location,
    workspace_name=workspace.name,
    big_data_pool_name="Spark1",
    auto_pause=synapse.AutoPausePropertiesArgs(
        delay_in_minutes=15,
        enabled=True,
    ),
    auto_scale=synapse.AutoScalePropertiesArgs(
        enabled=True,
        max_node_count=3,
        min_node_count=3,
    ),
    node_count=3,
    node_size="Small",
    node_size_family="MemoryOptimized",
    spark_version="2.4")
```

## Ready to Dive into Analytics

Our resource definitions are ready. Run `pulumi up` to provision your Azure Synapse infrastructure.

```sh
$ pulumi up
...
Do you want to perform this update? yes
Updating (dev)

     Type                                                            Name                  Plan
 +   pulumi:pulumi:Stack                                             azure-py-synapse-dev  created
 +   ├─ azure-nextgen:resources/latest:ResourceGroup                 resourceGroup         created
 +   ├─ azure-nextgen:storage/latest:StorageAccount                  storageAccount        created
 +   ├─ azure-nextgen:storage/latest:BlobContainer                   users                 created
 +   ├─ azure-nextgen:synapse/v20190601preview:Workspace             workspace             created
 +   ├─ random:index:RandomUuid                                      roleName              created
 +   └─ azure-nextgen:authorization/v20200401preview:RoleAssignment  storageAccess         created
 +   ├─ random:index:RandomUuid                                      userRoleName          created
 +   ├─ azure-nextgen:authorization/v20200401preview:RoleAssignment  userAccess            created
 +   ├─ azure-nextgen:synapse/v20190601preview:IpFirewallRule        allowAll              created
 +   ├─ azure-nextgen:synapse/v20190601preview:SqlPool               sqlPool               created
 +   ├─ azure-nextgen:synapse/v20190601preview:BigDataPool           sparkPool             created

 Resources:
    + 12 created

Duration: 10m51s
 ```

You can now navigate to the [Azure Synapse Quickstart, Step 2](https://docs.microsoft.com/en-us/azure/synapse-analytics/get-started-analyze-sql-pool), and follow along with the data analysis tutorial.

## Conclusion

Azure Synapse is a managed analytics service that accelerates time to insight across data warehouses and big data workloads. A Synapse workspace is a critical component of your cloud infrastructure that you should provision with infrastructure as code and other management best practices.

Pulumi and Azure NextGen provider open up full access to all types of Azure resources using your favorite programming languages, including Python, C#, and TypeScript. Navigate to the complete Azure Synapse example in [Python](https://github.com/pulumi/examples/tree/master/azure-nextgen-py-synapse), [C#](https://github.com/pulumi/examples/tree/master/azure-nextgen-cs-synapse), or [TypeScript](https://github.com/pulumi/examples/tree/master/azure-nextgen-ts-synapse) and get started today.
