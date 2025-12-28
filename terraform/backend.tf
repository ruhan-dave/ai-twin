terraform {
  backend "s3" {
    # These values will be set by deployment scripts
    # For local development, they can be passed via -backend-config
    dynamodb_table = ""  # Deprecated, but kept for compatibility
  }
}