/*
  Warnings:

  - Added the required column `tax` to the `Payment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `payment` ADD COLUMN `tax` DOUBLE NOT NULL;
