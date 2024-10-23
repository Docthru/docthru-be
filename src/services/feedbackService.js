import prisma from '../lib/prisma.js';
import * as notificationService from './notificationService.js';
import {
  BadRequestException,
  NotFoundException,
  UnprocessableEntityException,
  ForbiddenException,
} from '../errors/customException.js';

//커서 기반
export const getFeedbacksWorkById = async ({
  workId,
  cursorId,
  limit,
  userId,
  repliesCursorId,
}) => {
  let feedbackList;

  let orderBy = [{ createdAt: 'desc' }, { id: 'asc' }];

  const feedbacks = await prisma.feedback.findMany({
    where: { workId: Number(workId) },
    orderBy: orderBy,
    ...(cursorId && { cursor: { id: Number(cursorId) } }),
    take: Number(limit + 1),
    include: {
      user: {
        select: {
          nickname: true,
          grade: true,
        },
      },
      replies: {
        take: Number(limit + 1),
        orderBy: orderBy,
        ...(repliesCursorId && { cursor: { id: Number(repliesCursorId) } }),
        include: {
          user: {
            select: {
              nickname: true,
              grade: true,
            },
          },
        },
      },
    },
  });

  const work = await prisma.work.findUnique({
    where: { id: Number(workId) },
    include: {
      challenge: {
        select: {
          progress: true,
        },
      },
    },
  });

  const userInfo = await prisma.user.findUnique({
    where: { id: Number(userId) },
  });

  if (work.challenge.progress) {
    // progress가 true일 때: ADMIN만 수정 가능
    feedbackList = feedbacks.map((feedback) => ({
      ...feedback,
      isEditable: userInfo.role === 'ADMIN',

      hasNext: feedback.replies.length > limit ? true : false,
      nextCursor:
        feedback.replies.length > limit ? feedback.replies[limit]?.id : null,

      replies: feedback.replies.slice(0, limit).map((reply) => ({
        ...reply,
        isEditable: userInfo.role === 'ADMIN',
      })),
    }));
  } else {
    // progress가 false일 때: ADMIN과 피드백 작성자만 수정 가능
    feedbackList = feedbacks.map((feedback) => ({
      ...feedback,
      isEditable: userInfo.role === 'ADMIN' || feedback.userId === userId,

      nextCursor:
        feedback.replies.length > limit ? feedback.replies[limit]?.id : null,
      hasNext: feedback.replies.length > limit ? true : false,

      replies: feedback.replies.slice(0, limit).map((reply) => ({
        ...reply,
        isEditable: userInfo.role === 'ADMIN' || feedback.userId === userId,
      })),
    }));
  }

  const nextCursor = feedbacks.slice(limit)[0]?.id || null;
  const hasNext = feedbacks.length > limit ? true : false;
  const list = feedbackList.slice(0, limit);

  const data = list.map((feedback) => ({
    id: feedback.id,
    userId: feedback.userId,
    workId: feedback.workId,
    content: feedback.content,
    createdAt: feedback.createdAt,
    updatedAt: feedback.updatedAt,
    user: feedback.user,
    isEditable: feedback.isEditable,
    replies: {
      meta: {
        hasNext: feedback.hasNext,
        nextCursor: feedback.nextCursor,
      },
      list: feedback.replies,
    },
  }));

  return { meta: { hasNext, nextCursor }, list: data };
};

export const postFeedbackById = async ({ workId, content, userId }) => {
  if (!content) {
    throw new BadRequestException('내용 입력은 필수입니다.');
  }

  const feedback = await prisma.feedback.create({
    data: {
      content: content,
      userId: Number(userId),
      workId: Number(workId),
    },
  });

  await notifyCreateAboutFeedback(userId, workId, feedback);

  return feedback;
};

export const updateFeedbackById = async ({ feedbackId, content, userId }) => {
  try {
    if (!content) {
      throw new BadRequestException('내용 입력은 필수입니다.');
    }

    return await prisma.$transaction(
      async (tx) => {
        // 1. 피드백 정보 조회
        const feedbackInfo = await tx.feedback.findUnique({
          where: { id: Number(feedbackId) },
          include: {
            user: true,
            work: {
              include: {
                challenge: true,
                user: true,
              },
            },
          },
        });

        if (!feedbackInfo) {
          throw new NotFoundException('피드백을 찾을 수 없습니다.');
        }

        // 2. 피드백 업데이트
        const updatedFeedback = await tx.feedback.update({
          where: { id: Number(feedbackId) },
          data: { content },
        });

        // 3. 알림 처리
        const userInfo = await tx.user.findUnique({
          where: { id: Number(userId) },
        });

        const challengeInfo = feedbackInfo.work.challenge;

        // ADMIN이 수정한 경우 피드백 작성자에게 알림
        if (userInfo?.role === 'ADMIN') {
          notificationService.notifyContentChange(
            [Number(feedbackInfo.user.id)],
            Number(userId),
            'FEEDBACK',
            challengeInfo.title,
            '수정',
            Number(challengeInfo.id),
            Number(feedbackInfo.work.id)
          );
        }

        // 작업물 작성자에게 알림 (피드백 작성자와 다른 경우)
        if (feedbackInfo.user.id !== feedbackInfo.work.userId) {
          notificationService.notifyContentChange(
            [Number(feedbackInfo.work.userId)],
            Number(userId),
            'FEEDBACK',
            challengeInfo.title,
            '수정',
            Number(challengeInfo.id),
            Number(feedbackInfo.work.id)
          );
        }

        return updatedFeedback;
      },
      {
        isolationLevel: 'Serializable',
      }
    );
  } catch (error) {
    if (error.code === 'P2025') {
      throw new NotFoundException('피드백을 찾을 수 없습니다.');
    }
    throw error;
  }
};

