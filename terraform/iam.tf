resource "aws_iam_user" "ci" {
  name = "github-docs-ci"
  tags = local.tags
}

resource "aws_iam_user_policy" "lb_ro" {
  user = aws_iam_user.ci.name

  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": [
        "s3:*"
      ],
      "Effect": "Allow",
      "Resource": [
        "${aws_s3_bucket.bucket.arn}/*",
        "${aws_s3_bucket.preview.arn}/*"
       ]
    },
    {
      "Action": [
        "cloudfront:CreateInvalidation"
      ],
      "Effect": "Allow",
      "Resource": "${aws_cloudfront_distribution.s3_distribution.arn}"
    }
  ]
}
EOF
}

resource "aws_iam_access_key" "ci" {
  user = aws_iam_user.ci.name
}

output "ci_access_key" {
  value = aws_iam_access_key.ci.id
}

output "ci_secret_key" {
  sensitive = true
  value     = aws_iam_access_key.ci.secret
}
