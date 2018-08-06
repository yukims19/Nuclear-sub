const express = require("express");
const app = express();
const bodyParser = require("body-parser");
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));

const port = process.env.PORT || 5000;
const { Client } = require("pg");
const escape = require("pg-escape");

const connectionString =
  "postgres://someuser:somepassword@somehost:381/somedatabase";

const client = new Client({ connectionString: connectionString });
client.connect();

app.post("/emails", (req, res) => {
  const token = req.body.token;
  const data = req.body.data;
  console.log("======================================================");
  const values = data.map(e => {
    const subject = e.expanded.messages[0].payload.subject;
    const from = e.expanded.messages[0].payload.from;
    const to = e.expanded.messages[0].payload.to;
    const url =
      "https://mandrillapp.com/track/click/30254777/mandrillapp.com?p=eyJzIjoibWNYaVl3NmZFTjlUTlRnUWJ4OXg5NElRbEJNIiwidiI6MSwicCI6IntcInVcIjozMDI1NDc3NyxcInZcIjoxLFwidXJsXCI6XCJodHRwOlxcXC9cXFwvbWFuZHJpbGxhcHAuY29tXFxcL3RyYWNrXFxcL3Vuc3ViLnBocD91PTMwMjU0Nzc3JmlkPTRlZjY5MWM5YWFmNTRmNmM5NzBkMjJkZTFhN2I4NDljLmJUeDIycWhEeFBYTHBNU0V3VjRoTXZVSnh6YyUzRCZyPWh0dHBzJTNBJTJGJTJGd3d3LnNtYXJ0cmVjcnVpdGVycy5jb20lMkZ0ZXJtcy1hbmQtY29uZGl0aW9ucyUyRmpvYnMtZm9yLW1lLXVuc3Vic2NyaWJlJTJGJTNGbWRfZW1haWwlM0R5b2wxMDclMjU0MHVjc2QuZWR1XCIsXCJpZFwiOlwiNGVmNjkxYzlhYWY1NGY2Yzk3MGQyMmRlMWE3Yjg0OWNcIixcInVybF9pZHNcIjpbXCI4N2Y5MjNmMTgyODZmYzk3ODAwYTU3MDdlYTIwMmMzYTA0NTAwZmE0XCJdfSJ9";
    return "('" + subject + "', '" + from + "', '" + to + "', '" + url + "')";
  });
  const sqlValues = values.join(", ");
  console.log("======================================================");
  console.log(sqlValues);
  const sql = escape("INSERT INTO emails values %s", sqlValues);
  console.log("======================================================");
  console.log(sql);
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

app.get("/users", (req, res) => {
  /*var sql = "SELECT * FROM people";
  let resData;
  client.query(sql, (error, response) => {
    //console.log(err, res);
    resData = response.rows;
    res.send(resData);
  });*/
  res.send({ name: "yuki" });
});

app.listen(port, function() {
  console.error(`Listening on port ${port}`);
});
