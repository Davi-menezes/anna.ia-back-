import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateQuestionBank1769839784695 implements MigrationInterface {
    name = 'CreateQuestionBank1769839784695'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "question_bank" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "subject" character varying(255) NOT NULL, "question" text NOT NULL, "options" text array NOT NULL, "correctAnswerIndex" integer NOT NULL, "explanation" text, "difficulty" character varying(20) NOT NULL DEFAULT 'medium', "tags" text array, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_question_bank_id" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_question_bank_subject" ON "question_bank" ("subject")`);
        await queryRunner.query(`CREATE INDEX "IDX_question_bank_difficulty" ON "question_bank" ("difficulty")`);
        await queryRunner.query(`CREATE INDEX "IDX_question_bank_tags" ON "question_bank" USING GIN ("tags")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_question_bank_tags"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_question_bank_difficulty"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_question_bank_subject"`);
        await queryRunner.query(`DROP TABLE "question_bank"`);
    }
}
