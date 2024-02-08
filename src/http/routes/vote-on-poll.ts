import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import { FastifyInstance } from 'fastify';
import { prisma } from '../../lib/prisma';
import { redis } from '../../lib/redis';
import { voting } from '../../utils/voting-pub-sub';

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

        const votes = await redis.zincrby(
          pollId,
          -1,
          previousUserVoteOnPoll.pollOptionId,
        );

        voting.publish(pollId, {
          pollOptionId: previousUserVoteOnPoll.pollOptionId,
          votes: Number(votes),
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

    const votes = await redis.zincrby(pollId, 1, pollOptionId); // This increments each option by 1 in a single poll

    voting.publish(pollId, {
      pollOptionId,
      votes: Number(votes),
    });

    return reply.status(201).send();
  });
}
