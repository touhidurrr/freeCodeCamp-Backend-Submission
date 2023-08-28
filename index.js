const express = require('express');
const app = express();

// cors for freeCodeCamp (by freeCodeCamp)
const cors = require('cors');
app.use(cors({ optionsSuccessStatus: 200 }));

// parse json
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Entrypoint
app.get('/', (_, res) => {
  res.end('App is running!');
});

// URL Shortener Microservice
const Database = require("@replit/database");
const db = new Database();

const isValidURL = (url) => {
  try {
    const newUrl = new URL(url);
    return ['http:', 'https:'].includes(newUrl.protocol);
  } catch (e) {
    return false;
  }
}

app.post('/api/shorturl', async ({ body: { url }}, res) => {
  if (!isValidURL(url)) {
    res.json({ error: 'invalid url' });
    return;
  }

  const count = await db.get('fcc-backend-shorturl:count') + 1;
  await Promise.all([
    db.set('fcc-backend-shorturl:count', count),
    db.set(`fcc-backend-shorturl:${count}`, url),
  ]);

  res.json({ original_url: url, short_url: count });
});

app.get('/api/shorturl/:serial', async ({ params: { serial } }, res) => {
  const url = await db.get(`fcc-backend-shorturl:${serial}`);
  res.redirect(url);
});

// Request Header Parser Microservice
app.get('/api/whoami', (req, res) => {
  res.json({
    ipaddress: req.ip,
    language: req.get('accept-language'),
    software: req.get('user-agent')
  });
});

// Timestamp Microservice
app.get("/api/:dateString?", function (req, res) {
  const { params: { dateString } } = req;

  const timestamp = !dateString ? Date.now() : +dateString;
  const date = new Date(timestamp || dateString);
  const unix = date.valueOf();
  const utc = date.toUTCString();

  if (!unix) {
    res.json({ error : "Invalid Date" });
    return;
  }

  res.json({ unix, utc });
});

// listener from freeCodeCamp
const listener = app.listen(process.env.PORT, () => {
  console.log('Your app is listening on port', listener.address().port);
});
