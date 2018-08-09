const { Client } = require("pg");
const connectionString =
  "postgres://someuser:somepassword@somehost:381/somedatabase";

const client = new Client({ connectionString: connectionString });
client.connect();

client.query(
  "CREATE TABLE users (email TEXT PRIMARY KEY, token TEXT);",
  (err, res) => {
    console.log(err, res);
  }
);
client.query(
  "CREATE TABLE emails (subject TEXT, from_ TEXT, to_ TEXT, url TEXT, status INT, id SERIAL);",
  (err, res) => {
    console.log(err, res);
  }
);
