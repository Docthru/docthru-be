import express from 'express';
import * as feedbackController from '../controllers/feedbackController.js';
import { authenticateAccessToken } from '../middlewares/authMiddleware.js';
import { authFeedbackAction } from '../middlewares/authFeedbackMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Feedback
 *   description: 피드백 관련 API
 */

/**
 * @swagger
 * /api/feedbacks/{feedbackId}:
 *   patch:
 *     tags: [Feedback]
 *     summary: 피드백 수정
 *     security:
 *       - bearerAuth: []
 *     description: 피드백을 수정합니다.
 *     parameters:
 *       - name: feedbackId
 *         in: path
 *         required: true
 *         description: 피드백 ID
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
 *       200:
 *         description: 피드백 수정 완료
 *       401:
 *         description: 권한이 없음
 *       404:
 *         description: 피드백을 찾을 수 없음
 *       500:
 *         description: 서버 오류
 */

//본인, 어드민 계정만 수정되게끔
router.patch(
  '/:feedbackId',
  authenticateAccessToken,
  authFeedbackAction,
  feedbackController.updateFeedbackById
);

/**
 * @swagger
 * /api/feedbacks/{feedbackId}:
 *   delete:
 *     tags: [Feedback]
 *     summary: 피드백 삭제
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: feedbackId
 *         in: path
 *         required: true
 *         description: 피드백 ID
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 피드백 삭제 성공
 *       401:
 *         description: 권한이 없음
 *       404:
 *         description: 피드백을 찾을 수 없음
 *       500:
 *         description: 서버 오류
 */

//본인, 어드민 계정만 삭제
router.delete(
  '/:feedbackId',
  authenticateAccessToken,
  authFeedbackAction,
  feedbackController.deleteFeedbackById
);

export default router;
