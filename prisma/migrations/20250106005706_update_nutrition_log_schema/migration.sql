/*
  Warnings:

  - You are about to drop the column `totalCalories` on the `nutritionlog` table. All the data in the column will be lost.
  - You are about to drop the column `totalCarbs` on the `nutritionlog` table. All the data in the column will be lost.
  - You are about to drop the column `totalFat` on the `nutritionlog` table. All the data in the column will be lost.
  - You are about to drop the column `totalFolate` on the `nutritionlog` table. All the data in the column will be lost.
  - You are about to drop the column `totalIron` on the `nutritionlog` table. All the data in the column will be lost.
  - You are about to drop the column `totalProtein` on the `nutritionlog` table. All the data in the column will be lost.
  - Added the required column `calories` to the `NutritionLog` table without a default value. This is not possible if the table is not empty.
  - Added the required column `carbs` to the `NutritionLog` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fats` to the `NutritionLog` table without a default value. This is not possible if the table is not empty.
  - Added the required column `protein` to the `NutritionLog` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `dailycheckup` MODIFY `bloodPressure` VARCHAR(191) NULL,
    MODIFY `symptoms` JSON NULL;

-- AlterTable
ALTER TABLE `nutritionlog` DROP COLUMN `totalCalories`,
    DROP COLUMN `totalCarbs`,
    DROP COLUMN `totalFat`,
    DROP COLUMN `totalFolate`,
    DROP COLUMN `totalIron`,
    DROP COLUMN `totalProtein`,
    ADD COLUMN `calories` DOUBLE NOT NULL,
    ADD COLUMN `carbs` DOUBLE NOT NULL,
    ADD COLUMN `fats` DOUBLE NOT NULL,
    ADD COLUMN `notes` TEXT NULL,
    ADD COLUMN `protein` DOUBLE NOT NULL;

-- CreateTable
CREATE TABLE `ProductCategory` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `ProductCategory_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Product` (
    `id` VARCHAR(191) NOT NULL,
    `thumbnail` VARCHAR(191) NULL,
    `title` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `productStatus` ENUM('ACTIVE', 'UNACTIVE') NOT NULL DEFAULT 'ACTIVE',
    `price` DOUBLE NOT NULL,
    `categoryId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Product_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CartProduct` (
    `id` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `quantity` INTEGER NOT NULL DEFAULT 1,
    `userId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `CartProduct_productId_userId_key`(`productId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Transaction` (
    `id` VARCHAR(191) NOT NULL,
    `orderId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `transactionStatus` ENUM('PENDING', 'PAID', 'FAILED') NOT NULL DEFAULT 'PENDING',
    `totalAmount` DOUBLE NOT NULL,
    `midtransId` VARCHAR(191) NULL,
    `paidAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Transaction_orderId_key`(`orderId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Product` ADD CONSTRAINT `Product_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `ProductCategory`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CartProduct` ADD CONSTRAINT `CartProduct_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CartProduct` ADD CONSTRAINT `CartProduct_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Transaction` ADD CONSTRAINT `Transaction_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
