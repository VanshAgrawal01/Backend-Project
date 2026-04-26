const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

require("dotenv").config({ path: __dirname + "/.env" });

const app = require("./src/app");
const connectToDB = require("./src/config/db");

connectToDB();

app.listen(process.env.PORT || 3000, () => {
  console.log(`Server is running on port ${process.env.PORT || 3000}`);
});