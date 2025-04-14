/*
  Warnings:

  - You are about to drop the column `nivel` on the `Asistencia` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Asistencia" DROP COLUMN "nivel",
ADD COLUMN     "asistio" BOOLEAN;
