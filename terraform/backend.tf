# Generated by Terragrunt. Sig: nIlQXj57tbuaRZEa
terraform {
  backend "s3" {
    bucket         = "speedscale-terraform-prod"
    dynamodb_table = "terraform"
    encrypt        = true
    key            = "docs/terraform.tfstate"
    region         = "us-east-1"
  }
}
