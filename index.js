require("dotenv").config();

const express = require("express");
const cors = require("cors");

const router = require('./routes/clonerepo')
const worker = require('./Queue/Worker')

const app = express();



app.use(
  cors({
    origin: '*',
    credentials: true,
  })
);


 
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/',router) 
app.get('/',(req,res)=>{
  res.send("server running eew")
})



const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(` Server running on port ${PORT}`);
});