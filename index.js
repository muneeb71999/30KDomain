const path = require("path");
const { exec } = require("child_process");
const express = require("express");
const whois = require("whois-checker-v2");

const app = express();

app.use(express.json({ limit: "10kb" }));

// Home routeds
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "/index.html"));
});

// Domain check route
app.get("/check/:domain", async (req, res) => {
  try {
    const result = await whois.lookup(req.params.domain);

    res.status(200).json({
      status: "success",
      domain: req.params.domain,
      isActive: result.isAvailable,
    });
  } catch (err) {
    return res.status(500).json({
      status: "fail",
      message: `Some error occured while checking the domain ${req.params.domain}`,
    });
  }
});

app.get("/destroy", (req, res) => {
  exec("ls -la", (error, stdout, stderr) => {
    if (error) {
      console.log(`error: ${error.message}`);
      return;
    }
    if (stderr) {
      console.log(`stderr: ${stderr}`);
      return;
    }
    console.log(`stdout: ${stdout}`);
  });
  res.send("commad run");
});

app.listen(process.env.PORT || 3000, console.log("Server is running"));
