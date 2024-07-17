const express = require('express');
const cors = require('cors');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;

const corsConfig = {
    origin: ['http://localhost:5173','http://localhost:5173'],
    credentials: true,
    optionSuccessStatus: 200,
}

app.use(cors(corsConfig));
app.use(express.json());

app.get('/',(req,res)=>{
    res.send("YOO! Server IS Running")
})

app.listen(port,()=>{
    console.log(`Server is running on port ${port}`)
})