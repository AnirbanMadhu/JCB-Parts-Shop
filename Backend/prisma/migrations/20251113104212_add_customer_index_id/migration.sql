/*
  Warnings:

  - A unique constraint covering the columns `[indexId]` on the table `Customer` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Customer" ADD COLUMN "indexId" TEXT;

-- Populate indexId for existing customers
DO $$
DECLARE
    customer_record RECORD;
    counter INTEGER := 0;
BEGIN
    FOR customer_record IN 
        SELECT id FROM "Customer" ORDER BY id ASC
    LOOP
        counter := counter + 1;
        UPDATE "Customer" 
        SET "indexId" = 'CUST-' || LPAD(counter::TEXT, 3, '0')
        WHERE id = customer_record.id;
    END LOOP;
END $$;

-- CreateIndex
CREATE UNIQUE INDEX "Customer_indexId_key" ON "Customer"("indexId");
