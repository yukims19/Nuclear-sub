const express = require("express");
const app = express();
const bodyParser = require("body-parser");
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));

const port = process.env.PORT || 5000;
const { Client } = require("pg");
const escape = require("pg-escape");
const fetch = require("node-fetch");

//const connectionString =
//  "postgres://someuser:somepassword@somehost:381/somedatabase";

const client = new Client({ connectionString: connectionString });
client.connect();

app.post("/emails", (req, res) => {
  console.log("Got you emails");
  const data = req.body.data;
  const values = data.map(e => {
    const subject = e.expanded.messages[0].payload.subject;
    const from = e.expanded.messages[0].payload.from;
    const to = e.expanded.messages[0].payload.to;
    const url =
      "https://mandrillapp.com/track/click/30254777/mandrillapp.com?p=eyJzIjoibWNYaVl3NmZFTjlUTlRnUWJ4OXg5NElRbEJNIiwidiI6MSwicCI6IntcInVcIjozMDI1NDc3NyxcInZcIjoxLFwidXJsXCI6XCJodHRwOlxcXC9cXFwvbWFuZHJpbGxhcHAuY29tXFxcL3RyYWNrXFxcL3Vuc3ViLnBocD91PTMwMjU0Nzc3JmlkPTRlZjY5MWM5YWFmNTRmNmM5NzBkMjJkZTFhN2I4NDljLmJUeDIycWhEeFBYTHBNU0V3VjRoTXZVSnh6YyUzRCZyPWh0dHBzJTNBJTJGJTJGd3d3LnNtYXJ0cmVjcnVpdGVycy5jb20lMkZ0ZXJtcy1hbmQtY29uZGl0aW9ucyUyRmpvYnMtZm9yLW1lLXVuc3Vic2NyaWJlJTJGJTNGbWRfZW1haWwlM0R5b2wxMDclMjU0MHVjc2QuZWR1XCIsXCJpZFwiOlwiNGVmNjkxYzlhYWY1NGY2Yzk3MGQyMmRlMWE3Yjg0OWNcIixcInVybF9pZHNcIjpbXCI4N2Y5MjNmMTgyODZmYzk3ODAwYTU3MDdlYTIwMmMzYTA0NTAwZmE0XCJdfSJ9";
    return "('" + subject + "', '" + from + "', '" + to + "', '" + url + "')";
  });
  const sqlValues = values.join(", ");
  const sql = escape("INSERT INTO emails values %s", sqlValues);
  client.query(sql, (error, response) => {
    console.log(error, response);
    res.send(response);
  });
});

app.post("/login", (req, res) => {
  console.log("Got you login");
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

app.post("/unsubscribe", (req, res) => {
  console.log("unsubscribing");
  const cursor = req.body.cursor;
  console.log(cursor);
  const sql = escape("SELECT url FROM emails WHERE id > %s limit 2;", cursor);
  client
    .query(sql)
    .then(response => {
      const resData = response.rows;
      console.log(resData);
      resData.forEach(e => {
        if (e) {
          fetch(e.url)
            .then(res => {
              res;
              console.log(res.status);
            })
            .catch(error => {
              console.log(error);
              error;
            });
        }
      });
      res.send(resData);
    })
    .catch(error => {
      console.log(error);
    });
});

app.get("/process", (req, res) => {
  console.log("process here");
  var sql = "SELECT count(*) FROM emails";
  let resData;
  client.query(sql, (error, response) => {
    resData = response.rows;
    res.send(resData);
  });
});

app.listen(port, function() {
  console.error(`Listening on port ${port}`);
});
