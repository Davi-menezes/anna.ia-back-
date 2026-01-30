import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateFlashcardsAndQuestionGoals1769879999000 implements MigrationInterface {
    name = 'CreateFlashcardsAndQuestionGoals1769879999000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "flashcards" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "subject" character varying(255),
            "front" text NOT NULL,
            "back" text NOT NULL,
            "status" character varying(50) NOT NULL DEFAULT 'new',
            "last_reviewed_at" TIMESTAMP,
            "next_review_at" TIMESTAMP,
            "created_at" TIMESTAMP NOT NULL DEFAULT now(),
            "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
            "userId" uuid,
            CONSTRAINT "PK_flashcards_id" PRIMARY KEY ("id")
        )`);

        await queryRunner.query(`CREATE INDEX "IDX_flashcards_user" ON "flashcards" ("userId")`);

        await queryRunner.query(`ALTER TABLE "flashcards" ADD CONSTRAINT "FK_flashcards_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);

        await queryRunner.query(`CREATE TABLE "question_goals" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "goal_date" date NOT NULL,
            "target_questions" integer NOT NULL DEFAULT 0,
            "completed_questions" integer NOT NULL DEFAULT 0,
            "created_at" TIMESTAMP NOT NULL DEFAULT now(),
            "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
            "userId" uuid,
            CONSTRAINT "PK_question_goals_id" PRIMARY KEY ("id")
        )`);

        await queryRunner.query(`CREATE INDEX "IDX_question_goals_user" ON "question_goals" ("userId")`);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_question_goals_user_date" ON "question_goals" ("userId", "goal_date")`);

        await queryRunner.query(`ALTER TABLE "question_goals" ADD CONSTRAINT "FK_question_goals_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "question_goals" DROP CONSTRAINT "FK_question_goals_user"`);
        await queryRunner.query(`DROP INDEX "public"."UQ_question_goals_user_date"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_question_goals_user"`);
        await queryRunner.query(`DROP TABLE "question_goals"`);

        await queryRunner.query(`ALTER TABLE "flashcards" DROP CONSTRAINT "FK_flashcards_user"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_flashcards_user"`);
        await queryRunner.query(`DROP TABLE "flashcards"`);
    }
}
