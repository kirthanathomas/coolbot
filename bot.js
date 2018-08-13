'use strict';
require('dotenv').config();
const Botkit       = require('botkit');
var middleware = require('botkit-middleware-watson')({
  username: process.env.ASSISTANT_USERNAME,
  password: process.env.ASSISTANT_PASSWORD,
  workspace_id: process.env.WORKSPACE_ID,
  url: process.env.ASSISTANT_URL || 'https://gateway.watsonplatform.net/assistant/api',
  version: '2018-07-10'
});

// use the tokens you got from the previous step
const slack_token  = process.env.SLACK_TOKEN;

console.log('token is', slack_token);

const slackController = Botkit.slackbot({
    // optional: wait for a confirmation events for each outgoing message before continuing to the next message in a conversation
    require_delivery: true
});
const slackBot = slackController.spawn({
    token: slack_token
});
// create rtm connection
slackBot.startRTM((err, bot, payload) => {
    if (err) {
	console.log('error is', err);
	throw new Error('Could not connect to Slack');
    }
    slackController.log('Slack connection established.');
});
// listener that handles incoming messages
slackController.hears(['.*'], ['direct_message', 'direct_mention'], (bot, message) => {
    slackController.log('Slack message received');
    middleware.interpret(bot, message, function() {
    if (message.watsonError) {
      console.log(message.watsonError);
      bot.reply(message, message.watsonError.description || message.watsonError.error); 
    } else if (message.watsonData && 'output' in message.watsonData) {
	const output = message.watsonData.output.text;
	output.push('senior');
      bot.reply(message, output.join('\n'));
    } else {
      console.log('Error: received message in unknown format. (Is your connection with Watson Conversation up and running?)');
      bot.reply(message, 'I\'m sorry, but for technical reasons I can\'t respond to your message');
    }
  });
});
