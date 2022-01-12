'use strict'

const AWS = require('aws-sdk')
const code = require('../../config/code.js')
const message = require('../../config/message.js')
const json = require('../../config/response.js')
const uuid = require('uuid')
// const myFunc = require('../functions/functions')

const dynamoDb = new AWS.DynamoDB.DocumentClient()

module.exports.index = async (event) => {
  try {
    const timestamp = new Date().toJSON()
    const data = JSON.parse(event.body)
    const table = process.env.item_table
    const instituteId = event.pathParameters.institute_id
    const sk = instituteId + '-fin-loan'
    let head
    const lines = []
    if (data.id === undefined || data.id === '') {
      head = 'fin-loan-' + uuid.v1()
    } else {
      head = data.id
    }
    const pk = head
    let outStandingBalance = 0
    if (data.status === 'approved') {
      outStandingBalance = data.approvedAmount
    }
    const Loan = {
      sk: sk,
      pk: pk,
      id: pk,
      issuedDate: data.issuedDate,
      financialInstitutions: data.financialInstitutions,
      amount: data.amount,
      name: data.name,
      typeOfLoan: data.typeOfLoan,
      currency: data.currency,
      description: data.description,
      status: data.status,
      outStandingBalance: parseFloat(outStandingBalance),
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
      exchangeRate: data.exchangeRate,
      segment: data.segment,
      location: data.location,
      createdAt: timestamp,
      updatedAt: timestamp
    }
    // check count
    const cpara = {
      ExpressionAttributeValues: {
        ':sk': event.pathParameters.institute_id,
        ':pk': 'fin-loancount-'
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
              pk: 'fin-loancount-' + uuid.v1(),
              totalCount: startCount
            }
          }
        })
      }
    }
    // end count
    lines.push({
      PutRequest: {
        Item: {
          sk: sk,
          pk: pk,
          issuedDate: data.issuedDate,
          financialInstitutions: data.financialInstitutions,
          amount: data.amount,
          name: data.name,
          typeOfLoan: data.typeOfLoan,
          currency: data.currency,
          description: data.description,
          status: data.status,
          outStandingBalance: parseFloat(outStandingBalance),
          availableCredit: data.availableCredit,
          approvedAmount: data.approvedAmount,
          interestRate: data.interestRate,
          saveOption: data.saveOption,
          sortIndex: data.isEdit === false ? startCount : data.sortIndex,
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
          exchangeRate: data.exchangeRate,
          segment: data.segment,
          location: data.location,
          createdAt: timestamp,
          updatedAt: timestamp
        }
      }
    })
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
      body: json.responseBody(code.httpStatus.Created, Loan, message.msg.ItemCreatedSuccessed, '', 1)
    }
  } catch (e) {
    console.log('error ', e)
  }
}
module.exports.receipt = async (event) => {
  try {
    const timestamp = new Date().toJSON()
    const data = JSON.parse(event.body)
    const table = process.env.item_table
    const instituteId = event.pathParameters.institute_id
    const sk = instituteId
    let head
    const lines = []
    if (data.id === undefined || data.id === '') {
      head = 'fin-receipt-' + uuid.v1()
    } else {
      head = data.id
    }
    const pk = head
    const R = {
      sk: sk,
      pk: pk,
      id: pk,
      loan: data.loan,
      issuedDate: data.issuedDate,
      abbr: data.abbr,
      number: data.number,
      cashItemLine: data.cashItemLine,
      relateCostItemLine: data.relateCostItemLine,
      journalId: data.journalId,
      journal: data.journal,
      user: data.user,
      lastNumber: data.lastNumber,
      exchangeRate: data.exchangeRate,
      receivedAmount: data.receivedAmount,
      createdAt: timestamp,
      updatedAt: timestamp
    }
    lines.push({
      PutRequest: {
        Item: {
          sk: sk,
          pk: pk,
          loan: data.loan,
          issuedDate: data.issuedDate,
          abbr: data.abbr,
          number: data.number,
          cashItemLine: data.cashItemLine,
          relateCostItemLine: data.relateCostItemLine,
          journalId: data.journalId,
          journal: data.journal,
          user: data.user,
          lastNumber: data.lastNumber,
          exchangeRate: data.exchangeRate,
          receivedAmount: data.receivedAmount,
          createdAt: timestamp,
          updatedAt: timestamp
        }
      }
    })
    // add transaction
    lines.push({
      PutRequest: {
        Item: {
          sk: data.loan.id,
          pk: 'fin-txn-' + uuid.v1(),
          loan: data.loan,
          issuedDate: data.issuedDate,
          number: data.abbrNumber,
          amount: parseFloat(data.receivedAmount),
          user: data.user,
          exchangeRate: data.exchangeRate,
          type: 'loan receipt',
          createdAt: timestamp,
          updatedAt: timestamp
        }
      }
    })
    if (Object.prototype.hasOwnProperty.call(data.loan, 'id')) {
      lines.push({
        PutRequest: {
          Item: {
            sk: data.loan.id,
            pk: pk,
            name: data.loan.name,
            receiptData: R,
            deleted: 0,
            createdAt: timestamp,
            updatedAt: timestamp
          }
        }
      })
      const tparams = {
        TableName: table,
        Key: {
          pk: data.loan.id,
          sk: event.pathParameters.institute_id + '-fin-loan'
        },
        ExpressionAttributeValues: {
          ':status': 'active'
        },
        ExpressionAttributeNames: {
          '#status': 'status'
        },
        UpdateExpression: 'set #status = :status',
        ReturnValues: 'UPDATED_NEW'
      }
      await dynamoDb.update(tparams).promise()
      // balance
      const myFunc = require('../functions/functions')
      await myFunc.addBalanceDaily(parseFloat(data.loan.outStandingBalance) * parseFloat(data.loan.exchangeRate.rate), 'fin-loan-bal-', instituteId, data.issuedDate, 'loanBalanceReport', data.loan.typeOfLoan.uuid, '')
      for (const sche of data.loan.schedules) {
        if (sche.date !== 'Total') {
          lines.push({
            PutRequest: {
              Item: {
                sk: instituteId,
                pk: 'fin-loansche-' + uuid.v1(),
                data: sche,
                loan: data.loan,
                financialInstitutions: data.loan.financialInstitutions,
                receiptDate: sche.date,
                bankId: data.loan.financialInstitutions.uuid,
                bankName: data.loan.financialInstitutions.name,
                loanNumber: data.loan.number,
                loanId: data.loan.id,
                exchangeRate: data.loan.exchangeRate,
                status: 1,
                receiptId: '',
                createdAt: timestamp,
                updatedAt: timestamp
              }
            }
          })
        }
      }
      // update balance
      const bpara = {
        ExpressionAttributeValues: {
          ':sk': event.pathParameters.institute_id,
          ':pk': 'fin-balance-'
        },
        Limit: 1,
        IndexName: 'GSI1',
        KeyConditionExpression: 'sk = :sk and begins_with(pk, :pk)',
        TableName: table
      }
      const loanBal = await dynamoDb.query(bpara).promise()
      if (loanBal.Items.length > 0) {
        const tparams = {
          TableName: table,
          Key: {
            pk: loanBal.Items[0].pk,
            sk: instituteId
          },
          ExpressionAttributeValues: {
            ':approveLoan': 1,
            ':interestRate': parseFloat(data.loan.interestRate) * parseFloat(data.loan.exchangeRate.rate),
            ':outstandingBalance': parseFloat(data.loan.outStandingBalance) * parseFloat(data.loan.exchangeRate.rate)
          },
          ExpressionAttributeNames: {
            '#approveLoan': 'approveLoan',
            '#interestRate': 'interestRate',
            '#outstandingBalance': 'outstandingBalance'
          },
          UpdateExpression: 'set #approveLoan = #approveLoan + :approveLoan, #interestRate = #interestRate + :interestRate, #outstandingBalance = #outstandingBalance + :outstandingBalance',
          ReturnValues: 'UPDATED_NEW'
        }
        await dynamoDb.update(tparams).promise()
      } else {
        lines.push({
          PutRequest: {
            Item: {
              sk: instituteId,
              pk: 'fin-balance-' + uuid.v1(),
              approveLoan: 1,
              interestRate: parseFloat(data.loan.interestRate) * parseFloat(data.loan.exchangeRate.rate),
              outstandingBalance: parseFloat(data.loan.outStandingBalance) * parseFloat(data.loan.exchangeRate.rate)
            }
          }
        })
      }
    }
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
      body: json.responseBody(code.httpStatus.Created, R, message.msg.ItemCreatedSuccessed, '', 1)
    }
  } catch (e) {
    console.log('error ', e)
  }
}
module.exports.loanpayment = async (event) => {
  try {
    const timestamp = new Date().toJSON()
    const data = JSON.parse(event.body)
    const table = process.env.item_table
    const instituteId = event.pathParameters.institute_id
    const sk = instituteId
    let head
    const lines = []
    if (data.id === undefined || data.id === '') {
      head = 'fin-loanpay-' + uuid.v1()
    } else {
      head = data.id
    }
    const pk = head
    const Loan = {
      sk: sk,
      pk: pk,
      id: pk,
      issuedDate: data.issuedDate,
      cashAccount: data.cashAccount,
      penaltyAccount: data.penaltyAccount,
      number: data.number,
      journal: data.journal,
      journalId: data.journalId,
      loan: data.loan,
      user: data.user,
      exchangeRate: data.exchangeRate,
      schedules: data.schedules,
      penaltyAmount: data.penaltyAmount,
      receiptAmount: data.receiptAmount,
      interestAmount: data.interestAmount,
      principalAmount: data.principalAmount,
      lastNumber: data.lastNumber,
      createdAt: timestamp,
      updatedAt: timestamp
    }
    lines.push({
      PutRequest: {
        Item: {
          sk: sk,
          pk: pk,
          issuedDate: data.issuedDate,
          cashAccount: data.cashAccount,
          penaltyAccount: data.penaltyAccount,
          number: data.number,
          journal: data.journal,
          journalId: data.journalId,
          loan: data.loan,
          user: data.user,
          exchangeRate: data.exchangeRate,
          schedules: data.schedules,
          penaltyAmount: data.penaltyAmount,
          receiptAmount: data.receiptAmount,
          interestAmount: data.interestAmount,
          principalAmount: data.principalAmount,
          lastNumber: data.lastNumber,
          createdAt: timestamp,
          updatedAt: timestamp
        }
      }
    })
    // update loan
    if (Object.prototype.hasOwnProperty.call(data.loan, 'id')) {
      // console.log(data.loan, sk, 'data')
      const lparam = {
        TableName: table,
        Key: {
          pk: data.loan.id,
          sk: sk + '-fin-loan'
        },
        ExpressionAttributeValues: {
          ':outStandingBalance': parseFloat(data.principalAmount)
        },
        ExpressionAttributeNames: {
          '#outStandingBalance': 'outStandingBalance'
        },
        UpdateExpression: 'set #outStandingBalance = #outStandingBalance - :outStandingBalance',
        ReturnValues: 'UPDATED_NEW'
      }
      await dynamoDb.update(lparam).promise()
      // balance
      const myFunc = require('../functions/functions')
      await myFunc.addBalanceDaily(parseFloat(data.principalAmount) * parseFloat(data.exchangeRate.rate), 'fin-loan-repayment-bal-', instituteId, data.issuedDate, 'loanRepaymentReport', '', '')
    }
    // update schedule
    for (const sche of data.schedules) {
      const t = {
        TableName: table,
        Key: {
          pk: sche.id,
          sk: event.pathParameters.institute_id
        },
        ExpressionAttributeValues: {
          ':status': 2,
          ':receiptId': pk
        },
        ExpressionAttributeNames: {
          '#status': 'status',
          '#receiptId': 'receiptId'
        },
        UpdateExpression: 'set #status = :status, #receiptId = :receiptId',
        ReturnValues: 'UPDATED_NEW'
      }
      await dynamoDb.update(t).promise()
      // console.log(data.schedules, 'schedule')
    }
    // update balance
    const bpara = {
      ExpressionAttributeValues: {
        ':sk': event.pathParameters.institute_id,
        ':pk': 'fin-balance-'
      },
      Limit: 1,
      IndexName: 'GSI1',
      KeyConditionExpression: 'sk = :sk and begins_with(pk, :pk)',
      TableName: table
    }
    const loanBal = await dynamoDb.query(bpara).promise()
    if (loanBal.Items.length > 0) {
      const tparams = {
        TableName: table,
        Key: {
          pk: loanBal.Items[0].pk,
          sk: instituteId
        },
        ExpressionAttributeValues: {
          ':outstandingBalance': parseFloat(data.principalAmount) * parseFloat(data.exchangeRate.rate)
        },
        ExpressionAttributeNames: {
          '#outstandingBalance': 'outstandingBalance'
        },
        UpdateExpression: 'set #outstandingBalance = #outstandingBalance - :outstandingBalance',
        ReturnValues: 'UPDATED_NEW'
      }
      await dynamoDb.update(tparams).promise()
      // console.log(loanBal, 'loan balance')
    }
    // add transaction
    lines.push({
      PutRequest: {
        Item: {
          sk: data.loan.id,
          pk: 'fin-txn-' + uuid.v1(),
          loan: data.loan,
          issuedDate: data.issuedDate,
          number: data.number,
          amount: parseFloat(data.receiptAmount),
          user: data.user,
          exchangeRate: data.exchangeRate,
          type: 'loan payment',
          createdAt: timestamp,
          updatedAt: timestamp
        }
      }
    })
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
      body: json.responseBody(code.httpStatus.Created, Loan, message.msg.ItemCreatedSuccessed, '', 1)
    }
  } catch (e) {
    console.log('error ', e)
  }
}
module.exports.closeloan = async (event) => {
  try {
    const timestamp = new Date().toJSON()
    const data = JSON.parse(event.body)
    const myFunc = require('../functions/functions')
    const table = process.env.item_table
    const instituteId = event.pathParameters.institute_id
    let head
    const lines = []
    if (data.id === undefined || data.id === '') {
      head = 'fin-closeloan-' + uuid.v1()
    } else {
      head = data.id
    }
    const pk = head
    const Loan = {
      sk: instituteId,
      pk: pk,
      issuedDate: data.issuedDate,
      number: data.number,
      loan: data.loan,
      lastNumber: data.lastNumber,
      abbr: data.abbr,
      exchangeRate: data.exchangeRate,
      rate: data.rate,
      note: data.note,
      penalty: data.penalty,
      referenceNumber: data.referenceNumber,
      journalId: data.journalId,
      schedules: data.schedules,
      user: data.user,
      totalAmount: data.totalAmount,
      interest: data.interest,
      principal: data.principal,
      penaltyAccount: data.penaltyAccount,
      cashAccount: data.cashAccount,
      createdAt: timestamp,
      updatedAt: timestamp
    }
    lines.push({
      PutRequest: {
        Item: {
          sk: instituteId,
          pk: pk,
          issuedDate: data.issuedDate,
          number: data.number,
          loan: data.loan,
          lastNumber: data.lastNumber,
          abbr: data.abbr,
          exchangeRate: data.exchangeRate,
          rate: data.rate,
          note: data.note,
          penalty: data.penalty,
          referenceNumber: data.referenceNumber,
          journalId: data.journalId,
          schedules: data.schedules,
          user: data.user,
          totalAmount: data.totalAmount,
          interest: data.interest,
          principal: data.principal,
          penaltyAccount: data.penaltyAccount,
          cashAccount: data.cashAccount,
          createdAt: timestamp,
          updatedAt: timestamp
        }
      }
    })
    // add transaction
    lines.push({
      PutRequest: {
        Item: {
          sk: data.loan.id,
          pk: 'fin-txn-' + uuid.v1(),
          loan: data.loan,
          issuedDate: data.issuedDate,
          number: data.number,
          amount: parseFloat(data.totalAmount),
          user: data.user,
          exchangeRate: data.exchangeRate,
          type: 'close loan',
          createdAt: timestamp,
          updatedAt: timestamp
        }
      }
    })
    // let totalPaid = 0
    let prinPaid = 0
    // let intPaid = 0
    // let reportType = 'customer'
    // if (data.member.id.indexOf('ac-mem-') >= 0) {
    //   reportType = 'member'
    // }
    if (Object.prototype.hasOwnProperty.call(data.loan, 'id')) {
      lines.push({
        PutRequest: {
          Item: {
            sk: data.loan.id,
            pk: pk,
            number: data.loan.number,
            loanData: Loan,
            amount: data.totalAmount,
            deleted: 0,
            createdAt: timestamp,
            updatedAt: timestamp
          }
        }
      })
      // update schedule
      if (data.schedules.length > 0) {
        for (const sche of data.schedules) {
          // totalPaid += parseFloat(sche.data.total)
          prinPaid += parseFloat(sche.data.principal)
          // intPaid += parseFloat(sche.data.interest)
          // update schedule
          const t = {
            TableName: table,
            Key: {
              pk: sche.id,
              sk: event.pathParameters.institute_id
            },
            ExpressionAttributeValues: {
              ':status': 2,
              ':receiptId': pk
            },
            ExpressionAttributeNames: {
              '#status': 'status',
              '#receiptId': 'receiptId'
            },
            UpdateExpression: 'set #status = :status, #receiptId = :receiptId',
            ReturnValues: 'UPDATED_NEW'
          }
          await dynamoDb.update(t).promise()
        }
      }
      // balance repaid
      await myFunc.addBalanceDaily(parseFloat(prinPaid) * parseFloat(data.exchangeRate.rate), 'fin-loan-repayment-bal-', instituteId, data.issuedDate, 'loanRepaymentReport', '', '')
      // update loan
      const lparam = {
        TableName: table,
        Key: {
          pk: data.loan.id,
          sk: instituteId + '-fin-loan'
        },
        ExpressionAttributeValues: {
          ':outStandingBalance': parseFloat(prinPaid) * parseFloat(data.exchangeRate.rate),
          ':status': 'close'
        },
        ExpressionAttributeNames: {
          '#outStandingBalance': 'outStandingBalance',
          '#status': 'status'
        },
        UpdateExpression: 'set #outStandingBalance = #outStandingBalance - :outStandingBalance, #status = :status',
        ReturnValues: 'UPDATED_NEW'
      }
      await dynamoDb.update(lparam).promise()
    }
    // update balance
    const bpara = {
      ExpressionAttributeValues: {
        ':sk': event.pathParameters.institute_id,
        ':pk': 'fin-balance-'
      },
      Limit: 1,
      IndexName: 'GSI1',
      KeyConditionExpression: 'sk = :sk and begins_with(pk, :pk)',
      TableName: table
    }
    const loanBal = await dynamoDb.query(bpara).promise()
    if (loanBal.Items.length > 0) {
      const tparams = {
        TableName: table,
        Key: {
          pk: loanBal.Items[0].pk,
          sk: instituteId
        },
        ExpressionAttributeValues: {
          ':outstandingBalance': parseFloat(prinPaid) * parseFloat(data.exchangeRate.rate)
        },
        ExpressionAttributeNames: {
          '#outstandingBalance': 'outstandingBalance'
        },
        UpdateExpression: 'set #outstandingBalance = #outstandingBalance - :outstandingBalance',
        ReturnValues: 'UPDATED_NEW'
      }
      await dynamoDb.update(tparams).promise()
      // console.log(loanBal, 'loan balance')
    }
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
      body: json.responseBody(code.httpStatus.Created, Loan, message.msg.ItemCreatedSuccessed, '', 1)
    }
  } catch (e) {
    console.log('error ', JSON.stringify(e))
  }
}
