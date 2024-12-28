/*
  Warnings:

  - You are about to drop the column `jenis` on the `layanankesehatan` table. All the data in the column will be lost.
  - You are about to drop the column `kabupaten` on the `layanankesehatan` table. All the data in the column will be lost.
  - You are about to drop the column `kecamatan` on the `layanankesehatan` table. All the data in the column will be lost.
  - You are about to drop the column `nama` on the `layanankesehatan` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `layanankesehatan` table. All the data in the column will be lost.
  - You are about to drop the column `provinsi` on the `layanankesehatan` table. All the data in the column will be lost.
  - Added the required column `city` to the `LayananKesehatan` table without a default value. This is not possible if the table is not empty.
  - Added the required column `district` to the `LayananKesehatan` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `LayananKesehatan` table without a default value. This is not possible if the table is not empty.
  - Added the required column `phoneNumber` to the `LayananKesehatan` table without a default value. This is not possible if the table is not empty.
  - Added the required column `province` to the `LayananKesehatan` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `LayananKesehatan` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `layanankesehatan` DROP COLUMN `jenis`,
    DROP COLUMN `kabupaten`,
    DROP COLUMN `kecamatan`,
    DROP COLUMN `nama`,
    DROP COLUMN `phone`,
    DROP COLUMN `provinsi`,
    ADD COLUMN `city` VARCHAR(191) NOT NULL,
    ADD COLUMN `district` VARCHAR(191) NOT NULL,
    ADD COLUMN `name` VARCHAR(191) NOT NULL,
    ADD COLUMN `phoneNumber` VARCHAR(191) NOT NULL,
    ADD COLUMN `province` VARCHAR(191) NOT NULL,
    ADD COLUMN `type` VARCHAR(191) NOT NULL;
