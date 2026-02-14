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


async function isCountryVisited(countryCode) {
  const result = await db.query(
    "SELECT country_code FROM visited_country WHERE country_code = $1",
    [countryCode]
  );
  return result.rows.length > 0;
}

// HOME ROUTE
app.get("/", async (req, res) => {
  try {
    const result = await db.query("SELECT country_code FROM visited_country");
    const visitedCountries = result.rows.map((row) => row.country_code);
    res.render("index.ejs", {
      countries: visitedCountries,
      total: visitedCountries.length,
    });
  } catch (err) {
    console.error("Error executing query", err.stack);
    res.status(500).send("Database error");
  }
});



// POST ROUTE
app.post("/add", async (req, res) => {
  try {
    const userCountry = req.body.country?.trim();

    if (!userCountry) {
      throw new Error("No country to add");
    }

    const countryResult = await db.query(
      "SELECT country_code FROM countries WHERE LOWER(country_name) LIKE '%' || $1 || '%'",
      [userCountry.toLowerCase()]
    );

    if (countryResult.rows.length === 0) {
      throw new Error("No country found, check the spelling");
    }

    const userCountryCode = countryResult.rows[0].country_code;
    try {
      const alreadyVisited = await isCountryVisited(userCountryCode);
      if (alreadyVisited) {
        throw new Error("Country is already visited.");
      }

      await db.query(
        "INSERT INTO visited_country (country_code) VALUES ($1)",
        [userCountryCode]
      );

      return res.redirect("/");
    } catch (err) {
      const result = await db.query("SELECT country_code FROM visited_country");
      const visitedCountries = result.rows.map((row) => row.country_code);
      return res.render("index.ejs", {
        countries: visitedCountries,
        total: visitedCountries.length,
        error: err.message || "Database error",
      });
    }
  } catch (err) {
    const result = await db.query("SELECT country_code FROM visited_country");
    const visitedCountries = result.rows.map((row) => row.country_code);
    return res.render("index.ejs", {
      countries: visitedCountries,
      total: visitedCountries.length,
      error: err.message || "Database error",
    });
  }
});



// LISTEN TO SERVER
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
