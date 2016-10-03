"use strict"

const link = require('./link')
const list = require('./list')
const recentUpdates = require('./recentUpdates')
const sync = require('./sync')
const webhook = require('./webhook')


process.env.PATH = process.env.PATH + ':' + process.env.LAMBDA_TASK_ROOT


/** Operation requested by client -> handler */
const OPERATION_MAP = {
  'link': link,
  'list': list,
  'recentUpdates': recentUpdates,
  'sync': sync,
  'webhook': webhook
}

/** Main entry point. */
exports.handler = function (event, context, callback) {
  try {
    if (OPERATION_MAP[event.operation]) {
      OPERATION_MAP[event.operation](event, context, callback)
    } else {
      callback(`Unknown operation: ${event.operation || '(none provided)'}`)
    }
  } catch (err) {
    callback(err)
  }
}
