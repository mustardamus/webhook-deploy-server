const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const express = require('express')
const bodyParser = require('body-parser')
const config = require('./config')

const executeScript = payload => {
  const repo = payload.repository
  const scriptName = `${repo.owner.login}-${repo.name}.js`
  const scriptPath = path.join(__dirname, `scripts/${scriptName}`)

  if (!fs.existsSync(scriptPath)) {
    return { status: 404, text: `script ${scriptName} not found` }
  }

  delete require.cache[require.resolve(scriptPath)]
  const script = require(scriptPath)

  if (typeof script !== 'function') {
    return { status: 404, text: 'script must export a function' }
  }

  if (script(payload)) {
    return { status: 200, text: 'ok' }
  } else {
    return { status: 500, text: 'failed' }
  }
}

const app = express()

app.use((req, res, next) => {
  if (!req.headers['x-github-event']) {
    throw new Error('Header x-github-event missing')
  }

  if (!req.headers['x-hub-signature']) {
    throw new Error('Header x-hub-signature missing')
  }

  next()
})

app.use(bodyParser.json({
  verify (req, res, buf) {
    const signature = req.headers['x-hub-signature']
    const sha1 = crypto.createHmac('sha1', config.secret)
    const checkSig = sha1.update(buf).digest('hex')
    const buf1 = Buffer.from(signature, 'utf8')
    const buf2 = Buffer.from(`sha1=${checkSig}`, 'utf8')

    if (!crypto.timingSafeEqual(buf1, buf2)) {
      throw new Error('invalid signature')
    }
  }
}))

app.post(config.path, (req, res) => {
  switch(req.headers['x-github-event']) {
    case 'ping':
      res.status(200).send('pong')
      break
    case 'push':
      if (req.body.ref !== 'refs/heads/master') {
        res.status(401).send('not master branch')
      } else {
        const ret = executeScript(req.body)
        res.status(ret.status).send(ret.text)
      }
      break
    default:
      res.status(404).send('unknown event')
  }
})

app.listen(config.port, () => {
  console.log(`Webhook server started on http://localhost:${config.port}`)
})
