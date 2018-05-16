# MiniMVCS Framework

A small Model View Controller Service Framework for creating Rest Apps with NodeJS, Express and Sequelize

## The Why of MiniMVCS

This mini-framework idea (I think it's neither big nor great enough to be called a full framework) came to my mind when I started doing my third or fourth backend project in NodeJS and copied my utilities, dir structure and code architecture; it was not that great but I was not being DRYish, so I refined my ideas and started working in this library.

### Considerations

This library follows the good practices about architecture I learned when I was programming with [Grails](https://grails.org) Framework (I still do it) which highly encourages that applications should have a **Service** layer which in turn is the only one available to access the **Model** layer, basically this:

```
┌──────┐      ┌────────────┐      ┌─────────┐      ┌───────┐
│ View │ ───> │ Controller │ ───> │ Service │ ───> │ Model │
└──────┘      └────────────┘      └─────────┘      └───────┘
```

This has (IMHO) really good advantages:

- The **Controller** layer is responsible only for receiving the request and show the result of the operation.
- The **Model** layer is responsible for defining how is defined the data model.
- The **Service** layer holds all the functionality that compounds the core of the application otherwise known as the Bussiness Layer, making it highly reusable for controllers and services themselves.
- And last, it helps my code to be really functional, short and simple.

Another consideration is to have the minimum dependencies required to run a common REST app and be as functional as it can (avoid async/await).

If you think that your app does not need such complexity or maybe it would overload your application, then this mini-framework is not for you.

## Installation

This library was built using Node v8.11.1, the last LTS version at the time

```bash
$ npm install -S mini-mvcs
```

## Usage

Create a ```config.js``` file following this structure:

```javascript
module.exports = {
  development: {
    database: {

    },
  },
  test: {

  },
  production: {

  },
};
```

In the same folder create an ```index.js``` file and import the library for starting an app:

```javascript
const miniMvcs = require('miniMvcs');
miniMvcs.start();
```

### Configuration

Following are all the configurable variables:



And of course you can add some of your own and use them like this:

```javascript
const { config } = require('miniMvcs');
```

### Creating Models

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

### Creating Services

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

#### CRUD Service

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

### Creating Controllers

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

#### Transactional controllers

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

#### CRUD controller

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

#### Templater

Well, here I decided to include my first library I created when learning NodeJS (https://github.com/nardhar/custom-rest-templater), but at source code level, that is until I can make it fully pluggable. So I can end all my controllers with the ```res.customRest``` method:

```javascript
// controllers/blog.controller.js
module.exports = (router, services) => {
  router.get('/my_blog/:code', (req, res, next) => {
    return services.blog.readByCode(req.params.code)
    .then(res.customRest)
    .catch(next);
  });
};
```

### Creating Middlewares

In case you want to add some middlewares, you can create a ```middlewares``` folder and create your middlewares files like this:

```javascript
// middlewares/auth.middleware.js
// we can use the services
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

### Error Handling

For generating DRYish errors I added some Error Classes (there are more samples in the sample/errors folder):

#### ValidationError

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

#### NotFoundError

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

### Running the App

For running the app, just execute your ```index.js``` file as usual:

```bash
$ node index.js
```

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
- Give it a better name.
- Create a cli command for generating an app, models, controllers, services.
- Make Sequelize and Express optional.
- Include HATEOAS generation utilities (I have some ideas, just need to refine them).
- Make it pluggable at all possible levels, although my intention is not for this to become a super library, but instead, to be a mini-framework for creating dry, simple and extensible REST apps.
- Make CrudController and CrudService a plugin (or at least put them in another library).
- Improve the Error API (Is it ok to be a class?) and make it pluggable.
- Improve the REST templater (A wrapper may be a better idea) and make it pluggable.
