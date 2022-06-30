
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb')
const { DynamoDBDocumentClient, DeleteCommand } = require('@aws-sdk/lib-dynamodb')
const { LambdaClient, InvokeCommand } =  require("@aws-sdk/client-lambda")

const dbClient = new DynamoDBClient({})
const ddbDocClient = DynamoDBDocumentClient.from(dbClient)
const lambdaClient = new LambdaClient();

exports.handler = async (event) => {
  const payload = {
    requestContext: event.requestContext,
  }
  try {
    await lambdaClient.send(new InvokeCommand({FunctionName: process.env.FUNC_NAME, InvocationType:'RequestResponse', Payload:JSON.stringify(payload)}))
  } catch (err) {
    return {
      statusCode: 500,
    }
  }
  try {
    await ddbDocClient.send(new DeleteCommand({
      TableName: process.env.TABLE_NAME,
      Key: {
        connectionId: event.requestContext.connectionId
      }
    }));
  } catch (err) {
    return {
      statusCode:500,
    }
  }
  return {
    statusCode: 200
  }
}

