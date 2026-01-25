import passport from 'passport';
import { Strategy as GoogleStrategy, Profile as GoogleProfile } from 'passport-google-oauth20';
import { config } from './config';
import { User as UserEntity, UserStatus } from '../entities/User';
import { User as UserModel } from '../models/User';
import AppDataSource from './data-source';
import { logger } from '../utils/logger';
import { VerifyCallback } from 'passport-oauth2';

passport.use(
    new GoogleStrategy(
        {
            clientID: config.oauth.google.clientId,
            clientSecret: config.oauth.google.clientSecret,
            callbackURL: config.oauth.google.callbackURL,
            scope: ['profile', 'email'],
            passReqToCallback: true
        },
        async (req: any, accessToken: string, refreshToken: string, profile: GoogleProfile, done: VerifyCallback) => {
            try {
                const email = profile.emails?.[0]?.value;

                if (!email) {
                    return done(new Error('O e-mail não foi fornecido pelo Google.'));
                }

                const userRepository = AppDataSource.getRepository(UserEntity);

                // Verifica se o usuário já existe
                let user = await userRepository.findOneBy({ email });

                if (user) {
                    // Se o usuário existir, atualiza a foto se vier do Google
                    if (profile.photos?.[0]?.value && user.profilePicture !== profile.photos[0].value) {
                        user.profilePicture = profile.photos[0].value;
                        await userRepository.save(user);
                    }

                    // Se o usuário existir, apenas retorna ele
                    // Converte para um objeto simples para evitar problemas de tipo
                    const userObject = {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        status: user.status,
                        googleId: user.googleId,
                        profilePicture: user.profilePicture
                    };
                    return done(null, userObject as any);
                }

                // Se não existir, cria um novo usuário
                const newUser = userRepository.create({
                    name: profile.displayName || 'Usuário Google', // Fallback para o nome
                    email: email,
                    status: UserStatus.VERIFIED, // E-mail do Google já é verificado
                    googleId: profile.id,
                    profilePicture: profile.photos?.[0]?.value
                });

                await userRepository.save(newUser);

                logger.info(`Novo usuário criado via Google: ${email}`);

                // Retorna um objeto simples com os dados do usuário
                const userObject = {
                    id: newUser.id,
                    name: newUser.name,
                    email: newUser.email,
                    status: newUser.status,
                    googleId: newUser.googleId,
                    profilePicture: newUser.profilePicture
                };
                return done(null, userObject as any);

            } catch (error) {
                logger.error('Erro na autenticação com Google:', error);
                return done(error as Error);
            }
        }
    )
);
