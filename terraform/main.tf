##
# Main Terraform Configuration
#
# This file orchestrates all AWS infrastructure for the Email-WhatsApp Bridge application.
#
# Architecture:
# - VPC with public and private subnets across multiple AZs
# - ECS Fargate for running containerized services
# - RDS PostgreSQL for database
# - Application Load Balancer for traffic distribution
# - S3 for email attachments
# - SQS for async processing
# - Secrets Manager for sensitive credentials
#
# Prerequisites:
# 1. AWS CLI configured with credentials
# 2. Terraform installed (version >= 1.0)
# 3. Docker images built and pushed to ECR
##

terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Backend configuration for storing Terraform state
  # Uncomment and configure for production use
  # backend "s3" {
  #   bucket = "your-terraform-state-bucket"
  #   key    = "email-whatsapp-bridge/terraform.tfstate"
  #   region = "us-east-1"
  #   encrypt = true
  #   dynamodb_table = "terraform-state-lock"
  # }
}

##
# AWS Provider Configuration
##
provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "email-whatsapp-bridge"
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

##
# Local Variables
##
locals {
  name_prefix = "${var.project_name}-${var.environment}"

  # Common tags for all resources
  common_tags = {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

##
# VPC and Networking
##
module "vpc" {
  source = "./modules/vpc"

  name_prefix         = local.name_prefix
  vpc_cidr            = var.vpc_cidr
  availability_zones  = var.availability_zones
  public_subnet_cidrs = var.public_subnet_cidrs
  private_subnet_cidrs = var.private_subnet_cidrs

  tags = local.common_tags
}

##
# Security Groups
##
module "security_groups" {
  source = "./modules/security"

  name_prefix = local.name_prefix
  vpc_id      = module.vpc.vpc_id

  tags = local.common_tags
}

##
# RDS PostgreSQL Database
##
module "database" {
  source = "./modules/rds"

  name_prefix           = local.name_prefix
  vpc_id                = module.vpc.vpc_id
  private_subnet_ids    = module.vpc.private_subnet_ids
  security_group_ids    = [module.security_groups.database_sg_id]

  database_name         = var.database_name
  database_username     = var.database_username
  database_password     = var.database_password
  instance_class        = var.rds_instance_class
  allocated_storage     = var.rds_allocated_storage
  multi_az              = var.environment == "production"

  tags = local.common_tags
}

##
# ECS Cluster
##
module "ecs" {
  source = "./modules/ecs"

  name_prefix = local.name_prefix

  tags = local.common_tags
}

##
# Application Load Balancer
##
module "alb" {
  source = "./modules/alb"

  name_prefix        = local.name_prefix
  vpc_id             = module.vpc.vpc_id
  public_subnet_ids  = module.vpc.public_subnet_ids
  security_group_ids = [module.security_groups.alb_sg_id]

  tags = local.common_tags
}

##
# S3 Buckets
##
module "s3" {
  source = "./modules/s3"

  name_prefix = local.name_prefix
  environment = var.environment

  tags = local.common_tags
}

##
# SQS Queues
##
module "sqs" {
  source = "./modules/sqs"

  name_prefix = local.name_prefix

  tags = local.common_tags
}

##
# Secrets Manager
##
module "secrets" {
  source = "./modules/secrets"

  name_prefix = local.name_prefix

  # Secrets will be manually added after creation
  # Don't store sensitive values in Terraform!

  tags = local.common_tags
}

##
# ECS Services
##
module "api_service" {
  source = "./modules/ecs-service"

  name_prefix         = local.name_prefix
  service_name        = "api"
  cluster_id          = module.ecs.cluster_id
  cluster_name        = module.ecs.cluster_name
  vpc_id              = module.vpc.vpc_id
  private_subnet_ids  = module.vpc.private_subnet_ids
  security_group_ids  = [module.security_groups.api_sg_id]

  # Container configuration
  container_image     = var.api_container_image
  container_port      = 3000
  desired_count       = var.api_desired_count
  cpu                 = var.api_cpu
  memory              = var.api_memory

  # Load balancer
  target_group_arn    = module.alb.api_target_group_arn

  # Environment variables
  environment_variables = {
    NODE_ENV     = var.environment
    DATABASE_URL = "postgresql://${var.database_username}:${var.database_password}@${module.database.endpoint}/${var.database_name}"
    AWS_REGION   = var.aws_region
    USE_LOCALSTACK = "false"
  }

  # Secrets from Secrets Manager
  secrets = {
    GMAIL_CLIENT_ID     = module.secrets.gmail_secret_arn
    GMAIL_CLIENT_SECRET = module.secrets.gmail_secret_arn
    TWILIO_ACCOUNT_SID  = module.secrets.twilio_secret_arn
    TWILIO_AUTH_TOKEN   = module.secrets.twilio_secret_arn
  }

  tags = local.common_tags
}

module "frontend_service" {
  source = "./modules/ecs-service"

  name_prefix         = local.name_prefix
  service_name        = "frontend"
  cluster_id          = module.ecs.cluster_id
  cluster_name        = module.ecs.cluster_name
  vpc_id              = module.vpc.vpc_id
  private_subnet_ids  = module.vpc.private_subnet_ids
  security_group_ids  = [module.security_groups.frontend_sg_id]

  # Container configuration
  container_image     = var.frontend_container_image
  container_port      = 4200
  desired_count       = var.frontend_desired_count
  cpu                 = var.frontend_cpu
  memory              = var.frontend_memory

  # Load balancer
  target_group_arn    = module.alb.frontend_target_group_arn

  # Environment variables
  environment_variables = {
    NODE_ENV            = var.environment
    NEXT_PUBLIC_API_URL = "https://${module.alb.dns_name}/api"
  }

  tags = local.common_tags
}
