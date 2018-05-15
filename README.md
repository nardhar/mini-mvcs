# MiniMVCS Framework

A small Model View Controller Service Framework for creating Rest Apps with NodeJS, Express and Sequelize

## The Why of MiniMVCS

This mini-framework idea (I think it's neither big nor great enough to be called a full framework)
came to my mind when I started doing my third or fourth backend project in NodeJS and copied my utilities, dir
structure and code architecture; it was not that great but I was not being DRYish, so I refined my
ideas and started working in this library.

### Considerations

This library follows the good practices about architecture I learned when I was programming with
[Grails](https://grails.org) Framework (I still do it) which highly encourages that applications should have a **Service**
layer which in turn is the only one available to access the **Model** layer, basically this:

```
┌──────┐      ┌────────────┐      ┌─────────┐      ┌───────┐
│ View │ ───> │ Controller │ ───> │ Service │ ───> │ Model │
└──────┘      └────────────┘      └─────────┘      └───────┘
```

This has (IMHO) really good advantages:

- The Controller layer is responsible only for receiving the request and show the result of the operation.
- The Model layer is responsible for defining how is defined the data model.
- The Service layer holds all the functionality that compounds the core of the application otherwise known as the Bussiness Layer, making it highly reusable for controllers and services themselves.
- And last, it helps my code to be really functional, short and simple.

If you think that your app does not need such complexity or maybe it would overload your application,
then this framework it's not for you.

## Installation

```bash
$ npm install -S mini-mvcs
```

### Dependencies

Node v8.11.1

## Usage

### Configuration

### Creating Models

### Creating Services

#### CRUD Service

### Creating Controllers

#### CRUD Controller

### Creating Middlewares

### Error Handling

### Running the App

### Testing

## Samples

No samples yet, but I promise I'll add some soon.

## FAQ

**Why Express and Sequelize?**

They were the frameworks I was using when started programming in NodeJS, so for the first version I decided to include them by default.

**Why not use an already established and well known NodeJS MVC framework?**

I explored some options but some frameworks were too big for my requirements, besides, they required to use some other code conventions for every layer, and it did not make my code so reusable between apps (which may or may not use the same framework).

Besides, I think this library is more like a loader than a proper MVC framework.

**Are you planning to add a View layer?**

Although it is a somewhat MVC framework, my only intention is to work for REST apps (that is something that creates html responses), so I wouldn't add a proper View layer, unless it serves for formatting and generating the JSON response.

## TODO

Obviously there is a lot of work to do to improve this library, starting with (and in no particular order):
- Give it a better name
- Create a cli command for generating an app, models, controllers, services.
- Make Sequelize and Express optional.
- Include HATEOAS generation utilities.
- Improve the Error API (Is it ok to be a class?).
- Improve the REST templater (A wrapper may be a better idea).
- Make it pluggable.
- Make CrudController and CrudService a plugin (or at least another library).
