/*
  Warnings:

  - Added the required column `pregnancyWeek` to the `Consultation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `previousPregnancies` to the `Consultation` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `consultation` ADD COLUMN `concerns` TEXT NULL,
    ADD COLUMN `pregnancyWeek` INTEGER NOT NULL,
    ADD COLUMN `previousPregnancies` INTEGER NOT NULL,
    ADD COLUMN `symptoms` TEXT NULL,
    ADD COLUMN `type` ENUM('ONLINE', 'OFFLINE') NOT NULL DEFAULT 'OFFLINE';

-- CreateTable
CREATE TABLE `DoctorSchedule` (
    `id` VARCHAR(191) NOT NULL,
    `doctorId` VARCHAR(191) NOT NULL,
    `dayOfWeek` INTEGER NOT NULL,
    `startTime` VARCHAR(191) NOT NULL,
    `endTime` VARCHAR(191) NOT NULL,
    `isAvailable` BOOLEAN NOT NULL DEFAULT true,
    `bookedDates` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `DoctorSchedule` ADD CONSTRAINT `DoctorSchedule_doctorId_fkey` FOREIGN KEY (`doctorId`) REFERENCES `Doctor`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
