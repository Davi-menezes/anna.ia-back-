import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFreeSimuladoToUsers1769878134000 implements MigrationInterface {
    name = 'AddFreeSimuladoToUsers1769878134000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "free_simulado_used" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "users" ADD "free_simulado_used_at" TIMESTAMP`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "free_simulado_used_at"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "free_simulado_used"`);
    }
}
