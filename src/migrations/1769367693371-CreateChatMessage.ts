
import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateChatMessage1769367693371 implements MigrationInterface {
    name = 'CreateChatMessage1769367693371'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "chat_messages" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "role" character varying NOT NULL, "content" text NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" uuid, CONSTRAINT "PK_0f682570b3c65c691375d33f7c9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "chat_messages" ADD CONSTRAINT "FK_chat_messages_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "chat_messages" DROP CONSTRAINT "FK_chat_messages_user"`);
        await queryRunner.query(`DROP TABLE "chat_messages"`);
    }

}
