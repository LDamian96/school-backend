/*
  Warnings:

  - You are about to drop the column `estudianteId` on the `Examen` table. All the data in the column will be lost.
  - You are about to drop the column `horarioId` on the `Examen` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Examen" DROP CONSTRAINT "Examen_estudianteId_fkey";

-- DropForeignKey
ALTER TABLE "Examen" DROP CONSTRAINT "Examen_horarioId_fkey";

-- AlterTable
ALTER TABLE "Examen" DROP COLUMN "estudianteId",
DROP COLUMN "horarioId";

-- AlterTable
ALTER TABLE "Tarea" ADD COLUMN     "entrego" BOOLEAN;
