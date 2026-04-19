import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Initial schema migration.
 *
 * Creates all 20 domain tables used by the investment platform.
 * Run with: npm run migration:run
 * Revert with: npm run migration:revert
 */
export class InitialSchema1713000000000 implements MigrationInterface {
  name = 'InitialSchema1713000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── Ensure uuid-ossp extension is available ───────────────────────────────
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // ── Enums ────────────────────────────────────────────────────────────────
    await queryRunner.query(
      `CREATE TYPE "public"."user_role_enum" AS ENUM('GUEST','USER','VERIFIED_USER','ADMIN','COMPLIANCE_ADMIN','FINANCE_ADMIN','SUPPORT_ADMIN','SUPER_ADMIN')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."user_status_enum" AS ENUM('PENDING_VERIFICATION','ACTIVE','SUSPENDED','FROZEN')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."kyc_status_enum" AS ENUM('NOT_STARTED','PENDING','IN_REVIEW','APPROVED','REJECTED')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."kyc_level_enum" AS ENUM('BASIC','ADVANCED','INSTITUTIONAL')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."document_type_enum" AS ENUM('PASSPORT','DRIVERS_LICENSE','NATIONAL_ID','UTILITY_BILL','BANK_STATEMENT')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."document_status_enum" AS ENUM('PENDING','ACCEPTED','REJECTED')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."asset_type_enum" AS ENUM('FIAT','CRYPTO')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."account_type_enum" AS ENUM('USER_AVAILABLE','USER_LOCKED','SYSTEM_HOT_WALLET','SYSTEM_COLD_WALLET','SYSTEM_FEE','SYSTEM_EXCHANGE')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."entry_type_enum" AS ENUM('DEBIT','CREDIT')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."transaction_type_enum" AS ENUM('DEPOSIT','WITHDRAWAL','EXCHANGE','TRADE','FEE','ADJUSTMENT')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."transaction_status_enum" AS ENUM('PENDING','COMPLETED','FAILED','REVERSED')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."deposit_method_enum" AS ENUM('BANK_TRANSFER','CARD','CRYPTO','INTERNAL')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."deposit_status_enum" AS ENUM('PENDING','CONFIRMED','FAILED','REFUNDED')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."withdrawal_method_enum" AS ENUM('BANK_TRANSFER','CRYPTO','INTERNAL')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."withdrawal_status_enum" AS ENUM('PENDING_APPROVAL','APPROVED','COMPLETED','REJECTED','CANCELLED')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."exchange_order_status_enum" AS ENUM('QUOTED','FILLED','EXPIRED','CANCELLED','FAILED')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."bot_strategy_type_enum" AS ENUM('DCA','GRID','MOMENTUM','MEAN_REVERSION','ARBITRAGE')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."bot_instance_status_enum" AS ENUM('ACTIVE','PAUSED','STOPPED')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."trade_side_enum" AS ENUM('BUY','SELL')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."trade_status_enum" AS ENUM('OPEN','FILLED','CANCELLED','FAILED')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."notification_type_enum" AS ENUM('DEPOSIT_CONFIRMED','WITHDRAWAL_PROCESSED','KYC_UPDATED','TRADE_EXECUTED','SYSTEM_ALERT','BOT_STATUS_CHANGE')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."notification_channel_enum" AS ENUM('IN_APP','EMAIL','SMS')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."ticket_status_enum" AS ENUM('OPEN','IN_PROGRESS','WAITING_ON_USER','RESOLVED','CLOSED')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."ticket_priority_enum" AS ENUM('LOW','MEDIUM','HIGH','URGENT')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."fee_type_enum" AS ENUM('EXCHANGE_SPREAD','TRADING_FEE','WITHDRAWAL_FEE','DEPOSIT_FEE')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."risk_rule_type_enum" AS ENUM('WITHDRAWAL_LIMIT','VELOCITY_CHECK','POSITION_LIMIT','DAILY_LOSS_LIMIT','CIRCUIT_BREAKER')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."risk_rule_scope_enum" AS ENUM('GLOBAL','PER_USER','PER_BOT')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."wallet_connection_enum" AS ENUM('WALLETCONNECT','METAMASK','COINBASE')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."risk_level_enum" AS ENUM('LOW','MEDIUM','HIGH','EXTREME')`,
    );

