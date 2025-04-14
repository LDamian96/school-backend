-- AlterTable
ALTER TABLE "Materia" ADD COLUMN     "gradoSeccionId" INTEGER NOT NULL DEFAULT 1;

-- AddForeignKey
ALTER TABLE "Materia" ADD CONSTRAINT "Materia_gradoSeccionId_fkey" FOREIGN KEY ("gradoSeccionId") REFERENCES "GradoSeccion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
