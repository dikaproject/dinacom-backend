/*
  Warnings:

  - Added the required column `pregnancyStartDate` to the `PregnantProfile` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `pregnantprofile` ADD COLUMN `pregnancyStartDate` DATETIME(3) NOT NULL;
