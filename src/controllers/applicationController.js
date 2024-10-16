import * as applicationService from '../services/applicationService.js';
import prisma from '../lib/prisma.js';

// 신청 생성 함수 (일반 유저 접근 가능)
export const createApplication = async (req, res, next) => {
  try {
    const { challengeId, title, field, docType, description, docUrl, deadline, maxParticipants } = req.body;
    const userId = req.user.userId;

    await prisma.application.create({
      data: {
        userId,
        challengeId,
        challenge: {
          create: {
            title,
            field,
            docType,
            description,
            docUrl,
            deadline, // 프론트엔드에서 YYYY-MM-DD 형식으로 전달할 예정
            maxParticipants,
          },
        },
      },
    });

    res.status(201).json({ message: "신청이 성공적으로 완료되었습니다." });
  } catch (error) {
    next(error);
  }
};

// 신청 목록 조회 (관리자와 일반 사용자 모두 접근 가능, 취소된 신청 제외)
export const getApplications = async (req, res, next) => {
  try {
    const applications = await applicationService.getApplications();

    const formattedApplications = applications
      .filter((application) => !application.isCancelled) // 전체 목록에서 취소된 신청은 제외
      .map((application) => ({
        id: application.id,
        docType: application.challenge.docType,
        field: application.challenge.field,
        title: application.challenge.title,
        participates: application.challenge.maxParticipants,
        applicationDate: application.createdAt,
        deadline: application.challenge.deadline,
        status: application.status,
      }));

    res.status(200).json({ list: formattedApplications });
  } catch (error) {
    next(error);
  }
};

// 신청 상세 조회 (삭제 또는 거절 상태일 때만 상세 페이지에 어드민 정보 포함)
export const getApplicationById = async (req, res, next) => {
  try {
    const { applicationId } = req.params;

    const application = await prisma.application.findUnique({
      where: { id: parseInt(applicationId) },
      include: {
        challenge: true,
        user: { select: { nickname: true } }, // 어드민의 닉네임 포함
      },
    });

    if (!application) {
      return res.status(404).json({ message: '신청을 찾을 수 없습니다.' });
    }

    let adminInfo = null;
    if (application.status === 'DELETED' || application.status === 'REJECTED') {
      adminInfo = {
        adminNickname: application.user.nickname,
        reason: application.message, // 삭제 또는 거절 사유
        updatedAt: application.updatedAt, // 상태 변경 시간
      };
    }

    res.status(200).json({
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
      adminInfo, // 삭제 또는 거절 상태일 경우만 표시
    });
  } catch (error) {
    next(error);
  }
};

// 신청 상태 업데이트 (승인, 거절 포함 - 관리자 전용)
export const updateApplication = async (req, res, next) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: '접근 권한이 없습니다.' });
    }

    const { applicationId } = req.params;
    const { status, message } = req.body;

    if (status === 'REJECTED' && !message) {
      return res.status(400).json({ message: '거절 사유를 입력해 주세요.' });
    }

    const updatedApplication = await applicationService.updateApplication(
      parseInt(applicationId),
      status,
      message // 거절 사유 전달
    );

    res.status(200).json({ message: "신청 상태가 성공적으로 업데이트되었습니다." });
  } catch (error) {
    next(error);
  }
};

// 신청 삭제 (관리자 전용 - 삭제 사유 포함)
export const deleteApplication = async (req, res, next) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: '접근 권한이 없습니다.' });
    }

    const { applicationId } = req.params;
    const { message } = req.body; // 삭제 사유 추가
    await applicationService.deleteApplication(parseInt(applicationId), message);

    res.status(204).json({ message: "신청이 성공적으로 삭제되었습니다." });
  } catch (error) {
    next(error);
  }
};

// 신청 취소 (일반 사용자 - WAITING 상태에서만 취소 가능)
export const cancelChallenge = async (req, res, next) => {
  try {
    const { applicationId } = req.params;

    const application = await prisma.application.findUnique({
      where: { id: parseInt(applicationId) },
    });

    if (application.status !== 'WAITING') {
      return res.status(400).json({ message: '대기 중인 신청만 취소할 수 있습니다.' });
    }

    await prisma.application.update({
      where: { id: parseInt(applicationId) },
      data: {
        isCancelled: true,
      },
    });

    res.status(200).json({ message: "신청이 성공적으로 취소되었습니다." });
  } catch (error) {
    next(error);
  }
};

