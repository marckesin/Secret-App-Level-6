// Importação das dependências
require('dotenv').config();
const express = require('express');
const createError = require('http-errors');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const session = require('express-session')
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

const indexRouter = require('./routes/index');
const registerRouter = require('./routes/register');
const loginRouter = require('./routes/login');
const logoutRouter = require('./routes/logout');
const submitRouter = require('./routes/submit');
const authSecretstRouter = require('./routes/authsecrets');
const authRouter = require('./routes/auth');

const app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: process.env.NOT_SECRET,
  resave: false,
  saveUninitialized: false,
}))

app.use(passport.initialize());
app.use(passport.session());

const User = require('./models/user.model');
passport.use(User.createStrategy());

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.findById(id, (err, user) => {
    done(err, user);
  });
});

passport.use(new GoogleStrategy({
  clientID: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  callbackURL: "http://localhost:3000/auth/google/secrets",
  userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
},
  (accessToken, refreshToken, profile, cb) => {
    User.findOrCreate({ googleId: profile.id }, (err, user) => {
      console.log(profile);
      return cb(err, user);
    });
  }
));

const dbConfig = require('./config/database.config').local;
const mongoose = require('mongoose');

mongoose.Promise = global.Promise;

mongoose.connect(dbConfig, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
  keepAlive: true,
  keepAliveInitialDelay: 30000
}).then(() => {
  console.log('Conectado ao banco de dados com sucesso.');
}).catch((err) => {
  console.log('Não foi possivel conectar ao banco de dados: ', err);
  process.exit();
});

app.use('/', indexRouter);
app.use('/register', registerRouter);
app.use('/login', loginRouter);
app.use('/logout', logoutRouter);
app.use('/submit', submitRouter);
app.use('/auth/google/secrets', authSecretstRouter);
app.use('/auth/google', authRouter);

app.get('/secrets', (req, res, next) => {
  if (req.isAuthenticated()) {

    User.find({ secret: { $ne: null } }, (err, results) => {
      if (!err && results) {
        res.render('secrets', { secrets: results });
      } else {
        next(err);
      }
    });

  } else {
    res.redirect('/login');
  }
});


app.use((req, res, next) => {
  next(createError(404));
});

app.use((err, req, res, next) => {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;