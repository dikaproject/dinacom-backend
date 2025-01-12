/*
  Warnings:

  - You are about to drop the column `totalPrice` on the `transaction` table. All the data in the column will be lost.
  - Added the required column `basePrice` to the `CartProduct` table without a default value. This is not possible if the table is not empty.
  - Added the required column `subtotal` to the `CartProduct` table without a default value. This is not possible if the table is not empty.
  - Added the required column `platformFee` to the `Transaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `shippingAddressId` to the `Transaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `shippingCost` to the `Transaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `subtotal` to the `Transaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tax` to the `Transaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalAmount` to the `Transaction` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `cartproduct` ADD COLUMN `basePrice` DOUBLE NOT NULL,
    ADD COLUMN `subtotal` DOUBLE NOT NULL;

-- AlterTable
ALTER TABLE `transaction` DROP COLUMN `totalPrice`,
    ADD COLUMN `expiredAt` DATETIME(3) NULL,
    ADD COLUMN `paidAt` DATETIME(3) NULL,
    ADD COLUMN `paymentMethod` ENUM('BANK_TRANSFER', 'QRIS', 'MIDTRANS') NULL,
    ADD COLUMN `paymentStatus` ENUM('PENDING', 'PAID', 'EXPIRED', 'FAILED') NOT NULL DEFAULT 'PENDING',
    ADD COLUMN `platformFee` DOUBLE NOT NULL,
    ADD COLUMN `shippingAddressId` VARCHAR(191) NOT NULL,
    ADD COLUMN `shippingCost` DOUBLE NOT NULL,
    ADD COLUMN `subtotal` DOUBLE NOT NULL,
    ADD COLUMN `tax` DOUBLE NOT NULL,
    ADD COLUMN `totalAmount` DOUBLE NOT NULL,
    ALTER COLUMN `updatedAt` DROP DEFAULT;

-- CreateTable
CREATE TABLE `ShippingAddress` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `fullName` VARCHAR(191) NOT NULL,
    `phoneNumber` VARCHAR(191) NOT NULL,
    `province` VARCHAR(191) NOT NULL,
    `city` VARCHAR(191) NOT NULL,
    `district` VARCHAR(191) NOT NULL,
    `address` TEXT NOT NULL,
    `postalCode` VARCHAR(191) NOT NULL,
    `isDefault` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Transaction` ADD CONSTRAINT `Transaction_shippingAddressId_fkey` FOREIGN KEY (`shippingAddressId`) REFERENCES `ShippingAddress`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
