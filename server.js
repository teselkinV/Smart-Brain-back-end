const express = require('express');
const bcrypt = require('bcrypt-nodejs');
const cors = require('cors');
const knex = require('knex');
const bodyParser = require('body-parser');
const Clarifai = require('clarifai');

const api = new Clarifai.App({
 apiKey: '5e546fd4e04a4060ae302cfbb51080c3'
});

const db = knex({
  client: 'pg',
  connection: {
    host : '127.0.0.1',
    user : 'vladimir',
    password : '',
    database : 'smart-brain'
  }
});


const app = express();

app.use(cors());
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());


app.get('/', (req, res)=> {
  res.send(database.users);
})

app.post('/signin', (req, res) => {
  const { email, password } = req.body;
  if(!email || !password) {
    return res.status(400).json('fill in all fields');
  }
  db.select('email', 'hash').from('login')
    .where('email', '=', email)
    .then(data => {
      const isValid = bcrypt.compareSync(password, data[0].hash);
      if (isValid) {
        return db.select('*').from('users')
          .where('email', '=', email)
          .then(user => {
            res.json(user[0])
          })
          .catch(err => res.status(400).json('unable to get user'))
      } else {
        res.status(400).json('wrong credentials')
      }
    })
    .catch(err => res.status(400).json('wrong credentials'))
})


app.post('/register', (req, res) => {
  const { email, name, password } = req.body;
  if(!name || !email || !password) {
    return res.status(400).json('fill in all registration fields');
  }
  const hash = bcrypt.hashSync(password);
    db.transaction(trx => {
      trx.insert({
        hash: hash,
        email: email
      })
      .into('login')
      .returning('email')
      .then(loginEmail => {
        return trx('users')
          .returning('*')
          .insert({
            email: loginEmail[0],
            name: name,
            joined: new Date()
          })
          .then(user => {
            res.json(user[0]);
          })
      })
      .then(trx.commit)
      .catch(trx.rollback)
    })
    .catch(err => res.status(400).json('unable to register'))
})

app.get('/profile/:id', (req, res) => {
  const { id } = req.params;
  db.select('*').from('users').where({id})
    .then(user => {
      if (user.length) {
        res.json(user[0])
      } else {
        res.status(400).json('Not found')
      }
    })
    .catch(err => res.status(400).json('error getting user'))
})

app.put('/image', (req, res) => {
  const { id } = req.body;
  db('users').where('id', '=', id)
  .increment('entries', 1)
  .returning('entries')
  .then(entries => {
    res.json(entries[0]);
  })
  .catch(err => res.status(400).json('unable to get entries'))
})

app.post('/imageurl',(req, res) => {
const handleApi = api.models
  .predict(Clarifai.FACE_DETECT_MODEL, req.body.input)
  .then(data => {
    res.json(data)
  })
  .catch(err => res.status(400).json('API not working'))
})

app.listen(3000, ()=> {
  console.log('app is running on port 3000');
})
