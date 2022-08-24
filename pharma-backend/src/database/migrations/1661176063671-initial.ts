import {MigrationInterface, QueryRunner} from "typeorm";

export class initial1661176063671 implements MigrationInterface {
    name = 'initial1661176063671'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "file" (
                "id" SERIAL NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "fileName" character varying NOT NULL,
                "mimeType" character varying NOT NULL,
                "data" bytea NOT NULL,
                CONSTRAINT "PK_36b46d232307066b3a2c9ea3a1d" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."shortaccesstoken_resourcetype_enum" AS ENUM('case', 'file')
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."shortaccesstoken_permission_enum" AS ENUM('0', '1', '2')
        `);
        await queryRunner.query(`
            CREATE TABLE "shortaccesstoken" (
                "id" SERIAL NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "resourceType" "public"."shortaccesstoken_resourcetype_enum" NOT NULL,
                "resourceId" character varying NOT NULL,
                "permission" "public"."shortaccesstoken_permission_enum" NOT NULL,
                "duration" character varying NOT NULL,
                "token" uuid NOT NULL DEFAULT uuid_generate_v4(),
                CONSTRAINT "PK_a308986af1db66ffb40f12e7712" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_ac916e548523e26d57e83a6615" ON "shortaccesstoken" ("token", "resourceType")
        `);
        await queryRunner.query(`
            CREATE TABLE "users" (
                "id" SERIAL NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "keycloakId" character varying,
                "afm" character varying NOT NULL,
                "username" character varying NOT NULL,
                "email" character varying,
                "firstName" character varying,
                "lastName" character varying,
                CONSTRAINT "UQ_7c4efc5ecbdbcb378b7a43fa011" UNIQUE ("keycloakId"),
                CONSTRAINT "UQ_4e5d62363abdbbad9e7f7686ade" UNIQUE ("afm"),
                CONSTRAINT "UQ_fe0bb3f6520ee0469504521e710" UNIQUE ("username"),
                CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_7c4efc5ecbdbcb378b7a43fa01" ON "users" ("keycloakId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_4e5d62363abdbbad9e7f7686ad" ON "users" ("afm")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_fe0bb3f6520ee0469504521e71" ON "users" ("username")
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."transaction_transactiontype_enum" AS ENUM(
                '0',
                '1',
                '2',
                '3',
                '4',
                '5',
                '6',
                '7',
                '8',
                '9',
                '10',
                '11',
                '12',
                '13',
                '14',
                '15',
                '16'
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."transaction_vat_enum" AS ENUM('0', '1', '2', '3', '4')
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."transaction_paymenttype_enum" AS ENUM('0', '1', '2', '3', '4', '5', '6', '7')
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."transaction_suppliertype_enum" AS ENUM('0', '1', '2')
        `);
        await queryRunner.query(`
            CREATE TABLE "transaction" (
                "id" SERIAL NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "transactionType" "public"."transaction_transactiontype_enum" NOT NULL,
                "vat" "public"."transaction_vat_enum" NOT NULL,
                "paymentType" "public"."transaction_paymenttype_enum" NOT NULL,
                "supplierType" "public"."transaction_suppliertype_enum" NOT NULL,
                "cost" character varying NOT NULL,
                "comment" character varying NOT NULL,
                "userId" integer,
                CONSTRAINT "PK_89eadb93a89810556e1cbcd6ab9" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            ALTER TABLE "transaction"
            ADD CONSTRAINT "FK_605baeb040ff0fae995404cea37" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "transaction" DROP CONSTRAINT "FK_605baeb040ff0fae995404cea37"
        `);
        await queryRunner.query(`
            DROP TABLE "transaction"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."transaction_suppliertype_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."transaction_paymenttype_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."transaction_vat_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."transaction_transactiontype_enum"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_fe0bb3f6520ee0469504521e71"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_4e5d62363abdbbad9e7f7686ad"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_7c4efc5ecbdbcb378b7a43fa01"
        `);
        await queryRunner.query(`
            DROP TABLE "users"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_ac916e548523e26d57e83a6615"
        `);
        await queryRunner.query(`
            DROP TABLE "shortaccesstoken"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."shortaccesstoken_permission_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."shortaccesstoken_resourcetype_enum"
        `);
        await queryRunner.query(`
            DROP TABLE "file"
        `);
    }

}
