const express = require('express')
const app = express()
const bodyParser = require('body-parser')

const cors = require('cors')

const mongoose = require('mongoose')
// connecting database
let url= 'mongodb+srv://Jmukakalisa:Wharfdaycare%401@cluster0.fjkf6.mongodb.net/task-tracker?retryWrites=true&w=majority'
mongoose.connect(url,{useNewUrlParser: true, useUnifiedTopology: true});

app.use(cors())

app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/indext.html')
});

// setting port listener 
const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('You database is successfully connected to your app on port' + listener.address().port)
})

//  models
const taskSessionkSchema = new mongoose.Schema({
    description: {type: String, required: true},
    duration: {type: Number, required: true},
    date: String
  });
  
  const userSchema = new mongoose.Schema({
      username: {type: String, required: true},
      log: [taskSessionkSchema]
  
  })


  const Task = mongoose.model("Task", taskSessionkSchema);
  const User = mongoose.model('User', userSchema)

  // routes
  app.post('/api/task/new-user', bodyParser.urlencoded({extended: false}), (req, res) =>{
    let newUser = new User({username: req.body.username})
    newUser.save((error, savedUser) => {
      if(!error){
        let resObject = {}
        resObject['username'] = savedUser.username
        resObject['id'] = savedUser.id
        res.json(resObject)
      }
    })
} )

app.get('/api/task/users', (req,res) =>{
  User.find({}, (error, arrayOfUsers) =>{
    if(!error){
      res.json(arrayOfUsers)
    }
  })
})

app.post('/api/task/add', bodyParser.urlencoded({extended: false}), (req, res) => {
  let newTask = new Task({
    description: req.body.description,
    duration: parserInt(req.body.duration),
    date: req.body.date
  })
  if(newTask.date === ''){
    newTask.date = new Date().toISOString().substring(0,10)
  }
  User.findByIdAndUpdate(
    req.body.userId,
    {$push: {log: newTask}},
    {new: true},
    (error, updatedUser) => {
      if(!error){
        let resObject = {}
        resObject['_id'] = updatedUser.id
        resObject['username'] = updatedUser.username
        resObject['date'] = new Date(newTask.date).toDateString()
        resObject['description'] = newTask.description
        resObject['duration'] =newTask.duration
        res.json(resObject)
      }
    }
  )
})

app.get('/api/task/log', (req,res) => {
  User.findById(req.query.userId, (error, result) => {
    if(!error){
      let resObject = result
      if(req.query.from || req.query.to){
        let fromDate = new Date(0)
        let toDate = new Date()
        
        if(req.query.from){
          fromDate = new Date(req.query.from)
        }
        if (req.query.to){
          toDate = new Date(req.query.to)
        }

        fromDate = fromDate.getTime()
        toDate = toDate.getTime()

        resObject.log = resObject.log.filter((session) => {
          let sessionDate = new Date(session.date).getTime()

          return sessionDate >= fromDate && sessionDate <= toDate
          
        })
      }

      if(req.query.limit){
        resObject.log = resObject.log.slice(0, req.query.limit)
      }

      resObject['count'] = result.log.length
      res.json(resObject)
    }
  })
})