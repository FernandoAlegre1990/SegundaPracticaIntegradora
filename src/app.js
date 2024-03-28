import express from 'express'
import { Server } from 'socket.io'
import handlebars from 'express-handlebars'
import productsRouter from './routers/products.router.js'
import cartsRouter from './routers/carts.router.js'
import viewsRouter from './routers/views.router.js'
import chatRouter from './routers/chat.router.js'
import sessionsRouter from './routers/sessions.router.js'
import viewsUserRouter from './routers/viewsUser.router.js'
import mongoose from 'mongoose'
import Message from './dao/models/message.model.js'
import session from 'express-session'
import MongoStore from 'connect-mongo'
import passport from 'passport'
import initializePassport from './config/passport.config.js'

const PORT = 8080; // puerto en el que va a escuchar el servidor

const app = express(); // crea una instancia de una aplicación de express
app.use(express.json()); // middleware para parsear el body de las requests a JSON
app.use(express.static('./src/public')); // middleware para servir archivos estáticos

// configuracion de la sesion
app.use(session({
    store: MongoStore.create({
      mongoUrl: 'mongodb+srv://fernandoalegre31:79IoBCLSJZH0xpRp@cluster0.dakbflp.mongodb.net/ecommerce',
      dbName: 'ecommerce',
      mongoOptions: {
        useNewUrlParser: true,
        useUnifiedTopology: true
      }
  }),
  secret: 'secret',
  resave: true,
  saveUninitialized: true
}))

// configuracion de passport
initializePassport();
app.use(passport.initialize());
app.use(passport.session());



// configuracion del motor de plantillas handlebars
app.engine('handlebars', handlebars.engine());
app.set('views', './src/views');
app.set('view engine', 'handlebars');




// Inicialización del servidor
try {
  await mongoose.connect('mongodb+srv://fernandoalegre31:79IoBCLSJZH0xpRp@cluster0.dakbflp.mongodb.net/ecommerce'); // Conecta con la base de datos
  const serverHttp = app.listen(PORT, () => console.log('server up')); // Levanta el servidor en el puerto especificado
  const io = new Server(serverHttp); // Instancia de socket.io

  app.use((req, res, next) => {
      req.io = io;
      next();
  }); // Middleware para agregar la instancia de socket.io a la request

  // Rutas
  app.get('/', (req, res) => {
      if (req.session.user) {
          // Si el usuario ya está autenticado, redireccionar a la vista de productos
          res.render('index');
      } else {
          // Si el usuario no ha iniciado sesión, redireccionar a la vista de inicio de sesión
          res.redirect('/login');
      }
  });

  app.use('/', viewsUserRouter); // Registra el router de usuario en la ruta /
  app.use('/chat', chatRouter); // Ruta para renderizar la vista de chat
  app.use('/products', viewsRouter); // Ruta para renderizar la vista de productos
  app.use('/api/products', productsRouter); // Registra el router de productos en la ruta /api/products
  app.use('/api/carts', cartsRouter); // Registra el router de carritos en la ruta /api/carts
  app.use('/api/sessions', sessionsRouter); // Registra el router de sesiones en la ruta /api/sessions

  io.on('connection', socket => {
      console.log('Nuevo cliente conectado!');

      socket.broadcast.emit('Alerta');

      // Cargar los mensajes almacenados en la base de datos
      Message.find()
        .then(messages => {
          socket.emit('messages', messages); 
        })
        .catch(error => {
          console.log(error.message);
        });
  
      socket.on('message', data => {
        // Guardar el mensaje en la base de datos
        const newMessage = new Message({
          user: data.user,
          message: data.message
        });
  
        newMessage.save()
          .then(() => {
            // Emitir el evento messages con los mensajes actualizados de la base de datos
            Message.find()
              .then(messages => {
                io.emit('messages', messages);
              })
              .catch(error => {
                console.log(error.message);
              });
          })
          .catch(error => {
            console.log(error.message);
          });
      });

      socket.on('productList', async (data) => { 
          io.emit('updatedProducts', data ); // Emitir el evento updatedProducts con la lista de productos
      }); // Evento que se ejecuta cuando se actualiza la lista de productos
  }); // Evento que se ejecuta cuando un cliente se conecta
} catch (error) {
  console.log(error.message);
}