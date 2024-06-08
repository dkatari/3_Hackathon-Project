const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const mysql = require('mysql2');

const app = express();
// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.set('view engine', 'ejs');
// Create MySQL connection
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'mysql',
    database: 'medical'
});
// Connect to MySQL
connection.connect((err) => {
    if (err) {
        console.error('Error connecting to database:', err);
        return;
    }
    console.log('Connected to database');
});

// File upload setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
      cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
      cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage: storage });


// Routes
app.get('/', (req, res) => {
    res.redirect('/index');
});



// Routes for index Page

app.get('/index', (req,res) => {
  res.render('index')
});


// Routes for create profile page

app.get('/createprofile',(req,res) =>{
  res.render('createprofile')
})

app.post('/createprofile', (req, res) => {
  const profileData = req.body;
  console.log(typeof(profileData))

  // Insert the profile data into the database
  connection.query('INSERT INTO Profile SET ?', profileData, (error, results, fields) => {
      if (error) {
          console.error('Error inserting profile data:', error);
          res.status(500).send('Error inserting profile data');
          return;
      }
      userId = results.insertId;
      console.log('Profile data inserted successfully');
      res.redirect('/home')
      //console.log(results)
  });
});

app.get('/home', (req,res) =>{
  res.render('home');
})

app.get('/profile', (req, res) => {

  // Fetch user details from the database
  connection.query('SELECT * FROM Profile WHERE id = ?', userId, (error, results, fields) => {
      if (error) {
          console.error('Error fetching user details:', error);
          res.status(500).send('Error fetching user details');
          return;
      }

      if (results.length === 0) {
          // If no user found with the provided userId, handle it accordingly (e.g., render an error page)
          res.status(404).send('User not found');
          return;
      }

      // Render the profile page with user details
      res.render('profile', { user: results[0] });
  });
});

app.get('/form', (req,res) =>{
  res.render('form')
})

app.post('/form', upload.fields([
  { name: 'prescriptions', maxCount: 1 },
  { name: 'medical_report', maxCount: 1 },
  { name: 'additional_documents', maxCount: 1 }
]), (req, res) => {
  console.log('req.body:', req.body);
  console.log('req.files:', req.files);

  const {consultation_date, hospital_name, doctor_name, doctor_specialisation, next_consultation_date } = req.body;
  const prescriptions = req.files['prescriptions'] ? req.files['prescriptions'][0].path : null;
  const medical_report = req.files['medical_report'] ? req.files['medical_report'][0].path : null;
  const additional_documents = req.files['additional_documents'] ? req.files['additional_documents'][0].path : null;

  const sql = 'INSERT INTO consultation_records (user_id, consultation_date, hospital_name, doctor_name, doctor_specialisation, prescriptions, medical_report, next_consultation_date, additional_documents) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
  const values = [userId, consultation_date, hospital_name, doctor_name, doctor_specialisation, prescriptions, medical_report, next_consultation_date, additional_documents];

  connection.query(sql, values, (err, result) => {
      if (err) {
          console.error('Error inserting data:', err.stack);
          res.status(500).send('Error submitting form.');
          return;
      }
      res.render('success')
  });
});


// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


