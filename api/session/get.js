'use strict'

const AWS = require('aws-sdk')
const code = require('../../config/code.js')
const message = require('../../config/message.js')
const json = require('../../config/response.js')

const dynamoDb = new AWS.DynamoDB.DocumentClient({region:'ap-southeast-1'})

module.exports.gets = async (event, context) => {
  const table = process.env.item_table
  const instituteId = event.pathParameters.institute_id
  const sk = instituteId + '-ses'
  const params = {
    ExpressionAttributeValues: {
      ':sk': sk,
      ':pk': 'ses-'
    },
    IndexName: 'GSI1',
    KeyConditionExpression: 'sk = :sk and begins_with(pk, :pk)',
    TableName: table
  }
  try {
    const d = await dynamoDb.query(params).promise()
    const results = []
    for (const data of d.Items) {
      results.push({
        id: data.pk,
        startDate: data.startDate,
        endDate: data.endDate ? data.endDate : '',
        user: data.user,
        number: data.number,
        openBalance: data.openBalance,
        lastNumber: data.lastNumber,
        status: data.status,
        totalReceipt: data.totalReceipt,
        countNotes: data.countNotes ? data.countNotes : [],
        sortIndex: data.sortIndex,
        adjustmentAccount: data.adjustmentAccount ? data.adjustmentAccount : {}
      })
    }
    results.sort(function (a, b) {
      return parseInt(b.sortIndex) - parseInt(a.sortIndex)
    })
    return {
      statusCode: code.httpStatus.OK,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*' // to allow cross origin access
      },
      body: json.responseBody(code.httpStatus.OK, results, message.msg.FetchSuccessed, '', 1)
    }
  } catch (error) {
    return {
      statusCode: code.httpStatus.Created,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*' // to allow cross origin access
      },
      body: json.responseBody(code.httpStatus.BadRequest, [], message.msg.FetchFailed, error, 0)
    }
  }
}
module.exports.get = async (event, context) => {
  const table = process.env.item_table
  const instituteId = event.pathParameters.institute_id
  const sk = instituteId + '-ses'
  const params = {
    ExpressionAttributeValues: {
      ':sk': sk,
      ':pk': event.pathParameters.id
    },
    IndexName: 'GSI1',
    KeyConditionExpression: 'sk = :sk and pk = :pk',
    TableName: table
  }
  try {
    const d = await dynamoDb.query(params).promise()
    const results = d.Items.map(data => {
      return {
        id: data.pk,
        startDate: data.startDate,
        endDate: data.endDate,
        user: data.user,
        number: data.number,
        openBalance: data.openBalance,
        lastNumber: data.lastNumber,
        status: data.status,
        totalReceipt: data.totalReceipt,
        countNotes: data.countNotes ? data.countNotes : [],
        sortIndex: data.sortIndex,
        adjustmentAccount: data.adjustmentAccount ? data.adjustmentAccount : {}
      }
    })
    return {
      statusCode: code.httpStatus.OK,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*' // to allow cross origin access
      },
      body: json.responseBody(code.httpStatus.OK, results, message.msg.FetchSuccessed, '', 1)
    }
  } catch (error) {
    return {
      statusCode: code.httpStatus.Created,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*' // to allow cross origin access
      },
      body: json.responseBody(code.httpStatus.BadRequest, [], message.msg.FetchFailed, error, 0)
    }
  }
}
module.exports.byuser = async (event, context) => {
  const table = process.env.item_table
  const instituteId = event.pathParameters.institute_id
  const sk = instituteId + '-ses'
  const params = {
    ExpressionAttributeValues: {
      ':sk': sk,
      ':gsisk': event.pathParameters.user_id
    },
    IndexName: 'GSI1SK',
    KeyConditionExpression: 'sk = :sk and begins_with(gsisk, :gsisk)',
    TableName: table
  }
  try {
    const d = await dynamoDb.query(params).promise()
    const results = d.Items.map(data => {
      return {
        id: data.pk,
        startDate: data.startDate,
        endDate: data.endDate,
        user: data.user,
        number: data.number,
        openBalance: data.openBalance,
        lastNumber: data.lastNumber,
        status: data.status,
        totalReceipt: data.totalReceipt,
        countNotes: data.countNotes ? data.countNotes : [],
        sortIndex: data.sortIndex,
        adjustmentAccount: data.adjustmentAccount ? data.adjustmentAccount : {}
      }
    })
    results.sort(function (a, b) {
      return parseInt(b.sortIndex) - parseInt(a.sortIndex)
    })
    return {
      statusCode: code.httpStatus.OK,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*' // to allow cross origin access
      },
      body: json.responseBody(code.httpStatus.OK, results, message.msg.FetchSuccessed, '', 1)
    }
  } catch (error) {
    return {
      statusCode: code.httpStatus.Created,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*' // to allow cross origin access
      },
      body: json.responseBody(code.httpStatus.BadRequest, [], message.msg.FetchFailed, error, 0)
    }
  }
}
module.exports.bydate = async (event) => {
  const data = JSON.parse(event.body)
  const table = process.env.item_table
  const instituteId = event.pathParameters.institute_id
  const sk = instituteId + '-ses'
  const params = {
    ExpressionAttributeValues: {
      ':sk': sk,
      ':pk': event.pathParameters.user_id,
      ':startDate': data.startDate,
      ':endDate': data.endDate
    },
    ExpressionAttributeNames: {
      '#startDate': 'startDate',
      '#endDate': 'endDate'
    },
    IndexName: 'GSI1',
    KeyConditionExpression: 'sk = :sk and begins_with(pk, :pk)',
    FilterExpression: '#startDate >= :startDate and #endDate <= :endDate',
    TableName: table
  }
  try {
    const d = await dynamoDb.query(params).promise()
    const results = d.Items.map(data => {
      return {
        id: data.pk,
        startDate: data.startDate,
        endDate: data.endDate,
        user: data.user,
        number: data.number,
        openBalance: data.openBalance,
        lastNumber: data.lastNumber,
        status: data.status,
        totalReceipt: data.totalReceipt,
        countNotes: data.countNotes ? data.countNotes : [],
        sortIndex: data.sortIndex,
        adjustmentAccount: data.adjustmentAccount ? data.adjustmentAccount : {}
      }
    })
    results.sort(function (a, b) {
      return parseInt(b.sortIndex) - parseInt(a.sortIndex)
    })
    return {
      statusCode: code.httpStatus.OK,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*' // to allow cross origin access
      },
      body: json.responseBody(code.httpStatus.OK, results, message.msg.FetchSuccessed, '', 1)
    }
  } catch (error) {
    return {
      statusCode: code.httpStatus.Created,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*' // to allow cross origin access
      },
      body: json.responseBody(code.httpStatus.BadRequest, [], message.msg.FetchFailed, error, 0)
    }
  }
}
module.exports.checksession = async (event, context) => {
  const table = process.env.item_table
  const instituteId = event.pathParameters.institute_id
  const data = JSON.parse(event.body)
  const params = {
    ExpressionAttributeValues: {
      ':sk': instituteId + '-ses',
      ':gsisk': data.user_name + '#' + instituteId + '#1'
    },
    IndexName: 'GSI1SK',
    KeyConditionExpression: 'sk = :sk and begins_with(gsisk, :gsisk)',
    ScanIndexForward: false,
    TableName: table
  }
  try {
    const d = await dynamoDb.query(params).promise()
    const results = d.Items.map(data => {
      return {
        id: data.pk,
        pk: data.pk,
        startDate: data.startDate,
        endDate: data.endDate,
        user: data.user,
        number: data.number,
        openBalance: data.openBalance,
        lastNumber: data.lastNumber,
        status: data.status,
        totalReceipt: data.totalReceipt,
        countNotes: data.countNotes ? data.countNotes : [],
        sortIndex: data.sortIndex,
        adjustmentAccount: data.adjustmentAccount ? data.adjustmentAccount : {}
      }
    })
    return {
      statusCode: code.httpStatus.OK,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*' // to allow cross origin access
      },
      body: json.responseBody(code.httpStatus.OK, results, message.msg.FetchSuccessed, '', 1, {})
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
module.exports.cashiersetting = async (event, context) => {
  const table = process.env.item_table
  const instituteId = event.pathParameters.institute_id
  const sk = instituteId
  const params = {
    ExpressionAttributeValues: {
      ':sk': sk,
      ':pk': 'cashset-'
    },
    IndexName: 'GSI1',
    KeyConditionExpression: 'sk = :sk and begins_with(pk, :pk)',
    TableName: table
  }
  try {
    const d = await dynamoDb.query(params).promise()
    const results = d.Items.map(data => {
      return {
        id: data.pk,
        lastRefNum: data.lastRefNum,
        searchOption: data.searchOption,
        msgJournal: data.msgJournal,
        paymentOption: data.paymentOption,
        user: data.user ? data.user : {},
        segment: data.segment
      }
    })
    return {
      statusCode: code.httpStatus.OK,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*' // to allow cross origin access
      },
      body: json.responseBody(code.httpStatus.OK, results, message.msg.FetchSuccessed, '', 1)
    }
  } catch (error) {
    return {
      statusCode: code.httpStatus.Created,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*' // to allow cross origin access
      },
      body: json.responseBody(code.httpStatus.BadRequest, [], message.msg.FetchFailed, error, 0)
    }
  }
}
module.exports.txnsession = async (event, context) => {
  const table = process.env.item_table
  const params = {
    ExpressionAttributeValues: {
      ':sk': event.pathParameters.id,
      ':pk': 'txnses-'
    },
    IndexName: 'GSI1',
    KeyConditionExpression: 'sk = :sk and begins_with(pk, :pk)',
    TableName: table
  }
  try {
    const d = await dynamoDb.query(params).promise()
    const results = d.Items.map(data => {
      return {
        id: data.pk,
        pk: data.pk,
        instituteId: data.instituteId,
        receiptId: data.receiptId,
        invoiceId: data.invoiceId,
        amountTobePaid: data.amountTobePaid,
        paidAmount: data.paidAmount,
        user: data.user,
        issuedDate: data.issuedDate,
        printObj: data.printObj,
        gsisk: data.gsisk
      }
    })
    results.sort(function (a, b) {
      return parseInt(b.issuedDate) - parseInt(a.issuedDate)
    })
    return {
      statusCode: code.httpStatus.OK,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*' // to allow cross origin access
      },
      body: json.responseBody(code.httpStatus.OK, results, message.msg.FetchSuccessed, '', 1)
    }
  } catch (error) {
    return {
      statusCode: code.httpStatus.Created,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*' // to allow cross origin access
      },
      body: json.responseBody(code.httpStatus.BadRequest, [], message.msg.FetchFailed, error, 0)
    }
  }
}
