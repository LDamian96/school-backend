-- AlterTable
ALTER TABLE "Examen" ADD COLUMN     "estudianteId" INTEGER;

-- AddForeignKey
ALTER TABLE "Examen" ADD CONSTRAINT "Examen_estudianteId_fkey" FOREIGN KEY ("estudianteId") REFERENCES "Estudiante"("id") ON DELETE SET NULL ON UPDATE CASCADE;
