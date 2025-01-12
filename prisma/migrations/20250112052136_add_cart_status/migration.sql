/*
  Warnings:

  - You are about to drop the column `status` on the `transaction` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `cart` ADD COLUMN `status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE `transaction` DROP COLUMN `status`;
