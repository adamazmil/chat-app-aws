# Chat App 

  A serverless chat app with Websocket API, Lambda and DynamoDB. React App deployed on S3 Cloudfront

## Deployment
Prerequisite 
- AWS CLI
- AWS CDK CLI

```
cd chat-app-infra
npm install 
cd ../chat-app
npm install 
npm run api --profile=<aws-profile>
npm run deploy --profile=<aws-profile>
```
