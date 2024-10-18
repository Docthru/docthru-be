import express from 'express';
import {
  getChallenges,
  getChallengeById,
  patchChallengeById,
  deleteChallengeById,
  getChallengesUrl,
  postChallengeParticipate,
} from '../controllers/challengeController.js';
import { authenticateAccessToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Challenge
 *   description: 챌린지 관련 API
 */

/**
 * @swagger
 * /api/challenges:
 *   get:
 *     tags: [Challenge]
 *     summary: 챌린지 목록 조회
 *     description: 페이지네이션, 정렬 및 필터링된 챌린지 목록을 반환합니다.
 *     parameters:
 *       - in: query
 *         name: page
 *         required: false
 *         description: "페이지 번호 (기본값: 1)"
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         required: false
 *         description: "페이지 당 항목 수 (기본값: 10)"
 *         schema:
 *           type: integer
 *       - in: query
 *         name: sortBy
 *         required: false
 *         description: "정렬 기준 필드 (기본값: id)"
 *         schema:
 *           type: string
 *       - in: query
 *         name: sortOrder
 *         required: false
 *         description: "정렬 방향 (asc 또는 desc, 기본값: asc)"
 *         schema:
 *           type: string
 *       - in: body
 *         name: filters
 *         description: 필터 조건
 *         schema:
 *           type: object
 *           properties:
 *             field:
 *               type: array
 *               items:
 *                 type: string
 *             docType:
 *               type: string
 *             progress:
 *               type: boolean
 *     responses:
 *       200:
 *         description: 챌린지 목록
 *       400:
 *         description: "잘못된 요청 (예: 마감된 챌린지)"
 *       500:
 *         description: 서버 오류
 */

router.get('/', getChallenges);

/**
 * @swagger
 * /api/challenges/{challengeId}:
 *   get:
 *     summary: 특정 챌린지 조회
 *     security:
 *       - bearerAuth: []
 *     tags: [Challenge]
 *     description: ID로 특정 챌린지를 조회합니다.
 *     parameters:
 *       - in: path
 *         name: challengeId
 *         required: true
 *         description: 챌린지 ID
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 챌린지 상세 정보
 *       404:
 *         description: 챌린지를 찾을 수 없음
 *       500:
 *         description: 서버 오류
 */
router.get('/:challengeId', authenticateAccessToken, getChallengeById);

/**
 * @swagger
 * /api/challenges/{challengeId}:
 *   patch:
 *     summary: 챌린지 수정
 *     security:
 *       - bearerAuth: []
 *     tags: [Challenge]
 *     description: 관리자가 챌린지를 수정합니다.
 *     parameters:
 *       - in: path
 *         name: challengeId
 *         required: true
 *         description: 챌린지 ID
 *         schema:
 *           type: integer
 *       - in: body
 *         name: updateData
 *         description: 수정할 데이터
 *         schema:
 *           type: object
 *           properties:
 *             title:
 *               type: string
 *             description:
 *               type: string
 *             progress:
 *               type: boolean
 *           required:
 *             - title
 *             - description
 *             - progress
 *     responses:
 *       200:
 *         description: 수정된 챌린지 정보
 *       403:
 *         description: 관리자 권한 부족
 *       404:
 *         description: 챌린지를 찾을 수 없음
 *       500:
 *         description: 서버 오류
 */

router.patch('/:challengeId', authenticateAccessToken, patchChallengeById);

/**
 * @swagger
 * /api/challenges/{challengeId}:
 *   delete:
 *     summary: 챌린지 삭제
 *     security:
 *       - bearerAuth: []
 *     tags: [Challenge]
 *     description: 관리자가 챌린지를 삭제합니다.
 *     parameters:
 *       - in: path
 *         name: challengeId
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
 *               reason:
 *                 type: string
 *                 description: 삭제 사유
 *             required:
 *               - reason
 *     responses:
 *       204:
 *         description: 챌린지 삭제 성공
 *       403:
 *         description: 관리자 권한 부족
 *       404:
 *         description: 챌린지를 찾을 수 없음
 *       500:
 *         description: 서버 오류
 */

router.delete('/:challengeId', authenticateAccessToken, deleteChallengeById);

/**
 * @swagger
 * /api/challenges/{challengeId}/original:
 *   get:
 *     summary: 챌린지 URL 조회
 *     tags: [Challenge]
 *     description: 특정 챌린지의 URL을 조회합니다.
 *     parameters:
 *       - in: path
 *         name: challengeId
 *         required: true
 *         description: 챌린지 ID
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 챌린지 URL 정보
 *       404:
 *         description: 챌린지를 찾을 수 없음
 *       500:
 *         description: 서버 오류
 */
router.get('/:challengeId/original', getChallengesUrl);

/**
 * @swagger
 * /api/challenges/{challengeId}/participations:
 *   post:
 *     tags: [Challenge]
 *     summary: 챌린지 참여
 *     security:
 *       - bearerAuth: []
 *     description: 사용자가 챌린지에 참여합니다.
 *     parameters:
 *       - in: path
 *         name: challengeId
 *         required: true
 *         description: 챌린지 ID
 *         schema:
 *           type: integer
 *     responses:
 *       201:
 *         description: 챌린지 참여 성공
 *       400:
 *         description: "잘못된 요청 (예: 마감?된 챌린지)"
 *       404:
 *         description: 챌린지를 찾을 수 없음
 *       500:
 *         description: 서버 오류
 */

router.post(
  '/:challengeId/participations',
  authenticateAccessToken,
  postChallengeParticipate
);

export default router;
