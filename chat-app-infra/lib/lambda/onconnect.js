const AWS = require("aws-sdk");
var ddb = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
  try {
    await ddb
      .put({
        TableName: process.env.TABLE_NAME,
        Item: {
          connectionId: event.requestContext.connectionId,
        },
      })
      .promise();
  } catch (err) {
    return {
      statusCode: 500,
    };
  }
  return {
    statusCode: 200,
  };
};
