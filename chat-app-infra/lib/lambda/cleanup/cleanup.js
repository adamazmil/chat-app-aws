const { DynamoDBClient } = require('@aws-sdk/client-dynamodb')
const { DynamoDBDocumentClient, ScanCommand,GetCommand } = require('@aws-sdk/lib-dynamodb')
const {ApiGatewayManagementApiClient, PostToConnectionCommand} = require('@aws-sdk/client-apigatewaymanagementapi')

const dbClient = new DynamoDBClient({})
const ddbDocClient = DynamoDBDocumentClient.from(dbClient)

exports.handler = async (event) => {
  const apiManagementClient = new ApiGatewayManagementApiClient({
    endpoint: 'https://' + event.requestContext.domainName + '/' + event.requestContext.stage,
  })
  let connections;
  try {
    connections = await ddbDocClient.send(new ScanCommand(
      {
        TableName: process.env.TABLE_NAME
      }
    ))
  } catch (err) {
    return {
      statusCode: 500
    }
  }
  try {
    var item = await ddbDocClient.send(new GetCommand({
      TableName: process.env.TABLE_NAME,
      Key: {
        connectionId: event.requestContext.connectionId
      }
    }))
  } catch (err) {
    return {
      statusCode:500,
    }
  }
  const message = { typer:  item.Item.guestName}
  const payload = { type: 'notTyping', message: message }
  for(const {connectionId} of connections.Items){
    if(connectionId !== event.requestContext.connectionId){
      try{
        await apiManagementClient.send(new PostToConnectionCommand({
          ConnectionId: connectionId, Data:JSON.stringify(payload)
        }))
      } catch (err) {
        return{
          statusCode:500
        }
      }
    }
  }
  return {
    statusCode: 200
  }
}
