"use strict"

const rp = require('request-promise-native')
const common = require('./common')
const mime = require('mime-types')
const path = require('path')
const secrets = require('./secrets')


const s3 = new common.aws.S3()


/**
 * Downloads a file from Dropbox and then uploads it to S3.
 *
 * @param event.operation - 'sync'
 * @param event.path - path to the file
 */
function upload(event, callback) {

  const getOptions = {
    url: 'https://content.dropboxapi.com/2/files/download',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${secrets.DROPBOX_TOKEN}`,
      'Dropbox-API-Arg': JSON.stringify({ path: common.toDropboxPath(event.path) })
    },
    gzip: true,
    encoding: null,
    resolveWithFullResponse: true
  }

  console.log('downloading from dropbox: ' + event.path)
  rp(getOptions)
    .on('error', callback)
    .then((response) => {

      const s3Path = common.toS3Path(event.path)
      const putOptions = {
        ACL: 'public-read',
        Bucket: 'sunvalleybronze.com',
        Key: s3Path,
        Body: new Buffer(response.body),
        ContentDisposition: `inline; filename=\"${path.basename(event.path)}\"`,
        ContentType: mime.lookup(event.path) || 'application/octet-stream'
      }

      console.log('uploading to s3: ' + s3Path)
      s3.putObject(putOptions, function (err, data) {
        callback(err, data)
      })

    })
    .catch((err) => {
      callback(err)
    })
}


function del(event, callback) {

  const s3Path = common.toS3Path(event.path)
  const delOptions = {
    Bucket: 'sunvalleybronze.com',
    Key: s3Path,
  }

  console.log('uploading to s3: ' + s3Path)
  s3.deleteObject(delOptions, function (err, data) {
    callback(err, data)
  })
}

/**
 * Transfers a file from Dropbox to S3 or deletes a file on S3. Invoked by the 'webhook' operation.
 *
 * @param event.operation - 'sync'
 * @param event.deleted - true if the file is to be deleted
 * @param event.path - path to the file
 */
function sync(event, context, callback) {
  if (event.deleted) {
    del(event, callback);
  } else {
    upload(event, callback);
  }
}

module.exports = sync
