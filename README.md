# MiniMVCS Framework

A small Model View Controller Service Framework for creating Rest Apps with NodeJS, Express and Sequelize

## The Why of MiniMVCS

This mini-framework idea (I think it's neither big nor great enough to be called a full framework) came to my mind when I started doing my third or fourth backend project in NodeJS and copied my utilities, dir structure and code architecture; it was not that great but I was not being DRYish, so I refined my ideas and started working in this library.

## Architecture

This framework was built following concepts like:

* MVC pattern
* MVC + Service Layer
* Functional programming
* Asynchronous programming

The architecture is basically this:

```
┌──────┐      ┌────────────┐      ┌─────────┐      ┌───────┐
│ View │ ───> │ Controller │ ───> │ Service │ ───> │ Model │
└──────┘      └────────────┘      └─────────┘      └───────┘
```

This has (IMHO) really good advantages:

- The **Controller** layer is responsible only for receiving the request and show the result of the operation.
- The **Model** layer is responsible for defining how is defined the data model.
- The **Service** layer holds all the functionality that compounds the core of the application otherwise known as the Business Layer, making it highly reusable for controllers and services themselves.
- And last, it helps my code to be really functional, short and simple.

Another consideration is to have the minimum dependencies required to run a common REST application and be as functional as it can (so I avoid async/await, but it can work with them).

If you think that your app does not need such complexity or maybe it would overload your application, then this mini-framework is not for you, but maybe you can get some good idea from here.

## Installation and Configuration

This library was built using Node v8.12.1, not the last LTS version now, but it works fine with node v10

```bash
$ npm install -S mini-mvcs
```

For configuring the app create a ```config.js``` file following this structure:

```javascript
module.exports = {
  development: {
    database: {
      username: "db_user",
      password: "db_password",
      database: "db_name",
      host: "127.0.0.1",
      port: 5432,
      dialect: "postgres",
    },
  },
  test: {
    // same as development
  },
  production: {
    // same as development
  },
};
```

Following are all the configurable variables:

|Variable|Type|Default Value|Description|
|---|---|---|---|
|database|Object||Sequelize variables for database configuration all other options can be added|
|database.username|String|(none)|Database username|
|database.password|String|(none)| Database user password
|database.database|String|(none)| Database name
|database.host|String|(none)|Database server host
|database.port|Integer|(none)|Database server port
|database.dialect|String|(none)|Database dialect
|server|Object||Variables for the http server
|server.port|Integer|4000|Http server port
|api|Object||Variables for the Rest app
|api.main|String|"/api/v1/"|Main route prefix
|controller|Object||Controller configuration
|controller.dir|String|"./controllers"|Controllers folder container, relative to index.js
|controller.suffix|String|".controller"|Suffix for controller files
|controller.ignore|Array<String>|[]|Files to ignore when importing the controllers
|middleware|Object||Middleware configuration
|middleware.dir|String|"./middlewares"|Middlewares folder container, relative to index.js
|middleware.suffix|String|".middleware"|Suffix for middleware files
|middleware.ignore|Array<String>|[]|Files to ignore when importing the middlewares
|model|Object||Model configuration
|model.dir|String|"./models"|Models folder container, relative to index.js
|model.suffix|String|".model"|Suffix for model files
|model.ignore|Array<String>|[]|Files to ignore when importing the models
|service|Object||Service configuration
|service.dir|String|"./services"|Services folder container, relative to index.js
|service.suffix|String|".service"|Suffix for service files
|service.ignore|Array<String>|[]|Files to ignore when importing the services

And of course you can add more variables of your own.

In the same folder create a file and import the library for starting an app:

```javascript
const miniMvcs = require('mini-mvcs');
miniMvcs.start();
```

If your app is going to be just a rest-app, then you could put this code on the ```index.js``` file of your project and simply run it with:

```bash
$ node index.js
```

## Models

Create a ```models``` folder and create your sequelize model files as usual, e.g.:

```javascript
// models/blog.js
module.exports = (sequelize, DataTypes) => {
  const Blog = sequelize.define('Blog', {
    author: DataTypes.STRING(255),
    name: DataTypes.STRING(255),
    description: DataTypes.STRING(255),
  }, {
    tableName: 'blog',
  });

  Blog.associate = (models) => {
    models.Blog.hasMany(models.Post, {
      as: 'posts',
      foreignKey: 'id_blog',
    });
  };

  return Blog;
};
```

## Services

Create a ```services``` folder and create a your services file like this:

```javascript
// services/blog.service.js
module.exports = (services, models) => {
  const blogService = {};

  blogService.create = (params) => {
    return models.Blog.create(params);
  };

  // add as many methods as you want

  return blogService;
};
```

They should always end with ```.service.js``` (unless configured otherwise), be lowercase named and separated with dash (-), e.g.: ```blog-tag.service.js``` (this will create a blogTag service)

In order to use some service inside another one you do not need to import it, just use the services variable like this:

```javascript
// services/blog.service.js
module.exports = (services, models) => {
  const blogService = {};

  blogService.create = (params) => {
    // ...
  };

  blogService.createBlogAndTag = (params) => {
    // this line could also be services.blog.create(params.blog)
    return blogService.create(params.blog)
    .then((blog) => {
      // here we use the tag.service.js file
      return services.tag.create(params.tag);
    });
  };

  return blogService;
};
```

## CRUD Service

Guess what? creating service after service made me realize I was not being DRYish (again) so I created a CRUD Service utility to keep my files at minimum:

```javascript
// services/blog.service.js
const { crudService } = require('mini-mvcs');

module.exports = (services, models) => {
  const blogService = crudService(models.Blog);

  // you can add more methods or override the default methods

  return blogService;
};
```

This will create a service like the first block of service code in this section

## Controllers

Create a ```controllers``` folder and create a your controllers file like this:

```javascript
// controllers/blog.controller.js
module.exports = (router, services) => {
  router.post('/blog', (req, res, next) => {
    return services.blog.create(req.body)
    .then((blog) => {
      res.status(201).json(blog);
    })
    .catch(next);
  });
};
```

They should always end with ```.controller.js``` (unless configured otherwise).

## Transactional controllers

In order to create a transactional controller you can wrap your service calls with ```miniMvcs.withTransaction``` method like this:

```javascript
// controllers/blog.controller.js
const { withTransaction } = require('miniMvcs');

module.exports = (router, services) => {
  router.post('/blog', (req, res, next) => {
    return withTransaction(() => {
      return services.blog.create(req.body);
    })
    .then((blog) => {
      res.status(201).json(blog);
    })
    .catch(next);
  });
};
```

## CRUD controller

And again I found that all the functionality in the majority of the controllers could be reused, so I created a CRUD Controller (that depends on the structure proposed in CRUD Service) in order to minimize my code:

```javascript
// controllers/blog.controller.js
const { crudController } = require('mini-mvcs');

module.exports = (router, services) => {
  crudController('blog', router, services.blog);
};
```

And of course you can tell it to use only some endpoints and add other ones:

```javascript
// controllers/blog.controller.js
const { crudController } = require('mini-mvcs');

module.exports = (router, services) => {
  // only include GET /blog, POST /blog and GET /blog/:id
  // and wrap the last with the withTransaction function
  crudController('blog', router, services.blog, [
    'index',
    { method: 'post' }, // post, put and delete are transactional by default
    { method: 'get', transactional: true },
  ]);

  // adding /my_blog/:code endpoint
  router.get('/my_blog/:code', (req, res, next) => {
    return services.blog.readByCode(req.params.code)
    .then((blog) => {
      res.status(200).json(blog);
    })
    .catch(next);
  });
};
```

## Templater

Well, here I wanted to include my first library I created when learning NodeJS (https://github.com/nardhar/custom-rest-templater), but later I realized I could do better, so I wrote an express router wrapper, it has the same methods but it always executes an object wrapper upon the returned value from a controller, like this:

```javascript
// controllers/blog.controller.js
module.exports = (router, services) => {
  router.get('/my_blog/:code', (req) => {
    return services.blog.readByCode(req.params.code)
    .then((blog) => {
      return { blog };
    });
  });
};
```

and with a configured template would respond like this:
```json
{
  "success": true,
  "data": {
    "blog": { "code": "A1B2", "title": "MiniMVCS Blog Post" }
  }
}
```

## Creating Middlewares

In case you want to add some global middlewares, you can create a ```middlewares``` folder and create your middlewares files like this:

```javascript
// middlewares/auth.middleware.js
// NOTE: we can use the services
module.exports = (services) => {
  return {
    // the order property helps to add the middlewares in a specific order
    order: 10,
    callback: (req, res, next) => {
      return services.blog.read(req.headers.authorization).then((blog) => {
        res.locals.blogId = blog.id;
        next();
      })
      .catch(next);
    },
  };
};
```

They should always (unless configured otherwise) end with ```.middleware.js```.

## Error Handling

Since this library uses Promises at all levels, you can just throw an ApiError() in the controllers, middlewares or services:

```javascript
const { ApiError } = require('mini-mvcs');

throw new ApiError(...);
```

and an error response will be sent.

And of course you can create some custom error classes that extend ```ApiError``` to be handled properly, here are a couple Error Classes that are used in CrudService:

### ValidationError

For throwing errors when some data should not proceed

**Usage**

Create a ValidationError instance and throw it:

```javascript
// services/blog.service.js
const { ValidationError, FieldError } = require('mini-mvcs');

module.exports = (services, models) => {
  // ...

  blogService.create = (params) => {
    if (!params.title) {
      throw new ValidationError('Blog', [
        new FieldError('title', 'nullable'),
      ]);
    }
    return models.Blog.create(params);
  };

  // ...
};
```

By default, CrudService throws a ValidationError when something can not be saved (even from sequelize) and is catched by the error handling middleware

### NotFoundError

For throwing errors when some data is not found

**Usage**

Create a NotFoundError instance and throw it:

```javascript
// services/blog.service.js
const { NotFoundError } = require('mini-mvcs');

module.exports = (services, models) => {
  // ...

  blogService.create = (params) => {
    return models.Blog.findOne({ where: { id: params.id }})
    .then((blogInstance) => {
      if (!blogInstance) {
        throw new NotFoundError('Blog', { id: params.id });
      }
      return blogInstance;
    });
  };

  // ...
};
```

By default, CrudService throws a NotFoundError when something is not found and is catched by the error handling middleware

## Examples

The examples of working apps with MiniMVCS are here: https://github.com/nardhar/mini-mvcs-examples

## FAQ

**Why Express and Sequelize?**

They were the frameworks I was using when started programming in NodeJS, so for the first version I decided to include them by default.

**Why not use an already established and well known NodeJS MVC framework?**

I explored some options but some frameworks were too big for my requirements, besides, they required to use some other code conventions for every layer, and it did not make my code so reusable between apps (which may or may not use the same framework).

Besides, I think this library is more like a loader than a proper MVC framework.

**Are you planning to add a View layer?**

Although it is a somewhat MVC framework, my only intention is to work for creating REST apps, so I wouldn't add a proper View layer, unless it serves for formatting and generating the JSON response.

## TODO

Obviously there is a lot of work to do to improve this library, starting with (and in no particular order):
- Finish the integration tests.
- Improve the documentation (api doc?).
- Make more examples.
- Give it a better name.
- Create a cli command for generating an app, models, controllers, services.
- Make Sequelize and Express optional.
- Include HATEOAS generation utilities (I have some ideas, just need to refine them).
- Make it pluggable at all possible levels, although my intention is not for this to become a super library, but instead, to be a mini-framework for creating dry, simple and extensible REST apps.
- Make CrudController and CrudService a plugin (or at least put them in another library).
- Improve the Error API (Is it ok to be a class?) and make it pluggable.
