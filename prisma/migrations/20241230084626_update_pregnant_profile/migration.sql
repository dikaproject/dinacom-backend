/*
  Warnings:

  - Added the required column `dueDate` to the `PregnantProfile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pregnancyWeek` to the `PregnantProfile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `reminderTime` to the `PregnantProfile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `trimester` to the `PregnantProfile` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `pregnantprofile` ADD COLUMN `dueDate` DATETIME(3) NOT NULL,
    ADD COLUMN `isWhatsappActive` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `pregnancyWeek` INTEGER NOT NULL,
    ADD COLUMN `reminderTime` DATETIME(3) NOT NULL,
    ADD COLUMN `trimester` ENUM('FIRST_TRIMESTER', 'SECOND_TRIMESTER', 'THIRD_TRIMESTER') NOT NULL;

-- CreateTable
CREATE TABLE `DailyCheckup` (
    `id` VARCHAR(191) NOT NULL,
    `profileId` VARCHAR(191) NOT NULL,
    `date` DATETIME(3) NOT NULL,
    `weight` DOUBLE NOT NULL,
    `bloodPressure` VARCHAR(191) NOT NULL,
    `mood` VARCHAR(191) NOT NULL,
    `sleepHours` DOUBLE NOT NULL,
    `waterIntake` DOUBLE NOT NULL,
    `symptoms` JSON NOT NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `NutritionLog` (
    `id` VARCHAR(191) NOT NULL,
    `profileId` VARCHAR(191) NOT NULL,
    `date` DATETIME(3) NOT NULL,
    `mealType` VARCHAR(191) NOT NULL,
    `foodItems` JSON NOT NULL,
    `totalCalories` DOUBLE NOT NULL,
    `totalProtein` DOUBLE NOT NULL,
    `totalCarbs` DOUBLE NOT NULL,
    `totalFat` DOUBLE NOT NULL,
    `totalFolate` DOUBLE NOT NULL,
    `totalIron` DOUBLE NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ExerciseLog` (
    `id` VARCHAR(191) NOT NULL,
    `profileId` VARCHAR(191) NOT NULL,
    `date` DATETIME(3) NOT NULL,
    `activityType` VARCHAR(191) NOT NULL,
    `duration` INTEGER NOT NULL,
    `intensity` VARCHAR(191) NOT NULL,
    `heartRate` INTEGER NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AIRecommendation` (
    `id` VARCHAR(191) NOT NULL,
    `profileId` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `week` INTEGER NOT NULL,
    `trimester` ENUM('FIRST_TRIMESTER', 'SECOND_TRIMESTER', 'THIRD_TRIMESTER') NOT NULL,
    `recommendation` JSON NOT NULL,
    `analysis` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `DailyCheckup` ADD CONSTRAINT `DailyCheckup_profileId_fkey` FOREIGN KEY (`profileId`) REFERENCES `PregnantProfile`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `NutritionLog` ADD CONSTRAINT `NutritionLog_profileId_fkey` FOREIGN KEY (`profileId`) REFERENCES `PregnantProfile`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ExerciseLog` ADD CONSTRAINT `ExerciseLog_profileId_fkey` FOREIGN KEY (`profileId`) REFERENCES `PregnantProfile`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AIRecommendation` ADD CONSTRAINT `AIRecommendation_profileId_fkey` FOREIGN KEY (`profileId`) REFERENCES `PregnantProfile`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
