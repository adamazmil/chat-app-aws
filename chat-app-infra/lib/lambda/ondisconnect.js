const AWS = require("aws-sdk");
const ddb = new AWS.DynamoDB.DocumentClient();
exports.handler = async (event) => {
  await ddb
    .delete({
      TableName: process.env.TABLE_NAME,
      Key: {
        connectionId: event.requestContext.connectionId,
      },
    })
    .promise();
  return {
    statusCode: 200,
  };
};
