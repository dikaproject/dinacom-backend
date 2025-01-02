/*
  Warnings:

  - A unique constraint covering the columns `[productId,userId]` on the table `CartProduct` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `CartProduct_productId_userId_key` ON `CartProduct`(`productId`, `userId`);
