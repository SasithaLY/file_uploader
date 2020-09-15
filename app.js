const express = require('express');
const {google} = require('googleapis');
const multer = require('multer');
const fs = require('fs');

const app = express();
app.set("view engine", "ejs");
app.use(express.static("public"));

const OAuth2Data = require('./credentials.json');

const CLIENT_ID = OAuth2Data.web.client_id;
const CLIENT_SECRET = OAuth2Data.web.client_secret;
const REDERECT_URI = OAuth2Data.web.redirect_uris[0];

let name,photo;
let isAuth = false; 

const oAuth2Client = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    REDERECT_URI
);

let storage = multer.diskStorage({
    destination:function(req, file, callback){
        callback(null,"./uploads");
    },
    filename:function(req, file, callback){
        callback(null, file.originalname);
    } 
})

let upload = multer({
    storage:storage
}).single("file");

const scopes = "https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.profile";

//app.use(express.static("public"));



app.get('/', (req,res) => {
    if(!isAuth){
        let url = oAuth2Client.generateAuthUrl({
            access_type:'offline',
            scope:scopes
        });
        console.log(url);
        res.render("index", {url:url,auth:isAuth}); 
    }else{

        let oAuth2 = google.oauth2({
            auth:oAuth2Client,
            version:'v2'
        });

        oAuth2.userinfo.get((error, response)=>{
            if(error){
                throw error;
            }else{
                console.log(response.data);
                name = response.data.name;
                photo = response.data.picture;
            }
        })

        res.render("uploader", {name:name,photo:photo,success:false,auth:isAuth});
        res.redirect('/')
    }
    
});

app.get('/google/callback' , (req,res) => {
    const code = req.query.code;

    if(code){
        oAuth2Client.getToken(code, function(error, tokens){
            if(error){
                console.log("Authentication Error!");
                console.log(error);
            }else{
                console.log("Authentication Successful!");
                console.log(tokens);
                oAuth2Client.setCredentials(tokens);
                isAuth = true; 

                res.redirect('/');
            }
        })
    }
})

app.post('/upload', (req,res) => {

    upload(req,res,(error)=>{
        if(error){
            throw error;
        }else{
            const drive = google.drive({
                version:'v3',
                auth:oAuth2Client
            })
        
            const filemetadata = {
                name:req.file.filename
            }

            const media = {
                mimeType:req.file.mimetype,
                body:fs.createReadStream(req.file.path)
            }

            drive.files.create({
                resource:filemetadata,
                media:media,
                fields:"id"
            },(error,file)=>{
                if(error){
                    throw error
                } else{

                    fs.unlinkSync(req.file.path);

                    res.render("uploader", {name:name,photo:photo,success:true,auth:isAuth});
                }
            })

            // var q = setInterval(function () {
            //     console.log("Uploaded: " + req.connection.bytesWritten);
            // }, 250);
        }
    })  
})

app.get('/logout', (req,res)=>{
    isAuth = false;
    res.redirect('/');
})

app.listen(5000,() => {
    console.log("Server Started Running On Port 5000");
})