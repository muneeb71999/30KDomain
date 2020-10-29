const path = require("path");
const express = require("express");
const whois = require("whois-checker-v2");
const multer = require("multer");
const fs = require("fs");

// Init the App
const app = express();

// Middlewares
app.use("/uploads", express.static(path.join(__dirname, "/uploads")));
app.use(express.json({ limit: `${1024 * 50}kb` }));
app.use("/available", express.static(path.join(__dirname, "/available")));

// Multer Init
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads");
  },
  filename: (req, file, cb) => {
    console.log(file);
    const filename = Date.now() + path.extname(file.originalname);
    fs.writeFileSync(
      path.join(__dirname, "/filename.json"),
      JSON.stringify({
        filename,
      })
    );
    cb(null, filename);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype == "text/plain") {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

const upload = multer({ storage: storage, fileFilter });

// Home route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "/views/index.html"));
});

// Get the file
app.post("/", upload.single("textFile"), (req, res, next) => {
  try {
    return res.redirect("/list");
  } catch (error) {
    console.error(error);
  }
});

app.get("/list", (req, res, next) => {
  try {
    return res.sendFile(path.join(__dirname, "/views/checker.html"));
  } catch (err) {
    return res.status(404).json({
      status: "fail",
      message: "File was not found",
    });
  }
});

app.get("/domains", async (req, res, next) => {
  try {
    const { filename } = JSON.parse(
      fs.readFileSync(path.join(__dirname, "/filename.json"), "utf-8")
    );

    const filePath = path.join(__dirname, `/uploads/${filename}`);
    const data = await fs.readFile(filePath, (err, data) => {
      res.send(data);
    });

    // Delete the file from the uploads folder
  } catch (err) {
    res.send(err);
  }
});

app.post("/write", async (req, res, next) => {
  try {
    console.log(req.body.domains);
    const date = new Date();
    const filename = `${date.toDateString()}-${date.getTime()}`;

    fs.writeFileSync(
      path.resolve(__dirname, `./available/${filename}.txt`),
      req.body.domains
    );

    res.status(201).json({
      status: "success",
      filename: `/download/${filename}.txt`,
    });
  } catch (err) {
    return next(err);
  }
});

app.get("/download/:filename", function (req, res) {
  const file = `${__dirname}/available/${req.params.filename}`;
  const directory = "uploads";

  fs.readdir(directory, (err, files) => {
    if (err) throw err;

    for (const file of files) {
      fs.unlink(path.join(directory, file), (err) => {
        if (err) throw err;
      });
    }
  });
  res.download(file); // Set disposition and send it.
});

app.get("/delete/:filename", (req, res) => {
  try {
    const file = `${__dirname}/available/${req.params.filename}`;
    setTimeout(() => {
      fs.unlink(file, (err) => {
        console.log(err);
      });
    }, 50000);
    res.json({
      status: "success",
      filepath: file,
    });
  } catch (error) {
    console.log(error);
  }
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

app.listen(process.env.PORT || 3000, console.log("Server is running 3000"));
