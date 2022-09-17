## Updating an existing  distribution configuration
1. Get the current configuration for the distribution
```
$ aws cloudfront get-distribution-config --id E1FGFJ1ZCZ2ZBU > current-config.json
```
This give you a current-config.json file with the current configuration.
2. Remove the `ETag` property.  Peel out the `DistributionConfig` object wrapper  
3. Update the Parameter that you want updated
4. Run the `update-distribution` directive.
```
$ aws cloudfront update-distribution --id E1FGFJ1ZCZ2ZBU --distribution-config file://current-config.json
```
Todo: This does not work currently 
