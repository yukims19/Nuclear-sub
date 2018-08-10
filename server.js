const express = require("express");
const app = express();
const bodyParser = require("body-parser");
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));

const port = process.env.PORT || 5000;
const { Client } = require("pg");
const escape = require("pg-escape");
const fetch = require("node-fetch");
const idx = require("idx");

const connectionString = process.env.DATABASE_URL;

const client = new Client({ connectionString: connectionString });
client.connect();

app.post("/store", (req, res) => {
  const data = req.body.data;
  const values = [];
  if (!data) {
    res.send({ error: "No Data Found" });
  } else {
    for (let i = 0; i < data.length; i++) {
      //TODO:Check when login works & fix url

      if (
        !idx(
          data[i],
          _ => _.expanded.messages[0].payload.listUnsubscribe.http[0]
        )
      ) {
        console.log("no link!");
        continue;
      }
      const subject = idx(data[i], _ => _.expanded.messages[0].payload.subject);
      const from = idx(data[i], _ => _.expanded.messages[0].payload.from);
      const to = idx(data[i], _ => _.expanded.messages[0].payload.to);
      const url = idx(
        data[i],
        _ => _.expanded.messages[0].payload.listUnsubscribe.http[0]
      );
      values.push(
        "('" + subject + "', '" + from + "', '" + to + "', '" + url + "')"
      );
    }
    const sqlValues = values.join(", ");
    const sql = escape("INSERT INTO emails values %s", sqlValues);
    client.query(sql, (error, response) => {
      res.send(response);
    });
  }
});

app.post("/login", (req, res) => {
  const token = req.body.token;
  const email = req.body.email;
  const sql = escape(
    "UPDATE users SET token=%L WHERE email=%L; INSERT INTO users (email, token) SELECT %L, %L WHERE NOT EXISTS (SELECT * FROM users WHERE email= %L);",
    token,
    email,
    email,
    token,
    email
  );
  client.query(sql, (error, response) => {
    res.send(response);
  });
});

app.post("/unsubscribe", async (req, res) => {
  let emailReturnList = [];
  async function unsubscribe() {
    const sql = escape(
      "SELECT id, url FROM emails WHERE status IS NULL limit 5;"
    );
    const emailsRes = await client.query(sql);
    try {
      const resData = emailsRes.rows;
      (async function loop() {
        for (let i = 0; i < resData.length; i++) {
          emailReturnList.push(resData[i].url);
          fetch(resData[i].url)
            .then(response => console.log(response.status))
            .catch(error => console.log(error));
          const sqlStatus = escape(
            "UPDATE emails SET status = 1 WHERE id = '%s'",
            resData[i].id
          );
          client
            .query(sqlStatus)
            .then(response => console.log(response))
            .catch(error => console.log(error));
        }
      })();
    } catch (emailsRes) {
      console.error(emailsRes);
    }
  }
  unsubscribe().then(() => res.send({ unsubscribedEmails: emailReturnList }));

  /*
  let emailReturnList = [];
  async function unsubscribe() {
    const sql = escape(
      "SELECT id, url FROM emails WHERE status IS NULL limit 5;"
    );
    const emailsRes = await client.query(sql);
    const resData = emailsRes.rows;

    await Promise.all(
      resData.map(async data => {
        try {
          await fetch(data.url);
          emailReturnList.push(data.url);
          const sqlStatus = escape(
            "UPDATE emails SET status = 1 WHERE id = '%s'",
            data.id
          );
          await client.query(sqlStatus);
        } catch (e) {
          console.error(e);
        }
      })
    );
  }
  unsubscribe().then(() => res.send({ unsubscribedEmails: emailReturnList }));*/
});

app.get("/status", async (req, res) => {
  let allEmails = 0;
  let count = 0;
  const sqlAllEmails = "SELECT count(*) FROM emails";
  try {
    const allEmailsRes = await client.query(sqlAllEmails);
    allEmails = allEmailsRes.rows[0].count;
  } catch (allEmailsRes) {
    console.error("Failed to get data from DB:" + allEmailsRes);
  }

  const sqlCount = escape("SELECT count(*) FROM emails WHERE status = 1");
  const countRes = await client.query(sqlCount);
  try {
    count = countRes.rows[0].count;
  } catch (countRes) {
    console.error("Failed to get data from DB:" + countRes);
  }

  res.send({ allEmails: allEmails, count: count });
});

app.listen(port, function() {
  console.error(`Listening on port ${port}`);
});
