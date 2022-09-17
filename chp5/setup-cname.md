## Setting up an alternate domain name CNAME for Cloudfront

1. Request certificate
```
$ aws acm request-certificate --domain-name terminal.tochukwu.xyz --validation-method DNS
```  
--validation-method could also be EMAIL.

The result looks like This
```
{
    "CertificateArn": "arn:aws:acm:eu-west-2:966727776968:certificate/484b1915-7096-454f-ac4a-21df27b7d471"
}
```

2. View the details of the certificate using the `CertificateArn` from the previous step.
```
$ aws acm describe-certificate --certificate-arn arn:aws:acm:eu-west-2:966727776968:certificate/484b1915-7096-454f-ac4a-21df27b7d471
```
The result looks like this
```
{
    "Certificate": {
        "CertificateArn": "arn:aws:acm:eu-west-2:966727776968:certificate/484b1915-7096-454f-ac4a-21df27b7d471",
        "DomainName": "terminal.tochukwu.xyz",
        "SubjectAlternativeNames": [
            "terminal.tochukwu.xyz"
        ],
        "DomainValidationOptions": [
            {
                "DomainName": "terminal.tochukwu.xyz",
                "ValidationEmails": [
                    "admin@terminal.tochukwu.xyz",
                    "administrator@terminal.tochukwu.xyz",
                    "hostmaster@terminal.tochukwu.xyz",
                    "postmaster@terminal.tochukwu.xyz",
                    "webmaster@terminal.tochukwu.xyz"
                ],
                "ValidationDomain": "terminal.tochukwu.xyz",
                "ValidationStatus": "PENDING_VALIDATION",
                "ValidationMethod": "EMAIL"
            }
        ],
        "Subject": "CN=terminal.tochukwu.xyz",
        "Issuer": "Amazon",
        "CreatedAt": "2022-09-16T10:53:55.808000+02:00",
        "Status": "PENDING_VALIDATION",
        "KeyAlgorithm": "RSA-2048",
        "SignatureAlgorithm": "SHA256WITHRSA",
        "InUseBy": [],
        "Type": "AMAZON_ISSUED",
        "KeyUsages": [],
        "ExtendedKeyUsages": [],
        "RenewalEligibility": "INELIGIBLE",
        "Options": {
            "CertificateTransparencyLoggingPreference": "ENABLED"
        }
    }
}

```
You can also view you certificate on the AWS Certificate Manager console.  
3. From the JSON result of the `describe-certificate` directive above, locate the `Certificate.DomainValidationOptions[0].ResourceRecord` object.
This should contain three keys `Name`, `Type` and `Value`
Copy this three and use them to add a CNAME to your DNS record.
4. After some time issue the `describe-certificate` directive again of the previous step and check the `Certificate.Status` value. The value could be `ISSUED` or `PENDING_VALIDATION`
5. If the value of `Certificate.Status` is `ISSUED` then you can update your distribution configuration.
Update the alias object to reflect your CNAME
```
"Aliases": {
    "Quantity": 1,
    "Items": [
        "app.mydomain.site"
    ]
},
```  
See `update-cf-config.md` for how to update a distribution configuration.

__Other useful commands__  
To see all you available certificates
```
$  aws acm list-certificates
```
To delete the certificate
```
$ aws acm delete-certificate --certificate-arn arn:aws:acm:eu-west-2:966727776968:certificate/484b1915-7096-454f-ac4a-21df27b7d471
```
To move an alternate domain name /CNAME from one distribution to the other without downtime
```
$  associate-alias --target-distribution-id <value> --alias <value>
```
