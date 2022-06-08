const AWS = require("aws-sdk");
var ddb = new AWS.DynamoDB.DocumentClient();

var animals = ['Anonymous Liger','Anonymous Shark', 'Anonymous Mink', 'Anonymous Snake', 'Anonymous Aligator']

exports.handler = async (event) => {
  try {
    await ddb
      .put({
        TableName: process.env.TABLE_NAME,
        Item: {
          connectionId: event.requestContext.connectionId,
          guestName: animals[Math.random()*4]
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
