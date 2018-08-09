const express = require("express");
const app = express();
const bodyParser = require("body-parser");
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));

const port = process.env.PORT || 5000;
const { Client } = require("pg");
const escape = require("pg-escape");
const fetch = require("node-fetch");

const connectionString =
  "postgres://someuser:somepassword@somehost:381/somedatabase";

const client = new Client({ connectionString: connectionString });
client.connect();

app.post("/store", (req, res) => {
  console.log("/store here");
  const data = req.body.data;
  let values = [];
  if (!data) {
    res.send({ error: "No Data Found" });
  } else {
    for (let i = 0; i < data.length; i++) {
      //TODO:Check when login works & fix url
      /*
    if (!data[i].expanded.messages[0].payload.listUnsubscribe.http) {
      continue;
    }*/
      const subject = data[i].expanded.messages[0].payload.subject;
      const from = data[i].expanded.messages[0].payload.from;
      const to = data[i].expanded.messages[0].payload.to;
      const url =
        "https://mandrillapp.com/track/click/30254777/mandrillapp.com?p=eyJzIjoibWNYaVl3NmZFTjlUTlRnUWJ4OXg5NElRbEJNIiwidiI6MSwicCI6IntcInVcIjozMDI1NDc3NyxcInZcIjoxLFwidXJsXCI6XCJodHRwOlxcXC9cXFwvbWFuZHJpbGxhcHAuY29tXFxcL3RyYWNrXFxcL3Vuc3ViLnBocD91PTMwMjU0Nzc3JmlkPTRlZjY5MWM5YWFmNTRmNmM5NzBkMjJkZTFhN2I4NDljLmJUeDIycWhEeFBYTHBNU0V3VjRoTXZVSnh6YyUzRCZyPWh0dHBzJTNBJTJGJTJGd3d3LnNtYXJ0cmVjcnVpdGVycy5jb20lMkZ0ZXJtcy1hbmQtY29uZGl0aW9ucyUyRmpvYnMtZm9yLW1lLXVuc3Vic2NyaWJlJTJGJTNGbWRfZW1haWwlM0R5b2wxMDclMjU0MHVjc2QuZWR1XCIsXCJpZFwiOlwiNGVmNjkxYzlhYWY1NGY2Yzk3MGQyMmRlMWE3Yjg0OWNcIixcInVybF9pZHNcIjpbXCI4N2Y5MjNmMTgyODZmYzk3ODAwYTU3MDdlYTIwMmMzYTA0NTAwZmE0XCJdfSJ9";
      values.push(
        "('" + subject + "', '" + from + "', '" + to + "', '" + url + "')"
      );
    }
    const sqlValues = values.join(", ");
    const sql = escape("INSERT INTO emails values %s", sqlValues);
    client.query(sql, (error, response) => {
      console.log(error, response);
      res.send(response);
    });
  }
});

app.post("/login", (req, res) => {
  console.log("/login here");
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
    console.log(error, response);
    res.send(response);
  });
});

app.post("/unsubscribe", async (req, res) => {
  console.log("/unsubscribe here");
  let isFinished = false;
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
});

app.get("/status", async (req, res) => {
  console.log("/status here");
  let allEmails = 0;
  let count = 0;
  const sqlAllEmails = "SELECT count(*) FROM emails";
  const allEmailsRes = await client.query(sqlAllEmails);
  try {
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
