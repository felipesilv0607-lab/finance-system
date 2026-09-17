-- CreateIndex
CREATE UNIQUE INDEX "categories_userId_name_type_key" ON "categories"("userId", "name", "type");
