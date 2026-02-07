import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFlashcardStatsToUsers1770000000001 implements MigrationInterface {
    name = 'AddFlashcardStatsToUsers1770000000001';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "last_flashcard_gen_date" date`);
        await queryRunner.query(`ALTER TABLE "users" ADD "flashcards_gen_count" integer NOT NULL DEFAULT '0'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "flashcards_gen_count"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "last_flashcard_gen_date"`);
    }
}
