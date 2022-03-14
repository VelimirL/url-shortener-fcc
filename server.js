require('dotenv').config({ path: 'variables.env' });
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const dns = require('dns');
const urlparser = require('url');

const app = express();

const port = process.env.PORT || 3000;

mongoose.connect(process.env.DATABASE);
mongoose.Promise = global.Promise;
mongoose.connection.on('error', (err) => {
  console.error(`🚫 > ${err.message}`);
});

const urlSchema = mongoose.Schema({
  original_url: {
    type: String,
    required: 'URL is required',
  },
});

const Url = mongoose.model('Url', urlSchema);

app.use(bodyParser.urlencoded({ extended: false }));

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', (req, res) => {
  res.sendFile(`${process.cwd()}/views/index.html`);
});

app.post('/api/shorturl', async (req, res) => {
  try {
    const bodyurl = req.body.url;

    const checkWebsite = dns.lookup(urlparser.parse(bodyurl).hostname, (error, address) => {
      if (!address) {
        res.json({ error: 'Invalid URL' });
      } else {
        const url = new Url({ original_url: bodyurl });
        url.save((err, data) => {
          res.json({ original_url: data.original_url, short_url: data.id });
        });
      }
    });
  } catch (e) {
    console.log(error);
  }
});

app.get('/api/shorturl/:id', (req, res) => {
  const { id } = req.params;
  Url.findById(id, (err, data) => {
    if (!data) {
      res.json({ 404: 'Invalid url' });
    } else {
      res.redirect(data.original_url);
    }
  });
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
