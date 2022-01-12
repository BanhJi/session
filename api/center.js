'use strict'

const AWS = require('aws-sdk')
const code = require('../config/code.js')
const message = require('../config/message.js')
const json = require('../config/response.js')

const dynamoDb = new AWS.DynamoDB.DocumentClient()

module.exports.centersearchtxn = async (event) => {
  const table = process.env.item_table
  // const instituteId = event.pathParameters.institute_id
  const bdata = JSON.parse(event.body)
  // saving center
  let params = {
    ExpressionAttributeValues: {
      ':pk': 'ac-sav',
      ':sk': bdata.Id,
      ':startDate': bdata.startDate,
      ':endDate': bdata.endDate
    },
    ExpressionAttributeNames: {
      '#issuedDate': 'issuedDate'
    },
    IndexName: 'GSI1',
    KeyConditionExpression: 'sk = :sk and begins_with(pk, :pk)',
    FilterExpression: '#issuedDate >= :startDate and #issuedDate <= :endDate',
    TableName: table
  }
  if (bdata.type === 'member') {
    params = {
      ExpressionAttributeValues: {
        ':pk': 'ac-txn-',
        ':sk': bdata.Id,
        ':startDate': bdata.startDate,
        ':endDate': bdata.endDate
      },
      ExpressionAttributeNames: {
        '#issuedDate': 'issuedDate'
      },
      IndexName: 'GSI1',
      KeyConditionExpression: 'sk = :sk and begins_with(pk, :pk)',
      FilterExpression: '#issuedDate >= :startDate and #issuedDate <= :endDate',
      TableName: table
    }
  }
  try {
    const data = await dynamoDb.query(params).promise()
    const results = []
    for (const item of data.Items) {
      results.push({
        issuedDate: item.issuedDate ? item.issuedDate : '',
        number: item.number ? item.number : '',
        id: item.pk,
        price: item.price ? item.price : 0,
        quantity: item.quantity ? item.quantity : 1,
        amount: item.amount ? item.amount : 0,
        type: item.type ? item.type : ''
      })
    }
    results.sort(function (a, b) {
      return new Date(b.issuedDate) - new Date(a.issuedDate)
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
module.exports.creditsummaryreport = async (event) => {
  const table = process.env.item_table
  const inst = event.pathParameters.institute_id
  const yearQ = event.pathParameters.year
  try {
    const results = {
      memberSavingBalance: 0,
      customerSavingBalance: 0,
      generalDeposit: 0,
      termDeposit: 0,
      memberLoanBalance: 0,
      customerLoanBalance: 0
    }
    // saving balance
    const sp = {
      ExpressionAttributeValues: {
        ':pk': inst,
        ':sk': 'ac-dep-bal-',
        ':year': parseInt(yearQ),
        ':dateType': 'yearly'
      },
      ExpressionAttributeNames: {
        '#dateType': 'dateType',
        '#year': 'year'
      },
      KeyConditionExpression: 'pk = :pk and begins_with(sk, :sk)',
      FilterExpression: '#dateType = :dateType and #year = :year',
      TableName: table
    }
    let savingB = []
    do {
      savingB = await dynamoDb.query(sp).promise()
      if (savingB.Items.length > 0) {
        for (const acc of savingB.Items) {
          if (acc.att === 1) {
            results.generalDeposit += parseFloat(acc.amount)
          } else {
            results.termDeposit += parseFloat(acc.amount)
          }
          if (acc.typeId === 'member') {
            results.memberSavingBalance += parseFloat(acc.amount)
          } else {
            results.customerSavingBalance += parseFloat(acc.amount)
          }
        }
      }
      sp.ExclusiveStartKey = savingB.LastEvaluatedKey
    } while (typeof savingB.LastEvaluatedKey !== 'undefined')
    // saving interest
    const si = {
      ExpressionAttributeValues: {
        ':pk': inst,
        ':sk': 'ac-int-bal-',
        ':year': parseInt(yearQ),
        ':dateType': 'yearly'
      },
      ExpressionAttributeNames: {
        '#dateType': 'dateType',
        '#year': 'year'
      },
      KeyConditionExpression: 'pk = :pk and begins_with(sk, :sk)',
      FilterExpression: '#dateType = :dateType and #year = :year',
      TableName: table
    }
    let savingI = []
    do {
      savingI = await dynamoDb.query(si).promise()
      if (savingI.Items.length > 0) {
        for (const acc of savingI.Items) {
          if (acc.typeId === 'member') {
            results.memberSavingBalance += parseFloat(acc.amount)
          } else {
            results.customerSavingBalance += parseFloat(acc.amount)
          }
        }
      }
      si.ExclusiveStartKey = savingI.LastEvaluatedKey
    } while (typeof savingI.LastEvaluatedKey !== 'undefined')
    // saving withdraw
    const sw = {
      ExpressionAttributeValues: {
        ':pk': inst,
        ':sk': 'ac-wid-bal-',
        ':year': parseInt(yearQ),
        ':dateType': 'yearly'
      },
      ExpressionAttributeNames: {
        '#dateType': 'dateType',
        '#year': 'year'
      },
      KeyConditionExpression: 'pk = :pk and begins_with(sk, :sk)',
      FilterExpression: '#dateType = :dateType and #year = :year',
      TableName: table
    }
    let savingW = []
    do {
      savingW = await dynamoDb.query(sw).promise()
      if (savingW.Items.length > 0) {
        for (const acc of savingW.Items) {
          if (acc.typeId === 'member') {
            results.memberSavingBalance -= parseFloat(acc.amount)
          } else {
            results.customerSavingBalance -= parseFloat(acc.amount)
          }
        }
      }
      sw.ExclusiveStartKey = savingW.LastEvaluatedKey
    } while (typeof savingW.LastEvaluatedKey !== 'undefined')
    // loan balance
    const lb = {
      ExpressionAttributeValues: {
        ':pk': inst,
        ':sk': 'ac-loan-bal-',
        ':year': parseInt(yearQ),
        ':dateType': 'yearly'
      },
      ExpressionAttributeNames: {
        '#dateType': 'dateType',
        '#year': 'year'
      },
      KeyConditionExpression: 'pk = :pk and begins_with(sk, :sk)',
      FilterExpression: '#dateType = :dateType and #year = :year',
      TableName: table
    }
    let loanB = []
    do {
      loanB = await dynamoDb.query(lb).promise()
      if (loanB.Items.length > 0) {
        for (const acc of loanB.Items) {
          if (acc.typeId === 'member') {
            results.memberLoanBalance += parseFloat(acc.amount)
          } else {
            results.memberLoanBalance += parseFloat(acc.amount)
          }
        }
      }
      lb.ExclusiveStartKey = loanB.LastEvaluatedKey
    } while (typeof loanB.LastEvaluatedKey !== 'undefined')
    const lp = {
      ExpressionAttributeValues: {
        ':pk': inst,
        ':sk': 'ac-repaid-bal-',
        ':year': parseInt(yearQ),
        ':dateType': 'yearly'
      },
      ExpressionAttributeNames: {
        '#dateType': 'dateType',
        '#year': 'year'
      },
      KeyConditionExpression: 'pk = :pk and begins_with(sk, :sk)',
      FilterExpression: '#dateType = :dateType and #year = :year',
      TableName: table
    }
    let loanP = []
    do {
      loanP = await dynamoDb.query(lp).promise()
      if (loanP.Items.length > 0) {
        for (const acc of loanP.Items) {
          if (acc.typeId === 'member') {
            results.memberLoanBalance -= parseFloat(acc.amount)
          } else {
            results.memberLoanBalance -= parseFloat(acc.amount)
          }
        }
      }
      lp.ExclusiveStartKey = loanP.LastEvaluatedKey
    } while (typeof loanP.LastEvaluatedKey !== 'undefined')
    return {
      statusCode: code.httpStatus.OK,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*' // to allow cross origin access
      },
      body: json.responseBody(code.httpStatus.OK, results, message.msg.FetchSuccessed, '', 1)
    }
  } catch (error) {
    // console.log(error, 'error')
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
