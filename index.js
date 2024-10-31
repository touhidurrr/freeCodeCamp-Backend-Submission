const express = require("express");
const multer = require("multer");
const app = express();

// cors for freeCodeCamp (by freeCodeCamp)
const cors = require("cors");
app.use(cors({ optionsSuccessStatus: 200 }));

// server static files
app.use(express.static(process.cwd() + "/public"));
app.use("/public", express.static(process.cwd() + "/public"));

// parse json
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Entrypoint
app.get("/", (_, res) => {
  res.end("App is running!");
});

// File Metadata Microservice
const upload = multer({ dest: "uploads/" });
app.post("/api/fileanalyse", upload.single("upfile"), (req, res) => {
  const { originalname: name, mimetype: type, size } = req.file;
  res.json({ name, type, size });
});

// Exercise Tracker Microservice
const ObjectID = require("bson-objectid");

app.post("/api/users", async ({ body: { username } }, res) => {
  const _id = ObjectID();
  const user = { _id, username };
  await db.set(`fcc-backend-et:users:${_id}`, user);
  res.json(user);
});

app.get("/api/users", async (_, res) => {
  const userIds = await db.list("fcc-backend-et:users:");
  const users = await Promise.all(userIds.map((id) => db.get(id)));
  res.json(users);
});

app.post("/api/users/:_id/exercises", async (req, res) => {
  let { description, duration, date } = req.body;
  duration = +duration;
  date = date ? new Date(date).toDateString() : new Date().toDateString();

  const { _id } = req.params;
  const exercise = { date, description, duration };
  const [user] = await Promise.all([
    db.get(`fcc-backend-et:users:${_id}`),
    db.set(`fcc-backend-et:user-logs:${_id}:${ObjectID()}`, exercise),
  ]);

  res.json({ ...user, ...exercise });
});

app.get("/api/users/:_id/logs", async (req, res) => {
  const { _id } = req.params;
  const [user, logIds] = await Promise.all([
    db.get(`fcc-backend-et:users:${_id}`),
    db.list(`fcc-backend-et:user-logs:${_id}`),
  ]);

  let log = await Promise.all(logIds.map((logId) => db.get(logId)));

  let { from, to, limit } = req.query;
  from = new Date(from || 0).valueOf();
  to = !to ? null : new Date(to).valueOf();

  log = log.filter(({ date }) => {
    date = new Date(date).valueOf();
    return date >= from && (to === null || date <= to);
  });

  if (limit) log = log.slice(0, +limit);
  res.json({ ...user, log, count: log.length });
});

// URL Shortener Microservice
const { Database } = require("bun:sqlite");
const db = new Database(":memory:");

const isValidURL = (url) => {
  try {
    const newUrl = new URL(url);
    return ["http:", "https:"].includes(newUrl.protocol);
  } catch (e) {
    return false;
  }
};

app.post("/api/shorturl", async ({ body: { url } }, res) => {
  if (!isValidURL(url)) {
    res.json({ error: "invalid url" });
    return;
  }

  const count = (await db.get("fcc-backend-shorturl:count")) + 1;
  await Promise.all([
    db.set("fcc-backend-shorturl:count", count),
    db.set(`fcc-backend-shorturl:${count}`, url),
  ]);

  res.json({ original_url: url, short_url: count });
});

app.get("/api/shorturl/:serial", async ({ params: { serial } }, res) => {
  const url = await db.get(`fcc-backend-shorturl:${serial}`);
  res.redirect(url);
});

// Request Header Parser Microservice
app.get("/api/whoami", (req, res) => {
  res.json({
    ipaddress: req.ip,
    language: req.get("accept-language"),
    software: req.get("user-agent"),
  });
});

// Timestamp Microservice
app.get("/api/:dateString?", function (req, res) {
  const {
    params: { dateString },
  } = req;

  const timestamp = !dateString ? Date.now() : +dateString;
  const date = new Date(timestamp || dateString);
  const unix = date.valueOf();
  const utc = date.toUTCString();

  if (!unix) {
    res.json({ error: "Invalid Date" });
    return;
  }

  res.json({ unix, utc });
});

// start server
const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Server started on:", listener.address());
});

process.on("error", (err) => console.log(err));
process.on("uncaughtException", (err) => console.log(err));
