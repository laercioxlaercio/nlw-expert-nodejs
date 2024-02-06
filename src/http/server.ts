import fastiy from 'fastify';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
const config = {
  port: process.env.PORT || 3333,
};

const app = fastiy();

// connect db
const prisma = new PrismaClient();

// create new poll
app.post('/polls', async (request, reply) => {
  const createPollBody = z.object({
    title: z.string(),
  });

  const { title } = createPollBody.parse(request.body);

  const poll = await prisma.poll.create({
    data: {
      title,
    },
  });

  return reply.status(201).send({ pollId: poll.id });
});

app
  .listen({ port: Number(config.port) })
  .then(() =>
    console.log(`HTTP server listening at http://localhost:${config.port}`),
  );
