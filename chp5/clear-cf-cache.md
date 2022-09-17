## Clearing CloudFront Cache
__Clearing cloudfront cache for a distribution__  
1. Find the Cloudfront distribution's Id   
```
$ aws cloudfront list-distributions
```  
This will produce a large json result.
To narrow down to the object containing the ID and origin bucket/server, you can use the `--query` flag
```
$ aws cloudfront list-distributions --query "DistributionList.Items[*].{id:Id,origin:Origins.Items[0].Id}"
```

2. Invalidate the cache for the distribution
```
$ aws cloudfront create-invalidation --distribution-id my-distribution-id --paths "/*"
```  
This produces a JSON response with in invalidation ID.
3. After a few minutes you can check if the distribution has been invalidated using the invalidation ID form the previous JSON result
```
$ aws cloudfront get-invalidation --id my-invalidation-id --distribution-id my-distribution-id
```  

__Clearing Cloudfront cache for a directory__  
1. Find the Cloudfront distibution's Id
```
$ aws cloudfront list-distributions --query "DistributionList.Items[*].{id:Id,origin:Origins.Items[0].Id}"
```
2. To clear the cloudfront distributio cache for a directory say image for example
```
$ aws cloudfront create-invalidation --distribution-id my-distribution-id --paths "/images/*"
```
3. Similarly you can clear the cache for a specific files by passing the files' paths
```
$ aws cloudfront create-invalidation --distribution-id my-distibution-id --paths "/images/dog.png" "/js/bundle.js"

```
