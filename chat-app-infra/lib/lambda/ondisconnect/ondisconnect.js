
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb')
const { DynamoDBDocumentClient, DeleteCommand } = require('@aws-sdk/lib-dynamodb')
const dbClient = new DynamoDBClient({})
const ddbDocClient = DynamoDBDocumentClient.from(dbClient)

exports.handler = async (event) => {
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

