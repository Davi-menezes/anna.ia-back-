import { MigrationInterface, QueryRunner } from "typeorm";

export class AddStatusToUsers1767336309447 implements MigrationInterface {
    name = 'AddStatusToUsers1767336309447';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // First add the column with a default value
        await queryRunner.query(`
            ALTER TABLE "users" 
            ADD COLUMN "status" VARCHAR(20) NOT NULL DEFAULT 'created';
        `);
        
        // Then add the check constraint
        await queryRunner.query(`
            ALTER TABLE "users" 
            ADD CONSTRAINT "CHK_users_status" 
            CHECK (status IN ('created', 'verified', 'premium'));
        `);
        
        // Finally add the comment
        await queryRunner.query(`
            COMMENT ON COLUMN "users"."status" IS 'User status: created, verified, or premium';
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // First remove the constraint
        await queryRunner.query(`
            ALTER TABLE "users" 
            DROP CONSTRAINT IF EXISTS "CHK_users_status";
        `);
        
        // Then remove the column
        await queryRunner.query(`
            ALTER TABLE "users" 
            DROP COLUMN IF EXISTS "status";
        `);
    }
}
