# Amazon S3 Cookbook (2015)
__By Naoya Hashimoto__  

__AWS Console__  
[Free Tier Oferring](https://aws.amazon.com/free)  
[Hands on Tutorials](https://aws.amazon.com/getting-started/hands-on/)  

To install and use AWS CLI you need:   
* Python 2.7 or later  
* pip  

## Chapter 1: Managing Common Operations with AWS SDKs  
To get started with AWS SDKs see [AWS Developers](https://aws.amazon.com/developers/getting-started/)  

__Introduction__  
Amazon S3 does not have a minimum fee, we just pay for what we store.  

__AWS SDK for Node.js and basic S3 operations__  
See the [Developer Guide](https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/welcome.html) for the JavaScript SDK.  

AWS Bucket ownership is not transferable. You cannot change the name of a bucket or the region you selected after creating the bucket. A bucket name must be globally unique.

__Shared Credentials File__  
The shared credential file houses your AWS credential which is used by the AWS SDK and CLI to access AWS APIs.  
The credential file is named `credentials` and it is store as
* `~/.aws/credentials` for Linux, Unix, and MacOS
* `C:\Users\USER_NAME\.aws\credentials` for Windows  

A credential file looks like this
```
[default]
aws_access_key_id = <YOUR_ACCESS_KEY_ID>
aws_secret_access_key = <YOUR_SECRET_ACCESS_KEY>
```
To generate credential via the CLI, do
```
> aws configure
```  
Follow the prompt and enter your AWS _access key ID_, _secret access key_ and _default region_. 
[Learn more](https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/getting-your-credentials.html)    

To learn about AWS CLI commands see [AWS CLI Reference](https://awscli.amazonaws.com/v2/documentation/api/latest/reference/index.html)
## Chapter 2: Hosting a Static Website on Amazon S3 Bucket  
[S3 Pricing](https://aws.amazon.com/s3/pricing/)  
 To host a static website on Amazon S3:
 1. Create a bucket
 2. Add a website configuration to your bucket
 3. Apply a bucket policy  
 4. Upload your content
 5. Configure a custom domain if you want to use your own domain

Benefits of hosting a static website on Amazon S3 are as follows:
* Low cost  
* Reliable routing  
* Low latency  
* Low maintenance

__Hosting a static website from Amazon Management Console ([See Guide](https://docs.aws.amazon.com/AmazonS3/latest/dev/WebsiteHosting.html))__
1. Go to the S3 section of the Management Console and create a Bucket and allow _all_ public access.
2. Select the newly created bucket from S3 list of buckets. Click on the __Properties__ tab, scroll down to __Static website hosting__ and enable it.  Copy the generated website address.  
3. Enter the name for your index file and error file for you website and save.
4. Go to the __Permissions__ tab of the Bucket's page. Scroll down to __Bucket Policy__, edit and add JSON  
```
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObjects",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::<your_bucket_name>/*"
        }
    ]
}
```
If you experience access denial error with step 4, create a new policy with your root account using the following JSON  
```
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "ModifyBucketPolicy",
            "Action": [
                "s3:GetBucketPolicy",
                "s3:PutBucketPolicy"
            ],
            "Effect": "Allow",
            "Resource": "arn:aws:s3:::<your_bucket_name>"
        },
        {
            "Sid": "AccessS3Console",
            "Action": [
                "s3:GetBucketLocation",
                "s3:ListAllMyBuckets"
            ],
            "Effect": "Allow",
            "Resource": "arn:aws:s3:::*"
        }
    ]
}
```  
Then attach the policy to your IAM account or group used for this process.
5. Back to the Bucket's page on the __Objects__ tab, click on the __Upload__ button, upload all your website files and save.  
6. Visit the website address to see the site.   
__Note:__ Amazon S3 website do not support HTTPS, only HTTP.  

You can use _CNAME_ for the website endpoint to access with your custom domain name.  

To programmatically configure a bucket as a static website [see guide](https://docs.aws.amazon.com/AmazonS3/latest/dev/ManagingBucketWebsiteConfig.html).  
To configure custom domain for your website using Route 53 [see here](https://docs.aws.amazon.com/AmazonS3/latest/dev/website-hosting-custom-domain-walkthrough.html)  

__How to configure S3 server access logging__  
1. Go to Amazon S3 Management Console and select the bucket.   
2. Click on the __Property__ tab on the bucket's page  and scroll down to __Server access logging__ and click on the edit button and enable it.
3. Specify the bucket and path you want to save the logs to. Something like this `s3://<your_bucket>/<your_logs_path>`.  Click the save button. You can even choose to log to another bucket by specified the target bucket's name instead.  
4. If you go to __Permissions__ tab and scroll down to the __Access control list (ACL)__ you will see that _S3 log delivery group_ have been added to the _Grantee_ list.

Note that storing log objects and accessing log objects are charged in the same way as S3 storage and data transfer pricing.  
If you want to regularly delete log objects you can manage the life cycle of objects by using life cycle rules.  

__How to configure a static website suing a custom domain__  
To configure a website with your domain you need to
1. Create an S3 buckets, namely `<your_domain>` or `<your_subdomain>.<your_domain>` e.g `blog.tochukwu.xyz`.
2. Configure the bucket for static website hosting and upload your files as describe earlier above.
3. Go to Route 53 section of the Console and Click on Hosted _zones_ menu.
4. Create a hosted zone and in your Hosted zone, Create a record.
5. When creating a record, you select the _Alias_ option and map your site to your S3 bucket using the _Route traffic to Info_ select dropdown. It may take a few minutes before the URL will become active.
6. If you were not using an S3 bucket you can map the record name (website domain/subdomain) to the IP address by not selecting _Alias_ options.

You can have  `www` subdomain redirected to you site e.g `www.example.com` -> `example.com`.  
1. Create a bucket with the subdomain e.g `www.example.com`.
2. Click on the bucket's __Properties__ tab, go to __Static website hosting__ and click edit
3. Select _Enable_ and also _Redirect requests for an object_ options and enter you original site domain e.g `example.com` and save
4. Go to Route 53 Console, click on the _Hosted zones_ menu and selected thee hosted zone for your website.
5. Create a record and use `www.example.com` as the record name just like you did in step 5 above
6. After sometime request to `www.example.com` will start redirecting to `example.com`

__How to configure a static website on Amazon S3 bucker with AWS CLI__    
First, you have to install the AWS CLI.
* For window, download the MSI installer at [awscli.amazonaws.com/AWSCLIV2.msi](https://awscli.amazonaws.com/AWSCLIV2.msi) and run the installer.

* For Ubuntu (Linux x86 64bits),
First install the `unzip` utility if you don't already have it  
```
$ sudo apt install unzip
```
Download, unzip and install AWS CLI V2
```
$ curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
$ unzip awscliv2.zip
$ sudo ./aws/install
```
Verify the installation
```
$ aws --version
```
For more on Linux installation ,see the installation guide [here](https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2-linux.html).

Make sure your computer data/time is correct, because AWS CLI uses it to sign requests cryptographically. And request may fail if the date/time is incorrect.   

To configure you AWS CLI installation from the command line you can issue the command  
```
$ aws configure
```
The command automatically fills out your credential file for you with the values you supply to the prompt.  

Now to configure the website:
1. Create a bucket  
```
$ aws s3 mb s3://<my-bucket> --region <region-name>
```
2. Configure the bucket as a Website  
```
$ aws s3 website s3://<my-bucket> --index-document <index-file> --error-document <error-file> --region <region-name>
```   
3. Create a bucket policy in JSON and save it to a file say policy.json
```
{
  "Version":"2012-10-17",
  "Statement":[
    {
      "Sid":"PublicReadGetObjects",
      "Effect":"Allow",
      "Principal": {
        "AWS": "*"
      },
      "Action":["s3:GetObject"],
      "Resource":["arn:aws:s3:::<my-bucket>/*"]
    }
  ]
}
```  
4. Add the policy to the bucket
```
$ aws s3api put-bucket-policy --bucket <my-bucket> --policy file://<relative-path-to-policy-file>.json --region <region-name>
```  
5. Inspect the website configuration for the bucket  
```
$ aws s3api get-bucket-website --bucket <my-bucket> --region <region-name>  
```  
5. Upload your files to the bucket  
```
$ aws s3 sync <my-website-local-directory>/ s3://<my-bucket> --region <region-name>
```  

To learn more about AWS CLI (S3) see [cli s3 docs](https://docs.aws.amazon.com/cli/latest/reference/s3/index.html)  
To learn more about AWS CLI (S3Api) see [cli s3api docs](https://docs.aws.amazon.com/cli/latest/reference/s3api/index.html)  
For all CLI commands see [cli latests](https://docs.aws.amazon.com/cli/latest/)

## Chapter 3: Calculating Cost with the AWS Simple Monthly Calculator
[AWS S3 Calculator](https://calculator.s3.amazonaws.com/index.html)   
Todo: Return to this

## Chapter 4: Deploying a Static Website with CloudFormation  
__Introduction__   
_CloudFormation_ is a deployment tool that helps to provision your infrastructure using AWS resources such as EC2, IAM, RDB, Route 53, S3 and so on by creating a template to code your infrastructure in it so that you can deploy your infrastructure repeatedly and delete it as well.   
There is no additional charge for _CloudFormation_ itself, but you need to pay for AWS resources that your create.    

__Sample Templates__
*  [S3Hosting.json](https://s3-ap-northeast-1.amazonaws.com/hashnao.info/CloudFormation/S3Hosting.json) for static websites  
* [Simple Lamp Stack](https://s3.eu-west-2.amazonaws.com/cloudformation-templates-eu-west-2/LAMP_Single_Instance.template) with EC2 and local MySQL  

__Create a Stack__  
Go to the _CloudFormation_ section of the management console and create a new Stack.  
You can either select a template from a list of sample templates, upload your own template or supply a link for an existing template to create a stack.  

__Deleting a Stack__  
Make sure all of the objects are deleted before deleting the S3 bucket of the stack because cloud formation cannot delete objects in a bucket.  

__How to deploy a template with AWS CLI__  
First, you need to configure an _IAM_ user and a policy to enable full access to _S3_, full access to _CloudFront_ and issue an _IAM_ credential.  
1. Set environment variables
```
$ stack_name="static-shop-stack"
$ template_url="https://s3-ap-northeast-1.amazonaws.com/hashnao.info/CloudFormation/S3Hosting.json"  
$ HostingBucketName="static-shop-bucket"
$ LoggingBucketName="static-shop-logging-bucket"
```  

2. Validate your template
```
$ aws cloudformation validate-template --profile s3-node-app --region eu-west-2 --template-url ${template_url}
```
If you are using the default profile of your `credentials` file, then you do not need to supply the `--profile` flag.  
3. Create the stack  
```
$ aws cloudformation create-stack --stack-name ${stack_name} --template-url ${template_url} --parameters ParameterKey=HostingBucketName,ParameterValue=${HostingBucketName} ParameterKey=LoggingBucketName,ParameterValue=${LoggingBucketName} --profile s3-node-app --region eu-west-2
```

__AWS CLI Cloudformation commands__    
To list all your stacks  
```
$ aws cloudformation list-stacks --region eu-west-2
```

To list only stacks with status _CREATE_COMPLETE_
```
$ aws cloudformation list-stacks --stack-status-filter CREATE_COMPLETE --region eu-west-2
```

To see the detailed description of a stack  
```
$  aws cloudformation describe-stacks --stack-name ${stack_name} --region eu-west-2
```  
Note that _stack_name_ is a variable defined earlier whose value is the name of the stack.

To see the stack resources details, use the _describe-stack-resources_ subcommand.
```
$ aws cloudformation describe-stack-resources --stack-name ${stack_name} --region eu-west-2
```

Deleting a stack  
```
$ aws cloudformation delete-stack --stack-name ${stack_name} --region eu-west-2
```
The _delete_stack_ subcommand does not print any output on the terminal.   

List all the delete stacks using the _--stack-status-filter_ flag   
```
$ aws cloudformation list-stacks --stack-status-filter DELETE_COMPLETE --region eu-west-2
```

__Learn more__  
* [AWS CLI Cloudformation](https://docs.aws.amazon.com/cli/latest/reference/cloudformation/index.html)
* [Template Basics](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/gettingstarted.templatebasics.html)   
* [Sample Templates](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/cfn-sample-templates.html)  

## Chapter 5: Distributing Your Contents via CloudFront  
Amazon _CloudFront_ CDN is a content delivery service that is used to speed up the distribution of your static and dynamic content, for example, _.html_, _.css_, _.php_, image filed and streaming media to the end users. CloudFront delivers your content stored in origin servers such as Amazon S3 bucket or web servers through global network data centers called edge locations all
over the world.  
All you need to do is create a CloudFront distribution to define your origin server,
cache behavior settings, and distribution settings, and store your content in the origin server, so
that CloudFront distributes the configuration to CloudFront edge locations and adds the cache in
the edge locations.

__Step to configure a CloudFront distribution on the Amazon S3 bucket__   
1. Create a S3 bucket  
2. Create a CloudFront web distribution and specify the S3 bucket as the origin server.
3. Store your content on the S3 bucket.  
4. You can add more origins to your CloudFront distribution later.  

After creating a CloodFront web distribution, the distribution will be available within the next 15 minutes. The users will receive the content through the closest edge location, not directly from the configures s3 bucket.  

__How to configure a CloudFront distribution on the Amazon S3 bucket__
1. Sign in to your AWS management console and go to the CloudFront section.  
2. Click on The __Create Distribution__ button  
3. Under `Origin Domina Name`, select the S3 bucket that you want to use as the origin server. Make sure your S3 bucket is publicly accessable.
4. You may use the default settings under the `Origin Settings` and `Default Cache Behavior Settings` sections of the form.  
5. Take note of the `Price` class option in the `Distribution Settings` section and select the value that best suits your pocket.
6. You can specify your domain name under `Alternate Domain Names (CNAMEs)` if you want to use your own domain name. To learn more, see [CNAME DeveloperGuide](http://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/CNAMEs.html)  
7. To use your own domain name you must configure an SSL certificate using AWS Certificate Manager or upload one made using a third party service. See [AWS Certificate Manager](https://docs.aws.amazon.com/acm/latest/userguide/acm-overview.html) to learn more.  
8. You can either use the default `*.cloudfront.net` SSL certificate or you can upload your own for your custom CNAME. Learn more at [AWS Cloudfront Custom SSL](https://aws.amazon.com/cloudfront/custom-ssl-domains/) .  
9. After reviewing and selecting the option, check the __Create Distribution__ button at the end of the form. Your CloudFront distribution will then be in `In Progress` status. It should take about 15 minutes to complete after which the status will change to `Deployed`.  
10. Upload you assets to your origin S3 bucket using the S3 section of AWS management console or using the CLI  
```
$ aws s3 sync book_img/ s3://image-distribution-origin/ojlink-books --region eu-west-2
```

__Inspect your CloudFront Distribution__
* Copy the _Domain Name_ of the CloudFront distribution and visit it will a browser to confirm. You can use both HTTP and HTTPS.     
* Use the  `dig` command to lookup the domain name for the distribution:
```
$ dig d3ksa1f4kfjsu4.cloudfront.net
```
`dig` is a Linux utility that will show you the IP addresses associated with the domain name.  
The IP addresses shown are the IPs for the edge locations around the world.   

__Using an alias record instead of alternate domain names (CNAMEs)__    
You can choose to use an alias record or CNAME to a domain name of your distribution with Route 53 as a DNS service.   
If you choose to use an alias record other than CNAME, Route 53 will not chare you for alias queries to the CloudFront distribution. For more see [Alias DeveloperGuide](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/resource-record-sets-choosing-alias-non-alias.html)   

__To configure a certificate using AWS Certificate Manager (ACM)__    
If you are going to use your own domain name (e.g http://images.mydomain.com) instead of CloudFront generated domain (e.g, http://d3ksa1f4kfjsu4.cloudfront.net/), then you need to request a certificate for your domain using Route 53.  
1. Go to the AWS Certificate Manager section of the management console.  
2. Click on the `Get Started` button under `Provision cetificates`, select the `Request a public certificate` option and click `Request a certificate` button.  
3. Enter the name of your certificate and click `Next` button.  
4. Select the `DNS validation` option and click `Next` button
5. You may enter a tag name which is optional and click `Review` button.
6. Click the `Confirm and Request` button.
7. Download the `DNS` configuration file which contains a generated Record Name  
8. B=Now to validate your request, go to Route53 and click on `Hosted Zones`, click on your domain and click `Create record`  
9. Use the `Record Name` and `Record Value` found in the downloaded file to create a `CNAME` record type.
10. Your requested certificate is now validated and you should see the status on your certificate request list change from `Pending validated` to `validated` or complete.   

__To Configure an alias record for the CloudFront distribution with Amazone Route 53__  
To use you custom domain (e.g http://images.mydomain.com) instead of cloudFront automatically generate url (e.g, http://d3ksa1f4kfjsu4.cloudfront.net/), you need to configure an alias.
1. Make sure you enter your desired domain name in the `Alternate Domain Names (CNAMEs)` textbox under `Distribution Settings` when creating your distribution. You can also update this value for an already existing distribution.  
2. Sign into the management console to navigate to the Route 53 section.  
3. Click on the __Hosted Zones__ menu on the left navigation bar.  
4. Click on your domain name and then click on the __Create Record__ button.   
5. Enter your record name, select the `A` record type, switch on the `Alias` option and select `Alias to CloudFront distibution`, select you CloudFront Distribution and click on the save button.  
6. You should now be able to access your cloud front distribution using you custom domain.

__Amazon CloudFront limits or Quotas__  
AWS service limits exists by default. If you expect more than the default limit value for one of the resources (for example, you need more bandwidth for an event next week), you can create a case to request a higher limit via AWS support dashboard. See [AWS service quotas](https://docs.aws.amazon.com/general/latest/gr/aws_service_limits.html#limits_cloudfront)

__How to compare costs for data transfer between S3 and CloudFront__  
Todo: Return back later...  

To learn more about changing the cache behavior, checkout [CloudFront Developer Guide](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/distribution-web-values-specify.html#DownloadDistValuesCacheBehavior)

[CloudFront Pricing](https://aws.amazon.com/cloudfront/pricing/)  
[CloudFront CNAMEs](http://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/CNAMEs.html)  
[CloudFront Custom SSL](https://aws.amazon.com/cloudfront/custom-ssl-domains/)
