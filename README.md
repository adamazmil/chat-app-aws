# Chat App 

  A serverless chat app with Websocket API, Lambda and DynamoDB. React App deployed on S3 Cloudfront

## Deployment
Prerequisite 
- AWS CLI
- AWS CDK CLI

```
cd chat-app
npm install
npm start build
cd ../chat-app-infra
cdk bootstrap
cdk deploy ChatAppBackendInfraStack
cdk deploy AppInfraStack
```
