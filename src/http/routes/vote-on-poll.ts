import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import { FastifyInstance } from 'fastify';
import { prisma } from '../../lib/prisma';

export async function voteOnPoll(app: FastifyInstance) {
  // route for vote on poll
  app.post('/polls/:pollId/votes', async (request, reply) => {
    const voteOnPollBody = z.object({
      pollOptionId: z.string().uuid(),
    });

    const voteOnPollParams = z.object({
      pollId: z.string().uuid(),
    });

    const { pollId } = voteOnPollParams.parse(request.params);
    const { pollOptionId } = voteOnPollBody.parse(request.body);

    let { sessionId } = request.cookies;

    if (sessionId) {
      const previousUserVoteOnPoll = await prisma.vote.findUnique({
        where: {
          sessionId_pollId: {
            sessionId,
            pollId,
          },
        },
      });

      if (
        previousUserVoteOnPoll &&
        previousUserVoteOnPoll.pollOptionId !== pollOptionId
      ) {
        await prisma.vote.delete({
          where: {
            id: previousUserVoteOnPoll.id,
          },
        });
      } else if (previousUserVoteOnPoll) {
        return reply
          .status(400)
          .send({ message: 'You have already voted on this poll' });
      }
    }

    if (!sessionId) {
      sessionId = randomUUID();

      reply.setCookie('sessionId', sessionId, {
        path: '/',
        maxAge: 2592000, // 30 days
        signed: true, // <sessionId>.<signature>, Ex.: 982c004d-8665-409d-842b-0a05673b003c.xgwDGi5cnHRPoiuwTCAzA0k7W2F7RllDYxISScyqQ1w
        httpOnly: true,
      });
    }

    await prisma.vote.create({
      data: {
        sessionId,
        pollId,
        pollOptionId,
      },
    });

    return reply.status(201).send();
  });
}
