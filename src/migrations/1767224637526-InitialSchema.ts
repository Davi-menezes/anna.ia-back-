import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1767224637526 implements MigrationInterface {
    name = 'InitialSchema1767224637526'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying(255) NOT NULL, "password" character varying(255), "google_id" character varying(255), "name" character varying(255) NOT NULL, "profile_picture" character varying(500), "is_email_verified" boolean NOT NULL DEFAULT false, "email_verification_token" character varying(255), "email_verification_expires" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_97672ac88f789774dd47f7c8be" ON "users" ("email") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_97672ac88f789774dd47f7c8be"`);
        await queryRunner.query(`DROP TABLE "users"`);
    }

}
