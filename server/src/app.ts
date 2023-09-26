import 'express-async-errors'
// Importing this package will catch all errors that are thrown in async functions and pass them to the next() function which will then be handled by our error handler middleware.
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import passport from 'passport';
import { rateLimit } from 'express-rate-limit'

import errorHandler from './middlewares/errorHandler';
import jwtStrategy from './auth/jwtStrategy';
import { IAppRouter } from './api/BaseRouter';
import DIContainer from './di/diContainer';
import UserService from './api/users/UserService';
import PostService from './api/posts/PostService';
import MongoCrudService from './database/MongoCrudService';
import MongooseDatabase from './database/MongoDatabase';

import DI_TYPES from './di/DITypes';
import { ENVIRONMENT, CLIENT_ORIGIN, MONGO_URI } from './config';


class App {
  private app: express.Application;

  constructor() {
    this.app = express();
  }
  private async initializeDependencies() {
    DIContainer.initialize();

    //  Initilize DB
    const database = new MongooseDatabase(MONGO_URI)
    DIContainer.bind(DI_TYPES.Database, database);
    await database.connect()
    database.loadModels()

    //    Initialize services
    const crudService = new MongoCrudService(database)
    DIContainer.bind(DI_TYPES.CrudService, crudService);

    const postService = new PostService(crudService);
    DIContainer.bind(DI_TYPES.PostService, postService);

    const userService = new UserService(crudService);
    DIContainer.bind(DI_TYPES.UserService, userService);
  }
  public async config(routers: IAppRouter[]): Promise<express.Application> {

    await this.initializeDependencies()

    // CORS (Cross Origin Resource Sharing)
    this.app.use(
      cors({
        origin: [CLIENT_ORIGIN],
      })
    );

    // Security headers
    this.app.use(helmet());

    // Parse incoming requests with JSON payload
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    // Rate limit
    this.app.use('/api', rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      limit: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
      standardHeaders: 'draft-7', // Set `RateLimit` and `RateLimit-Policy` headers
      legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    })
    )
    // Logging 
    const format =
      ENVIRONMENT !== 'production'
        ? 'dev'
        : '[:date[clf]] :method :url :status :res[content-length] - :response-time ms';
    this.app.use(morgan(format));

    // Authentication
    this.app.use(passport.initialize());
    passport.use('jwt', jwtStrategy);
    // Routers
    routers.forEach((router: IAppRouter) => {
      this.app.use(`/api/${router.getPath()}`, router.createRouter());
    });

    // Error handler
    this.app.use(errorHandler);
    return this.app;
  }
}

export default App;
