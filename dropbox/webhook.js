"use strict"

const common = require('./common')
const rp = require('request-promise-native')
const secrets = require('./secrets')


const s3 = new common.aws.S3()


function getDropboxTree() {

  const options = {
    url: 'https://api.dropboxapi.com/2/files/list_folder',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${secrets.DROPBOX_TOKEN}`,
      'Content-Type': 'application/json'
    },
    json: true,
    body: {
      path: '',
      recursive: true
    }
  }

  return rp(options).then((results) => {
    const tree = results.entries
      .filter((entry) => entry['.tag'] === 'file')
      .map((entry) => ({
        path: entry.path_lower.slice(1),  // remove leading slash
        modified: new Date(entry.server_modified)
      }))
      .reduce((obj, entry) => {
        obj[entry.path] = entry
        return obj
      }, {})
    console.info('dropboxTree:', tree)

    return tree
  })
}


function getS3Tree() {
  return new Promise((resolve, reject) => {

    const params = {
      Bucket: 'sunvalleybronze.com'
    }
    s3.listObjectsV2(params, (err, data) => {
      if (err) {
        reject(err)
      } else {
        const tree = data.Contents
          .map((entry) => ({
            path: entry.Key.toLowerCase(),
            modified: entry.LastModified
          }))
          .sort((a, b) => a.path.localeCompare(b.path))
          .reduce((obj, entry) => {
            obj[entry.path] = entry
            return obj
          }, {})
        console.info('s3Tree:', tree)

        resolve(tree)
       }
    })
  })
}


function synchronizeTrees(trees) {

  const dropboxTree = trees[0]
  const s3Tree = trees[1]

  let added = [], changed = [], deleted = []

  for (let key in dropboxTree) {
    if (!s3Tree[key]) {
      added.push(dropboxTree[key].path)
    } else {
      if (dropboxTree[key].modified > s3Tree[key].modified) {
        changed.push(dropboxTree[key].path)
      }
    }
  }

  for (let key in s3Tree) {
    if (s3Tree[key][key.length - 1] !== '/' && !dropboxTree[key]) {
      deleted.push(s3Tree[key].path)
    }
  }

  const delta = { added, changed, deleted }
  console.info('delta:', delta)

  const lambda = new common.aws.Lambda()
  added.forEach((entry) => {

    console.log('invoking sync lambda to upload new file: ' + entry)
    const r = lambda.invoke({
      FunctionName: 'arn:aws:lambda:us-east-1:643105274006:function:dropbox',
      InvocationType: 'Event',
      Payload: JSON.stringify({
        operation: 'sync',
        deleted: false,
        path: entry
      })
    })
    r.send()
  })

  changed.forEach((entry) => {

    console.log('invoking sync lambda to upload modified file: ' + entry)
    const r = lambda.invoke({
      FunctionName: 'arn:aws:lambda:us-east-1:643105274006:function:dropbox',
      InvocationType: 'Event',
      Payload: JSON.stringify({
        operation: 'sync',
        deleted: false,
        path: entry
      })
    })
    r.send()
  })

 deleted.forEach((entry) => {

    console.log('invoking sync lambda to delete file: ' + entry)
    const r = lambda.invoke({
      FunctionName: 'arn:aws:lambda:us-east-1:643105274006:function:dropbox',
      InvocationType: 'Event',
      Payload: JSON.stringify({
        operation: 'sync',
        deleted: true,
        path: entry
      })
    })
    r.send()
  })

  return delta
}

/**
 * Called by Dropbox when the contents of the SVB app's folder have changed.
 *
 * @param event.operation - 'webhook'
 * @param event.payload - payload sent by Dropbox (https://www.dropbox.com/developers/reference/webhooks)
 */
function webhook(event, context, callback) {

  Promise.all([getDropboxTree(), getS3Tree()])
    .then(synchronizeTrees)
    .then((result) => {
      callback(null, result)
    })
    .catch((err) => {
      callback(err)
    })
}


module.exports = webhook
