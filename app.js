const express = require("express");
const { google } = require("googleapis");
const multer = require("multer");
const fs = require("fs");
const bodyParser = require('body-parser');
const app = express();
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

const OAuth2Data = require("./credentials.json");

const CLIENT_ID = OAuth2Data.web.client_id;
const CLIENT_SECRET = OAuth2Data.web.client_secret;
const REDERECT_URI = OAuth2Data.web.redirect_uris[0];

const oAuth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDERECT_URI);

const scopes =
  "https://www.googleapis.com/auth/drive.metadata.readonly https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.profile";

let name, photo;
let isAuth = false;

let storage = multer.diskStorage({
  destination: function (req, file, callback) {
    callback(null, "./uploads");
  },
  filename: function (req, file, callback) {
    callback(null, file.originalname);
  },
});

let upload = multer({
  storage: storage,
}).single("file");

app.get("/", (req, res) => {
  if (!isAuth) {
    let url = oAuth2Client.generateAuthUrl({
      access_type: "offline",
      scope: scopes,
    });
    console.log(url);
    res.render("index", { url: url, auth: isAuth });
  } else {
    let oAuth2 = google.oauth2({
      auth: oAuth2Client,
      version: "v2",
    });

    oAuth2.userinfo.get(function (error, response) {
      if (error) {
        throw error;
      } else {
        console.log(response.data);
        name = response.data.name;
        photo = response.data.picture;
        res.render("uploader", { name: name, photo: photo, success: false, auth: isAuth });
      }
    });
  }
});

app.get("/google/redirect", (req, res) => {
  const code = req.query.code;

  if (code) {
    oAuth2Client.getToken(code, function (error, tokens) {
      if (error) {
        console.log("Authentication Error!");
        console.log(error);
      } else {
        console.log("Authentication Successful!");
        console.log(tokens);
        oAuth2Client.setCredentials(tokens);
        isAuth = true;

        res.redirect("/");
      }
    });
  }
});

app.post("/upload", (req, res) => {

  upload(req, res, (error) => {
    if (error) {
      throw error;
    } else {
      let size = fs.lstatSync(req.file.path).size;
      let bytes = 0;

      const drive = google.drive({
        version: "v3",
        auth: oAuth2Client,
      });

      const filemetadata = {
        name: req.file.filename,
      };

      const media = {
        mimeType: req.file.mimetype,
        body: fs.createReadStream(req.file.path).on("data", (chunk) => {
          bytes += (chunk.length / size) * 100;
          console.log(Math.round(bytes) + "%", size);
        }),
      };

      drive.files.create(
        {
          resource: filemetadata,
          media: media,
          fields: "id",
        },
        (error, file) => {
          if (error) {
            throw error;
          } else {
            fs.unlinkSync(req.file.path);
            res.json({ success: true });
          }
        }
      );
    }
  });
});

app.get("/getfiles", (req, res) => {
  const drive = google.drive({ version: "v3", auth: oAuth2Client });
  //let parent = req.parent;
  console.log(req.query);
  drive.files.list(
    {
      //pageSize: 10,
      q:`'${req.query.parent}' in parents and trashed=false`,
      orderBy:"folder",
      fields: "nextPageToken, files(id, name, mimeType, parents)",
    },
    (err, data) => {
      if (err) return console.log("The API returned an error: " + err);
      const files = data.data.files;
      if (files.length) {
        
        res.json({ files: files });
        // files.map((file) => {
        //   console.log(`${file.name} (${file.id})`);
        // });
      } else {
        res.json({ error: "No files found." });
        //console.log("No files found.");
      }
    }
  );
});

app.get("/logout", (req, res) => {
  isAuth = false;
  res.redirect("/");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server Started Running On Port ${PORT}`);
});
