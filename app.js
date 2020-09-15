const express = require('express');
const {google} = require('googleapis');

const app = express();

const OAuth2Data = require('./credentials.json');

const CLIENT_ID = OAuth2Data.web.client_id;
const CLIENT_SECRET = OAuth2Data.web.client_secret;
const REDERECT_URI = OAuth2Data.web.redirect_uris[0];

let name,photo;

const oAuth2Client = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    REDERECT_URI
);

let isAuth = false; 

const scopes = "https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.profile";

app.set("view engine", "ejs");

app.use(express.static(__dirname + '/views'));

app.get('/', (req,res) => {
    if(!isAuth){
        let url = oAuth2Client.generateAuthUrl({
            access_type:'offline',
            scope:scopes
        });
        console.log(url);
        res.render("index", {url:url}); 
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

        res.render("uploader", {name:name,photo:photo});
        

    }
    
});

app.get('/google/callback' , (req,res) => {
    const code = req.query.code

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



app.listen(5000,() => {
    console.log("Server Started Running On Port 5000");
})