/*
  Warnings:

  - Changed the type of `dia` on the `Horario` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "Dias" AS ENUM ('LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO');

-- AlterTable
ALTER TABLE "Horario" DROP COLUMN "dia",
ADD COLUMN     "dia" "Dias" NOT NULL;
