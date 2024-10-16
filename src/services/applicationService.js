import prisma from '../lib/prisma.js';

export const ApplicationService = {
  // 신규 챌린지 신청 (일반 사용자)
  createApplication: async (userId, challengeId, { title, field, docType, description, docUrl, deadline, maxParticipants }) => {
    return prisma.application.create({
      data: {
        userId,
        challengeId: parseInt(challengeId),
        challenge: {
          connect: { id: parseInt(challengeId) },
        },
        title,
        field,
        docType,
        description,
        docUrl,
        deadline,
        maxParticipants,
      },
    });
  },

  // 사용자가 신청한 챌린지 목록 조회 (취소된 신청 제외)
  getUserApplications: async (userId) => {
    return prisma.application.findMany({
      where: {
        userId,
        isCancelled: false, // 취소된 신청은 목록에서 제외
      },
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
      },
    });
  },

  // 사용자가 신청한 특정 챌린지 상세 조회 (상태에 관계없이 신청 상태 표시)
  getUserApplicationById: async (userId, applicationId) => {
    const application = await prisma.application.findUnique({
      where: { id: parseInt(applicationId), userId: parseInt(userId) },
      include: {
        challenge: {
          select: {
            id: true,
            docType: true,
            field: true,
            title: true,
            description: true,
            docUrl: true,
            maxParticipants: true,
            deadline: true,
          },
        },
        user: {
          select: { nickname: true },
        },
      },
    });

    if (!application) return null;

    const result = {
      id: application.id,
      docType: application.challenge.docType,
      field: application.challenge.field,
      title: application.challenge.title,
      description: application.challenge.description,
      docUrl: application.challenge.docUrl,
      maxParticipants: application.challenge.maxParticipants,
      applicationDate: application.createdAt,
      deadline: application.challenge.deadline,
      status: application.status,
    };

    // 상태가 DELETED 또는 REJECTED일 때 어드민 정보 추가
    if (application.status === 'DELETED' || application.status === 'REJECTED') {
      result.adminInfo = {
        adminNickname: application.user.nickname,
        reason: application.message, // 삭제 또는 거절 사유
        updatedAt: application.updatedAt, // 상태가 설정된 날짜
      };
    }

    return result;
  },

  // 신청 상태 업데이트 (승인, 거절, 삭제 - 어드민 전용)
  updateApplication: async (applicationId, status, message) => {
    const updateData = {
      status,
      updatedAt: new Date(),
    };

    if (status === 'DELETED' || status === 'REJECTED') {
      updateData.message = message;  // 삭제 또는 거절 사유 전달
    }

    return prisma.application.update({
      where: { id: parseInt(applicationId) },
      data: updateData,
    });
  },

  // 신청 취소 (WAITING 상태일 때만 가능하며, 전체 목록 조회에서 제외)
  cancelApplication: async (applicationId) => {
    const application = await prisma.application.findUnique({
      where: { id: parseInt(applicationId) },
    });

    if (!application || application.status !== 'WAITING') {
      throw new Error('대기 중인 신청만 취소할 수 있습니다.');
    }

    return prisma.application.update({
      where: { id: parseInt(applicationId) },
      data: {
        isCancelled: true,  // 목록에서 제외
      },
    });
  },

  // 관리자용 신청 목록 조회 (어드민 전용)
  getAdminApplications: async () => {
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
        user: {
          select: { nickname: true },
        },
      },
    });
  },

  // 신청 수정 (어드민 전용)
  updateApplicationDetails: async (applicationId, updateData) => {
    const application = await prisma.application.findUnique({
      where: { id: parseInt(applicationId) },
    });

    if (!application) {
      throw new Error('신청을 찾을 수 없습니다.');
    }

    return prisma.application.update({
      where: { id: parseInt(applicationId) },
      data: {
        title: updateData.title || application.title,
        field: updateData.field || application.field,
        docType: updateData.docType || application.docType,
        description: updateData.description || application.description,
        docUrl: updateData.docUrl || application.docUrl,
        deadline: updateData.deadline || application.deadline,
        maxParticipants: updateData.maxParticipants || application.maxParticipants,
      },
    });
  },
};
