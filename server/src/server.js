import app from "./app.js";
import config from "./config/index.js";

const PORT = config.port;

app.get("/", (req, res) => {
  res.status(200).send("Voice Assistant working properly");
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
