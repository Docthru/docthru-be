import express from 'express';
import {
  createApplication,
  getMyApplications,
  getMyApplicationById,
  updateApplication,
  cancelApplication,
  getAdminApplications,
  updateApplicationDetails,
} from '../controllers/applicationController.js';
import { authenticateAccessToken, isAdmin } from '../middlewares/authMiddleware.js';

const router = express.Router();

// 인증 미들웨어 적용
router.use(authenticateAccessToken);

// 신규 챌린지 신청 (일반 사용자용)
router.post('/challenges/:challengeId/applications', createApplication);

// 내가 신청한 챌린지 목록 조회 (일반 사용자)
router.get('/users/me/challenges/applications', getMyApplications);

// 내가 신청한 챌린지 상세 조회 (일반 사용자)
router.get('/users/me/challenges/applications/:applicationId', getMyApplicationById);

// 신청 취소 (일반 사용자 - WAITING 상태에서만 가능, 전체 목록에서 제외)
router.put('/applications/:applicationId/cancel', cancelApplication);

// 관리자용 신청 목록 조회 (어드민 전용)
router.get('/applications', isAdmin, getAdminApplications);

// 신청 상태 업데이트 (승인, 거절, 삭제 - 어드민 전용)
router.put('/applications/:applicationId', isAdmin, updateApplication);

// 신청 수정 (어드민 전용)
router.patch('/applications/:applicationId', isAdmin, updateApplicationDetails);

export default router;
