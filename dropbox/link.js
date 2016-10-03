"use strict"

const common = require('./common')
const path = require('path')


const s3 = new common.aws.S3()


/**
 * Gets a link to a Dropbox file's "shadow" on AWS S3.
 *
 * @param event.operation - 'link'
 * @param event.path - Dropbox path to the file
 */
function link(event, context, callback) {

  if (event.path) {

    const s3Path = common.toS3Path(event.path.toLowerCase())
    const url = `https://s3.amazonaws.com/sunvalleybronze.com/${s3Path}`
    const params = {
      Bucket: 'sunvalleybronze.com',
      Key: s3Path,
      ResponseContentDisposition: `attachment; filename=\"${path.basename(event.path)}\"`
    }
    s3.getSignedUrl('getObject', params, (err, signedUrl) => {

      callback(null, {
        link: url,
        downloadLink: signedUrl
      })

    })

  } else {
    callback('The path parameter is required.')
  }
}


module.exports = link
