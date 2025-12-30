const express = require('express'); 
const cors = require("cors"); 
const app =express(); 
app.use(express.json());
app.use(cors());  
const bcrypt = require("bcryptjs");
const mysql =require("mysql2"); 

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "coffee-store",
});


db.connect((err)=>{ 
if (err) { 
    console.error("error connecting to db ", err) ; 
    return ; 
}
console.log("connected to db");
});



app.get('/items',(req ,res)=>

{
 const q = "select * from items" ;
 db.query(q, (err,data) =>{
  if (err)
  {
    console.log(err);
    return res.json(err);
  }
  return res.json(data);
 })

});
app.get('/categories',(req ,res)=>
{

 const q = "select DISTINCT category from items" ;

 db.query(q, (err,data) =>{

  if (err)

  {

    console.log(err);

    return res.json(err);

  }

  return res.json(data);

 })

});



app.get('/items/details',(req ,res)=>

{

 const q = "SELECT i.item_id, i.name, i.category, i.description, i.image, d.quantity, d.size, d.price FROM details d INNER JOIN items i ON d.item_id = i.item_id     WHERE d.size = 'small'";

 db.query(q, (err,data) =>{

  if (err)

  {

    console.log(err);

    return res.json(err);

  }

  return res.json(data);

 })

});

app.get("/items/related/:id", async (req, res) => {

  try {

    const id = parseInt(req.params.id);

    const limit = parseInt(req.query.limit) || 3;

    if (isNaN(id)) {

      return res.status(400).json({ error: "Invalid ID provided" });

    }const [products] = await db.promise().query(

  "SELECT  i.item_id, i.name, i.category, i.description, i.image, d.price FROM items i INNER JOIN details d ON i.item_id = d.item_id  WHERE i.item_id != ? GROUP BY i.item_id ORDER BY RAND() LIMIT ?",

  [id, limit] ); 
    res.json(products);

  } catch (err) {

    console.error("FULL ERROR DETAILS:", err);

    res.status(500).json({ error: "Database query failed", message: err.message });

  }

});



app.get('/items/detail/:identifier', (req, res) => {

  const identifier = req.params.identifier;
  const q =     "SELECT i.item_id, i.name, i.category, i.description, i.image, d.price  FROM items i  INNER JOIN details d ON i.item_id = d.item_id  WHERE (i.item_id = ? OR i.name = ?) AND d.size = 'Small'  LIMIT 1";

  db.query(q, [identifier, identifier], (err, data) => {

    if (err) return res.status(500).json(err);

    if (data.length === 0) return res.status(440).json("Product not found");

    return res.json(data[0]); 

  });

});



app.get('/items/details/:category',(req ,res)=>

  { 

    const CategoryName = req.params.category;

     const q = "SELECT * FROM items where category = ?";

  db.query(q, [CategoryName], (err, data) => {

    if (err) {

  return res.status(500).json({ error: "Database error" });

    } else {

     if (data.length === 0) {return res.status(200).json([]);



    }

      return res.status(200).json(data);

    }

  });

});



app.get('/items/:id',(req ,res)=>

  { 

    const idNumber = req.params.category;

     const q = "SELECT * FROM items where item_id = ?";

  db.query(q, [idNumber], (err, data) => {

    if (err) {

  return res.status(500).json({ error: "Database error" });

    } else {

     if (data.length === 0) {return res.status(200).json([]);



    }

      return res.status(200).json(data);

    }

  });

});


app.post("/auth/signup", async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "All fields required" });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const q =
      "INSERT INTO users (name, email, password) VALUES (?, ?, ?)";

    db.query(q, [name, email, hashedPassword], (err) => {
      if (err) {
        return res.status(400).json({ message: "Email already exists" });
      }
      res.status(201).json({ message: "Account created" });
    });
  } catch (err) {
    res.status(500).json({ message: "Signup failed" });
  }
});app.post("/auth/login", (req, res) => {
  const { email, password } = req.body;

  const q = "SELECT * FROM users WHERE email = ?";
  db.query(q, [email], async (err, data) => {
    if (err || data.length === 0) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const user = data[0];
    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    res.json({
      user: {
        id: user.user_id,
        name: user.name,
        email: user.email,
      },
    });
  });
});


app.post("/contact", (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const q =
    "INSERT INTO contact_messages (name, email, message) VALUES (?, ?, ?)";

  db.query(q, [name, email, message], (err) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Database error" });
    }

    res.status(201).json({ message: "Message sent successfully" });
  });
});


// app.listen(5000, () => {

//   console.log("Connected to backend.");

// });
const PORT = process.env.PORT || 10000; 

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
});