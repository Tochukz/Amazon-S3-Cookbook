#!/bin/bash
# Filename: cloudfront.sh
# Task: Configure cloud front distribution with S3 as origin server

# Create the S3 bucket and make it public
aws s3 mb s3://cf-site-bucket
aws s3api put-bucket-policy --bucket cf-site-bucket --policy file://public-policy.json

# Copy your assets to the bucket
aws s3 sync react-app/build s3://cf-site-bucket

# Your files should now be publicly accessable at https://cf-site-bucket.s3.eu-west-2.amazonaws.com,
# To see the index.html file go to https://cf-site-bucket.s3.eu-west-2.amazonaws.com/index.html

### Create the cloud front distribution
# First generate a sample config json
aws cloudfront create-distribution --generate-cli-skeleton > sample-conf.json
# Update copy and update the config
cp sample-conf.json dist-config.json

# Peel out the outer DistributionConfig object wrapper from the sample-conf.json

# Update the following
# Origins.Items[*].Id
# Origins.Items[*].DomainName
# DefaultCacheBehaviour.TragetOriginId
# CallerReference (I normally set here the current timestamp, however it needs to be unique within all your previous AWS-API-calls)
# Aliases.Items[*]

# as follows

# DefaultRootObject = "index.html"
# Logging.Enabled = false
# Origins.Items[0].Id = cf-site-bucket.s3.eu-west-2.amazonaws.com
# Origins.Items[0].DomainName = cf-site-bucket.s3.eu-west-2.amazonaws.com
# Origins.Items[0].CustomOriginConfig.HTTPPort = 80
# Origins.Items[0].CustomOriginConfig.HTTPSPort = 443
# Origins.Items[0].CustomOriginConfig.OriginProtocolPolicy = "https-only"
# Origins.Items[0].CustomOriginConfig.OriginSslProtocols.Quantity = 1
# Origins.Items[0].OriginShield.OriginShieldRegion = "eu-west-2"
# Origins.Quantity = 1
# DefaultCacheBehaviour.TragetOriginId = "cf-site-bucket.s3.eu-west-2.amazonaws.com"
# DefaultCacheBehaviour.TrustedSigners.Enabled = false
# CallerReference = "Tue, 13 Sep 2022 06:20:38 GMT",
# Aliases.Quantity = 1
# Aliases.Items[0] = "ecommerce.tochukwu.xyz"

# Delete the following from your dist-config.json
# OriginGroups.Items
# CacheBehaviors.Items

# Create the cloudfront distribution
aws cloudfront create-distribution --distribution-config file://config/dist-config.json

# Inspect all your distributions
aws cloudfront list-distributions

# Learn more about origin-shield and OriginGroups
# https://aws.amazon.com/about-aws/whats-new/2020/10/announcing-amazon-cloudfront-origin-shield/
# https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/origin-shield.html
# https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/high_availability_origin_failover.html

# Lern more about DefaultCacheBehavior and CacheBehaviors
https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-cloudfront-distribution-defaultcachebehavior.html
