const express = require('express');
const cors = require('cors');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();


const corsConfig = {
  origin: ['https://ass-11-food-shearing.web.app'],
  credentials: true,
  optionSuccessStatus: 200,
}

app.use(cors(corsConfig));
app.use(express.json());
app.use(cookieParser());

const port = process.env.PORT || 5000;

const verifyToken = (req, res, next) => {
  const token = req?.cookies?.token;
  if (!token) {
    return res.status(401).send({ message: 'Unauthorized User' });
  }
  if (token) {
    jwt.verify(token, process.env.Access_Token, (err, decodedToken) => {
      if (err) {
        return res.status(403).send({ message: 'Invalid Token' });
      }
      req.user = decodedToken;
      next();
    });
  }

}

app.get('/', (req, res) => {
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

    const food_data = client.db('ShareByte').collection('food_info')
    const Request_food = client.db('ShareByte').collection('food_request')

    app.post('/jwt', async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.Access_Token, { expiresIn: '7d' })
      res
        .cookie('token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict'
        })
        .send({ success: true, message: 'JWT token sent successfully' })
    })

    app.get('/logout', async (req, res) => {
      res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production' ? true : false,
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
        maxAge: 0
      })
        .send({ success: true, message: 'Cookie Clear Done' })
    })

    app.get('/feature_food', async (req, res) => {
      const result = await food_data.find().toArray();
      res.send(result)
    })

    app.post('/add_food', async (req, res) => {
      const data = req.body;
      const result = await food_data.insertOne(data);
      res.send(result)
    })
    //  i may add (verifyToken)
    app.get('/manage_food/:email',verifyToken, async (req, res) => {
      const email = req.params.email;
      const tokenEmail = req.user.email;
      if (email !== tokenEmail) return res.status(403).send({ message: 'Unauthorized User' });
      const query = { 'Donator.Email': email };
      const result = await food_data.find(query).toArray();
      res.send(result)
    })

    app.delete('/my_food/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await food_data.deleteOne(query);
      res.send(result)
    })

    app.put('/my_food/:id', async (req, res) => {
      const id = req.params.id;
      const data = req.body;
      const query = { _id: new ObjectId(id) }
      const options = { upsert: true }
      const update = { $set: { ...data } }
      const result = await food_data.updateOne(query, update, options);
      res.send(result)
    })

    app.get('/my_food_data/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await food_data.findOne(query);
      res.send(result)
    })
    app.get('/food_info/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await food_data.findOne(query);
      res.send(result)
    })
    // food Request with new database and delete in food_info db
    app.post('/food_request', async (req, res) => {
      const data = req.body;
      const result = await Request_food.insertOne(data);
      res.send(result)
    })
    app.delete('/food_info/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await food_data.deleteOne(query);
      res.send(result)
    })
    //  i may add (verifyToken)
    app.get('/my_requested_food',verifyToken, async (req, res) => {
      const tokenEmail = req.user.email;
      // console.log(tokenEmail)
      if (!tokenEmail) return res.status(403).send({ message: 'Forbidden User' });
      const query = { req_email: tokenEmail };
      const result = await Request_food.find(query).toArray();
      res.send(result)
    })

    // For Avilable Food Section 
    app.get('/available_food', async (req, res) => {
      const result = await food_data.find({ Status: 'available' }).toArray();
      res.send(result)
    })

    app.get('/filtered_food', async (req, res) => {
      const size = parseInt(req.query.size);
      const page = parseInt(req.query.page) - 1;
      const sort = req.query.sort;
      const search = req.query.search;
      let query = {
        Food_Name: { $regex: search, $options: 'i' }
      }
      let options = {}
      if (sort) {
        options = { sort: { Expired_Date_Time: sort === 'asc' ? 1 : -1 } }
      }
      const result = await food_data
        .find(query, options)
        .skip(page * size)
        .limit(size)
        .toArray();
      res.send(result)
    })


    // await client.db("admin").command({ ping: 1 });
    // console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`)
})