output "bucket_name" {
  value       = aws_s3_bucket.spa_bucket.bucket
  description = "S3 bucket for Vite dist/ uploads"
}

output "cloudfront_domain" {
  value       = aws_cloudfront_distribution.spa_distribution.domain_name
  description = "CloudFront domain name (dxxxxx.cloudfront.net)"
}

output "cloudfront_distribution_id" {
  value       = aws_cloudfront_distribution.spa_distribution.id
  description = "CloudFront distribution ID (invalidations / DNS)"
}

output "acm_certificate_arn" {
  value       = data.aws_acm_certificate.spa_certificate.arn
  description = "ARN of the ISSUED ACM cert looked up for this SPA (us-east-1)"
}
