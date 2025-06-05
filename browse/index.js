
const express = require('express');

const PORT = 8080;

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/public", express.static(__dirname + "/public"));

let dataString = "";

app.get('/', (req, res) => {
  res.render('index.html', { data: dataString });
});

app.post('/', (req, res) => {
  dataString = req.body.data;
  res.render('index.html', { data: dataString });
});

app.listen(process.env.PORT || PORT);
