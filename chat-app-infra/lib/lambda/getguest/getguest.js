const { DynamoDBClient } = require('@aws-sdk/client-dynamodb')
const { DynamoDBDocumentClient, GetCommand } = require('@aws-sdk/lib-dynamodb')

const dbClient = new DynamoDBClient({})
const ddbDocClient = DynamoDBDocumentClient.from(dbClient)
exports.handler = async (event) => {
  try {
    var item = await ddbDocClient.send(
      new GetCommand({
        TableName: process.env.TABLE_NAME,
        Key: {
          connectionId: event.requestContext.connectionId,
        }
      })
    )
  } catch (err) {
    return {
      statusCode:500
    }
  }
  var payload = await {type:'getGuest',message:item.Item.guestName}
  return {
    body: JSON.stringify(payload),
    statusCode: 200,
  }
}
