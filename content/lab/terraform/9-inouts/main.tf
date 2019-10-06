provider "azurerm" {
  version="~> 1.34"
}

provider "random" {
  version="~> 2.2"
}

variable "region" {
  type    = string
  default = "westus"
}

variable "rg_name" {
  type    = string
  default = "terraform-workshop"
}

variable "app_name" {
  type    = string
  default = "app123mikhail"
}

resource "azurerm_resource_group" "rg" {
  name     = var.rg_name
  location = var.region
}

resource "random_string" "sa_name" {
  length  = 10
  special = false
  upper   = false
}

resource "azurerm_storage_account" "sa" {
  name                     = "sa${random_string.sa_name.result}"
  location                 = azurerm_resource_group.rg.location
  resource_group_name      = azurerm_resource_group.rg.name
  account_tier             = "Standard"
  account_replication_type = "LRS"
}

resource "azurerm_app_service_plan" "asp" {
  name                = "${var.app_name}-asp"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
  kind                = "FunctionApp"
  sku {
    tier = "Dynamic"
    size = "Y1"
  }
}

resource "azurerm_function_app" "app" {
  name                      = var.app_name
  location                  = azurerm_resource_group.rg.location
  resource_group_name       = azurerm_resource_group.rg.name
  app_service_plan_id       = azurerm_app_service_plan.asp.id
  storage_connection_string = azurerm_storage_account.sa.primary_connection_string
  version                   = "~2"
  app_settings = {
    FUNCTIONS_WORKER_RUNTIME     = "node"
    WEBSITE_NODE_DEFAULT_VERSION = "10.14.1"
    WEBSITE_RUN_FROM_PACKAGE     = "https://mikhailworkshop.blob.core.windows.net/zips/app.zip"
  }
}

output "endpoint" {
  value = "https://${azurerm_function_app.app.default_hostname}/api/hello"
}
