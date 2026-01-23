import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateStudyPlanTables1769122678354 implements MigrationInterface {
    name = 'CreateStudyPlanTables1769122678354'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "study_plan_subjects" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "subjectName" character varying(255) NOT NULL, "level" integer NOT NULL DEFAULT '1', "priority" integer NOT NULL DEFAULT '1', "errorPatterns" jsonb, "study_plan_id" uuid, CONSTRAINT "PK_a23ed4b134664901bec38e60951" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "weekly_schedules" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "startDate" date NOT NULL, "endDate" date NOT NULL, "content" jsonb NOT NULL, "isActive" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "study_plan_id" uuid, CONSTRAINT "PK_c14aa04ae270430a6eb8444108c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "study_plans" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "targetVestibular" character varying(255) NOT NULL, "availableTimePerDay" integer NOT NULL, "studyDays" text NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "user_id" uuid, CONSTRAINT "REL_a23248b3753cee30205a45cc18" UNIQUE ("user_id"), CONSTRAINT "PK_0e9610ccbc3b79324da329edb33" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "study_plan_subjects" ADD CONSTRAINT "FK_00f4ea4c6457af9929a555348d0" FOREIGN KEY ("study_plan_id") REFERENCES "study_plans"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "weekly_schedules" ADD CONSTRAINT "FK_5a8abb460c695b655f51626a583" FOREIGN KEY ("study_plan_id") REFERENCES "study_plans"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "study_plans" ADD CONSTRAINT "FK_a23248b3753cee30205a45cc189" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "study_plans" DROP CONSTRAINT "FK_a23248b3753cee30205a45cc189"`);
        await queryRunner.query(`ALTER TABLE "weekly_schedules" DROP CONSTRAINT "FK_5a8abb460c695b655f51626a583"`);
        await queryRunner.query(`ALTER TABLE "study_plan_subjects" DROP CONSTRAINT "FK_00f4ea4c6457af9929a555348d0"`);
        await queryRunner.query(`DROP TABLE "study_plans"`);
        await queryRunner.query(`DROP TABLE "weekly_schedules"`);
        await queryRunner.query(`DROP TABLE "study_plan_subjects"`);
    }

}
