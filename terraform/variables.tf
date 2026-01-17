##
# Terraform Variables
#
# This file defines all input variables for the infrastructure.
# Set values in terraform.tfvars or pass via command line.
##

variable "aws_region" {
  description = "AWS region for all resources"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name (development, staging, production)"
  type        = string
  default     = "development"

  validation {
    condition     = contains(["development", "staging", "production"], var.environment)
    error_message = "Environment must be development, staging, or production."
  }
}

variable "project_name" {
  description = "Project name used for resource naming"
  type        = string
  default     = "email-whatsapp-bridge"
}

##
# VPC Configuration
##
variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b"]
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.0.10.0/24", "10.0.11.0/24"]
}

##
# Database Configuration
##
variable "database_name" {
  description = "Name of the PostgreSQL database"
  type        = string
  default     = "email_whatsapp_bridge"
}

variable "database_username" {
  description = "Master username for the database"
  type        = string
  default     = "dbadmin"
  sensitive   = true
}

variable "database_password" {
  description = "Master password for the database"
  type        = string
  sensitive   = true
  # Must be set via environment variable or tfvars file
}

variable "rds_instance_class" {
  description = "RDS instance type"
  type        = string
  default     = "db.t3.micro" # Free tier eligible
}

variable "rds_allocated_storage" {
  description = "Allocated storage for RDS in GB"
  type        = number
  default     = 20
}

##
# API Service Configuration
##
variable "api_container_image" {
  description = "Docker image for API service (ECR URL)"
  type        = string
  # Example: 123456789.dkr.ecr.us-east-1.amazonaws.com/email-whatsapp-api:latest
}

variable "api_desired_count" {
  description = "Desired number of API service tasks"
  type        = number
  default     = 2
}

variable "api_cpu" {
  description = "CPU units for API service (1024 = 1 vCPU)"
  type        = number
  default     = 512
}

variable "api_memory" {
  description = "Memory for API service in MB"
  type        = number
  default     = 1024
}

##
# Frontend Service Configuration
##
variable "frontend_container_image" {
  description = "Docker image for frontend service (ECR URL)"
  type        = string
  # Example: 123456789.dkr.ecr.us-east-1.amazonaws.com/email-whatsapp-frontend:latest
}

variable "frontend_desired_count" {
  description = "Desired number of frontend service tasks"
  type        = number
  default     = 2
}

variable "frontend_cpu" {
  description = "CPU units for frontend service (1024 = 1 vCPU)"
  type        = number
  default     = 256
}

variable "frontend_memory" {
  description = "Memory for frontend service in MB"
  type        = number
  default     = 512
}
