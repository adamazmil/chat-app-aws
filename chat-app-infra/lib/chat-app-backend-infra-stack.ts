import { Stack, StackProps, CfnOutput,RemovalPolicy, Aws } from 'aws-cdk-lib';
import {AssetCode, Function, Runtime} from "aws-cdk-lib/aws-lambda";
import { CfnApi, CfnDeployment, CfnIntegration, CfnRoute, CfnStage } from "aws-cdk-lib/aws-apigatewayv2";
import { AttributeType, Table } from "aws-cdk-lib/aws-dynamodb";
import {Effect, PolicyStatement, Role, ServicePrincipal} from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export class ChatAppBackendInfraStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
    const tableName = 'chat_connections';

    // initialises API
    const name = id + '-api';
    const api = new CfnApi(this, name, {
      name: 'ChatAppApi',
      protocolType: 'WEBSOCKET',
      routeSelectionExpression: '$request.body.action'
    });
    const table = new Table(this, `${name}-table`, {
      tableName: tableName,
      partitionKey: {
        name: 'connectionId',
        type: AttributeType.STRING
      },
      removalPolicy: RemovalPolicy.DESTROY
    });
    const connectFunc = new Function(this, 'connect-lambda', {
      code: new AssetCode('./lib/lambda'),
      handler: 'onconnect.handler',
      runtime: Runtime.NODEJS_16_X,
      memorySize: 256,
      environment: {
        "TABLE_NAME": tableName
      }
    });
    table.grantReadWriteData(connectFunc);
    const disconnectFunc = new Function(this, 'disconnect-lambda', {
      code: new AssetCode('./lib/lambda'),
      handler: 'ondisconnect.handler',
      runtime: Runtime.NODEJS_16_X,
      memorySize: 256,
      environment: {
        "TABLE_NAME": tableName
      }
    })
    table.grantReadWriteData(disconnectFunc);
    const messageFunc = new Function(this, 'message-lambda', {
      code: new AssetCode('./lib/lambda'),
      handler: 'message.handler',
      runtime: Runtime.NODEJS_16_X,
      memorySize: 256,
      environment: {
          "TABLE_NAME": tableName,
      },
      initialPolicy: [
        new PolicyStatement({
          actions: [
            'execute-api:ManageConnections'
          ],
          resources: [
            'arn:aws:execute-api:' + this.region + ':' + this.account + ':' + api.ref + '/*'
          ],
          effect: Effect.ALLOW,
        })
      ]
    });
    table.grantReadWriteData(messageFunc);
    const defaultFunc = new Function(this, 'default-lambda', {
      code: new AssetCode('./lib/lambda'),
      handler: 'default.handler',
      runtime: Runtime.NODEJS_16_X,
      memorySize: 256,
      environment: {
          "TABLE_NAME": tableName,
      },
    });

    // access role for the socket api to access the socket lambda 
    const policy = new PolicyStatement({
      effect: Effect.ALLOW,
      resources: [
        connectFunc.functionArn,
        disconnectFunc.functionArn,
        messageFunc.functionArn,
        defaultFunc.functionArn
      ],
      actions: ["lambda:InvokeFunction"]
    })

    const role = new Role(this, `${name}-iam-role`, {
      assumedBy: new ServicePrincipal('apigateway.amazonaws.com')
    });
    role.addToPolicy(policy);

    // lambda Integration
    const connectIntegration = new CfnIntegration(this, 'connect-lambda-integration', {
      apiId: api.ref,
      integrationType: "AWS_PROXY",
      integrationUri: 'arn:aws:apigateway:' + this.region + ':lambda:path/2015-03-31/functions/' + connectFunc.functionArn + '/invocations',
      credentialsArn: role.roleArn
    });
    const disconnectIntegration = new CfnIntegration(this, 'disconnect-lambda-integration', {
      apiId: api.ref,
      integrationType: "AWS_PROXY",
      integrationUri: 'arn:aws:apigateway:' + this.region + ':lambda:path/2015-03-31/functions/' + disconnectFunc.functionArn + '/invocations',
      credentialsArn: role.roleArn
    });
    const messageIntegration = new CfnIntegration(this, 'message-lamda-integration', {
      apiId: api.ref,
      integrationType: "AWS_PROXY",
      integrationUri: 'arn:aws:apigateway:' + this.region + ':lambda:path/2015-03-31/functions/' + messageFunc.functionArn + '/invocations',
      credentialsArn: role.roleArn      
    })
    const defaultIntegration = new CfnIntegration(this, 'default-integration', {
      apiId: api.ref,
      integrationType: "AWS_PROXY",
      integrationUri: 'arn:aws:apigateway:' + this.region + ':lambda:path/2015-03-31/functions/' + defaultFunc.functionArn + '/invocations',
      credentialsArn: role.roleArn
    })

    // sets up routes for api 

    const connectRoute = new CfnRoute(this, 'connect-route', {
      apiId: api.ref,
      routeKey: '$connect',
      authorizationType: 'NONE',
      target: 'integrations/' + connectIntegration.ref,
    });
    const disconnectRoute = new CfnRoute(this, 'disconnect-route', {
      apiId: api.ref,
      routeKey: '$disconnect',
      authorizationType: 'NONE',
      target: 'integrations/' + disconnectIntegration.ref,
    });
    const messageRoute = new CfnRoute(this, 'message-route', {
      apiId: api.ref,
      routeKey: 'sendmessage',
      authorizationType: 'NONE',
      target: 'integrations/' + messageIntegration.ref,
    });
    const defaultRoute = new CfnRoute(this, 'default-route', {
      apiId: api.ref,
      routeKey: '$default',
      authorizationType: 'NONE',
      target: 'integrations/' + defaultIntegration.ref,
    });

    const deployment = new CfnDeployment(this, `${name}-deployment`, {
      apiId: api.ref
    });

    new CfnStage(this, `${name}-stage`, {
      apiId: api.ref,
      autoDeploy: true,
      deploymentId: deployment.ref,
      stageName: 'dev'
    });
    deployment.node.addDependency(connectRoute)
    deployment.node.addDependency(disconnectRoute)
    deployment.node.addDependency(messageRoute)  
    deployment.node.addDependency(defaultRoute)
  }
}