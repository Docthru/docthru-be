import * as userServices from '../services/userServices.js';
import {
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
} from '../errors/customException.js';
import {
  REFRESH_TOKEN_SECRET,
  ACCESS_TOKEN_SECRET,
  TOKEN_EXPIRY,
  REFRESH_TOKEN_EXPIRY,
  REFRESH_TOKEN_MAX_AGE,
} from '../configs/config.js';
import jwt from 'jsonwebtoken';

const sendRefreshToken = (res, token) => {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
    maxAge: parseInt(REFRESH_TOKEN_MAX_AGE, 10),
    path: '/api/users/refresh-token',
  });
};

export const register = async (req, res, next) => {
  const { nickname, email, password } = req.body;
  try {
    const { accessToken, refreshToken, userId } =
      await userServices.registerUser(nickname, email, password);
    sendRefreshToken(res, refreshToken);
    res.status(201).json({
      message: '회원가입 성공',
      accessToken,
      userId,
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  const { email, password } = req.body;
  try {
    const { accessToken, refreshToken, userId } = await userServices.loginUser(
      email,
      password
    );
    sendRefreshToken(res, refreshToken);
    res.json({
      message: '로그인 성공',
      accessToken,
      userId,
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      throw new BadRequestException('리프레시 토큰이 없습니다.');
    }

    let userId;
    try {
      const decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);
      userId = decoded.userId;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedException('리프레시 토큰이 만료되었습니다.');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new UnauthorizedException('유효하지 않은 리프레시 토큰입니다.');
      } else {
        throw new UnprocessableEntityException(
          '리프레시 토큰 검증 중 오류가 발생했습니다.'
        );
      }
    }

    const user = await userServices.findUserByRefreshToken(refreshToken);
    if (!user) {
      throw new UnauthorizedException(
        '저장된 리프레시 토큰과 일치하지 않습니다.'
      );
    }

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
      path: '/api/users/refresh-token',
    });
    res.json({ message: '로그아웃 성공' });
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (req, res, next) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return next(new BadRequestException('리프레시 토큰이 없습니다.'));
  }

  try {
    const user = await userServices.verifyRefreshToken(refreshToken);

    const accessToken = userServices.generateToken(
      user.id,
      process.env.ACCESS_TOKEN_SECRET,
      process.env.TOKEN_EXPIRY
    );
    const newRefreshToken = userServices.generateToken(
      user.id,
      process.env.REFRESH_TOKEN_SECRET,
      process.env.REFRESH_TOKEN_EXPIRY
    );

    await userServices.updateRefreshToken(user.id, newRefreshToken);
    userServices.sendRefreshToken(res, newRefreshToken);

    res.json({ accessToken });
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return next(new UnauthorizedException('리프레시 토큰이 만료되었습니다.'));
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return next(
        new UnauthorizedException('유효하지 않은 리프레시 토큰입니다.')
      );
    }
    if (error instanceof NotFoundException) {
      return next(new UnauthorizedException('사용자를 찾을 수 없습니다.'));
    }
    next(new UnprocessableEntityException('토큰 갱신 중 오류가 발생했습니다.'));
  }
};

export const getCurrentUser = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      throw new NotFoundException('액세스 토큰이 없습니다.');
    }

    let decodedToken;
    try {
      decodedToken = jwt.verify(token, ACCESS_TOKEN_SECRET);
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new NotFoundException('토큰이 만료되었습니다.');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new UnauthorizedException('유효하지 않은 토큰입니다.');
      } else {
        throw new InternalServerErrorException(
          '토큰 검증 중 오류가 발생했습니다.'
        );
      }
    }

    const user = await userServices.getCurrentUser(decodedToken.userId);
    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    res.json(user);
  } catch (error) {
    next(error);
  }
};

export const getOngoingChallenges = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const { page, limit } = req.query;
    const result = await userServices.getOngoingChallenges(userId, page, limit);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getCompletedChallenges = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const { page, limit } = req.query;
    const result = await userServices.getCompletedChallenges(
      userId,
      page,
      limit
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getAppliedChallenges = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const { status, sortBy, sortOrder, search, page, limit } = req.query;

    const validStatuses = ['WAITING', 'ACCEPTED', 'REJECTED'];
    const validSortBy = ['appliedAt', 'deadline'];
    const validSortOrder = ['asc', 'desc'];

    if (status && !validStatuses.includes(status)) {
      throw new BadRequestException('유효하지 않은 상태값입니다.');
    }
    if (sortBy && !validSortBy.includes(sortBy)) {
      throw new BadRequestException('유효하지 않은 정렬 기준입니다.');
    }
    if (sortOrder && !validSortOrder.includes(sortOrder)) {
      throw new BadRequestException('유효하지 않은 정렬 순서입니다.');
    }

    const result = await userServices.getAppliedChallenges(
      userId,
      status,
      sortBy,
      sortOrder,
      search,
      page,
      limit
    );

    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getUserById = async (req, res, next) => {
  const { id } = req.params;
  if (isNaN(id)) {
    return next(new BadRequestException('유효하지 않은 사용자 ID입니다.'));
  }
  try {
    const user = await userServices.getUserById(Number(id));
    res.json(user);
  } catch (error) {
    next(error);
  }
};
