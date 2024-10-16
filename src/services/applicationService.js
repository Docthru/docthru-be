import prisma from '../lib/prisma.js';

// 신청 목록 조회
export const getApplications = async () => {
  return prisma.application.findMany({
    include: {
      challenge: {
        select: {
          id: true,
          docType: true,
          field: true,
          title: true,
          maxParticipants: true,
          deadline: true,
        },
      },
      user: { select: { nickname: true } }, // 어드민의 닉네임 포함
    },
    select: {
      id: true,
      createdAt: true,
      status: true,
      isCancelled: true, // 취소 신청을 하기 위한 필드
      message: true, // 삭제/거절 사유
      updatedAt: true, // 상태 변경 시간
    },
  });
};

// 신청 상태 업데이트 (승인 및 거절 포함)
export const updateApplication = async (applicationId, status, message) => {
  return prisma.application.update({
    where: { id: applicationId },
    data: {
      status,
      message, // 거절 사유
      updatedAt: new Date(), // 상태 변경 시간
    },
  });
};

// 신청 삭제 (관리자)
export const deleteApplication = async (applicationId, message) => {
  return prisma.application.update({
    where: { id: applicationId },
    data: {
      status: 'DELETED',
      message, // 삭제 사유
      updatedAt: new Date(),
    },
  });
};

