
const path = require('path');
const express = require('express');
const sessions = require('express-session');
//const bodyParser = require('body-parser');
const hbs = require('hbs');
const bcrypt = require('bcrypt');
const { db, users } = require('./database');
const { checkAuth } = require('./middleware/checkAuth');
const secretKey = 'sdfk345kjgkk';

const app = express();

app.set('view engine', 'hbs');
app.set('cookieName', 'sid');
app.set('views', './handlebars');
hbs.registerPartials('./handlebars');
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));
app.use(express.json()); // для распознавания входящего объекта запроса как объекта JSON




app.use(sessions({
    name: app.get('cookieName'),
    secret: secretKey,
    resave: false, 
    saveUninitialized: false, 
    cookie: { 
      httpOnly: true, 
      maxAge: 86400 * 1e3, 
    },
  }));


app.use((req, res, next) => {
    const usersEmail = req.session?.user?.email;
    if (usersEmail) {
      const currentUser = users.user.find((user) => user.email === usersEmail);
      res.locals.name = currentUser.name
     
    }
    next()
  });



// регистрация
app.get('/', (req, res) => {
    res.render('header')
  });


app.get('/signup', async (req, res) => {
    res.render('signup');
  });


app.post('/signup', async (req, res) => {
    const { name, email, password } = req.body
    const hashPass = await bcrypt.hash(password, 5)
    users.user.push({
      name,
      email,
      password: hashPass,
    })
    req.session.user = {
      email,
    }
    res.redirect('/signin')
  })



  // вход в систему
app.get('/signin', async (req, res) => {
    res.render('signin')
  });

app.post('/signin', async (req, res) => {
    const { email, password } = req.body
    const currentUser = users.user.find((user) => user.email === email)
    if (currentUser) {
      if (await bcrypt.compare(password, currentUser.password)) {
        req.session.user = { email };
        return res.redirect('/upload');
      }
    }
    return res.redirect('/signin');
});

// выход из сессии
app.get('/signout', (req, res) => {
    req.session.destroy((err) => {
      if (err) return res.redirect('/')
  
      res.clearCookie(req.app.get('cookieName'))
  
      return res.redirect('/')
    });
});

// отрисовка постов
app.get('/upload', checkAuth, (req, res) => {
  const postQuery = req.query
  let postsForRender = db.posts
  if (postQuery.limit !== undefined && Number.isNaN(+postQuery.limit) === false) {
    postsForRender = db.posts.slice(0, postQuery.limit)
  }
  if (postQuery.reverse !== false) {
    postsForRender = db.posts.reverse()
  }
  console.log(postsForRender);
  res.render('main', {list : postsForRender} )
});
   
 

//  контроллер добавления поста
app.post('/addPost', (req, res) => {
    db.posts.push({
        "title": req.body.title,
        "image": req.body.image,
        "text": req.body.text,
        "tag": req.body.tag,
        "email": req.session.user.email
    });
    //console.log(db.posts);
    res.redirect(req.get('referer'));
});

app.listen(3000, () => {
    console.log('Application listening on port 3000!')
    console.log('http://127.0.0.1:3000')
});

