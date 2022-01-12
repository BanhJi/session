'use strict'

const AWS = require('aws-sdk')
const code = require('../../config/code.js')
const message = require('../../config/message.js')
const json = require('../../config/response.js')

const dynamoDb = new AWS.DynamoDB.DocumentClient()

module.exports.gets = async (event, context) => {
  const table = process.env.item_table
  const instituteId = event.pathParameters.institute_id
  const sk = instituteId + '-fin-loan'
  const params = {
    ExpressionAttributeValues: {
      ':sk': sk,
      ':pk': 'fin-loan-'
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
        uuid: data.pk,
        issuedDate: data.issuedDate,
        financialInstitutions: data.financialInstitutions,
        amount: data.amount,
        name: data.name,
        typeOfLoan: data.typeOfLoan,
        currency: data.currency,
        description: data.description,
        status: data.status,
        outStandingBalance: data.outStandingBalance,
        availableCredit: data.availableCredit,
        approvedAmount: data.approvedAmount,
        interestRate: data.interestRate,
        saveOption: data.saveOption,
        loanAccount: data.loanAccount,
        interestAccount: data.interestAccount,
        maturityDate: data.maturityDate,
        approveDate: data.approveDate,
        firstPaymentDate: data.firstPaymentDate,
        number: data.number,
        approveNumber: data.approveNumber,
        duration: data.duration,
        monthlyRepayment: data.monthlyRepayment,
        paymentTerm: data.paymentTerm,
        paymentMethod: data.paymentMethod,
        totalInterest: data.totalInterest,
        totalPayment: data.totalPayment,
        schedules: data.schedules,
        sortIndex: data.sortIndex,
        exchangeRate: data.exchangeRate,
        segment: data.segment ? data.segment : {},
        location: data.location ? data.location : {}
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
  const sk = instituteId + '-fin-loan'
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
        uuid: data.pk,
        issuedDate: data.issuedDate,
        financialInstitutions: data.financialInstitutions,
        amount: data.amount,
        name: data.name,
        typeOfLoan: data.typeOfLoan,
        currency: data.currency,
        description: data.description,
        status: data.status,
        outStandingBalance: data.outStandingBalance,
        availableCredit: data.availableCredit,
        approvedAmount: data.approvedAmount,
        saveOption: data.saveOption,
        sortIndex: data.sortIndex,
        loanAccount: data.loanAccount ? data.loanAccount : {},
        interestAccount: data.interestAccount ? data.interestAccount : {},
        interestRate: data.interestRate,
        maturityDate: data.maturityDate,
        approveDate: data.approveDate,
        firstPaymentDate: data.firstPaymentDate,
        number: data.number,
        approveNumber: data.approveNumber,
        duration: data.duration,
        monthlyRepayment: data.monthlyRepayment,
        paymentTerm: data.paymentTerm,
        paymentMethod: data.paymentMethod,
        schedules: data.schedules ? data.schedules : [],
        segment: data.segment ? data.segment : {},
        location: data.location ? data.location : {}
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
module.exports.loanschedule = async (event, context) => {
  const table = process.env.item_table
  const params = {
    ExpressionAttributeValues: {
      ':sk': event.pathParameters.institute_id,
      ':pk': 'fin-loansche-',
      ':loanId': event.pathParameters.id
    },
    ExpressionAttributeNames: {
      '#loanId': 'loanId'
    },
    IndexName: 'GSI1',
    KeyConditionExpression: 'sk = :sk and begins_with(pk, :pk)',
    FilterExpression: '#loanId = :loanId',
    TableName: table
  }
  try {
    const data = await dynamoDb.query(params).promise()
    const results = data.Items.map(item => {
      return {
        id: item.pk,
        data: item.data,
        loan: item.loan,
        receiptDate: item.receiptDate,
        loanId: item.loanId,
        status: item.status,
        receiptId: item.receiptId
      }
    })
    results.sort(function (a, b) {
      return new Date(a.receiptDate) - new Date(b.receiptDate)
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
module.exports.centersearchtxn = async (event) => {
  const table = process.env.item_table
  // const instituteId = event.pathParameters.institute_id
  const bdata = JSON.parse(event.body)
  // saving center
  const params = {
    ExpressionAttributeValues: {
      ':pk': 'fin-txn-',
      ':sk': bdata.loanId,
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
  try {
    const data = await dynamoDb.query(params).promise()
    const results = []
    for (const item of data.Items) {
      results.push({
        issuedDate: item.issuedDate ? item.issuedDate : '',
        number: item.number ? item.number : '',
        id: item.pk,
        type: item.type ? item.type : '',
        amount: item.amount ? item.amount : 0
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
