import { Controller, Post, Get, Put, Delete, Param, Body, UseGuards, Res, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';
import { Throttle } from '@nestjs/throttler';
import { UserService } from '../application/user.service';
import { RoleService } from '../../Role/application/role.service';
import { JwtAuthService } from '../../Shared/Auth/jwt.service';
import type { JwtPayload } from '../../Shared/Auth/jwt.service';
import { CaptchaService } from '../../Shared/Auth/captcha.service';
import { JwtAuthGuard } from '../../Shared/Auth/jwt-auth.guard';
import { AdminGuard } from '../../Shared/Auth/admin.guard';
import { CurrentUser } from '../../Shared/Auth/current-user.decorator';

@Controller('api')
export class UserController {
    constructor(
        private readonly userService: UserService,
        private readonly roleService: RoleService,
        private readonly jwtAuthService: JwtAuthService,
        private readonly captchaService: CaptchaService,
    ) {}

    @Post('user/register')
    @UseGuards(AdminGuard)
    @Throttle({ default: { limit: 3, ttl: 3600000 } })
    async register(@Body() body: any, @Res() res: Response) {
        try {
            const user = await this.userService.create(body);
            return user
                ? res.status(HttpStatus.OK).json({ message: 'User registered successfully' })
                : res.status(HttpStatus.BAD_REQUEST).json({ error: 'Invalid data' });
        } catch {
            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: 'Error registering user' });
        }
    }

    @Post('user/login')
    @Throttle({ default: { limit: 20, ttl: 900000 } })
    async login(@Body() body: any, @Res() res: Response) {
        try {
            const { captchaToken, ...data } = body;

            const captchaValid = await this.captchaService.verify(captchaToken);
            if (!captchaValid) {
                return res.status(HttpStatus.BAD_REQUEST).json({ error: 'CAPTCHA inválido ou expirado' });
            }

            const response = await this.userService.login(data);
            return response?.token
                ? res.status(HttpStatus.OK).json({ message: 'User logged in successfully', response })
                : res.status(HttpStatus.BAD_REQUEST).json({ error: 'Invalid Login' });
        } catch {
            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: 'Error logging in user' });
        }
    }

    @Post('user/refresh-token')
    async refreshToken(@Body() body: { refreshToken: string }, @Res() res: Response) {
        try {
            if (!body.refreshToken) {
                return res.status(HttpStatus.UNAUTHORIZED).json({ error: 'Refresh token not provided' });
            }

            const decoded = this.jwtAuthService.verifyRefreshToken(body.refreshToken);
            if (!decoded) {
                return res.status(HttpStatus.UNAUTHORIZED).json({ error: 'Invalid refresh token' });
            }

            const user = await this.userService.findById(parseInt(decoded.id));
            if (!user) {
                return res.status(HttpStatus.UNAUTHORIZED).json({ error: 'User not found' });
            }

            const role = user.idRole ? await this.roleService.findById(user.idRole) : null;
            if (!role) {
                return res.status(HttpStatus.UNAUTHORIZED).json({ error: 'User role not found' });
            }

            const token = this.jwtAuthService.generateToken(user, role.roleName);
            const refreshToken = this.jwtAuthService.generateRefreshToken(user.id);

            return res.status(HttpStatus.OK).json({ token, refreshToken });
        } catch {
            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: 'Error refreshing token' });
        }
    }

    @Get('user/info/:id')
    @UseGuards(AdminGuard)
    async findById(@Param('id') id: string, @Res() res: Response) {
        try {
            const user = await this.userService.findById(parseInt(id));
            return user
                ? res.status(HttpStatus.OK).json({ user })
                : res.status(HttpStatus.BAD_REQUEST).json({ error: 'User not found' });
        } catch {
            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: 'Error fetching user' });
        }
    }

    @Get('users')
    @UseGuards(AdminGuard)
    async findAll(@Res() res: Response) {
        try {
            const users = await this.userService.findAll();
            return res.status(HttpStatus.OK).json({ users });
        } catch {
            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: 'Error fetching users' });
        }
    }

    @Get('user/details')
    @UseGuards(JwtAuthGuard)
    async details(@CurrentUser() user: JwtPayload, @Res() res: Response) {
        return res.status(HttpStatus.OK).json({ user });
    }

    @Get('user/show')
    async show(@Res() res: Response) {
        try {
            const users = await this.userService.findUsersToShow();
            return res.status(HttpStatus.OK).json(users);
        } catch {
            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: 'Error fetching users' });
        }
    }

    @Put('user/recover')
    @UseGuards(JwtAuthGuard)
    @Throttle({ default: { limit: 3, ttl: 3600000 } })
    async recover(
        @CurrentUser() authUser: JwtPayload,
        @Body() body: { password: string; newPassword: string },
        @Res() res: Response,
    ) {
        try {
            const result = await this.userService.updatePassword({
                user: authUser,
                password: body.password,
                newPassword: body.newPassword,
            });
            return result
                ? res.status(HttpStatus.OK).json({ message: 'Password updated successfully' })
                : res.status(HttpStatus.BAD_REQUEST).json({ error: 'Invalid data' });
        } catch {
            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: 'Error updating password' });
        }
    }

    @Put('user/update')
    @UseGuards(JwtAuthGuard)
    async update(@CurrentUser() authUser: JwtPayload, @Body() body: any, @Res() res: Response) {
        try {
            const result = await this.userService.update({ ...body, id: authUser.id });
            return result
                ? res.status(HttpStatus.OK).json({ message: 'User updated successfully' })
                : res.status(HttpStatus.BAD_REQUEST).json({ error: 'Invalid data' });
        } catch {
            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: 'Error updating user' });
        }
    }

    @Delete('user/delete')
    @UseGuards(AdminGuard)
    @Throttle({ default: { limit: 3, ttl: 3600000 } })
    async delete(@Body() body: any, @Res() res: Response) {
        try {
            const response = await this.userService.delete(body);
            return response
                ? res.status(HttpStatus.OK).json({ message: 'User deleted', response })
                : res.status(HttpStatus.BAD_REQUEST).json({ message: 'Unable to delete user' });
        } catch {
            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: 'Error deleting user' });
        }
    }
}
