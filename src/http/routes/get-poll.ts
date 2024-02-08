import { z } from 'zod';
import { FastifyInstance } from 'fastify';
import { prisma } from '../../lib/prisma';
import { redis } from '../../lib/redis';

export async function getPoll(app: FastifyInstance) {
  // route for get a poll
  app.get('/polls/:pollId', async (request, reply) => {
    const getPollParams = z.object({
      pollId: z.string().uuid(),
    });

    const { pollId } = getPollParams.parse(request.params);

    const poll = await prisma.poll.findUnique({
      where: {
        id: pollId,
      },
      include: {
        options: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    if (!poll) {
      return reply.status(400).send({ message: 'Poll not found.' });
    }

    const result = await redis.zrange(pollId, 0, -1, 'WITHSCORES'); // Return a range (from 0 to -1 is equivalent to all) of all scores from a poll ranking by a key.

    const votes = result.reduce((accObject, cur, index) => {
      if (index % 2 === 0) {
        const score = result[index + 1];

        Object.assign(accObject, { [cur]: Number(score) });
      }

      return accObject;
    }, {} as Record<string, number>);

    return reply.send({
      poll: {
        id: poll.id,
        title: poll.title,
        options: poll.options.map(({ id, title }) => {
          return {
            id,
            title,
            score: id in votes ? votes[id] : 0,
          };
        }),
      },
    });
  });
}
