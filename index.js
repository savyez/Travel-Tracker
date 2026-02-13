import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import pg from "pg";

dotenv.config({path: ".env"});

const app = express();
const port = 3000;

const db = new pg.Client({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
});
db.connect();


app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));



app.get("/", async (req, res) => {
  try {
    const result = await db.query("SELECT country_code FROM visited_country");
    const visited_countries = result.rows.map((row) => row.country_code);
    const total_country = visited_countries.length;

    res.render("index.ejs", {
      countries: visited_countries,
      total: total_country,
    });
  } catch (err) {
    console.error("Error executing query", err.stack);
    res.status(500).send("Database error");
  }
});




app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
