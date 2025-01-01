/*
  Warnings:

  - The primary key for the `article` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `categoryId` on the `article` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `article` DROP FOREIGN KEY `Article_categoryId_fkey`;

-- DropIndex
DROP INDEX `Article_categoryId_fkey` ON `article`;

-- AlterTable
ALTER TABLE `article` DROP PRIMARY KEY,
    DROP COLUMN `categoryId`,
    MODIFY `id` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`id`);

-- CreateTable
CREATE TABLE `_ArticleCategories` (
    `A` VARCHAR(191) NOT NULL,
    `B` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `_ArticleCategories_AB_unique`(`A`, `B`),
    INDEX `_ArticleCategories_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `_ArticleCategories` ADD CONSTRAINT `_ArticleCategories_A_fkey` FOREIGN KEY (`A`) REFERENCES `Article`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_ArticleCategories` ADD CONSTRAINT `_ArticleCategories_B_fkey` FOREIGN KEY (`B`) REFERENCES `ArticleCategory`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
