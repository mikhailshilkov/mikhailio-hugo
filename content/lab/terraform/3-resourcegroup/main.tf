provider "azurerm" {
}

resource "azurerm_resource_group" "rg" {
  name     = "terraform-workshop"
  location = "westus"
}
