'use strict'

const AWS = require('aws-sdk')
const code = require('../../config/code.js')
const message = require('../../config/message.js')
const json = require('../../config/response.js')

const dynamoDb = new AWS.DynamoDB.DocumentClient()

module.exports.loanoutstanding = async (event, context) => {
  const table = process.env.item_table
  const strQuery = event.queryStringParameters
  const instituteId = event.pathParameters.institute_id
  const sk = instituteId + '-fin-loan'
  let total = 0
  const cparams = {
    ExpressionAttributeValues: {
      ':sk': instituteId,
      ':pk': 'fin-loancount-'
    },
    Limit: 1,
    IndexName: 'GSI1',
    KeyConditionExpression: 'sk = :sk and begins_with(pk, :pk)',
    TableName: table
  }
  const citem = await dynamoDb.query(cparams).promise()
  if (citem.Items.length > 0) {
    total = parseInt(citem.Items[0].totalCount)
  }
  const take = strQuery.take ? parseInt(strQuery.take) : 100
  let endPage = total - parseInt(strQuery.skip) // (take + total) - (take * page)
  const startPage = endPage - take
  if (parseInt(strQuery.skip) > 0) {
    endPage -= 1
  }
  const params = {
    ExpressionAttributeValues: {
      ':sk': sk,
      ':start': startPage,
      ':end': endPage
    },
    IndexName: 'GSI3',
    KeyConditionExpression: 'sk = :sk and sortIndex between :start and :end',
    ScanIndexForward: false,
    TableName: table
  }
  try {
    const item = await dynamoDb.query(params).promise()
    const results = item.Items.map(v => {
      return {
        id: v.pk,
        number: v.approveNumber,
        name: v.name,
        bankName: v.financialInstitutions ? v.financialInstitutions.name : '',
        approvedAmount: parseFloat(v.approvedAmount),
        outstandingAmount: parseFloat(v.outStandingBalance),
        interestAmount: parseFloat(v.totalInterest),
        interestRate: parseFloat(v.interestRate),
        status: v.status,
        currency: v.currency.code,
        sortIndex: v.sortIndex
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
      body: json.responseBody(code.httpStatus.OK, results, message.msg.FetchSuccessed, '', total)
    }
  } catch (error) {
    console.log(error, 'error sir')
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
module.exports.summaryloanbalance = async (event, context) => {
  const table = process.env.item_table
  const instituteId = event.pathParameters.institute_id
  const params = {
    ExpressionAttributeValues: {
      ':sk': instituteId,
      ':pk': 'fin-balance-'
    },
    Limit: 1,
    IndexName: 'GSI1',
    KeyConditionExpression: 'sk = :sk and begins_with(pk, :pk)',
    TableName: table
  }
  try {
    const item = await dynamoDb.query(params).promise()
    const results = item.Items.map(v => {
      return {
        id: v.pk,
        approveLoan: v.approveLoan,
        interestRate: v.interestRate,
        outstandingBalance: v.outstandingBalance
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
    console.log(error, 'error sir')
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
module.exports.loanrepayment = async (event, context) => {
  const table = process.env.item_table
  const strQuery = event.queryStringParameters
  const instituteId = event.pathParameters.institute_id
  const sk = instituteId
  const startD = strQuery.start
  const endD = strQuery.end
  const params = {
    ExpressionAttributeValues: {
      ':sk': sk,
      ':pk': 'fin-loansche-',
      ':start': startD,
      ':end': endD,
      ':status': 1
    },
    IndexName: 'GSI1',
    KeyConditionExpression: 'sk = :sk and begins_with(pk, :pk)',
    ExpressionAttributeNames: {
      '#status': 'status'
    },
    FilterExpression: 'receiptDate between :start and :end and #status = :status',
    ScanIndexForward: false,
    TableName: table
  }
  try {
    const item = await dynamoDb.query(params).promise()
    const results = item.Items.map(v => {
      return {
        id: v.pk,
        date: v.receiptDate,
        number: v.loan.approveNumber,
        name: v.loan.name,
        total: v.data.total,
        principal: v.data.principal,
        interest: v.data.interest,
        currency: v.data.locale,
        loanId: v.loanId
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
    console.log(error, 'error sir')
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
module.exports.loanbalmonthly = async (event, context) => {
  const table = process.env.item_table
  const instituteId = event.pathParameters.institute_id
  const params = {
    ExpressionAttributeValues: {
      ':sk': 'fin-loan-bal-',
      ':pk': instituteId,
      ':dateType': 'monthly'
    },
    KeyConditionExpression: 'pk = :pk and begins_with(sk, :sk)',
    ExpressionAttributeNames: {
      '#dateType': 'dateType'
    },
    FilterExpression: '#dateType = :dateType',
    TableName: table
  }
  try {
    const item = await dynamoDb.query(params).promise()
    const results = item.Items.map(v => {
      return {
        id: v.pk,
        month: v.month,
        amount: parseFloat(v.amount),
        typeId: v.typeId
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
    console.log(error, 'error sir')
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
module.exports.loanpaymonthly = async (event, context) => {
  const table = process.env.item_table
  const instituteId = event.pathParameters.institute_id
  const params = {
    ExpressionAttributeValues: {
      ':sk': 'fin-loan-repayment-bal-',
      ':pk': instituteId,
      ':dateType': 'monthly'
    },
    KeyConditionExpression: 'pk = :pk and begins_with(sk, :sk)',
    ExpressionAttributeNames: {
      '#dateType': 'dateType'
    },
    FilterExpression: '#dateType = :dateType',
    TableName: table
  }
  try {
    const item = await dynamoDb.query(params).promise()
    const results = item.Items.map(v => {
      return {
        id: v.pk,
        month: v.month,
        amount: parseFloat(v.amount)
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
    console.log(error, 'error sir')
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
