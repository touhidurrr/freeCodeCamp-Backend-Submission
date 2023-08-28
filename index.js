const express = require('express');
const app = express();

// Entrypoin
app.get('/', (_, res) => {
  res.end('App is running!');
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

// Request Header Parser Microservice
app.get('/api/whoami', (req, res) => {
});

// listener from freeCodeCamp
const listener = app.listen(process.env.PORT, () => {
  console.log('Your app is listening on port', listener.address().port);
});
