-- AlterTable
ALTER TABLE "Examen" ADD COLUMN     "horarioId" INTEGER;

-- AddForeignKey
ALTER TABLE "Examen" ADD CONSTRAINT "Examen_horarioId_fkey" FOREIGN KEY ("horarioId") REFERENCES "Horario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
