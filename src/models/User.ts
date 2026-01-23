import mongoose, { Document, Types } from 'mongoose';
import crypto from 'crypto';

export enum UserStatus {
  CREATED = 'created',
  VERIFIED = 'verified',
  PREMIUM = 'premium'
}

export interface IUser extends Document<Types.ObjectId> {
  _id: Types.ObjectId;
  email: string;
  password?: string;
  googleId?: string;
  name: string;
  profilePicture?: string;
  status: UserStatus;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
  generateEmailVerificationToken(): string;
}

const userSchema = new mongoose.Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: function() {
        return !this.googleId; // Senha não é obrigatória para autenticação social
      },
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    profilePicture: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: Object.values(UserStatus),
      default: UserStatus.CREATED
    },
    emailVerificationToken: String,
    emailVerificationExpires: Date,
    googleId: {
      type: String,
      sparse: true,
      unique: true,
    },
  },
  {
    timestamps: true,
  }
);

// Gerar token para verificação de e-mail
userSchema.methods.generateEmailVerificationToken = function(): string {
  const token = crypto.randomBytes(32).toString('hex');
  this.emailVerificationToken = token;
  this.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas
  return token;
};

// Atualizar status após verificação de e-mail
userSchema.methods.verifyEmail = function(): void {
  this.status = UserStatus.VERIFIED;
  this.emailVerificationToken = undefined;
  this.emailVerificationExpires = undefined;
};

export const User = mongoose.model<IUser>('User', userSchema);