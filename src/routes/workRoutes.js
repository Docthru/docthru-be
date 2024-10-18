import express from 'express';
import * as workController from '../controllers/workController.js';
import * as feedbackController from '../controllers/feedbackController.js';
import { authenticateAccessToken } from '../middlewares/authMiddleware.js';
import {
  authWorkAction,
  authCreateWorkAction,
} from '../middlewares/authWorkMiddleware.js';
import { authCreateFeedbackAction } from '../middlewares/authFeedbackMiddleware.js';

const router = express.Router();

// router.use(authenticateAccessToken); // 로그인 여부 확인
// router.use(authWorkAction); 본인, 어드민만 수정, 삭제되게끔
// router.use(authCreateWorkAction); 작성할 때 챌린지 참가 인원인지, 이미 글을 쓴 사람인지 체크

/**
 * @swagger
 * tags:
 *   name: Work
 *   description: 챌린지 관련 API
 */

/**
 * @swagger
 * /api/works/list/{challengeId}:
 *   get:
 *     tags: [Work]
 *     summary: 챌린지 아이디에 따른 작업물들 조회
 *     security:
 *       - bearerAuth: []
 *     description: 챌린지 아이디에 따른 작업물을 조회합니다.
 *     parameters:
 *       - name: challengeId
 *         in: path
 *         required: true
 *         description: 챌린지 ID
 *         schema:
 *           type: integer
 *       - name: page
 *         in: query
 *         required: false
 *         description: 현재 페이지
 *         schema:
 *           type: integer
 *       - name: limit
 *         in: query
 *         required: false
 *         description: 작업물 갯수
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 작업물 목록 조회 성공
 *       401:
 *         description: 권한이 없음
 *       404:
 *         description: 챌린지가 없음
 *       500:
 *         description: 서버 오류
 */

router.get(
  '/list/:challengeId',
  authenticateAccessToken,
  workController.getWorksListById
);

/**
 * @swagger
 * /api/works/{workId}:
 *   get:
 *     tags: [Work]
 *     summary: 작업물 조회
 *     security:
 *       - bearerAuth: []
 *     description: 작업물 아이디에 따른 상세 조회합니다.
 *     parameters:
 *       - name: workId
 *         in: path
 *         required: true
 *         description: 작업물 ID
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 작업물 조회 성공
 *       401:
 *         description: 권한이 없음
 *       404:
 *         description: 작업물이 없음
 *       500:
 *         description: 서버 오류
 */

router.get('/:workId', authenticateAccessToken, workController.getWorkById);

/**
 * @swagger
 * /api/works/{challengeId}:
 *   post:
 *     tags: [Work]
 *     summary: 작업물 게시
 *     security:
 *       - bearerAuth: []
 *     description: 챌린지 아이디에 따른 작업물을 게시합니다.
 *     parameters:
 *       - name: challengeId
 *         in: path
 *         required: true
 *         description: 챌린지 ID
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *                 description: 작업물 내용
 *             required:
 *               - content
 *     responses:
 *       201:
 *         description: 작업물 게시 완료
 *       401:
 *         description: 권한이 없음
 *       404:
 *         description: 챌린지가 없음
 *       500:
 *         description: 서버 오류
 */

// 챌린지에 참가한 인원인지 권한 설정
router.post(
  '/:challengeId',
  authenticateAccessToken,
  authCreateWorkAction,
  workController.postWorkById
);

/**
 * @swagger
 * /api/works/{workId}:
 *   patch:
 *     tags: [Work]
 *     summary: 작업물 수정
 *     security:
 *       - bearerAuth: []
 *     description: 작업물을 수정합니다.
 *     parameters:
 *       - name: workId
 *         in: path
 *         required: true
 *         description: 작업물 ID
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *                 description: 작업물 내용
 *             required:
 *               - content
 *     responses:
 *       200:
 *         description: 작업물 수정 완료
 *       401:
 *         description: 권한이 없음
 *       404:
 *         description: 작업물을 찾을 수 없음
 *       500:
 *         description: 서버 오류
 */

//본인, 어드민 계정만 수정되게끔
router.patch(
  '/:workId',
  authenticateAccessToken,
  authWorkAction,
  workController.updateWorkById
);

/**
 * @swagger
 * /api/works/{workId}:
 *   delete:
 *     tags: [Work]
 *     summary: 작업물 삭제
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: workId
 *         in: path
 *         required: true
 *         description: 작업물 ID
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 작업물 삭제 성공
 *       401:
 *         description: 권한이 없음
 *       404:
 *         description: 작업물을 찾을 수 없음
 *       500:
 *         description: 서버 오류
 */

//본인, 어드민 계정만 수정되게끔
router.delete(
  '/:workId',
  authenticateAccessToken,
  authWorkAction,
  workController.deleteWorkById
);

/**
 * @swagger
 * /api/works/{workId}/likes:
 *   post:
 *     tags: [Work]
 *     summary: 작업물 좋아요
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: workId
 *         in: path
 *         required: true
 *         description: 작업물 ID
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 작업물에 좋아요 성공
 *       401:
 *         description: 권한이 없음
 *       404:
 *         description: 작업물을 찾을 수 없음
 *       500:
 *         description: 서버 오류
 */

router.post(
  '/:workId/likes',
  authenticateAccessToken,
  workController.likeWorkById
);

/**
 * @swagger
 * /api/works/{workId}/likes:
 *   delete:
 *     tags: [Work]
 *     summary: 작업물 좋아요 취소
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: workId
 *         in: path
 *         required: true
 *         description: 작업물 ID
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 작업물에 좋아요 취소 성공
 *       401:
 *         description: 권한이 없음
 *       404:
 *         description: 작업물을 찾을 수 없음
 *       500:
 *         description: 서버 오류
 */

router.delete(
  '/:workId/likes',
  authenticateAccessToken,
  workController.likeCancelWorkById
);

/**
 * @swagger
 * /api/works/{workId}/feedbacks:
 *   get:
 *     tags: [Work]
 *     summary: 작업물 피드백 조회
 *     security:
 *       - bearerAuth: []
 *     description: 작업물 아이디에 따른 피드백을 조회합니다.
 *     parameters:
 *       - name: workId
 *         in: path
 *         required: true
 *         description: 작업물 ID
 *         schema:
 *           type: integer
 *       - name: cursorId
 *         in: query
 *         required: false
 *         description: 현재 커서 위치
 *         schema:
 *           type: integer
 *       - name: limit
 *         in: query
 *         required: false
 *         description: 피드백 갯수
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 피드백 목록
 *       401:
 *         description: 권한이 없음
 *       404:
 *         description: 작업물이 없음
 *       500:
 *         description: 서버 오류
 */

router.get(
  '/:workId/feedbacks',
  authenticateAccessToken,
  workController.getFeedbacksWorkById
);

/**
 * @swagger
 * /api/works/{workId}/feedbacks:
 *   post:
 *     tags: [Feedback]
 *     summary: 피드백 게시
 *     security:
 *       - bearerAuth: []
 *     description: 작업물 아이디에 따른 피드백을 게시합니다.
 *     parameters:
 *       - name: workId
 *         in: path
 *         required: true
 *         description: 작업물 ID
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *                 description: 피드백 내용
 *             required:
 *               - content
 *     responses:
 *       201:
 *         description: 작업물 게시 완료
 *       401:
 *         description: 권한이 없음
 *       404:
 *         description: 챌린지가 없음
 *       500:
 *         description: 서버 오류
 */

router.post(
  '/:workId/feedbacks',
  authenticateAccessToken,
  authCreateFeedbackAction,
  feedbackController.postFeedbackById
);

export default router;
