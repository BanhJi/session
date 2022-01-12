'use strict'

const AWS = require('aws-sdk')
const code = require('../config/code.js')
const message = require('../config/message.js')
const json = require('../config/response.js')

const dynamoDb = new AWS.DynamoDB.DocumentClient()

module.exports.index = async (event, context) => {
  const table = process.env.item_table
  const instituteId = event.pathParameters.institute_id
  const bdata = JSON.parse(event.body)
  let params = {
    ExpressionAttributeValues: {
      ':sk': instituteId,
      ':pk': 'fin-receipt-'
    },
    IndexName: 'GSI1',
    KeyConditionExpression: 'sk = :sk and begins_with(pk, :pk)',
    ScanIndexForward: false,
    TableName: table
  }
  if (bdata.type === 'CloseLoan') {
    params = {
      ExpressionAttributeValues: {
        ':sk': instituteId,
        ':pk': 'fin-closeloan-'
      },
      IndexName: 'GSI1',
      KeyConditionExpression: 'sk = :sk and begins_with(pk, :pk)',
      ScanIndexForward: false,
      TableName: table
    }
  } else if (bdata.type === 'RecordPayment') {
    params = {
      ExpressionAttributeValues: {
        ':sk': instituteId,
        ':pk': 'fin-loanpay-'
      },
      IndexName: 'GSI1',
      KeyConditionExpression: 'sk = :sk and begins_with(pk, :pk)',
      ScanIndexForward: false,
      TableName: table
    }
  }
  try {
    let items = []
    const numbers = []
    do {
      items = await dynamoDb.query(params).promise()
      items.Items.forEach(item => {
        // eslint-disable-next-line no-prototype-builtins
        if (item.hasOwnProperty('lastNumber')) {
          numbers.push({
            lastNumber: item.lastNumber
          })
        }
      })
      params.ExclusiveStartKey = items.LastEvaluatedKey
    } while (typeof items.LastEvaluatedKey !== 'undefined')
    // console.log(JSON.stringify(numbers), 'numbers')
    const lastNumber = Math.max.apply(Math, numbers.map(o => { return o.lastNumber }))

    const empty = {
      lastNumber: 1
    }

    let obj = numbers.filter(m => m.lastNumber === lastNumber).map(o => {
      return {
        lastNumber: parseInt(o.lastNumber) + 1
      }
    })

    if (obj.length === 0) {
      obj = empty
    } else {
      obj = obj[0]
    }
    return {
      statusCode: code.httpStatus.OK,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*' // to allow cross origin access
      },
      body: json.responseBody(code.httpStatus.OK, obj, message.msg.FetchSuccessed, '', 1, {})
    }
  } catch (error) {
    return {
      statusCode: code.httpStatus.BadRequest,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*' // to allow cross origin access
      },
      body: json.responseBody(code.httpStatus.BadRequest, [], message.msg.FetchFailed, error, 0, {})
    }
  }
}
