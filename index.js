const express = require('express');
const cors = require('cors');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const { MongoClient, ServerApiVersion } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;

const corsConfig = {
    origin: ['http://localhost:5173','http://localhost:5173'],
    credentials: true,
    optionSuccessStatus: 200,
}

app.use(cors(corsConfig));
app.use(express.json());
app.use(cookieParser());


const verifyToken = (req, res, next) => {
  const token = req.cookies?.token;
  if(!token){
    return res.status(401).send({message: 'Unauthorized User'});
  }
  if(token)
  {
    jwt.verify(token, process.env.Access_Token, (err, decodedToken) => {
      if (err) {
        return res.status(403).send({message: 'Invalid Token'});
      }
      req.user = decodedToken;
      next();
    });
  }
 
}

app.get('/',(req,res)=>{
    res.send("YOO! Server IS Running")
})

const uri = `mongodb+srv://${process.env.USER}:${process.env.PASSWORD}@cluster0.mmutbdd.mongodb.net/?appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Send a ping to confirm a successful connection
    app.post('/jwt',async(req,res)=>{
      const user = req.body;
      const token = jwt.sign(user,process.env.Access_Token,{expiresIn: '7d'})
      res
      .cookie('token',token,{
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production'  ? 'none' : 'strict'
      })
      .send({success: true, message: 'JWT token sent successfully'})
    })

    app.get('/logout', async(req,res)=>{
      res.clearCookie('token',{
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production'  ? 'none' : 'strict',
        maxAge: 0
      })
      .send({success: true, message: 'Cookie Clear Done'})
    })


    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port,()=>{
    console.log(`Server is running on port ${port}`)
})