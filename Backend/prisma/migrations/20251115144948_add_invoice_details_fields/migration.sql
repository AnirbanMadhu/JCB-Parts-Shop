-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "stateCode" TEXT;

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "buyerOrderNo" TEXT,
ADD COLUMN     "deliveryNote" TEXT,
ADD COLUMN     "deliveryNoteDate" TIMESTAMP(3),
ADD COLUMN     "dispatchDocNo" TEXT,
ADD COLUMN     "dispatchedThrough" TEXT,
ADD COLUMN     "termsOfDelivery" TEXT;

-- AlterTable
ALTER TABLE "Supplier" ADD COLUMN     "stateCode" TEXT;
