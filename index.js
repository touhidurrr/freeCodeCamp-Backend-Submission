// Request Header Parser Microservice
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

app.listem