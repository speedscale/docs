terraform_version_constraint = "~> 1.3.0"

remote_state {
  backend = "s3"

  generate = {
    path      = "backend.tf"
    if_exists = "overwrite"
  }

  config = {
    bucket         = "speedscale-terraform-prod"
    key            = "docs/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform"
  }
}

terraform {
  extra_arguments "out" {
    commands  = ["plan"]
    arguments = ["-out=${get_terragrunt_dir()}/plan.tfplan"]
  }

  extra_arguments "in" {
    commands  = ["apply"]
    arguments = ["-input=false"]
  }
}
