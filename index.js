const express = require('express');
const app = express();

// cors for freeCodeCamp (by freeCodeCamp)
const cors = require('cors');
app.use(cors({ optionsSuccessStatus: 200 }));  

// Entrypoint
app.get('/', (_, res) => {
  res.end('App is running!');
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
