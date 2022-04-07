provider "aws" {
  region = "us-east-1"
}

locals {
  tags = {
    VantaOwner            = "matt@speedscale.com"
    VantaNonProd          = "true"
    VantaDescription      = "Docs"
    VantaContainsUserData = false
  }

  domain          = "docs.speedscale.com"
  preview_domain  = "docs-preview.speedscale.com"
  s3_origin_id    = "s3Origin"
  certificate_arn = "arn:aws:acm:us-east-1:880246755038:certificate/5e22e4e0-36d8-499e-92b8-42f4917dce23"
}

resource "aws_s3_bucket" "bucket" {
  bucket = local.domain

  tags = local.tags
}

resource "aws_s3_bucket_acl" "bucket" {
 bucket = aws_s3_bucket.bucket.id
 acl = "public-read"
}

resource "aws_s3_bucket_policy" "prod_public" {
 bucket = aws_s3_bucket.bucket.id
 policy = <<POLICY
{
  "Version": "2012-10-17",
  "Statement": [
      {
          "Sid": "PublicReadGetObject",
          "Effect": "Allow",
          "Principal": "*",
          "Action": [
              "s3:GetObject"
          ],
          "Resource": [
              "arn:aws:s3:::${local.domain}/*"
          ]
      }
  ]
}
POLICY
}

resource "aws_s3_bucket_website_configuration" "bucket" {
 bucket = aws_s3_bucket.bucket.id

 index_document {
   suffix = "index.html"
 } 

 error_document {
   key = "404.html"
 } 
}

resource "aws_s3_bucket" "preview" {
  bucket = local.preview_domain

  tags = local.tags
}

resource "aws_s3_bucket_website_configuration" "preview" {
 bucket = aws_s3_bucket.bucket.id

 index_document {
   suffix = "index.html"
 } 

 error_document {
   key = "404.html"
 }
}

resource "aws_cloudfront_distribution" "s3_distribution" {
  origin {
    domain_name = "${aws_s3_bucket.bucket.id}.${aws_s3_bucket.bucket.website_domain}"
    origin_id   = local.s3_origin_id
    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "http-only"
      origin_ssl_protocols   = ["TLSv1", "TLSv1.1", "TLSv1.2"]
    }

  }

  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"


  aliases = ["${local.domain}"]

  default_cache_behavior {
    allowed_methods  = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = local.s3_origin_id

    forwarded_values {
      query_string = false

      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    acm_certificate_arn = local.certificate_arn
    ssl_support_method  = "sni-only"
  }

  tags = local.tags
}

output "cloudfront" {
  value = aws_cloudfront_distribution.s3_distribution.domain_name
}

output "dist_id" {
  value = aws_cloudfront_distribution.s3_distribution.id
}
