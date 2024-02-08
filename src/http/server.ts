import fastiy from 'fastify';
import cookie from '@fastify/cookie';
import websocket from '@fastify/websocket';
import { createPoll } from './routes/create-poll';
import { getPoll } from './routes/get-poll';
import { voteOnPoll } from './routes/vote-on-poll';
import { pollResults } from './ws/poll.results';
const config = {
  port: process.env.PORT || 3333,
};

const app = fastiy();

// set cookies
app.register(cookie, {
  secret: process.env.COOKIE_SIGNATURE,
  hook: 'onRequest',
});

// ws
app.register(websocket);

// poll routes
app.register(createPoll);
app.register(getPoll);
app.register(voteOnPoll);

// ws route
app.register(pollResults);

app
  .listen({ port: Number(config.port) })
  .then(() =>
    console.log(`HTTP server listening at http://localhost:${config.port}`),
  );
