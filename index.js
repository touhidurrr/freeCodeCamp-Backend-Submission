const express = require("express");
const multer = require("multer");
const cors = require("cors");
const ObjectID = require("bson-objectid");
const { Database } = require("bun:sqlite");

// our app
const app = express();

// cors for freeCodeCamp (by freeCodeCamp)
app.use(cors({ optionsSuccessStatus: 200 }));

// server static files
app.use(express.static(process.cwd() + "/public"));

// parse json
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// init database
const db = new Database(":memory:");
db.exec(await Bun.file("index.sql").text());

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
const usersPostQuery = db.query(`\
  insert into users(_id, username)
  values(?1, ?2)
  returning *;`);

app.post("/api/users", async ({ body: { username } }, res) => {
  const _id = ObjectID().toHexString();
  res.json(usersPostQuery.get(_id, username));
});

const usersGetQuery = db.query(`select * from users;`);
app.get("/api/users", async (_, res) => {
  res.json(usersGetQuery.all());
});

const exercisesPostQuery = db.query(`\
  insert into exercises(description, duration, date, userid)
  values(?1, ?2, ?3, ?4)
  returning description, duration, date;`);

const exercisesUserQuery = db.query(`\
  select * from users where (_id = ?);
  `);

app.post(
  "/api/users/:_id/exercises",
  async ({ params: { _id }, body: { description, duration, date } }, res) => {
    date = (date ? new Date(date) : new Date()).toDateString();

    const user = exercisesUserQuery.get(_id);
    const exercise = exercisesPostQuery.get(description, duration, date, _id);

    res.json({ ...user, ...exercise });
  },
);

const exercisesGetQuery = db.query(`\
  select description, duration, date
  from exercises where (userid = ?);
  `);

app.get(
  "/api/users/:_id/logs",
  async ({ params: { _id }, query: { from, to, limit } }, res) => {
    const user = exercisesUserQuery.get(_id);
    let log = exercisesGetQuery.all(_id);

    from = new Date(from || 0).valueOf();
    to = !to ? null : new Date(to).valueOf();

    log = log.filter(({ date }) => {
      date = new Date(date).valueOf();
      return date >= from && (to === null || date <= to);
    });

    if (limit) log = log.slice(0, +limit);
    const resp = { ...user, count: log.length, log };
    console.log(resp);
    res.json(resp);
  },
);

// URL Shortener Microservice
const isValidURL = (url) => {
  try {
    const newUrl = new URL(url);
    return ["http:", "https:"].includes(newUrl.protocol);
  } catch (e) {
    return false;
  }
};

const shorturlPostQuery = db.query(
  "insert into shorturl(original_url) values(?) returning *;",
);
app.post("/api/shorturl", async ({ body: { url } }, res) => {
  if (!isValidURL(url)) {
    res.json({ error: "invalid url" });
    return;
  }

  res.json(shorturlPostQuery.get(url));
});

const shorturlGetQuery = db.query(
  "select original_url from shorturl where (short_url = ?);",
);
app.get("/api/shorturl/:serial", async ({ params: { serial } }, res) => {
  res.redirect(shorturlGetQuery.get(serial).original_url);
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
