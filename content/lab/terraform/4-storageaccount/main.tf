provider "azurerm" {
}

provider "random" {
}

resource "azurerm_resource_group" "rg" {
  name     = "terraform-workshop"
  location = "westus"
}

resource "random_string" "sa_name" {
  length = 10
  special = false
  upper = false
}

resource "azurerm_storage_account" "sa" {
  name                     = "saijas378"
  resource_group_name      = "terraform-workshop"
  location                 = "westus2"
  account_tier             = "Standard"
  account_replication_type = "LRS"
}
