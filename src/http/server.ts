import fastiy from 'fastify';
import cookie from '@fastify/cookie';
import { createPoll } from './routes/create-poll';
import { getPoll } from './routes/get-poll';
import { voteOnPoll } from './routes/vote-on-poll';
const config = {
  port: process.env.PORT || 3333,
};

const app = fastiy();

app.register(cookie, {
  secret: process.env.COOKIE_SIGNATURE,
  hook: 'onRequest',
});

app.register(createPoll);
app.register(getPoll);
app.register(voteOnPoll);

app
  .listen({ port: Number(config.port) })
  .then(() =>
    console.log(`HTTP server listening at http://localhost:${config.port}`),
  );
