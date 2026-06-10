const fs = require("fs");
const path = require("path");
const selfsigned = require("selfsigned");

const certDir = path.resolve(__dirname, "certs");
const keyPath = path.join(certDir, "localhost.key.pem");
const certPath = path.join(certDir, "localhost.crt.pem");

if (!fs.existsSync(certDir)) {
  fs.mkdirSync(certDir, { recursive: true });
}

const attrs = [{ name: "commonName", value: "localhost" }];
const opts = {
  days: 365,
  algorithm: "sha256",
  extensions: [
    {
      name: "subjectAltName",
      altNames: [
        { type: 2, value: "localhost" },
        { type: 7, ip: "127.0.0.1" },
      ],
    },
  ],
};

(async () => {
  const pems = await selfsigned.generate(attrs, opts);
  fs.writeFileSync(keyPath, pems.private, "utf8");
  fs.writeFileSync(certPath, pems.cert, "utf8");

  console.log("✅ Local HTTPS certificate generated.");
  console.log(`  - Key: ${keyPath}`);
  console.log(`  - Cert: ${certPath}`);
  console.log("Run `npm run dev` after generating certs.");
})();
