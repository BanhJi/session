'use strict'

const AWS = require('aws-sdk')
const code = require('../../config/code.js')
const message = require('../../config/message.js')
const json = require('../../config/response.js')
const uuid = require('uuid')

const dynamoDb = new AWS.DynamoDB.DocumentClient({region:'ap-southeast-1'})

module.exports.index = async (event) => {
  try {
    const timestamp = new Date().toJSON()
    const data = JSON.parse(event.body)
    const table = process.env.item_table
    const instituteId = event.pathParameters.institute_id
    const sk = instituteId + '-ses'
    let head
    const lines = []
    if (data.id === undefined || data.id === '') {
      head = 'ses-' + uuid.v1()
    } else {
      head = data.id
    }
    const pk = head
    const Session = {
      sk: sk,
      pk: pk,
      startDate: data.startDate,
      endDate: data.endDate,
      user: data.user,
      sortIndex: data.sortIndex,
      lastNumber: data.lastNumber,
      number: data.number,
      openBalance: data.openBalance,
      totalReceipt: data.totalReceipt,
      adjustmentAccount: data.adjustmentAccount,
      actualAmount: data.actualAmount,
      createdAt: timestamp,
      updatedAt: timestamp
    }
    // check count
    const cpara = {
      ExpressionAttributeValues: {
        ':sk': event.pathParameters.institute_id,
        ':pk': 'sescount-'
      },
      Limit: 1,
      IndexName: 'GSI1',
      KeyConditionExpression: 'sk = :sk and begins_with(pk, :pk)',
      TableName: table
    }
    const loanCount = await dynamoDb.query(cpara).promise()
    let startCount = 0
    let hasCount = 0
    if (loanCount.Items.length > 0) {
      hasCount = 1
      startCount = parseInt(loanCount.Items[0].totalCount)
    }
    // update count
    if (data.isEdit === false) {
      startCount += 1
      if (hasCount === 1) {
        const mtcount = {
          TableName: table,
          Key: {
            pk: loanCount.Items[0].pk,
            sk: event.pathParameters.institute_id
          },
          ExpressionAttributeValues: {
            ':totalCount': startCount
          },
          ExpressionAttributeNames: {
            '#totalCount': 'totalCount'
          },
          UpdateExpression: 'set #totalCount = :totalCount',
          ReturnValues: 'UPDATED_NEW'
        }
        await dynamoDb.update(mtcount).promise()
      } else {
        lines.push({
          PutRequest: {
            Item: {
              sk: instituteId,
              pk: 'sescount-' + uuid.v1(),
              totalCount: startCount
            }
          }
        })
      }
    }
    lines.push({
      PutRequest: {
        Item: {
          sk: sk,
          pk: pk,
          startDate: data.startDate,
          endDate: data.endDate,
          user: data.user,
          sortIndex: startCount,
          lastNumber: data.lastNumber,
          gsisk: data.endDate === '' ? data.user.email + '#' + event.pathParameters.institute_id + '#1' : data.user.email + '#' + event.pathParameters.institute_id + '#2',
          number: data.number,
          openBalance: data.openBalance,
          status: data.status,
          totalReceipt: data.totalReceipt,
          countNotes: data.countNotes,
          adjustmentAccount: data.adjustmentAccount,
          actualAmount: data.actualAmount,
          createdAt: timestamp,
          updatedAt: timestamp
        }
      }
    })
    // end count
    for (let i = 0; i < lines.length; i += 25) {
      const upperLimit = Math.min(i + 25, lines.length)
      const newItems = lines.slice(i, upperLimit)
      try {
        await dynamoDb
          .batchWrite({
            RequestItems: {
              [table]: newItems
            }
          })
          .promise()
      } catch (e) {
        console.log('arr ', JSON.stringify(e), JSON.stringify(newItems))
        console.error('There was an error while processing the request')
        break
      }
    }
    // response back
    return {
      statusCode: code.httpStatus.Created,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*' // to allow cross origin access
      },
      body: json.responseBody(code.httpStatus.Created, Session, message.msg.ItemCreatedSuccessed, '', 1)
    }
  } catch (e) {
    console.log('error ', e)
  }
}
module.exports.txnsession = async (event) => {
  try {
    const timestamp = new Date().toJSON()
    const data = JSON.parse(event.body)
    const table = process.env.item_table
    let head
    const lines = []
    if (data.id === undefined || data.id === '') {
      head = 'txnses-' + uuid.v1()
    } else {
      head = data.id
    }
    const pk = head
    const Session = {
      sk: data.sessionId,
      pk: pk,
      receiptId: data.receiptId,
      invoiceId: data.invoiceId,
      amountTobePaid: data.amountTobePaid,
      paidAmount: data.paidAmount,
      user: data.user,
      issuedDate: data.issuedDate,
      printObj: data.printObj,
      createdAt: timestamp,
      updatedAt: timestamp
    }
    lines.push({
      PutRequest: {
        Item: {
          sk: data.sessionId,
          pk: pk,
          instituteId: event.pathParameters.institute_id,
          receiptId: data.receiptId,
          invoiceId: data.invoiceId,
          amountTobePaid: data.amountTobePaid,
          paidAmount: data.paidAmount,
          user: data.user,
          issuedDate: data.issuedDate,
          printObj: data.printObj,
          gsisk: data.user.username + '#' + data.issuedDate,
          createdAt: timestamp,
          updatedAt: timestamp
        }
      }
    })
    // end count
    for (let i = 0; i < lines.length; i += 25) {
      const upperLimit = Math.min(i + 25, lines.length)
      const newItems = lines.slice(i, upperLimit)
      try {
        await dynamoDb
          .batchWrite({
            RequestItems: {
              [table]: newItems
            }
          })
          .promise()
      } catch (e) {
        console.log('arr ', JSON.stringify(e), JSON.stringify(newItems))
        console.error('There was an error while processing the request')
        break
      }
    }
    // response back
    return {
      statusCode: code.httpStatus.Created,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*' // to allow cross origin access
      },
      body: json.responseBody(code.httpStatus.Created, Session, message.msg.ItemCreatedSuccessed, '', 1)
    }
  } catch (e) {
    console.log('error ', e)
  }
}
module.exports.cashiersetting = async (event) => {
  try {
    const timestamp = new Date().toJSON()
    const data = JSON.parse(event.body)
    const table = process.env.item_table
    const instituteId = event.pathParameters.institute_id
    const sk = instituteId
    let head
    const lines = []
    if (data.id === undefined || data.id === '') {
      head = 'cashset-' + uuid.v1()
    } else {
      head = data.id
    }
    const pk = head
    const Session = {
      sk: sk,
      pk: pk,
      lastRefNum: data.lastRefNum,
      searchOption: data.searchOption,
      msgJournal: data.msgJournal,
      paymentOption: data.paymentOption,
      user: data.user,
      segment: data.segment,
      createdAt: timestamp,
      updatedAt: timestamp
    }
    lines.push({
      PutRequest: {
        Item: {
          sk: sk,
          pk: pk,
          lastRefNum: data.lastRefNum,
          searchOption: data.searchOption,
          msgJournal: data.msgJournal,
          paymentOption: data.paymentOption,
          user: data.user,
          segment: data.segment,
          createdAt: timestamp,
          updatedAt: timestamp
        }
      }
    })
    // end count
    for (let i = 0; i < lines.length; i += 25) {
      const upperLimit = Math.min(i + 25, lines.length)
      const newItems = lines.slice(i, upperLimit)
      try {
        await dynamoDb
          .batchWrite({
            RequestItems: {
              [table]: newItems
            }
          })
          .promise()
      } catch (e) {
        console.log('arr ', JSON.stringify(e), JSON.stringify(newItems))
        console.error('There was an error while processing the request')
        break
      }
    }
    // response back
    return {
      statusCode: code.httpStatus.Created,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*' // to allow cross origin access
      },
      body: json.responseBody(code.httpStatus.Created, Session, message.msg.ItemCreatedSuccessed, '', 1)
    }
  } catch (e) {
    console.log('error ', e)
  }
}
module.exports.collection = async (event) => {
  const table = process.env.item_table
  const instituteId = event.pathParameters.institute_id
  const data = JSON.parse(event.body)
  const params = {
    ExpressionAttributeValues: {
      ':sk': instituteId,
      ':startDate': data.startDate,
      ':endDate': data.endDate
    },
    IndexName: 'InstGSI',
    KeyConditionExpression: 'instituteId = :sk And gsisk BETWEEN :startDate AND :endDate',
    TableName: table
  }
  try {
    const d = await dynamoDb.query(params).promise()
    return {
      statusCode: code.httpStatus.OK,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*' // to allow cross origin access
      },
      body: json.responseBody(code.httpStatus.OK, d.Items, message.msg.FetchSuccessed, '', 1)
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
module.exports.reconcile = async (event) => {
  try {
    const timestamp = new Date().toJSON()
    const data = JSON.parse(event.body)
    const table = process.env.item_table
    const instituteId = event.pathParameters.institute_id
    const sk = instituteId
    let head
    const lines = []
    if (data.id === undefined || data.id === '') {
      head = 'recon-' + uuid.v1()
    } else {
      head = data.id
    }
    const pk = head
    const Recon = {
      sk: sk,
      pk: pk,
      number: data.number,
      lastNumber: data.lastNumber,
      issuedDate: data.issuedDate,
      endingBalanceDate: data.endingBalanceDate,
      actualAmount: data.actualAmount,
      endingBalance: data.endingBalance,
      varianceAmount: data.varianceAmount,
      account: data.account,
      adjustmentAccount: data.adjustmentAccount,
      session: data.session,
      user: data.user,
      type: data.type,
      reconcileEntries: data.reconcileEntries,
      is_draft: data.is_draft,
      created_by: data.created_by,
      modified_by: data.modified_by,
      journalId: data.journalId,
      countNotes: data.countNotes,
      createdAt: timestamp,
      updatedAt: timestamp
    }
    lines.push({
      PutRequest: {
        Item: {
          sk: sk,
          pk: pk,
          number: data.number,
          lastNumber: data.lastNumber,
          issuedDate: data.issuedDate,
          endingBalanceDate: data.endingBalanceDate,
          actualAmount: data.actualAmount,
          endingBalance: data.endingBalance,
          varianceAmount: data.varianceAmount,
          account: data.account,
          adjustmentAccount: data.adjustmentAccount,
          session: data.session,
          user: data.user,
          type: data.type,
          reconcileEntries: data.reconcileEntries,
          is_draft: data.is_draft,
          created_by: data.created_by,
          modified_by: data.modified_by,
          journalId: data.journalId,
          gsisk: 'recon#' + data.user.email + '#' + event.pathParameters.institute_id + '#' + data.issuedDate,
          countNotes: data.countNotes,
          createdAt: timestamp,
          updatedAt: timestamp
        }
      }
    })
    if (data.is_draft !== 1) {
      const mtcount = {
        TableName: table,
        Key: {
          pk: data.session.pk,
          sk: event.pathParameters.institute_id + '-ses'
        },
        ExpressionAttributeValues: {
          ':gsisk': data.user.email + '#' + event.pathParameters.institute_id + '#2',
          ':countNotes': data.countNotes,
          ':endDate': data.endingBalanceDate,
          ':actualAmount': data.actualAmount,
          ':status': 2
        },
        ExpressionAttributeNames: {
          '#gsisk': 'gsisk',
          '#countNotes': 'countNotes',
          '#endDate': 'endDate',
          '#actualAmount': 'actualAmount',
          '#status': 'status'
        },
        UpdateExpression: 'set #gsisk = :gsisk, #countNotes = :countNotes, #endDate = :endDate, #actualAmount = :actualAmount, #status = :status',
        ReturnValues: 'UPDATED_NEW'
      }
      await dynamoDb.update(mtcount).promise()
    }
    // end count
    for (let i = 0; i < lines.length; i += 25) {
      const upperLimit = Math.min(i + 25, lines.length)
      const newItems = lines.slice(i, upperLimit)
      try {
        await dynamoDb
          .batchWrite({
            RequestItems: {
              [table]: newItems
            }
          })
          .promise()
      } catch (e) {
        console.log('arr ', JSON.stringify(e), JSON.stringify(newItems))
        console.error('There was an error while processing the request')
        break
      }
    }
    // response back
    return {
      statusCode: code.httpStatus.Created,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*' // to allow cross origin access
      },
      body: json.responseBody(code.httpStatus.Created, Recon, message.msg.ItemCreatedSuccessed, '', 1)
    }
  } catch (e) {
    console.log('error ', e)
  }
}
module.exports.txnreport = async (event) => {
  const table = process.env.item_table
  const instituteId = event.pathParameters.institute_id
  const data = JSON.parse(event.body)
  const params = {
    ExpressionAttributeValues: {
      ':sk': instituteId,
      ':startDate': data.startDate,
      ':endDate': data.endDate
    },
    IndexName: 'GSI1SK',
    KeyConditionExpression: 'sk = :sk And gsisk BETWEEN :startDate AND :endDate',
    TableName: table
  }
  try {
    const d = await dynamoDb.query(params).promise()
    const results = []
    for (const data of d.Items) {
      results.push({
        id: data.pk,
        number: data.number,
        lastNumber: data.lastNumber,
        issuedDate: data.issuedDate,
        endingBalanceDate: data.endingBalanceDate,
        actualAmount: data.actualAmount,
        endingBalance: data.endingBalance,
        varianceAmount: data.varianceAmount,
        account: data.account,
        adjustmentAccount: data.adjustmentAccount,
        session: data.session,
        user: data.user,
        type: data.type,
        reconcileEntries: data.reconcileEntries,
        is_draft: data.is_draft,
        created_by: data.created_by,
        modified_by: data.modified_by,
        journalId: data.journalId
      })
    }
    results.sort(function (a, b) {
      return parseInt(b.lastNumber) - parseInt(a.lastNumber)
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
