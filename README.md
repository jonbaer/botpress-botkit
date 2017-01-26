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
[messenger] ---> [botpress-messenger webhook] ---> [dispatch incoming middleware] 
---> [analytics, etc..] ---> [botkit]
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

### Full example

This example needs the `botpress-botkit` and `botpress-messenger` modules installed

```js
const BotpressBot = require('botpress-botkit').BotpressBot

module.exports = function(bp) {

  var controller = BotpressBot(bp, {})
  var bot = controller.spawn()
  controller.startTicking()

  controller.hears(['what is my name', 'who am i'], 'message_received', function(bot, message) {

    controller.storage.users.get(message.user, function(err, user) {
      if (user && user.name) {
        bot.reply(message, 'Your name is ' + user.name);
      } else {
        bot.startConversation(message, function(err, convo) {
          if (!err) {
            convo.say('I do not know your name yet!');
            convo.ask('What should I call you?', function(response, convo) {

              const confirm = bp.messenger.createText(convo.context.user, 'You want me to call you: ' + response.text + '?', {
                quick_replies: [{
                    payload: 'BP_YES',
                    title: 'Yes',
                    content_type: 'text'
                  },
                  {
                    payload: 'BP_NO',
                    title: 'No',
                    content_type: 'text'
                  }
                ],
                typing: true
              })

              convo.ask(confirm, [{
                pattern: 'yes',
                callback: function(response, convo) {
                  // since no further messages are queued after this,
                  // the conversation will end naturally with status == 'completed'
                  convo.next();
                }
              }, {
                pattern: 'no|quick_reply::BP_NO',
                callback: function(response, convo) {
                  // stop the conversation. this will cause it to end with status == 'stopped'
                  convo.stop();
                }
              }, {
                default: true,
                callback: function(response, convo) {
                  convo.repeat();
                  convo.next();
                }
              }]);

              convo.next();

            }, {
              'key': 'nickname'
            });



            convo.on('end', function(convo) {
              if (convo.status == 'completed') {
                bot.reply(message, 'OK! I will update my dossier...');

                controller.storage.users.get(message.user, function(err, user) {
                  if (!user) {
                    user = {
                      id: message.usebr,
                    };
                  }
                  user.name = convo.extractResponse('nickname');
                  controller.storage.users.save(user, function(err, id) {
                    bot.reply(message, 'Got it. I will call you ' + user.name + ' from now on.');
                  });
                });



              } else {
                // this happens if the conversation ended prematurely for some reason
                bot.reply(message, 'OK, nevermind!');
              }
            });
          }
        });
      }
    });
  });

  bp.middlewares.load()
}
```
