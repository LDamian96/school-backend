-- DropForeignKey
ALTER TABLE "Materia" DROP CONSTRAINT "Materia_gradoSeccionId_fkey";

-- AlterTable
ALTER TABLE "Materia" ALTER COLUMN "gradoSeccionId" DROP NOT NULL,
ALTER COLUMN "gradoSeccionId" DROP DEFAULT;

-- AddForeignKey
ALTER TABLE "Materia" ADD CONSTRAINT "Materia_gradoSeccionId_fkey" FOREIGN KEY ("gradoSeccionId") REFERENCES "GradoSeccion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
