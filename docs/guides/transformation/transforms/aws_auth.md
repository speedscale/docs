# aws_auth

### Purpose

**aws_auth** re-signs an existing AWS Authorization v4 HTTP Header. The original algorithm is honored. This transform works with request tokens in the generator. This is not a transform for re-signing AWS Auth keys in the responder because it is not necessary.

This transform generates a new Authorization signature using the complete request. Make sure that this is the last transform chain to be run in sequence if you want the signature to include other changes you may have made with other transforms.

The incoming token must be a current valid AWS signature because the SignedHeaders and other information is necessary for the re-sign process. In other words, if you want to change how the signature is generated then you can modify fields in the incoming Authorization header. For instance, if you remove a header from the SignedHeaders portion of the current header than this transform will not use it during it's new calculation.

### Usage

```json
"type": "aws_auth"
```

| Key                | Description                                                                                                                                                                                           |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **secretPath**     | The local path of a secret mounted to generator. This secret should be plain text and contain the same info that you would find in the AWS_SECRET_ACCESS_KEY environment variable. If working in Kubernetes, you can specify a secret using this format: `${{secret:secret_name/key_inside_the_secret}}` and the operator will automatically mount it to the load generator.
| **idPath**     | The local path of a secret mounted to generator. This secret should be plain text and contain the same info that you would find in the AWS_ACCESS_KEY_ID environment variable. If working in Kubernetes, you can specify a secret using this format: `${{secret:secret_name/key_inside_the_secret}}` and the operator will automatically mount it to the load generator.

### Example

### Before and After Example

#### Configuration

```json
{
    "type": "aws_auth",
    "config": {
        "secretPath": "${{secret:awscreds/secretkey}}",
        "idPath": "${{secret:awscreds/id}}"
    }
}
```

#### Example Chains

```
http_req_header(name="Authorization") -> aws_auth(secretPath="${{secret:awscreds/staging}}", idPath="${{secret:awscreds/id}}")
```

This will extract the existing AWS Authorization header and re-sign it with new credentials.

#### Before (Original Authorization Header)

```
Authorization: AWS4-HMAC-SHA256 Credential=AKIAIOSFODNN7EXAMPLE/20240115/us-east-1/s3/aws4_request, SignedHeaders=host;range;x-amz-date, Signature=fe5f80f77d5fa3beca038a248ff027d0445342fe2855ddc963176630326f1024
```

#### After (AWS Auth Transformed)

```
Authorization: AWS4-HMAC-SHA256 Credential=AKIAI44QH8DHBEXAMPLE/20240115/us-east-1/s3/aws4_request, SignedHeaders=host;range;x-amz-date, Signature=28a9d1de97c8bc3c5e0e5b3f6d8f2b9a7c4e6a5b8d3f1e9c2a7b4f6d8e1c3a5b
```

