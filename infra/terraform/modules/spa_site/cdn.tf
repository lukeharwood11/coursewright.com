# CloudFront + OAC + (optional) Route53. Modeled on SayNosh.com terraform/cdn.tf.
#
# HUMAN_NEEDED HN-005 — data.aws_acm_certificate looks up an ISSUED cert for
# local.acm_domain in us-east-1. Luke must request/validate that cert before
# terraform plan/apply. Do not invent ARNs.
#
# Route53 A/AAAA aliases are gated on var.manage_dns (default false) so validate
# and plan can run before DNS host is decided.

data "aws_acm_certificate" "spa_certificate" {
  domain      = local.acm_domain
  statuses    = ["ISSUED"]
  most_recent = true
}

data "aws_route53_zone" "parent" {
  count        = var.manage_dns ? 1 : 0
  name         = var.route53_zone_name
  private_zone = false
}

resource "aws_cloudfront_response_headers_policy" "immutable_assets" {
  name = "coursewright-${var.environment}-immutable-assets"

  custom_headers_config {
    items {
      header   = "Cache-Control"
      value    = "public, max-age=31536000, immutable"
      override = true
    }
  }
}

resource "aws_cloudfront_origin_access_control" "default" {
  name                              = "coursewright-${var.environment}-spa-oac"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_cloudfront_distribution" "spa_distribution" {
  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"
  aliases             = [var.domain_name]
  comment             = "CourseWright ${var.environment} SPA"

  origin {
    domain_name              = aws_s3_bucket.spa_bucket.bucket_regional_domain_name
    origin_access_control_id = aws_cloudfront_origin_access_control.default.id
    origin_id                = aws_s3_bucket.spa_bucket.id
  }

  ordered_cache_behavior {
    path_pattern               = "/assets/*"
    allowed_methods            = ["GET", "HEAD"]
    cached_methods             = ["GET", "HEAD"]
    target_origin_id           = aws_s3_bucket.spa_bucket.id
    viewer_protocol_policy     = "redirect-to-https"
    min_ttl                    = 31536000
    default_ttl                = 31536000
    max_ttl                    = 31536000
    compress                   = true
    response_headers_policy_id = aws_cloudfront_response_headers_policy.immutable_assets.id

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }
  }

  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = aws_s3_bucket.spa_bucket.id
    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 60
    max_ttl                = 300
    compress               = true

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    acm_certificate_arn      = data.aws_acm_certificate.spa_certificate.arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  custom_error_response {
    error_code         = 403
    response_code      = 200
    response_page_path = "/index.html"
  }

  custom_error_response {
    error_code         = 404
    response_code      = 200
    response_page_path = "/index.html"
  }
}

resource "aws_s3_bucket_policy" "spa_bucket_policy" {
  bucket = aws_s3_bucket.spa_bucket.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = "s3:GetObject"
        Resource = [
          aws_s3_bucket.spa_bucket.arn,
          "${aws_s3_bucket.spa_bucket.arn}/*",
        ]
        Principal = {
          Service = "cloudfront.amazonaws.com"
        }
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = aws_cloudfront_distribution.spa_distribution.arn
          }
        }
      },
    ]
  })

  depends_on = [aws_s3_bucket_public_access_block.spa_bucket]
}

resource "aws_route53_record" "spa_record_ipv4" {
  count   = var.manage_dns ? 1 : 0
  zone_id = data.aws_route53_zone.parent[0].zone_id
  name    = var.domain_name
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.spa_distribution.domain_name
    zone_id                = aws_cloudfront_distribution.spa_distribution.hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "spa_record_ipv6" {
  count   = var.manage_dns ? 1 : 0
  zone_id = data.aws_route53_zone.parent[0].zone_id
  name    = var.domain_name
  type    = "AAAA"

  alias {
    name                   = aws_cloudfront_distribution.spa_distribution.domain_name
    zone_id                = aws_cloudfront_distribution.spa_distribution.hosted_zone_id
    evaluate_target_health = false
  }
}
