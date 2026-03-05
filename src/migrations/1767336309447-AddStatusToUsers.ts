import { MigrationInterface, QueryRunner } from "typeorm";

export class AddStatusToUsers1767336309447 implements MigrationInterface {
    name = 'AddStatusToUsers1767336309447';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Adiciona a coluna com valor padrão
        await queryRunner.query(`
            ALTER TABLE "users" 
            ADD COLUMN "status" VARCHAR(20) NOT NULL DEFAULT 'created';
        `);
        
        // Adiciona a constraint de validação dos valores permitidos
        await queryRunner.query(`
            ALTER TABLE "users" 
            ADD CONSTRAINT "CHK_users_status" 
            CHECK (status IN ('created', 'verified', 'premium'));
        `);
        
        // Adiciona comentário descritivo na coluna
        await queryRunner.query(`
            COMMENT ON COLUMN "users"."status" IS 'Status do usuário: created, verified ou premium';
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove a constraint antes de deletar a coluna
        await queryRunner.query(`
            ALTER TABLE "users" 
            DROP CONSTRAINT IF EXISTS "CHK_users_status";
        `);
        
        // Remove a coluna de status
        await queryRunner.query(`
            ALTER TABLE "users" 
            DROP COLUMN IF EXISTS "status";
        `);
    }
}
