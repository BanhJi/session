const AWS = require('aws-sdk')
const dynamoDb = new AWS.DynamoDB.DocumentClient()
const uuid = require('uuid')

const addBalanceDaily = async (amt, pkhead, instituteId, issuedDate, reportName, typeId, att) => {
  let result = ''
  try {
    const timestamp = new Date().toJSON()
    const table = process.env.item_table
    // date
    const pd = {
      ExpressionAttributeValues: {
        ':pk': instituteId,
        ':sk': pkhead,
        ':dateType': 'daily',
        ':reportName': reportName,
        ':typeId': typeId,
        ':att': att,
        ':issuedDate': issuedDate
      },
      ExpressionAttributeNames: {
        '#dateType': 'dateType',
        '#reportName': 'reportName',
        '#typeId': 'typeId',
        '#att': 'att',
        '#issuedDate': 'issuedDate'
      },
      KeyConditionExpression: 'pk = :pk and begins_with(sk, :sk)',
      FilterExpression: '#dateType = :dateType and #reportName = :reportName and #typeId = :typeId and #att = :att and #issuedDate = :issuedDate',
      TableName: table
    }
    try {
      const data = await dynamoDb.query(pd).promise()
      let amount = parseFloat(amt)
      let sk = pkhead + uuid.v1()
      // console.log(data.Items, 'dayitem')
      if (data.Items.length > 0) {
        let total = 0
        data.Items.forEach(function (t) {
          total += parseFloat(t.amount)
          sk = t.sk
        })
        amount += total
      }
      const d = {
        pk: instituteId,
        sk: sk,
        amount: amount,
        reportName: reportName,
        issuedDate: issuedDate,
        dateType: 'daily',
        typeId: typeId,
        att: att,
        createdAt: timestamp,
        updatedAt: timestamp
      }
      const params = [
        {
          PutRequest: {
            Item: d
          }
        }
      ]
      try {
        await dynamoDb
          .batchWrite({
            RequestItems: {
              [table]: params
            }
          })
          .promise()
      } catch (err) {
        result = err + 'd01'
      }
    } catch (error) {
      result = error + 'd02'
    }
    // month
    const today = new Date(issuedDate).setDate(1)
    const formatDate = function (date) {
      const ddd = new Date(date)
      let month = '' + (ddd.getMonth() + 1)
      let day = '' + ddd.getDate()
      const year = ddd.getFullYear()

      if (month.length < 2) { month = '0' + month }
      if (day.length < 2) { day = '0' + day }

      return [year, month, day].join('-')
    }
    const m = formatDate(today)
    const pm = {
      ExpressionAttributeValues: {
        ':pk': instituteId,
        ':sk': pkhead,
        ':dateType': 'monthly',
        ':reportName': reportName,
        ':typeId': typeId,
        ':att': att,
        ':month': m
      },
      ExpressionAttributeNames: {
        '#dateType': 'dateType',
        '#reportName': 'reportName',
        '#typeId': 'typeId',
        '#att': 'att',
        '#month': 'month'
      },
      KeyConditionExpression: 'pk = :pk and begins_with(sk, :sk)',
      FilterExpression: '#dateType = :dateType and #reportName = :reportName and #typeId = :typeId and #att = :att and #month = :month',
      TableName: table
    }
    try {
      const dm = await dynamoDb.query(pm).promise()
      let amount = parseFloat(amt)
      let sk = pkhead + uuid.v1()
      if (dm.Items.length > 0) {
        let total = 0
        dm.Items.forEach(function (t) {
          total += parseFloat(t.amount)
          sk = t.sk
        })
        amount += total
      }
      const ddm = {
        pk: instituteId,
        sk: sk,
        amount: amount,
        reportName: reportName,
        month: m,
        dateType: 'monthly',
        typeId: typeId,
        att: att,
        createdAt: timestamp,
        updatedAt: timestamp
      }
      const pmd = [
        {
          PutRequest: { //  todo: add month
            Item: ddm
          }
        }
      ]
      try {
        await dynamoDb
          .batchWrite({
            RequestItems: {
              [table]: pmd
            }
          })
          .promise()
      } catch (err) {
        result = err + 'm01'
      }
    } catch (error) {
      result = error + 'm02'
    }
    // year
    const y = new Date(issuedDate).getFullYear()
    const py = {
      ExpressionAttributeValues: {
        ':pk': instituteId,
        ':sk': pkhead,
        ':dateType': 'yearly',
        ':reportName': reportName,
        ':typeId': typeId,
        ':att': att,
        ':year': y
      },
      ExpressionAttributeNames: {
        '#dateType': 'dateType',
        '#reportName': 'reportName',
        '#typeId': 'typeId',
        '#att': 'att',
        '#year': 'year'
      },
      KeyConditionExpression: 'pk = :pk and begins_with(sk, :sk)',
      FilterExpression: '#dateType = :dateType and #reportName = :reportName and #typeId = :typeId and #att = :att and #year = :year',
      TableName: table
    }
    try {
      const dy = await dynamoDb.query(py).promise()
      let amount = parseFloat(amt)
      let sk = pkhead + uuid.v1()
      if (dy.Items.length > 0) {
        let total = 0
        dy.Items.forEach(function (t) {
          total += parseFloat(t.amount)
          sk = t.sk
        })
        amount += total
      }
      const ddy = {
        pk: instituteId,
        sk: sk,
        amount: amount,
        reportName: reportName,
        year: y,
        dateType: 'yearly',
        typeId: typeId,
        att: att,
        createdAt: timestamp,
        updatedAt: timestamp
      }
      const pmy = [
        {
          PutRequest: { //  todo: add month
            Item: ddy
          }
        }
      ]
      try {
        await dynamoDb
          .batchWrite({
            RequestItems: {
              [table]: pmy
            }
          })
          .promise()
      } catch (err) {
        result = err + 'y01'
      }
    } catch (error) {
      result = error + 'y02'
    }
  } catch (e) {
    result = e + 'top01'
  }
  console.log(result)
}

module.exports = {
  addBalanceDaily
}
