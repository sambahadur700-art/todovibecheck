require("dotenv").config(); // read .env file
const fs = require("fs");
const https = require("https");
const path = require("path");
const app = require("./app");

const certDir = path.resolve(__dirname, "certs");
const keyPath = path.join(certDir, "localhost.key.pem");
const certPath = path.join(certDir, "localhost.crt.pem");

const requestedPort = process.env.PORT ? Number(process.env.PORT) : 5000;
const port = requestedPort || 5000;

function logServer(protocol, port) {
  const env = process.env.NODE_ENV || "development";
  console.log(`Server is running on ${protocol}://localhost:${port}`);
  console.log(`environment : ${env}`);
  console.log(`API Base Url : ${protocol}://localhost:${port}/api`);
  console.log(`Frontend URL : ${protocol}://localhost:${port}/index.html`);
}

const server =
  fs.existsSync(keyPath) && fs.existsSync(certPath)
    ? https.createServer(
        {
          key: fs.readFileSync(keyPath),
          cert: fs.readFileSync(certPath),
        },
        app,
      )
    : app;

if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
  console.warn(
    "⚠️ HTTPS certificate not found. Generate it with `npm run gen-cert`.",
  );
}

const listener = server.listen(port, () => {
  logServer(
    fs.existsSync(keyPath) && fs.existsSync(certPath) ? "https" : "http",
    port,
  );
});

listener.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(
      `Port ${port} is already in use. Stop the running server and try again.`,
    );
    process.exit(1);
  }
  console.error(err);
  process.exit(1);
});
