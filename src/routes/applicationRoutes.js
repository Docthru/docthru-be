import express from 'express';
import {
  createApplication,
  getApplications,
  getApplicationById,
  deleteApplication,
  updateApplication,
  cancelChallenge,
} from '../controllers/applicationController.js';
import { authenticateAccessToken, isAdmin } from '../middlewares/authMiddleware.js';

const router = express.Router();

// 인증 미들웨어
router.use(authenticateAccessToken);

// 신청 생성 라우트 (일반 유저 접근 가능)
router.post('/create', createApplication);

// 신청 목록 조회 (관리자와 일반 사용자 모두 접근 가능)
router.get('/applications', getApplications);

// 신청 상세 조회 (관리자와 일반 사용자 모두 접근 가능)
router.get('/applications/:applicationId', getApplicationById);

// 신청 삭제 (관리자 전용)
router.delete('/applications/:applicationId', isAdmin, deleteApplication);

// 신청 상태 업데이트 (관리자 전용 - 승인, 거절, 삭제 가능)
router.put('/applications/:applicationId', isAdmin, updateApplication);

// 신청 취소 (일반 사용자 - WAITING 상태에서만 취소 가능)
router.put('/applications/:applicationId/cancel', cancelChallenge);

export default router;