    // ── users ─────────────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id"                UUID         NOT NULL DEFAULT uuid_generate_v4(),
        "email"             VARCHAR      NOT NULL,
        "passwordHash"      VARCHAR      NOT NULL,
        "firstName"         VARCHAR      NOT NULL,
        "lastName"          VARCHAR      NOT NULL,
        "phone"             VARCHAR,
        "role"              "public"."user_role_enum" NOT NULL DEFAULT 'USER',
        "status"            "public"."user_status_enum" NOT NULL DEFAULT 'PENDING_VERIFICATION',
        "twoFactorEnabled"  BOOLEAN      NOT NULL DEFAULT false,
        "twoFactorSecret"   VARCHAR,
        "emailVerified"     BOOLEAN      NOT NULL DEFAULT false,
        "createdAt"         TIMESTAMPTZ  NOT NULL DEFAULT now(),
        "updatedAt"         TIMESTAMPTZ  NOT NULL DEFAULT now(),
        CONSTRAINT "PK_users" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_users_email" UNIQUE ("email")
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_users_email" ON "users" ("email")`);

    // ── refresh_tokens (sessions) ─────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "refresh_tokens" (
        "id"          UUID        NOT NULL DEFAULT uuid_generate_v4(),
        "userId"      UUID        NOT NULL,
        "token"       VARCHAR     NOT NULL,
        "ipAddress"   VARCHAR,
        "deviceInfo"  VARCHAR,
        "expiresAt"   TIMESTAMPTZ NOT NULL,
        "revokedAt"   TIMESTAMPTZ,
        "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_refresh_tokens" PRIMARY KEY ("id"),
        CONSTRAINT "FK_refresh_tokens_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_refresh_tokens_userId" ON "refresh_tokens" ("userId")`);

    // ── assets ────────────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "assets" (
        "id"        UUID       NOT NULL DEFAULT uuid_generate_v4(),
        "symbol"    VARCHAR    NOT NULL,
        "name"      VARCHAR    NOT NULL,
        "type"      "public"."asset_type_enum" NOT NULL,
        "chain"     VARCHAR,
        "decimals"  INT        NOT NULL DEFAULT 8,
        "isActive"  BOOLEAN    NOT NULL DEFAULT true,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_assets" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_assets_symbol" UNIQUE ("symbol")
      )
    `);

    // ── kyc_cases ─────────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "kyc_cases" (
        "id"          UUID       NOT NULL DEFAULT uuid_generate_v4(),
        "userId"      UUID       NOT NULL,
        "status"      "public"."kyc_status_enum" NOT NULL DEFAULT 'NOT_STARTED',
        "level"       "public"."kyc_level_enum"  NOT NULL DEFAULT 'BASIC',
        "onfidoApplicantId" VARCHAR,
        "onfidoCheckId"     VARCHAR,
        "sdkToken"    VARCHAR,
        "rejectionReason" TEXT,
        "reviewedBy"  UUID,
        "submittedAt" TIMESTAMPTZ,
        "reviewedAt"  TIMESTAMPTZ,
        "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt"   TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_kyc_cases" PRIMARY KEY ("id"),
        CONSTRAINT "FK_kyc_cases_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    // ── kyc_documents ─────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "kyc_documents" (
        "id"         UUID       NOT NULL DEFAULT uuid_generate_v4(),
        "kycCaseId"  UUID       NOT NULL,
        "type"       "public"."document_type_enum" NOT NULL,
        "status"     "public"."document_status_enum" NOT NULL DEFAULT 'PENDING',
        "fileUrl"    VARCHAR,
        "metadata"   JSONB,
        "createdAt"  TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt"  TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_kyc_documents" PRIMARY KEY ("id"),
        CONSTRAINT "FK_kyc_documents_case" FOREIGN KEY ("kycCaseId") REFERENCES "kyc_cases"("id") ON DELETE CASCADE
      )
    `);

    // ── wallets ───────────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "wallets" (
        "id"          UUID       NOT NULL DEFAULT uuid_generate_v4(),
        "userId"      UUID       NOT NULL,
        "address"     VARCHAR    NOT NULL,
        "chain"       VARCHAR    NOT NULL,
        "connection"  "public"."wallet_connection_enum",
        "isVerified"  BOOLEAN    NOT NULL DEFAULT false,
        "metadata"    JSONB,
        "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt"   TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_wallets" PRIMARY KEY ("id"),
        CONSTRAINT "FK_wallets_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    // ── accounts ──────────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "accounts" (
        "id"        UUID       NOT NULL DEFAULT uuid_generate_v4(),
        "userId"    UUID,
        "assetId"   UUID       NOT NULL,
        "type"      "public"."account_type_enum" NOT NULL,
        "balance"   DECIMAL(18,8) NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_accounts" PRIMARY KEY ("id"),
        CONSTRAINT "FK_accounts_asset" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE RESTRICT
      )
    `);

    // ── transactions ──────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "transactions" (
        "id"              UUID       NOT NULL DEFAULT uuid_generate_v4(),
        "type"            "public"."transaction_type_enum" NOT NULL,
        "status"          "public"."transaction_status_enum" NOT NULL DEFAULT 'PENDING',
        "description"     TEXT,
        "metadata"        JSONB,
        "idempotencyKey"  VARCHAR,
        "createdAt"       TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt"       TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_transactions" PRIMARY KEY ("id")
      )
    `);

    // ── ledger_entries ────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "ledger_entries" (
        "id"            UUID       NOT NULL DEFAULT uuid_generate_v4(),
        "transactionId" UUID       NOT NULL,
        "accountId"     UUID       NOT NULL,
        "amount"        DECIMAL(18,8) NOT NULL,
        "balanceAfter"  DECIMAL(18,8) NOT NULL,
        "entryType"     "public"."entry_type_enum" NOT NULL,
        "createdAt"     TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_ledger_entries" PRIMARY KEY ("id"),
        CONSTRAINT "FK_ledger_entries_transaction" FOREIGN KEY ("transactionId") REFERENCES "transactions"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_ledger_entries_account"     FOREIGN KEY ("accountId")     REFERENCES "accounts"("id")     ON DELETE RESTRICT
      )
    `);

    // ── deposits ──────────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "deposits" (
        "id"            UUID       NOT NULL DEFAULT uuid_generate_v4(),
        "userId"        UUID       NOT NULL,
        "assetId"       UUID       NOT NULL,
        "transactionId" UUID,
        "amount"        DECIMAL(18,8) NOT NULL,
        "fee"           DECIMAL(18,8) NOT NULL DEFAULT 0,
        "method"        "public"."deposit_method_enum" NOT NULL,
        "status"        "public"."deposit_status_enum" NOT NULL DEFAULT 'PENDING',
        "provider"      VARCHAR,
        "externalId"    VARCHAR,
        "metadata"      JSONB,
        "createdAt"     TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt"     TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_deposits" PRIMARY KEY ("id"),
        CONSTRAINT "FK_deposits_user"    FOREIGN KEY ("userId")  REFERENCES "users"("id")  ON DELETE RESTRICT,
        CONSTRAINT "FK_deposits_asset"   FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE RESTRICT
      )
    `);

    // ── withdrawals ───────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "withdrawals" (
        "id"                UUID       NOT NULL DEFAULT uuid_generate_v4(),
        "userId"            UUID       NOT NULL,
        "assetId"           UUID       NOT NULL,
        "transactionId"     UUID,
        "amount"            DECIMAL(18,8) NOT NULL,
        "fee"               DECIMAL(18,8) NOT NULL DEFAULT 0,
        "method"            "public"."withdrawal_method_enum" NOT NULL,
        "status"            "public"."withdrawal_status_enum" NOT NULL DEFAULT 'PENDING_APPROVAL',
        "toAddress"         VARCHAR,
        "bankDetails"       JSONB,
        "rejectionReason"   TEXT,
        "approvedBy"        UUID,
        "approvedAt"        TIMESTAMPTZ,
        "createdAt"         TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt"         TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_withdrawals" PRIMARY KEY ("id"),
        CONSTRAINT "FK_withdrawals_user"  FOREIGN KEY ("userId")  REFERENCES "users"("id")  ON DELETE RESTRICT,
        CONSTRAINT "FK_withdrawals_asset" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE RESTRICT
      )
    `);

    // ── exchange_orders ───────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "exchange_orders" (
        "id"              UUID       NOT NULL DEFAULT uuid_generate_v4(),
        "userId"          UUID       NOT NULL,
        "fromAssetId"     UUID       NOT NULL,
        "toAssetId"       UUID       NOT NULL,
        "transactionId"   UUID,
        "fromAmount"      DECIMAL(18,8) NOT NULL,
        "toAmount"        DECIMAL(18,8) NOT NULL,
        "rate"            DECIMAL(18,8) NOT NULL,
        "spread"          DECIMAL(18,8) NOT NULL DEFAULT 0,
        "fee"             DECIMAL(18,8) NOT NULL DEFAULT 0,
        "status"          "public"."exchange_order_status_enum" NOT NULL DEFAULT 'QUOTED',
        "idempotencyKey"  VARCHAR,
        "quoteExpiresAt"  TIMESTAMPTZ,
        "executedAt"      TIMESTAMPTZ,
        "createdAt"       TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt"       TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_exchange_orders" PRIMARY KEY ("id"),
        CONSTRAINT "FK_exchange_orders_user"       FOREIGN KEY ("userId")      REFERENCES "users"("id")  ON DELETE RESTRICT,
        CONSTRAINT "FK_exchange_orders_fromAsset"  FOREIGN KEY ("fromAssetId") REFERENCES "assets"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_exchange_orders_toAsset"    FOREIGN KEY ("toAssetId")   REFERENCES "assets"("id") ON DELETE RESTRICT
      )
    `);

    // ── bot_strategies ────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "bot_strategies" (
        "id"                  UUID       NOT NULL DEFAULT uuid_generate_v4(),
        "name"                VARCHAR    NOT NULL,
        "description"         TEXT       NOT NULL,
        "type"                "public"."bot_strategy_type_enum" NOT NULL,
        "riskLevel"           "public"."risk_level_enum" NOT NULL,
        "parameters"          JSONB      NOT NULL DEFAULT '{}',
        "allowedAssets"       TEXT[]     NOT NULL DEFAULT '{}',
        "maxDrawdownPercent"  DECIMAL(5,2) NOT NULL DEFAULT 20,
        "isActive"            BOOLEAN    NOT NULL DEFAULT true,
        "createdBy"           UUID,
        "createdAt"           TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt"           TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_bot_strategies" PRIMARY KEY ("id")
      )
    `);

    // ── bot_instances ─────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "bot_instances" (
        "id"              UUID       NOT NULL DEFAULT uuid_generate_v4(),
        "userId"          UUID       NOT NULL,
        "strategyId"      UUID       NOT NULL,
        "status"          "public"."bot_instance_status_enum" NOT NULL DEFAULT 'ACTIVE',
        "allocatedAmount" DECIMAL(18,8) NOT NULL,
        "currentValue"    DECIMAL(18,8) NOT NULL DEFAULT 0,
        "pnl"             DECIMAL(18,8) NOT NULL DEFAULT 0,
        "pnlPercent"      DECIMAL(10,4) NOT NULL DEFAULT 0,
        "assetId"         UUID,
        "startedAt"       TIMESTAMPTZ,
        "stoppedAt"       TIMESTAMPTZ,
        "createdAt"       TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt"       TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_bot_instances" PRIMARY KEY ("id"),
        CONSTRAINT "FK_bot_instances_user"     FOREIGN KEY ("userId")     REFERENCES "users"("id")          ON DELETE RESTRICT,
        CONSTRAINT "FK_bot_instances_strategy" FOREIGN KEY ("strategyId") REFERENCES "bot_strategies"("id") ON DELETE RESTRICT
      )
    `);

    // ── trades ────────────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "trades" (
        "id"          UUID       NOT NULL DEFAULT uuid_generate_v4(),
        "instanceId"  UUID       NOT NULL,
        "assetId"     UUID       NOT NULL,
        "side"        "public"."trade_side_enum" NOT NULL,
        "status"      "public"."trade_status_enum" NOT NULL DEFAULT 'OPEN',
        "quantity"    DECIMAL(18,8) NOT NULL,
        "price"       DECIMAL(18,8) NOT NULL,
        "total"       DECIMAL(18,8) NOT NULL,
        "fee"         DECIMAL(18,8) NOT NULL DEFAULT 0,
        "metadata"    JSONB,
        "executedAt"  TIMESTAMPTZ,
        "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt"   TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_trades" PRIMARY KEY ("id"),
        CONSTRAINT "FK_trades_instance" FOREIGN KEY ("instanceId") REFERENCES "bot_instances"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_trades_asset"    FOREIGN KEY ("assetId")    REFERENCES "assets"("id")        ON DELETE RESTRICT
      )
    `);

    // ── audit_logs ────────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "audit_logs" (
        "id"          UUID       NOT NULL DEFAULT uuid_generate_v4(),
        "actorId"     UUID,
        "actorRole"   VARCHAR    NOT NULL,
        "action"      VARCHAR    NOT NULL,
        "targetType"  VARCHAR    NOT NULL DEFAULT 'SYSTEM',
        "targetId"    VARCHAR,
        "details"     JSONB      NOT NULL DEFAULT '{}',
        "ipAddress"   VARCHAR,
        "userAgent"   VARCHAR,
        "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_audit_logs" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_audit_logs_actorId" ON "audit_logs" ("actorId")`);
    await queryRunner.query(`CREATE INDEX "IDX_audit_logs_action"  ON "audit_logs" ("action")`);

    // ── notifications ─────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "notifications" (
        "id"        UUID       NOT NULL DEFAULT uuid_generate_v4(),
        "userId"    UUID       NOT NULL,
        "type"      "public"."notification_type_enum" NOT NULL,
        "channel"   "public"."notification_channel_enum" NOT NULL DEFAULT 'IN_APP',
        "title"     VARCHAR    NOT NULL,
        "message"   TEXT       NOT NULL,
        "isRead"    BOOLEAN    NOT NULL DEFAULT false,
        "metadata"  JSONB,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_notifications" PRIMARY KEY ("id"),
        CONSTRAINT "FK_notifications_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_notifications_userId" ON "notifications" ("userId")`);

    // ── support_tickets ───────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "support_tickets" (
        "id"          UUID       NOT NULL DEFAULT uuid_generate_v4(),
        "userId"      UUID       NOT NULL,
        "assignedTo"  UUID,
        "subject"     VARCHAR    NOT NULL,
        "description" TEXT       NOT NULL,
        "status"      "public"."ticket_status_enum"    NOT NULL DEFAULT 'OPEN',
        "priority"    "public"."ticket_priority_enum"  NOT NULL DEFAULT 'MEDIUM',
        "category"    VARCHAR    NOT NULL,
        "resolvedAt"  TIMESTAMPTZ,
        "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt"   TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_support_tickets" PRIMARY KEY ("id"),
        CONSTRAINT "FK_support_tickets_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_support_tickets_userId" ON "support_tickets" ("userId")`);

    // ── fee_configs ───────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "fee_configs" (
        "id"            UUID       NOT NULL DEFAULT uuid_generate_v4(),
        "name"          VARCHAR    NOT NULL,
        "type"          "public"."fee_type_enum" NOT NULL,
        "assetId"       UUID,
        "value"         DECIMAL(18,8) NOT NULL,
        "isPercentage"  BOOLEAN    NOT NULL DEFAULT true,
        "minAmount"     DECIMAL(18,8),
        "maxAmount"     DECIMAL(18,8),
        "isActive"      BOOLEAN    NOT NULL DEFAULT true,
        "createdAt"     TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt"     TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_fee_configs" PRIMARY KEY ("id"),
        CONSTRAINT "FK_fee_configs_asset" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE SET NULL
      )
    `);

    // ── risk_rules ────────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "risk_rules" (
        "id"          UUID       NOT NULL DEFAULT uuid_generate_v4(),
        "name"        VARCHAR    NOT NULL,
        "description" TEXT       NOT NULL,
        "type"        "public"."risk_rule_type_enum"  NOT NULL,
        "parameters"  JSONB      NOT NULL,
        "scope"       "public"."risk_rule_scope_enum" NOT NULL,
        "isActive"    BOOLEAN    NOT NULL DEFAULT true,
        "createdBy"   UUID       NOT NULL,
        "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt"   TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_risk_rules" PRIMARY KEY ("id"),
        CONSTRAINT "FK_risk_rules_creator" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT
      )
    `);

    // ── Enable uuid-ossp extension ────────────────────────────────────────────
    // (already created at the top of up(); included here only as documentation)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "risk_rules"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "fee_configs"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "support_tickets"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "notifications"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "audit_logs"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "trades"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "bot_instances"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "bot_strategies"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "exchange_orders"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "withdrawals"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "deposits"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "ledger_entries"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "transactions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "accounts"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "wallets"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "kyc_documents"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "kyc_cases"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "assets"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "refresh_tokens"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);

    await queryRunner.query(`DROP TYPE IF EXISTS "public"."risk_rule_scope_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."risk_rule_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."fee_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."ticket_priority_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."ticket_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."notification_channel_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."notification_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."trade_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."trade_side_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."bot_instance_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."bot_strategy_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."exchange_order_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."withdrawal_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."withdrawal_method_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."deposit_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."deposit_method_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."transaction_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."transaction_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."entry_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."account_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."asset_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."document_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."document_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."kyc_level_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."kyc_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."user_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."user_role_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."wallet_connection_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."risk_level_enum"`);
  }
}