export const deleteFeedbackById = async ({ feedbackId, userId }) => {
  try {
    return await prisma.$transaction(
      async (tx) => {
        const feedbackInfo = await tx.feedback.findUnique({
          where: { id: Number(feedbackId) },
          include: {
            user: true,
            work: {
              include: {
                challenge: true,
                user: true,
              },
            },
          },
        });

        if (!feedbackInfo) {
          throw new NotFoundException('피드백을 찾을 수 없습니다.');
        }

        const userInfo = await tx.user.findUnique({
          where: { id: Number(userId) },
        });

        const challengeInfo = feedbackInfo.work.challenge;

        await tx.feedback.delete({
          where: {
            id: Number(feedbackId),
          },
        });

        if (userInfo?.role === 'ADMIN') {
          notificationService.notifyContentChange(
            [Number(feedbackInfo.user.id)],
            Number(userId),
            'FEEDBACK',
            challengeInfo.title,
            '삭제',
            Number(challengeInfo.id),
            Number(feedbackInfo.work.id)
          );
        }

        if (feedbackInfo.user.id !== feedbackInfo.work.userId) {
          notificationService.notifyContentChange(
            [Number(feedbackInfo.work.userId)],
            Number(userId),
            'FEEDBACK',
            challengeInfo.title,
            '삭제',
            Number(challengeInfo.id),
            Number(feedbackInfo.work.id)
          );
        }

        return { message: '피드백이 삭제되었습니다.' };
      },
      {
        isolationLevel: 'Serializable',
      }
    );
  } catch (error) {
    if (error.code === 'P2025') {
      throw new NotFoundException('피드백을 찾을 수 없습니다.');
    }
    throw error;
  }
};

const notifyCreateAboutFeedback = async (userId, workId, feedback) => {
  const workInfo = await prisma.work.findUnique({
    where: { id: Number(workId) },
    include: {
      challenge: true,
      user: true,
    },
  });

  if (!workInfo) {
    throw new NotFoundException('작업물을 찾을 수 없습니다.');
  }

  notificationService.notifyNewFeedback(
    [Number(workInfo.userId)],
    Number(userId),
    Number(workInfo.challenge.id),
    workInfo.challenge.title,
    Number(workId),
    Number(feedback.id),
    new Date()
  );
};

export const validateFeedbackAccess = async (userId, feedbackId) => {
  const [userInfo, feedbackInfo] = await prisma.$transaction([
    prisma.user.findUnique({
      where: { id: Number(userId) },
    }),
    prisma.feedback.findFirst({
      where: { id: Number(feedbackId) },
      include: {
        work: {
          include: {
            challenge: {
              include: {
                participations: true,
              },
            },
          },
        },
      },
    }),
  ]);

  if (!feedbackInfo) {
    throw new NotFoundException('등록된 피드백이 없습니다.');
  }

  const challengeInfo = feedbackInfo.work.challenge;

  if (!challengeInfo) {
    throw new NotFoundException('등록된 챌린지가 없습니다.');
  }

  if (challengeInfo.progress) {
    if (userInfo.role === 'ADMIN') {
      return;
    } else {
      throw new UnprocessableEntityException('챌린지가 마감됐습니다.');
    }
  }

  if (userInfo.id === feedbackInfo.userId || userInfo.role === 'ADMIN') {
    return;
  }

  throw new ForbiddenException('접근 권한이 없습니다.');
};

export const validateCreateFeedbackAccess = async (workId) => {
  const workWithChallenge = await prisma.work.findUnique({
    where: { id: Number(workId) },
    include: {
      challenge: {
        include: {
          participations: true,
        },
      },
    },
  });

  if (!workWithChallenge) {
    throw new NotFoundException('등록된 작업물이 없습니다.');
  }

  const challengeInfo = workWithChallenge.challenge;

  if (challengeInfo.progress) {
    throw new UnprocessableEntityException('챌린지가 마감됐습니다.');
  }

  return;
};
