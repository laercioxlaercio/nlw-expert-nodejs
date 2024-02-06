import fastiy from 'fastify';
const config = {
  port: process.env.PORT || 3333,
};

const app = fastiy();

app.get('/', () => 'ok');

app
  .listen({ port: Number(config.port) })
  .then(() =>
    console.log(`HTTP server listening at http://localhost:${config.port}`),
  );
