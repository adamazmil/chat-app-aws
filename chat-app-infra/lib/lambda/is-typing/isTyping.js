const { DynamoDBClient } = require('@aws-sdk/client-dynamodb')
const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb')
const {ApiGatewayManagementApiClient, PostToConnectionCommand, ApiGatewayManagementApi} = require('@aws-sdk/client-apigatewaymanagementapi')

const dbClient = new DynamoDBClient({})
const ddbDocClient = DynamoDBDocumentClient.from(dbClient)

exports.handler = async (event) => {
  const apiManagementClient = new ApiGatewayManagementApiClient({
    apiVersion: "2018-11-29",
    endpoint: "https://" + event.requestContext.domainName + "/" + event.requestContext.stage
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
      statusCode:500
    }
  }
  const message = { typer: JSON.parse(event.body).message }
  const payload = {type:'isTyping',message:message}
  for(const {connectionId} of connections.Items){
    if(connectionId !== event.requestContext.connectionId){
      try{
        await apiManagementClient.send(new PostToConnectionCommand({
          ConnectionId: connectionId, Data:JSON.stringify(payload)
        }))
      } catch (err) {
        console.log(err)
        return{
          statusCode:500
        }
      }
    }
  }
  return {
    statusCode: 200,
  }
}