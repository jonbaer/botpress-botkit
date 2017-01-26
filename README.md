# Botkit + Botpress = ❤️

## I don't understand, why a Botkit module?

Appart from being awesome, [Botkit](https://github.com/howdyai/botkit) is the most popular open-source bot development tool. If you've been playing with Botpress a bit, you probably noticed that it lacks a conversation management system (which Botkit offers). Our philosophy at Botpress is to have a small & powerful core and leverage the best tools available by integrating them as Modules.

## Getting started

### 1. Get acquinted with [Botkit](https://github.com/howdyai/botkit) first
### 2. Install this module in your bot: `bp i botkit`
### 3. In your bot's `index.js` file, require Botkit

```js
var BotpressBot = require('botpress-botkit').BotpressBot
```

### 4. Spawn an instance of BotpressBot

```js
module.exports = function(bp) {
  var controller = BotpressBot(bp, { /* optional configuration */ })
  var bot = controller.spawn()
  controller.startTicking()

  // Use botkit normally
}
```

## How does it work?

Both Botkit and Botpress relies on the concept of middlewares and so it's pretty easy to make them both work together. For this module to work, you must already have a botpress connector installed (for example `botpress-messenger`). The way it works is that Botkit will register an incoming middleware (which should be near the end as it swallows events) and process the messages as they enter the middleware.

```
[messenger] ---> [botpress-messenger webhook] ---> [dispatch incoming middleware] ---> [analytics, etc..] ---> [botkit]
```

## What if I want to use Botkit's built-in connectors?

Then you should use Botkit directly, not this module. If you still want to leverage Botpress, know that it is 100% feasible. It's just the other way around. We haven't tested it yet but we plan on prototyping something later.

## How-tos

### How do I send a non-textual question (`bot.ask`)?

If you are using an official botpress connector, we usually expose action creators that you can use:

```js
// instead of doing this
bp.messenger.sendText(event.user.id, 'My message', { typing: true })
// do this (notice CREATE*Text instead of sendText)
const message = bp.messenger.createText(event.user.id, 'My message', { typing: true })
convo.ask(message, /* ... */)
```

### How do I capture non-textual answers?

There's an extra configuration that we added to Botkit: `receive_as_text`. This allows you to treat these events as if they were regular messages. `receive_as_text` defaults to `['quick_reply']`

Events that are captured this way will be prepended by the event type, followed by `::`, followed by their textual value. For example, a quick_reply event would look like: `quick_reply::BOOST_GYM_VIDEO`