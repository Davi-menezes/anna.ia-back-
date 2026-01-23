import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMissingUserFields1767463312472 implements MigrationInterface {
    name = 'AddMissingUserFields1767463312472'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "CHK_users_status"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "birth_date" date`);
        await queryRunner.query(`ALTER TABLE "users" ADD "education" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "users" ADD "location" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "users" ADD "main_goal" character varying(500)`);
        await queryRunner.query(`ALTER TABLE "users" ADD "credits" numeric(10,2) NOT NULL DEFAULT '5'`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "status"`);
        await queryRunner.query(`CREATE TYPE "public"."users_status_enum" AS ENUM('created', 'verified', 'premium')`);
        await queryRunner.query(`ALTER TABLE "users" ADD "status" "public"."users_status_enum" NOT NULL DEFAULT 'created'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "status"`);
        await queryRunner.query(`DROP TYPE "public"."users_status_enum"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "status" character varying(20) NOT NULL DEFAULT 'created'`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "credits"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "main_goal"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "location"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "education"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "birth_date"`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "CHK_users_status" CHECK (((status)::text = ANY ((ARRAY['created'::character varying, 'verified'::character varying, 'premium'::character varying])::text[])))`);
    }

}
