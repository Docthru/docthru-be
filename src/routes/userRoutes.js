import { Router } from 'express';
import * as userController from '../controllers/userController.js';
import { authenticateAccessToken } from '../middlewares/authMiddleware.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: User
 *   description: 사용자 관련 API
 */

/**
 * @swagger
 * /api/users/register:
 *   post:
 *     tags: [User]
 *     summary: 사용자 회원가입
 *     description: 새로운 사용자를 등록합니다.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nickname:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *             required:
 *               - nickname
 *               - email
 *               - password
 *     responses:
 *       201:
 *         description: 회원가입 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 accessToken:
 *                   type: string
 *                 userId:
 *                   type: integer
 *       400:
 *         description: 잘못된 요청
 *       409:
 *         description: 이미 존재하는 닉네임 또는 이메일
 */
router.post('/register', userController.register);

/**
 * @swagger
 * /api/users/login:
 *   post:
 *     tags: [User]
 *     summary: 사용자 로그인
 *     description: 사용자가 로그인합니다.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *             required:
 *               - email
 *               - password
 *     responses:
 *       200:
 *         description: 로그인 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 accessToken:
 *                   type: string
 *                 userId:
 *                   type: integer
 *       400:
 *         description: 잘못된 요청
 */
router.post('/login', userController.login);

/**
 * @swagger
 * /api/users/token/refresh:
 *   post:
 *     tags: [User]
 *     summary: 리프레시 토큰 갱신
 *     description: 리프레시 토큰을 사용하여 액세스 토큰을 갱신합니다.
 *     responses:
 *       200:
 *         description: 토큰 갱신 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *       400:
 *         description: 리프레시 토큰이 없습니다.
 *       401:
 *         description: 유효하지 않은 리프레시 토큰
 */
router.post('/token/refresh', userController.refreshToken);

/**
 * @swagger
 * /api/users/logout:
 *   post:
 *     tags: [User]
 *     summary: 사용자 로그아웃
 *     description: 사용자를 로그아웃합니다.
 *     responses:
 *       200:
 *         description: 로그아웃 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: 리프레시 토큰이 없습니다.
 */
router.post('/logout', userController.logout);

/**
 * @swagger
 * /api/users/me:
 *   get:
 *     tags: [User]
 *     summary: 현재 사용자 정보 조회
 *     security:
 *       - bearerAuth: []
 *     description: 현재 로그인한 사용자의 정보를 조회합니다.
 *     responses:
 *       200:
 *         description: 사용자 정보
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 nickname:
 *                   type: string
 *                 email:
 *                   type: string
 *                 role:
 *                   type: string
 *                 grade:
 *                   type: string
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *       404:
 *         description: 사용자를 찾을 수 없습니다.
 */
router.get('/me', userController.getCurrentUser);

router.use(authenticateAccessToken);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     tags: [User]
 *     summary: 특정 사용자 정보 조회
 *     description: 특정 사용자 ID에 대한 정보를 조회합니다.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: 사용자 ID
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 사용자 정보
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 nickname:
 *                   type: string
 *                 role:
 *                   type: string
 *                 grade:
 *                   type: string
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: 유효하지 않은 사용자 ID입니다.
 *       404:
 *         description: 사용자를 찾을 수 없습니다.
 */
router.get('/:id', userController.getUserById);

/**
 * @swagger
 * /api/users/me/challenges/ongoing:
 *   get:
 *     tags: [User]
 *     summary: 진행 중인 챌린지 조회
 *     security:
 *       - bearerAuth: []
 *     description: 현재 사용자가 참여 중인 진행 중인 챌린지를 조회합니다.
 *     responses:
 *       200:
 *         description: 진행 중인 챌린지 목록
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 challenges:
 *                   type: array
 *                   items:
 *                     type: object
 *                 meta:
 *                   type: object
 *                   properties:
 *                     currentPage:
 *                       type: integer
 *                     pageSize:
 *                       type: integer
 *                     totalCount:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 */
router.get('/me/challenges/ongoing', userController.getOngoingChallenges);

/**
 * @swagger
 * /api/users/me/challenges/completed:
 *   get:
 *     tags: [User]
 *     summary: 완료된 챌린지 조회
 *     security:
 *       - bearerAuth: []
 *     description: 현재 사용자가 참여한 완료된 챌린지를 조회합니다.
 *     responses:
 *       200:
 *         description: 완료된 챌린지 목록
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 challenges:
 *                   type: array
 *                   items:
 *                     type: object
 *                 meta:
 *                   type: object
 *                   properties:
 *                     currentPage:
 *                       type: integer
 *                     pageSize:
 *                       type: integer
 *                     totalCount:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 */
router.get('/me/challenges/completed', userController.getCompletedChallenges);

/**
 * @swagger
 * /api/users/me/challenges/applications:
 *   get:
 *     tags: [User]
 *     summary: 신청한 챌린지 조회
 *     security:
 *       - bearerAuth: []
 *     description: 현재 사용자가 신청한 챌린지 목록을 조회합니다.
 *     parameters:
 *       - in: query
 *         name: status
 *         required: false
 *         description: 챌린지 상태 (WAITING, ACCEPTED, REJECTED)
 *         schema:
 *           type: string
 *       - in: query
 *         name: sortBy
 *         required: false
 *         description: 정렬 기준 (appliedAt, deadline)
 *         schema:
 *           type: string
 *       - in: query
 *         name: sortOrder
 *         required: false
 *         description: 정렬 순서 (asc, desc)
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         required: false
 *         description: 검색어
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         required: false
 *         description: 페이지 번호
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         required: false
 *         description: 페이지당 항목 수
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 신청한 챌린지 목록
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 challenges:
 *                   type: array
 *                   items:
 *                     type: object
 *                 meta:
 *                   type: object
 *                   properties:
 *                     currentPage:
 *                       type: integer
 *                     totalCount:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 */
router.get('/me/challenges/applications', userController.getAppliedChallenges);

export default router;
