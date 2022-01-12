'use strict'

module.exports.responseBody = function (code, data, msg, error, total) {
  return JSON.stringify(
    {
      statusCode: code,
      data: data,
      message: msg,
      error: error,
      total: total
    }
  )
}
