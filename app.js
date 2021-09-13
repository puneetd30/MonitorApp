const express = require('express')
const app = express()
const port = process.env.PORT || 3002
const config = require('./config');
console.log(config);
const path = require('path')
app.use('/static', express.static(path.join(__dirname, 'public')))

var MongoClient = require('mongodb').MongoClient;

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html')
})


app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})

const http = require('http');
const https = require('https');

let map = new Map();
const findApp = () => {
  MongoClient.connect(`${config.url}`, async (err, client) => {

    if (err) throw err;
    let db = client.db();
    db.collection('app').find({}).toArray((err, result) => {
      if (err) throw err;
      result.forEach(r => {
        if (!map.has(r._id)) {
          map.set(r._id, r.url);
          setInterval(req, r.frequency * 1000, r);
        }

      })
    });
  });
}

const req = (app) => {
  try {
    let start = Date.now();
    const httpScheme = app.url.includes('http') ? http : https;
    const options = {
      hostname: app.url,
      method: 'GET',
      headers: app.headers
    }
    console.log(options);

    httpScheme.get(app.url, res => {
      res.on('data', d => {
        const duration = Date.now() - start;
        process.stdout.write(d);
        MongoClient.connect(`${config.url}`, async (err, client) => {
          if (err) throw err;
          const db = client.db();
          db.collection('incidents').findOne({ appName: app._id, state: 'open' }, (err, res) => {
            if (res == null) return;
            db.collection('incidents').updateOne({ _id: res._id },
              { $set: { state: 'closed', endTime: new Date(Date.now()) } },
              { $upsert: true });

          });
          db.collection(`${app._id}`).insertOne({ status: 'up', createTime: new Date(Date.now()), responseTime: duration });

        })
      });
    }).on('error', error => {
      MongoClient.connect(`${config.url}`, async (err, client) => {

        if (err) throw err;
        let db = client.db();
        db.collection(`${app._id}`).insertOne({ status: 'down', createTime: new Date(Date.now()) });
        db.collection('incidents').findOne({ state: 'open', appName: app._id }, (err, res) => {
          if (res != null) return;
          db.collection('incidents').insertOne({
            appName: app._id,
            startTime: new Date(Date.now()),
            state: 'open'
          });
        })
      });

    })
  } catch (err) {
    console.error(err)
  }
}

eval('setInterval(findApp, 1800000)');
