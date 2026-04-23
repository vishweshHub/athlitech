const express = require("express");

const app = express();
const PORT = 3000;

app.use(express.json());

const athletes = [
  { id: 1, name: "Sprinter A", sport: "100m", bestTime: 10.21 },
  { id: 2, name: "Sprinter B", sport: "200m", bestTime: 20.45 },
];

app.get("/", (req, res) => {
  res.send("AthliTech API is running 🚀");
});

app.get("/athletes", (req, res) => {
  res.json(athletes);
});

app.listen(PORT, () => {
  console.log("Server running on port 3000");
});
