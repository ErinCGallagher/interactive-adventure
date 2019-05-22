// Copyright 2016, Google, Inc.
// Licensed under the Apache License, Version 2.0 (the 'License');
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an 'AS IS' BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

'use strict';

const functions = require('firebase-functions');

const {
  dialogflow,
  ImmersiveResponse,
  Permission,
  Suggestions,
} = require('actions-on-google');

const firebaseConfig = JSON.parse(process.env.FIREBASE_CONFIG);

const app = dialogflow({debug: true});

// Handle the Dialogflow intent for the fedault welcome.
// if the name exists do not ask for the permission
app.intent('welcome', (conv) => {
  const name = conv.user.storage.userName;
  if (!name) {
    // Asks the user's permission to know their name, for personalization.
    conv.ask(new Permission({
      context: 'Let\'s play interactive adventure! To get to know you better',
      permissions: 'NAME',
    }));
  } else {
    conv.ask(` Hi again, ${name}. Would you like to hear the rules before starting?`);
  }
  conv.ask(new ImmersiveResponse({
    url: `https://${firebaseConfig.projectId}.firebaseapp.com`,
  }));
});

// Handle the Dialogflow intent to retrieve user permission for their name
app.intent('actions_intent_PERMISSION', (conv, params, permissionGranted) => {
  if (!permissionGranted) {
    conv.ask(`Ok, no worries. Which town would you like?`);
    conv.ask(new Suggestions('Yes', 'No'));
  } else {
    conv.user.storage.userName = conv.user.name.display;
    conv.ask(`Thanks, ${conv.user.storage.userName}. Would you like to hear the rules before starting?`);
    conv.ask(new Suggestions('Yes', 'No'));
  }
});

// Handle welcome follow up intent and trigger instructions
app.intent('welcome - yes', (conv) => {
  instructionsConv(conv);
});

// Handle welcome follow up intent and trigger game start
app.intent('welcome - no', (conv) => {
  conv.close('Okay, let\'s start playing!');
});

// Handle the Dialogflow intent to 
app.intent('instructions', (conv) => {
  instructionsConv(conv);
});

// Function handling instruction conversation
const instructionsConv = (conv) => {
	conv.ask(new ImmersiveResponse({
      state: {
        instructions: true,
      },
    }));
	conv.close('You are the new mayor of a town for the next 10 years. Your goal is to survive and prosper. ' +
  		'Each turn you can buy or sell acres of land, feed people using your bushels, ' +
  		'and plant a number of seeds on your land to grow bushels.' +
  		' Let\'s start playing!');
}

exports.yourAction = functions.https.onRequest(app);

