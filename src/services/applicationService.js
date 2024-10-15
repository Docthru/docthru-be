import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 여기에 애플리케이션 생성 로직을 구현합니다.
// 예를 들어, 중복 신청 확인, 챌린지 존재 여부 확인 등의 비즈니스 로직을 추가할 수 있습니다.
export const createApplication = async (userId, challengeId) => {
  const application = await prisma.application.create({
    data: {
      userId,
      challengeId,
    },
  });

  return application;
};

// 신청 목록 조회 서비스 함수
export const getApplications = async () => {
  return prisma.application.findMany({
    include: {
      user: true,
      challenge: true,
    },
  });
};

// 신청 삭제 서비스 함수
export const deleteApplication = async (applicationId) => {
  return prisma.application.delete({
    where: { id: applicationId },
  });
};

// 신청 업데이트 서비스 함수
export const updateApplication = async (
  applicationId,
  status,
  invalidationComment
) => {
  return prisma.application.update({
    where: { id: applicationId },
    data: {
      status,
      invalidationComment,
      invalidatedAt: status === 'REJECTED' ? new Date() : null,
    },
  });
};
