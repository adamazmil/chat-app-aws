import { Stack, StackProps, CfnOutput,RemovalPolicy, Aws } from 'aws-cdk-lib';
import {AssetCode, Function, Runtime} from "aws-cdk-lib/aws-lambda";
import { CfnApi, CfnDeployment, CfnIntegration, CfnRoute, CfnStage, CfnIntegrationResponse, CfnRouteResponse } from "aws-cdk-lib/aws-apigatewayv2";
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
      code: new AssetCode('./lib/lambda/onconnect'),
      handler: 'onconnect.handler',
      runtime: Runtime.NODEJS_16_X,
      memorySize: 256,
      environment: {
        "TABLE_NAME": tableName
      }
    });
    table.grantReadWriteData(connectFunc);
    const messageFunc = new Function(this, 'message-lambda', {
      code: new AssetCode('./lib/lambda/message'),
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
      code: new AssetCode('./lib/lambda/default'),
      handler: 'default.handler',
      runtime: Runtime.NODEJS_16_X,
      memorySize: 256,
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
    const getGuestFunc = new Function(this, 'getguest-lambda', {
      code: new AssetCode('./lib/lambda/getguest'),
      handler: 'getguest.handler',
      runtime: Runtime.NODEJS_16_X,
      memorySize: 128,
      environment: {
        "TABLE_NAME": tableName
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
    table.grantReadData(getGuestFunc);
    const isTypingFunc = new Function(this, 'is-typing-lambda', {
      code: new AssetCode('./lib/lambda/is-typing'),
      handler: 'isTyping.handler',
      runtime: Runtime.NODEJS_16_X,
      memorySize: 128,
      environment: {
        "TABLE_NAME": table.tableName
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
    })
    table.grantReadData(isTypingFunc);
    const notTypingFunc = new Function(this, 'not-typing-lambda', {
      code: new AssetCode('./lib/lambda/not-typing'),
      handler: 'notTyping.handler',
      runtime: Runtime.NODEJS_16_X,
      memorySize: 128,
      environment: {
        "TABLE_NAME": table.tableName
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
    })
    table.grantReadData(notTypingFunc);
    const cleanupFunc = new Function(this, 'cleanup-lambda', {
      code: new AssetCode('./lib/lambda/cleanup'),
      handler: 'cleanup.handler',
      runtime: Runtime.NODEJS_16_X,
      memorySize: 128,
      environment: {
        "TABLE_NAME": table.tableName
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
    })
    table.grantReadWriteData(cleanupFunc);
    const disconnectFunc = new Function(this, 'disconnect-lambda', {
      code: new AssetCode('./lib/lambda/ondisconnect'),
      handler: 'ondisconnect.handler',
      runtime: Runtime.NODEJS_16_X,
      memorySize: 256,
      environment: {
        "TABLE_NAME": tableName,
        "FUNC_NAME": cleanupFunc.functionArn
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
        }),
        new PolicyStatement({
          actions: [
            'lambda:invokeFunction'
          ],
          resources: [
            cleanupFunc.functionArn
          ],
          effect: Effect.ALLOW
        })
      ]
    })
    table.grantReadWriteData(disconnectFunc);

    // access role for the socket api to access the socket lambda 
    const policy = new PolicyStatement({
      effect: Effect.ALLOW,
      resources: [
        connectFunc.functionArn,
        disconnectFunc.functionArn,
        messageFunc.functionArn,
        defaultFunc.functionArn,
        getGuestFunc.functionArn,
        isTypingFunc.functionArn,
        notTypingFunc.functionArn
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
    const getGuestIntegration = new CfnIntegration(this, 'getguest-integration', {
      apiId: api.ref,
      integrationType: "AWS_PROXY",
      integrationUri: 'arn:aws:apigateway:' + this.region + ':lambda:path/2015-03-31/functions/' + getGuestFunc.functionArn + '/invocations',
      credentialsArn: role.roleArn
    })
    const isTypingIntegration = new CfnIntegration(this, 'is-typing-integration', {
      apiId: api.ref,
      integrationType: "AWS_PROXY",
      integrationUri: 'arn:aws:apigateway:' + this.region + ':lambda:path/2015-03-31/functions/' + isTypingFunc.functionArn + '/invocations',
      credentialsArn: role.roleArn
    })
    const notTypingIntegration = new CfnIntegration(this, 'not-typing-integration', {
      apiId: api.ref,
      integrationType: "AWS_PROXY",
      integrationUri: 'arn:aws:apigateway:' + this.region + ':lambda:path/2015-03-31/functions/' + notTypingFunc.functionArn + '/invocations',
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
    const getGuestRoute = new CfnRoute(this, 'getguest-route', {
      apiId: api.ref,
      routeKey: 'getguest',
      routeResponseSelectionExpression:'$default',
      authorizationType: 'NONE',
      target: 'integrations/' + getGuestIntegration.ref,
    })
    const isTypingRoute = new CfnRoute(this, 'is-typing-route', {
      apiId: api.ref,
      routeKey: 'istyping',
      authorizationType: 'NONE',
      target: 'integrations/' + isTypingIntegration.ref,
    })
    const notTypingRoute = new CfnRoute(this, 'not-typing-route', {
      apiId: api.ref,
      routeKey: 'nottyping',
      authorizationType: 'NONE',
      target: 'integrations/' + notTypingIntegration.ref,
    })

    const getGuestIntegrationResponse = new CfnIntegrationResponse(this, 'getguest-integration-response', {
      apiId: api.ref,
      integrationId: getGuestIntegration.ref,
      integrationResponseKey: '/200/'
    })

    const getGuestRouteResponse = new CfnRouteResponse(this, 'getguest-route-response', {
      apiId: api.ref,
      routeId: getGuestRoute.ref,
      routeResponseKey: '$default'
    })

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
    deployment.node.addDependency(getGuestRoute)
    deployment.node.addDependency(isTypingRoute)
    deployment.node.addDependency(notTypingRoute)
  }
}