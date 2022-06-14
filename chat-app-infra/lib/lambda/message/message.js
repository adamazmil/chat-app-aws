const AWS = require("aws-sdk");
const ddb = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
  let now = Date.now();
  const callbackAPI = new AWS.ApiGatewayManagementApi({
    apiVersion: "2018-11-29",
    endpoint:
      event.requestContext.domainName + "/" + event.requestContext.stage,
  });
  let connections;
  try {
    connections = await ddb.scan({ TableName: process.env.TABLE_NAME }).promise();
  } catch (err) {
    return {
      statusCode: 500,
    };
  }
  let sender
  try {
    const senderId = event.requestContext.connectionId
    const params = {
      TableName: process.env.TABLE_NAME,
      Key:{
        connectionId: senderId
      }
    }
    sender =  await ddb.get(params).promise()
  } catch (err) {
    return {
      statusCode: 500
    }
  }
  const message = { msg: JSON.parse(event.body).message, sender: sender.Item.guestName, timestamp: now };
  const payload = {type:'message',message:message}

  const sendMessages = connections.Items.map(async ({ connectionId }) => {
    if (connectionId !== event.requestContext.connectionId) {
      try {
        await callbackAPI
          .postToConnection({ ConnectionId: connectionId, Data: JSON.stringify(payload) })
          .promise();
      } catch (e) {
        console.log(e);
      }
    }
  });

  try {
    await Promise.all(sendMessages);
  } catch (e) {
    console.log(e);
    return {
      statusCode: 500,
    };
  }

  return { statusCode: 200 };
};
