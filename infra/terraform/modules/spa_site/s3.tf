# Private origin bucket for the Vite SPA. Deploy upload/invalidation is a later
# concern — do not add a null_resource that syncs on every apply (nosh does;
# CourseWright skips that for now).

resource "aws_s3_bucket" "spa_bucket" {
  bucket = local.bucket_name
}

resource "aws_s3_bucket_server_side_encryption_configuration" "spa_bucket" {
  bucket = aws_s3_bucket.spa_bucket.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "spa_bucket" {
  bucket = aws_s3_bucket.spa_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}
