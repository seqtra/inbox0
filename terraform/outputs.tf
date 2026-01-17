##
# Terraform Outputs
#
# These outputs provide important information about deployed resources.
# Access them after deployment with: terraform output <output_name>
##

output "vpc_id" {
  description = "ID of the VPC"
  value       = module.vpc.vpc_id
}

output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = module.alb.dns_name
}

output "alb_url" {
  description = "URL to access the application"
  value       = "https://${module.alb.dns_name}"
}

output "database_endpoint" {
  description = "RDS database endpoint"
  value       = module.database.endpoint
  sensitive   = true
}

output "database_name" {
  description = "Name of the database"
  value       = module.database.database_name
}

output "ecs_cluster_name" {
  description = "Name of the ECS cluster"
  value       = module.ecs.cluster_name
}

output "api_service_name" {
  description = "Name of the API ECS service"
  value       = module.api_service.service_name
}

output "frontend_service_name" {
  description = "Name of the Frontend ECS service"
  value       = module.frontend_service.service_name
}

output "s3_attachments_bucket" {
  description = "Name of S3 bucket for email attachments"
  value       = module.s3.attachments_bucket_name
}

output "sqs_email_processing_queue_url" {
  description = "URL of the email processing SQS queue"
  value       = module.sqs.email_processing_queue_url
}

output "deployment_commands" {
  description = "Useful commands for managing the deployment"
  value = <<-EOT
    # Update API service with new image:
    aws ecs update-service --cluster ${module.ecs.cluster_name} --service ${module.api_service.service_name} --force-new-deployment

    # Update Frontend service with new image:
    aws ecs update-service --cluster ${module.ecs.cluster_name} --service ${module.frontend_service.service_name} --force-new-deployment

    # View API logs:
    aws logs tail /ecs/${local.name_prefix}-api --follow

    # View Frontend logs:
    aws logs tail /ecs/${local.name_prefix}-frontend --follow

    # Connect to database:
    psql postgresql://${var.database_username}:PASSWORD@${module.database.endpoint}/${var.database_name}
  EOT
}
