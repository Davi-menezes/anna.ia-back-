import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPasswordResetFields1767330144249 implements MigrationInterface {
    name = 'AddPasswordResetFields1767330144249';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "password_reset_token" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "users" ADD "password_reset_expires" TIMESTAMP`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "password_reset_expires"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "password_reset_token"`);
    }
}
