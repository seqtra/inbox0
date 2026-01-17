# Terraform Infrastructure

This directory contains Terraform configurations for deploying the Email-WhatsApp Bridge to AWS.

## Architecture Overview

The infrastructure includes:

- **VPC**: Multi-AZ VPC with public and private subnets
- **ECS Fargate**: Containerized services for API and frontend
- **RDS PostgreSQL**: Managed database
- **Application Load Balancer**: Traffic distribution and SSL termination
- **S3**: Storage for email attachments
- **SQS**: Message queues for async processing
- **Secrets Manager**: Secure storage for API credentials

## Prerequisites

1. **AWS Account**: Active AWS account with appropriate permissions
2. **AWS CLI**: Installed and configured (`aws configure`)
3. **Terraform**: Version 1.0 or higher ([installation guide](https://learn.hashicorp.com/tutorials/terraform/install-cli))
4. **Docker Images**: Built and pushed to Amazon ECR

## Quick Start

### 1. Configure Variables

Copy the example file and edit values:

```bash
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars` and set:
- `api_container_image`: Your ECR image URL for the API
- `frontend_container_image`: Your ECR image URL for the frontend
- Other configuration values as needed

### 2. Set Sensitive Variables

For security, set sensitive values via environment variables:

```bash
export TF_VAR_database_password="your-secure-password"
```

### 3. Initialize Terraform

```bash
terraform init
```

This downloads required providers and modules.

### 4. Review the Plan

```bash
terraform plan
```

Review the resources that will be created.

### 5. Apply Configuration

```bash
terraform apply
```

Type `yes` when prompted to create resources.

### 6. Get Outputs

After deployment:

```bash
terraform output
```

This shows important values like the load balancer URL and database endpoint.

## Module Structure

```
terraform/
├── main.tf              # Main orchestration file
├── variables.tf         # Input variable definitions
├── outputs.tf           # Output values
├── terraform.tfvars     # Variable values (gitignored)
└── modules/
    ├── vpc/            # VPC and networking
    ├── security/       # Security groups
    ├── rds/            # PostgreSQL database
    ├── ecs/            # ECS cluster
    ├── ecs-service/    # ECS service template
    ├── alb/            # Application Load Balancer
    ├── s3/             # S3 buckets
    ├── sqs/            # SQS queues
    └── secrets/        # Secrets Manager
```

## Cost Estimates

**Development Environment** (~$30-50/month):
- RDS db.t3.micro: ~$15/month
- ECS Fargate (4 tasks): ~$20/month
- NAT Gateways (2): ~$70/month (largest cost!)
- ALB: ~$20/month
- Data transfer: Variable

**Cost Optimization Tips**:
- Use single NAT Gateway for dev (edit VPC module)
- Use spot instances for non-critical services
- Schedule resources to shut down during off-hours
- Use AWS Free Tier eligible services where possible

## Production Considerations

Before deploying to production:

1. **Enable State Locking**: Uncomment the S3 backend in `main.tf`
2. **Multi-AZ RDS**: Set `multi_az = true` in production
3. **SSL/TLS**: Configure ACM certificate for the load balancer
4. **Monitoring**: Add CloudWatch alarms and dashboards
5. **Backup**: Configure RDS automated backups
6. **Secrets**: Never commit sensitive values; use AWS Secrets Manager
7. **IAM**: Follow principle of least privilege for service roles

## Common Commands

```bash
# Format Terraform files
terraform fmt -recursive

# Validate configuration
terraform validate

# Show current state
terraform show

# Destroy all resources (DANGEROUS!)
terraform destroy

# Update a specific module
terraform apply -target=module.api_service

# View logs
terraform output deployment_commands
```

## Troubleshooting

### Issue: "Error creating VPC"
- Check AWS credentials: `aws sts get-caller-identity`
- Verify region in `terraform.tfvars`

### Issue: "Error launching ECS service"
- Ensure Docker images are pushed to ECR
- Check ECR repository permissions
- Verify task definition CPU/memory limits

### Issue: "Database connection failed"
- Check security group rules
- Verify database credentials in Secrets Manager
- Ensure RDS is in same VPC as ECS tasks

## Next Steps

After deployment:

1. Configure DNS to point to the load balancer
2. Set up SSL certificate in ACM and attach to ALB
3. Add Gmail API credentials to Secrets Manager
4. Add Twilio credentials to Secrets Manager
5. Run database migrations
6. Set up monitoring and alerts

## Support

For issues or questions about the infrastructure:
- Check AWS CloudWatch logs
- Review Terraform state: `terraform state list`
- Enable debug logging: `TF_LOG=DEBUG terraform apply`
