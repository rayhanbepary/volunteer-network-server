const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const admin = require('firebase-admin');
const MongoClient = require('mongodb').MongoClient;
require('dotenv').config();


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.jsjow.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;

const app = express()
const port = 5000
app.use(bodyParser.json());
app.use(cors());

const serviceAccount = require("./config/volunteer-network-5055d-firebase-adminsdk-qktkt-585731cfab.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIRE_DB
});

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
    const allEvents = client.db("volunteerNetwork").collection("events");
    const registeredVolunteer = client.db("volunteerNetwork").collection("registeredVolunteer");
    
    app.post("/addEvents", (req, res) => {
        const singleEvent = req.body;
        allEvents.insertOne(singleEvent)
        .then( result => {
            res.send( result.insertedCount > 0 );
        })
    })

    app.get("/getEvents", (req, res) => {
        allEvents.find({})
        .toArray( (err,documents) => {
            res.send(documents);
        })
    })

    app.post("/addVolunteer", (req, res) => {

        const volunteer = req.body;

        registeredVolunteer.insertOne(volunteer)
        .then( result => {
            res.send( result.insertedCount > 0 );
        })
    })

    app.get("/getVolunteers", (req, res) => {
        registeredVolunteer.find({})
        .toArray( (err,documents) => {
            res.send(documents);
        })
    })


    app.get("/getRegisteredEvents", (req, res) => {

        const bearer = req.headers.authorization;

        if(bearer && bearer.startsWith("Bearer ")){
            const idToken = bearer.split(" ")[1];

            // idToken comes from the client app
            admin.auth().verifyIdToken(idToken)
            .then( decodedToken => {
                const tokenEmail = decodedToken.email;
                const queryEmail = req.query.email;

                if( tokenEmail === queryEmail ){
                    registeredVolunteer.find({email: queryEmail})
                    .toArray( (err,documents) => {
                        res.send(documents);
                    })
                }else{
                    res.status(401).send("un-authorized access");
                }
            })
            .catch( error => {
                res.status(401).send("un-authorized access");
            });
        }else{
            res.status(401).send("un-authorized access");
        }
    })

    app.delete("/delete/:id", (req, res) => {

        registeredVolunteer.deleteOne({_id: req.params.id})
        .then( result => {
            res.send( result.deletedCount > 0 );
        })
    })

});

app.get("/", (req, res) => {
    res.send("Volunteer Network Working")
})

app.listen( process.env.PORT || port );